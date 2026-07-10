import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.0";

type WooLineItem = {
  id?: number;
  product_id?: number;
  sku?: string;
  name?: string;
  quantity?: number;
  total?: string;
  price?: number;
};

type WooOrder = {
  id?: number;
  status?: string;
  date_created?: string;
  line_items?: WooLineItem[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

async function findTrackedProduct(
  supabase: ReturnType<typeof createClient>,
  wooProductId: string | null,
  wooSku: string | null
) {
  if (wooProductId) {
    const result = await supabase.from("products").select("id").eq("woo_product_id", wooProductId).limit(1);
    if (result.error) throw result.error;
    if (result.data?.[0]) return result.data[0] as { id: string };
  }

  if (wooSku) {
    const result = await supabase.from("products").select("id").eq("woo_sku", wooSku).limit(1);
    if (result.error) throw result.error;
    if (result.data?.[0]) return result.data[0] as { id: string };
  }

  return null;
}

async function importOrderLine(
  supabase: ReturnType<typeof createClient>,
  order: WooOrder,
  item: WooLineItem
) {
  const wooOrderId = order.id ? String(order.id) : null;
  const wooLineItemId = item.id ? String(item.id) : null;
  const wooProductId = item.product_id ? String(item.product_id) : null;
  const wooSku = item.sku ?? null;

  if (!wooOrderId) return { imported: 0, unmatched: 0 };

  const product = await findTrackedProduct(supabase, wooProductId, wooSku);

  if (!product) {
    await supabase.from("unmatched_woocommerce_products").insert({
      id: crypto.randomUUID(),
      woo_product_id: wooProductId,
      woo_sku: wooSku,
      name: item.name ?? "Producto WooCommerce sin nombre",
      woo_order_id: wooOrderId,
      quantity: item.quantity ?? 0,
      line_total: Number(item.total ?? 0),
      order_date: order.date_created ?? new Date().toISOString()
    });
    return { imported: 0, unmatched: 1 };
  }

  const sale = {
    id: crypto.randomUUID(),
    product_id: product.id,
    woo_order_id: wooOrderId,
    woo_line_item_id: wooLineItemId,
    woo_order_status: order.status ?? "processing",
    quantity: item.quantity ?? 0,
    unit_price: item.price ?? 0,
    line_total: Number(item.total ?? 0),
    order_date: order.date_created ?? new Date().toISOString()
  };

  if (wooLineItemId) {
    await supabase.from("campaign_sales").upsert(sale, { onConflict: "woo_order_id,woo_line_item_id" });
  } else {
    const existing = await supabase
      .from("campaign_sales")
      .select("id")
      .eq("woo_order_id", wooOrderId)
      .eq("product_id", product.id)
      .limit(1);

    if (existing.data?.[0]) {
      const { id: _id, ...saleUpdate } = sale;
      await supabase.from("campaign_sales").update(saleUpdate).eq("id", existing.data[0].id);
    } else {
      await supabase.from("campaign_sales").insert(sale);
    }
  }

  return { imported: 1, unmatched: 0 };
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const wooUrl = Deno.env.get("WOOCOMMERCE_URL") ?? Deno.env.get("WOOCOMMERCE_BASE_URL");
  const wooConsumerKey = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
  const wooConsumerSecret = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !wooUrl || !wooConsumerKey || !wooConsumerSecret) {
    return Response.json({ error: "Missing WooCommerce or Supabase Edge Function secrets" }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const url = new URL("/wp-json/wc/v3/orders", wooUrl);
  url.searchParams.set("status", "processing");
  url.searchParams.set("per_page", "100");
  url.searchParams.set("orderby", "date");
  url.searchParams.set("order", "desc");
  url.searchParams.set("consumer_key", wooConsumerKey);
  url.searchParams.set("consumer_secret", wooConsumerSecret);

  const response = await fetch(url);

  if (!response.ok) {
    await supabase.from("sync_logs").insert({
      id: crypto.randomUUID(),
      status: "error",
      imported_orders: 0,
      imported_lines: 0,
      error_message: `WooCommerce respondio ${response.status}`
    });
    return Response.json({ error: "WooCommerce sync failed" }, { status: 502, headers: corsHeaders });
  }

  const orders = (await response.json()) as WooOrder[];
  let importedLines = 0;
  let unmatchedLines = 0;

  for (const order of orders) {
    for (const item of order.line_items ?? []) {
      const result = await importOrderLine(supabase, order, item);
      importedLines += result.imported;
      unmatchedLines += result.unmatched;
    }
  }

  await supabase.from("sync_logs").insert({
    id: crypto.randomUUID(),
    status: unmatchedLines > 0 ? "error" : "success",
    imported_orders: orders.length,
    imported_lines: importedLines,
    error_message: unmatchedLines > 0 ? `Sincronizacion con ${unmatchedLines} productos sin vincular.` : null
  });

  return Response.json({ ok: true, orders: orders.length, importedLines, unmatchedLines }, { headers: corsHeaders });
});
