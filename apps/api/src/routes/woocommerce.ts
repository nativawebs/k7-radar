import { isWooCommerceSaleOk } from "@k7/business";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";

const wooLineItemSchema = z.object({
  product_id: z.union([z.string(), z.number()]).optional(),
  sku: z.string().optional(),
  name: z.string().optional(),
  quantity: z.coerce.number().int().default(1),
  price: z.coerce.number().default(0),
  total: z.coerce.number().default(0)
});

const wooOrderSchema = z.object({
  id: z.union([z.string(), z.number()]),
  status: z.string(),
  date_created: z.string().optional(),
  line_items: z.array(wooLineItemSchema).default([])
});

async function processWooOrder(order: z.infer<typeof wooOrderSchema>) {
  if (!isWooCommerceSaleOk(order.status)) {
    return { importedLines: 0, unmatchedLines: 0 };
  }

  let importedLines = 0;
  let unmatchedLines = 0;
  const orderDate = order.date_created ? new Date(order.date_created) : new Date();
  const wooOrderId = String(order.id);

  for (const item of order.line_items) {
    const wooProductId = item.product_id ? String(item.product_id) : undefined;
    const product = await prisma.product.findFirst({
      where: {
        OR: [
          wooProductId ? { wooProductId } : undefined,
          item.sku ? { wooSku: item.sku } : undefined,
          item.sku ? { dropiCode: item.sku } : undefined
        ].filter(Boolean) as any
      },
      include: { campaigns: { where: { status: "activa" }, orderBy: { createdAt: "desc" }, take: 1 } }
    });

    if (!product) {
      unmatchedLines += 1;
      await prisma.unmatchedWooCommerceProduct.create({
        data: {
          wooProductId,
          wooSku: item.sku,
          wooOrderId,
          name: item.name,
          quantity: item.quantity,
          lineTotal: item.total,
          orderDate
        }
      });
      continue;
    }

    await prisma.campaignSale.upsert({
      where: { wooOrderId_productId: { wooOrderId, productId: product.id } },
      create: {
        campaignId: product.campaigns[0]?.id,
        productId: product.id,
        wooOrderId,
        wooOrderStatus: order.status,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.total,
        orderDate
      },
      update: {
        wooOrderStatus: order.status,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.total,
        orderDate
      }
    });

    await prisma.product.update({
      where: { id: product.id },
      data: { hasRealSalesData: true }
    });

    importedLines += 1;
  }

  return { importedLines, unmatchedLines };
}

export const wooCommerceRoutes: FastifyPluginAsync = async (app) => {
  app.post("/webhooks/woocommerce/orders", async (request, reply) => {
    const order = wooOrderSchema.parse(request.body);
    const result = await processWooOrder(order);
    return reply.code(202).send(result);
  });

  app.post("/sync/woocommerce/orders", { preHandler: [app.authenticate] }, async () => {
    const baseUrl = process.env.WOOCOMMERCE_BASE_URL;
    const key = process.env.WOOCOMMERCE_CONSUMER_KEY;
    const secret = process.env.WOOCOMMERCE_CONSUMER_SECRET;

    if (!baseUrl || !key || !secret) {
      await prisma.syncLog.create({
        data: { status: "error", errorMessage: "Credenciales WooCommerce no configuradas" }
      });
      return { importedOrders: 0, importedLines: 0, error: "Credenciales WooCommerce no configuradas" };
    }

    try {
      const url = new URL("/wp-json/wc/v3/orders", baseUrl);
      url.searchParams.set("status", "processing");
      url.searchParams.set("consumer_key", key);
      url.searchParams.set("consumer_secret", secret);

      const response = await fetch(url);
      if (!response.ok) throw new Error(`WooCommerce respondio ${response.status}`);

      const orders = z.array(wooOrderSchema).parse(await response.json());
      let importedLines = 0;
      for (const order of orders) {
        const result = await processWooOrder(order);
        importedLines += result.importedLines;
      }

      await prisma.syncLog.create({
        data: { status: "success", importedOrders: orders.length, importedLines }
      });

      return { importedOrders: orders.length, importedLines };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Error desconocido";
      await prisma.syncLog.create({ data: { status: "error", errorMessage: message } });
      return { importedOrders: 0, importedLines: 0, error: message };
    }
  });

  app.get("/sync/woocommerce/status", { preHandler: [app.authenticate] }, async () => {
    return prisma.syncLog.findFirst({ orderBy: { syncedAt: "desc" } });
  });

  app.get("/woocommerce/unmatched-products", { preHandler: [app.authenticate] }, async () => {
    return prisma.unmatchedWooCommerceProduct.findMany({ orderBy: { createdAt: "desc" } });
  });
};
