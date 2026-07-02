import type { FastifyPluginAsync } from "fastify";
import { prisma } from "../prisma.js";

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export const dashboardRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/summary", async () => {
    const today = startOfToday();
    const [salesToday, activeProducts, activeCampaigns, alerts, topProduct] = await Promise.all([
      prisma.campaignSale.findMany({
        where: { orderDate: { gte: today }, wooOrderStatus: "processing" },
        include: { product: { include: { financials: { orderBy: { createdAt: "desc" }, take: 1 } } } }
      }),
      prisma.product.count({ where: { status: { notIn: ["descartado", "pausado"] } } }),
      prisma.campaign.count({ where: { status: "activa" } }),
      prisma.product.count({ where: { stock: { lt: 10 } } }),
      prisma.product.findFirst({ orderBy: { priorityScore: "desc" } })
    ]);

    const salesOkToday = salesToday.reduce((sum, sale) => sum + sale.quantity, 0);
    const estimatedProfitToday = salesToday.reduce((sum, sale) => {
      const margin = Number(sale.product.financials[0]?.grossMargin ?? 0);
      return sum + margin * sale.quantity;
    }, 0);

    return {
      salesOkToday,
      estimatedProfitToday,
      activeProducts,
      activeCampaigns,
      stockAlerts: alerts,
      topProduct
    };
  });

  app.get("/top-products", async () => {
    return prisma.product.findMany({
      orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }],
      take: 10,
      include: { financials: { orderBy: { createdAt: "desc" }, take: 1 }, campaignSales: true }
    });
  });

  app.get("/alerts", async () => {
    return prisma.product.findMany({
      where: { stock: { lt: 10 } },
      orderBy: { stock: "asc" },
      include: { financials: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
  });

  app.get("/daily-performance", async () => {
    const today = startOfToday();
    return prisma.campaignSale.findMany({
      where: { orderDate: { gte: today }, wooOrderStatus: "processing" },
      orderBy: { orderDate: "desc" },
      include: { product: true, campaign: true }
    });
  });
};
