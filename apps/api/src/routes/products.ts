import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";
import { recalculateProduct } from "../services/financials.js";

const productSchema = z.object({
  name: z.string().min(1),
  dropiCode: z.string().optional(),
  dropiUrl: z.string().optional(),
  productUrl: z.string().optional(),
  supplierUrl: z.string().optional(),
  supplierName: z.string().optional(),
  supplierCost: z.coerce.number().default(0),
  marketPrice: z.coerce.number().optional(),
  marketPriceLow: z.coerce.number().optional(),
  marketPriceAverage: z.coerce.number().optional(),
  marketPriceHigh: z.coerce.number().optional(),
  idealSalePrice: z.coerce.number().default(0),
  minSalePrice: z.coerce.number().optional(),
  stock: z.coerce.number().int().default(0),
  category: z.string().optional(),
  niche: z.string().optional(),
  wooProductId: z.string().optional(),
  wooSku: z.string().optional(),
  logisticComplexity: z.enum(["baja", "media", "alta"]).default("media"),
  wowScore: z.coerce.number().int().min(1).max(5).default(1),
  supplierScore: z.coerce.number().int().min(1).max(5).default(1),
  contentScore: z.coerce.number().int().min(1).max(5).default(1),
  hasRealSalesData: z.coerce.boolean().default(false),
  isPriceCompetitive: z.coerce.boolean().default(false),
  status: z.enum(["detectado", "en_analisis", "aprobado", "campana_activa", "escalar", "ajustar", "pausado", "descartado", "ganador"]).default("detectado"),
  observations: z.string().optional(),
  mainImageUrl: z.string().optional()
});

export const productRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async () => {
    return prisma.product.findMany({
      orderBy: [{ priorityScore: "desc" }, { createdAt: "desc" }],
      include: { financials: { orderBy: { createdAt: "desc" }, take: 1 } }
    });
  });

  app.post("/", async (request, reply) => {
    const body = productSchema.parse(request.body);
    const product = await prisma.product.create({ data: body });
    const calculated = await recalculateProduct(product.id);
    return reply.code(201).send(calculated);
  });

  app.get("/top-10", async () => {
    return prisma.product.findMany({
      orderBy: [{ priorityScore: "desc" }, { updatedAt: "desc" }],
      take: 10,
      include: {
        financials: { orderBy: { createdAt: "desc" }, take: 1 },
        campaignSales: true
      }
    });
  });

  app.get("/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    return prisma.product.findUniqueOrThrow({
      where: { id },
      include: {
        financials: { orderBy: { createdAt: "desc" }, take: 5 },
        campaigns: { orderBy: { createdAt: "desc" } },
        campaignSales: { orderBy: { orderDate: "desc" } },
        decisionLogs: { orderBy: { createdAt: "desc" } }
      }
    });
  });

  app.patch("/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = productSchema.partial().parse(request.body);
    await prisma.product.update({ where: { id }, data: body });
    return recalculateProduct(id);
  });

  app.delete("/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    await prisma.product.delete({ where: { id } });
    return { ok: true };
  });

  app.post("/:id/calculate-score", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      adInvestment: z.coerce.number().optional(),
      targetSales: z.coerce.number().int().optional()
    }).parse(request.body ?? {});
    return recalculateProduct(id, body);
  });

  app.get("/:id/financials", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    return prisma.productFinancial.findMany({
      where: { productId: id },
      orderBy: { createdAt: "desc" }
    });
  });
};
