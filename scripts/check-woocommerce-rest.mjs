import { existsSync, readFileSync } from "node:fs";

function loadEnvFile() {
  if (!existsSync(".env")) return;
  const lines = readFileSync(".env", "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const match = trimmed.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    const value = rawValue.replace(/^["']|["']$/g, "");
    process.env[key] ??= value;
  }
}

function requiredEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}. Add it to .env first.`);
  }
  return value;
}

loadEnvFile();

const baseUrl = requiredEnv("WOOCOMMERCE_BASE_URL").replace(/\/$/, "");
const key = requiredEnv("WOOCOMMERCE_CONSUMER_KEY");
const secret = requiredEnv("WOOCOMMERCE_CONSUMER_SECRET");

if (!key.startsWith("ck_")) {
  throw new Error("WOOCOMMERCE_CONSUMER_KEY should start with ck_");
}

if (!secret.startsWith("cs_")) {
  throw new Error("WOOCOMMERCE_CONSUMER_SECRET should start with cs_");
}

const url = new URL("/wp-json/wc/v3/orders", baseUrl);
url.searchParams.set("status", "processing");
url.searchParams.set("per_page", "5");
url.searchParams.set("consumer_key", key);
url.searchParams.set("consumer_secret", secret);

console.log(`Checking WooCommerce REST API at ${baseUrl}`);
console.log("Endpoint: /wp-json/wc/v3/orders?status=processing&per_page=5");

const response = await fetch(url, {
  headers: {
    Accept: "application/json",
    "User-Agent": "K7-Product-Radar/0.1"
  }
});

console.log(`HTTP status: ${response.status} ${response.statusText}`);

const text = await response.text();
let payload;
try {
  payload = JSON.parse(text);
} catch {
  throw new Error(`WooCommerce did not return JSON. First 200 chars: ${text.slice(0, 200)}`);
}

if (!response.ok) {
  console.log("Response:", JSON.stringify(payload, null, 2));
  process.exit(1);
}

if (!Array.isArray(payload)) {
  console.log("Response:", JSON.stringify(payload, null, 2));
  throw new Error("Expected WooCommerce orders endpoint to return an array.");
}

console.log(`Processing orders received: ${payload.length}`);

const firstOrder = payload[0];
if (firstOrder) {
  console.log("First order sample:", {
    id: firstOrder.id,
    status: firstOrder.status,
    date_created: firstOrder.date_created,
    line_items: (firstOrder.line_items ?? []).slice(0, 3).map((item) => ({
      product_id: item.product_id,
      sku: item.sku,
      name: item.name,
      quantity: item.quantity,
      total: item.total
    }))
  });
} else {
  console.log("Connection OK. There are no processing orders in the first page.");
}
