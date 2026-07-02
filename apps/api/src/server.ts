import cors from "@fastify/cors";
import Fastify from "fastify";
import { authRoutes } from "./routes/auth.js";
import { campaignRoutes } from "./routes/campaigns.js";
import { dashboardRoutes } from "./routes/dashboard.js";
import { productRoutes } from "./routes/products.js";
import { createSupabaseAuthPreHandler } from "./services/auth.js";
import { wooCommerceRoutes } from "./routes/woocommerce.js";

const app = Fastify({ logger: true });

await app.register(cors, {
  origin: process.env.CORS_ORIGIN ?? true,
  credentials: true
});

app.decorate("authenticate", createSupabaseAuthPreHandler("user"));

app.get("/health", async () => ({ ok: true, name: "K7 Product Radar API" }));

await app.register(authRoutes, { prefix: "/api/auth" });
await app.register(productRoutes, { prefix: "/api/products" });
await app.register(campaignRoutes, { prefix: "/api/campaigns" });
await app.register(dashboardRoutes, { prefix: "/api/dashboard" });
await app.register(wooCommerceRoutes, { prefix: "/api" });

const port = Number(process.env.PORT ?? 4000);

try {
  await app.listen({ port, host: "0.0.0.0" });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
