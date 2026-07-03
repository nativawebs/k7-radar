import { createClient } from "https://esm.sh/@supabase/supabase-js@2.110.0";

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
  const wooUrl = Deno.env.get("WOOCOMMERCE_URL");
  const wooConsumerKey = Deno.env.get("WOOCOMMERCE_CONSUMER_KEY");
  const wooConsumerSecret = Deno.env.get("WOOCOMMERCE_CONSUMER_SECRET");

  if (!supabaseUrl || !serviceRoleKey || !wooUrl || !wooConsumerKey || !wooConsumerSecret) {
    return Response.json({ error: "Missing WooCommerce or Supabase Edge Function secrets" }, { status: 500, headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const url = new URL("/wp-json/wc/v3/orders", wooUrl);
  url.searchParams.set("status", "processing");
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

  const orders = (await response.json()) as Array<{ id?: number; status?: string; line_items?: unknown[] }>;

  await supabase.from("sync_logs").insert({
    id: crypto.randomUUID(),
    status: "success",
    imported_orders: orders.length,
    imported_lines: 0,
    error_message: null
  });

  return Response.json({ ok: true, orders: orders.length }, { headers: corsHeaders });
});
