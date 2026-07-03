import { calculateFinancials } from "../lib/calculations";
import { calculateProductScore, recommendDecision } from "../lib/scoring";
import type { LogisticComplexity, ProductStatus } from "../types/business";

export type ProductDemo = {
  id: string;
  name: string;
  stock: number;
  supplierCost: number;
  idealSalePrice: number;
  marketPriceAverage: number;
  category: string;
  supplierName: string;
  logisticComplexity: LogisticComplexity;
  wowScore: number;
  contentScore: number;
  supplierScore: number;
  status: ProductStatus;
  isPriceCompetitive: boolean;
  hasRealSalesData: boolean;
  sales: number;
  adSpend: number;
  clicks: number;
  messages: number;
};

export const demoProducts: ProductDemo[] = [
  {
    id: "p1",
    name: "Mini licuadora portatil",
    stock: 42,
    supplierCost: 9.5,
    idealSalePrice: 24.99,
    marketPriceAverage: 26,
    category: "Hogar",
    supplierName: "Dropi",
    logisticComplexity: "baja",
    wowScore: 5,
    contentScore: 5,
    supplierScore: 4,
    status: "campana_activa",
    isPriceCompetitive: true,
    hasRealSalesData: true,
    sales: 11,
    adSpend: 35,
    clicks: 180,
    messages: 37
  },
  {
    id: "p2",
    name: "Organizador modular cocina",
    stock: 18,
    supplierCost: 7,
    idealSalePrice: 18.5,
    marketPriceAverage: 19,
    category: "Cocina",
    supplierName: "Proveedor local",
    logisticComplexity: "media",
    wowScore: 4,
    contentScore: 4,
    supplierScore: 4,
    status: "aprobado",
    isPriceCompetitive: true,
    hasRealSalesData: false,
    sales: 3,
    adSpend: 18,
    clicks: 92,
    messages: 14
  },
  {
    id: "p3",
    name: "Lampara led tactil",
    stock: 7,
    supplierCost: 12,
    idealSalePrice: 23,
    marketPriceAverage: 21,
    category: "Tecnologia",
    supplierName: "Dropi",
    logisticComplexity: "alta",
    wowScore: 3,
    contentScore: 3,
    supplierScore: 3,
    status: "ajustar",
    isPriceCompetitive: false,
    hasRealSalesData: true,
    sales: 1,
    adSpend: 22,
    clicks: 130,
    messages: 9
  }
];

export function enrichProduct(product: ProductDemo) {
  const financials = calculateFinancials({
    supplierCost: product.supplierCost,
    salePrice: product.idealSalePrice,
    adInvestment: product.adSpend,
    targetSales: 10
  });
  const score = calculateProductScore({
    grossMargin: financials.grossMargin,
    grossMarginPercent: financials.grossMarginPercent,
    stock: product.stock,
    targetSales: 10,
    isPriceCompetitive: product.isPriceCompetitive,
    contentScore: product.contentScore,
    wowScore: product.wowScore,
    logisticComplexity: product.logisticComplexity,
    supplierScore: product.supplierScore,
    hasRealSalesData: product.hasRealSalesData
  });
  const revenue = product.sales * product.idealSalePrice;
  const cpa = product.sales > 0 ? product.adSpend / product.sales : product.adSpend;
  const roas = product.adSpend > 0 ? revenue / product.adSpend : 0;
  const estimatedProfit = product.sales * financials.grossMargin - product.adSpend;
  const recommendation = recommendDecision({
    sales: product.sales,
    salesGoal: 10,
    roas,
    breakEvenRoas: financials.breakEvenRoas,
    estimatedProfit,
    stock: product.stock,
    cpa,
    grossMargin: financials.grossMargin,
    spend: product.adSpend,
    clicks: product.clicks,
    messages: product.messages,
    lowStock: product.stock < 10,
    highLogisticComplexity: product.logisticComplexity === "alta",
    notCompetitivePrice: !product.isPriceCompetitive
  });

  return { ...product, financials, score, revenue, cpa, roas, estimatedProfit, recommendation };
}

export const enrichedProducts = demoProducts.map(enrichProduct).sort((a, b) => b.score.total - a.score.total);
