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

type WooOrderPayload = {
  id?: number;
  status?: string;
  date_created?: string;
  line_items?: WooLineItem[];
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!supabaseUrl || !serviceRoleKey) {
    return Response.json({ error: "Missing Supabase Edge Function secrets" }, { status: 500, headers: corsHeaders });
  }

  const payload = (await request.json()) as WooOrderPayload;

  if (payload.status !== "processing") {
    return Response.json({ ok: true, ignored: true, reason: "Only processing orders count as Venta OK" }, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const lineItems = payload.line_items ?? [];
  let imported = 0;
  let unmatched = 0;

  for (const item of lineItems) {
    const wooLineItemId = item.id ? String(item.id) : null;
    const wooProductId = item.product_id ? String(item.product_id) : null;
    const wooSku = item.sku ?? null;
    let products: Array<{ id: string }> | null = null;
    let error: unknown = null;

    if (wooProductId) {
      const result = await supabase.from("products").select("id").eq("woo_product_id", wooProductId).limit(1);
      products = result.data;
      error = result.error;
    } else if (wooSku) {
      const result = await supabase.from("products").select("id").eq("woo_sku", wooSku).limit(1);
      products = result.data;
      error = result.error;
    }

    if (error || !products?.[0]) {
      unmatched += 1;
      await supabase.from("unmatched_woocommerce_products").insert({
        id: crypto.randomUUID(),
        woo_product_id: wooProductId,
        woo_sku: wooSku,
        name: item.name ?? "Producto WooCommerce sin nombre",
        woo_order_id: payload.id ? String(payload.id) : null,
        quantity: item.quantity ?? 0,
        line_total: Number(item.total ?? 0),
        order_date: payload.date_created ?? new Date().toISOString()
      });
      continue;
    }

    const sale = {
      id: crypto.randomUUID(),
      product_id: products[0].id,
      woo_order_id: payload.id ? String(payload.id) : null,
      woo_line_item_id: wooLineItemId,
      woo_order_status: payload.status,
      quantity: item.quantity ?? 0,
      unit_price: item.price ?? 0,
      line_total: Number(item.total ?? 0),
      order_date: payload.date_created ?? new Date().toISOString()
    };

    if (wooLineItemId) {
      await supabase.from("campaign_sales").upsert(sale, { onConflict: "woo_order_id,woo_line_item_id" });
    } else {
      await supabase.from("campaign_sales").insert(sale);
    }
    imported += 1;
  }

  await supabase.from("sync_logs").insert({
    id: crypto.randomUUID(),
    status: unmatched > 0 ? "error" : "success",
    imported_orders: payload.id ? 1 : 0,
    imported_lines: imported,
    error_message: unmatched > 0 ? `Webhook procesado con ${unmatched} productos sin vincular.` : null
  });

  return Response.json({ ok: true, imported, unmatched }, { headers: corsHeaders });
});
