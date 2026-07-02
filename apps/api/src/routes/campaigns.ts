import { recommendDecision } from "@k7/business";
import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { prisma } from "../prisma.js";

const campaignSchema = z.object({
  productId: z.string(),
  name: z.string().min(1),
  channel: z.enum(["meta_ads", "organico", "whatsapp", "catalogo", "tiktok_ads"]),
  status: z.enum(["pendiente", "activa", "en_revision", "escalada", "pausada", "finalizada"]).default("pendiente"),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  plannedBudget: z.coerce.number().default(0),
  realSpend: z.coerce.number().default(0),
  salesGoal: z.coerce.number().int().default(1),
  profitGoal: z.coerce.number().default(100),
  mainHook: z.string().optional(),
  salesAngle: z.string().optional(),
  offer: z.string().optional(),
  cta: z.string().optional(),
  creativeUrl: z.string().optional(),
  adUrl: z.string().optional(),
  responsible: z.string().optional(),
  observations: z.string().optional()
});

const metricSchema = z.object({
  date: z.coerce.date().default(() => new Date()),
  spend: z.coerce.number().default(0),
  impressions: z.coerce.number().int().default(0),
  clicks: z.coerce.number().int().default(0),
  messages: z.coerce.number().int().default(0),
  sales: z.coerce.number().int().default(0),
  revenue: z.coerce.number().default(0),
  estimatedProfit: z.coerce.number().default(0),
  cpa: z.coerce.number().default(0),
  roas: z.coerce.number().default(0),
  conversionRate: z.coerce.number().default(0)
});

export const campaignRoutes: FastifyPluginAsync = async (app) => {
  app.addHook("preHandler", app.authenticate);

  app.get("/", async () => {
    return prisma.campaign.findMany({
      orderBy: { createdAt: "desc" },
      include: { product: true, metrics: { orderBy: { date: "desc" }, take: 1 } }
    });
  });

  app.post("/", async (request, reply) => {
    const body = campaignSchema.parse(request.body);
    const campaign = await prisma.campaign.create({ data: body });
    return reply.code(201).send(campaign);
  });

  app.get("/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    return prisma.campaign.findUniqueOrThrow({
      where: { id },
      include: {
        product: { include: { financials: { orderBy: { createdAt: "desc" }, take: 1 } } },
        metrics: { orderBy: { date: "desc" } },
        sales: { orderBy: { orderDate: "desc" } },
        decisionLogs: { orderBy: { createdAt: "desc" } }
      }
    });
  });

  app.patch("/:id", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = campaignSchema.partial().parse(request.body);
    return prisma.campaign.update({ where: { id }, data: body });
  });

  app.post("/:id/activate", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const campaign = await prisma.campaign.update({ where: { id }, data: { status: "activa" } });
    await prisma.product.update({ where: { id: campaign.productId }, data: { status: "campana_activa" } });
    return campaign;
  });

  app.post("/:id/pause", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const campaign = await prisma.campaign.update({ where: { id }, data: { status: "pausada" } });
    await prisma.product.update({ where: { id: campaign.productId }, data: { status: "pausado" } });
    return campaign;
  });

  app.post("/:id/close", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    return prisma.campaign.update({ where: { id }, data: { status: "finalizada" } });
  });

  app.post("/:id/metrics", async (request, reply) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = metricSchema.parse(request.body);
    const metric = await prisma.campaignMetric.create({ data: { ...body, campaignId: id } });
    return reply.code(201).send(metric);
  });

  app.post("/:id/recommendation", async (request) => {
    const { id } = z.object({ id: z.string() }).parse(request.params);
    const body = z.object({
      hasInterest: z.boolean().optional(),
      weakCreativeOrCopy: z.boolean().optional(),
      lowConversion: z.boolean().optional(),
      limitedStock: z.boolean().optional(),
      insufficientMargin: z.boolean().optional(),
      unstableSupplier: z.boolean().optional(),
      lowStock: z.boolean().optional(),
      highLogisticComplexity: z.boolean().optional(),
      notCompetitivePrice: z.boolean().optional()
    }).parse(request.body ?? {});

    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id },
      include: {
        product: { include: { financials: { orderBy: { createdAt: "desc" }, take: 1 } } },
        metrics: { orderBy: { date: "desc" }, take: 1 },
        sales: true
      }
    });
    const latestFinancial = campaign.product.financials[0];
    const latestMetric = campaign.metrics[0];
    const sales = campaign.sales.reduce((sum, sale) => sum + sale.quantity, 0);
    const revenue = campaign.sales.reduce((sum, sale) => sum + Number(sale.lineTotal), 0);
    const spend = Number(latestMetric?.spend ?? campaign.realSpend);
    const grossMargin = Number(latestFinancial?.grossMargin ?? 0);
    const estimatedProfit = revenue > 0 ? sales * grossMargin - spend : Number(latestMetric?.estimatedProfit ?? 0);
    const cpa = sales > 0 ? spend / sales : spend;
    const roas = spend > 0 ? revenue / spend : 0;

    const recommendation = recommendDecision({
      sales,
      salesGoal: campaign.salesGoal,
      roas,
      breakEvenRoas: Number(latestFinancial?.breakEvenRoas ?? 0),
      estimatedProfit,
      stock: campaign.product.stock,
      cpa,
      grossMargin,
      spend,
      clicks: latestMetric?.clicks,
      messages: latestMetric?.messages,
      ...body
    });

    const log = await prisma.decisionLog.create({
      data: {
        productId: campaign.productId,
        campaignId: campaign.id,
        decision: recommendation.decision,
        reason: recommendation.reason,
        scoreBefore: campaign.product.priorityScore,
        scoreAfter: campaign.product.priorityScore
      }
    });

    return { recommendation, log };
  });
};
