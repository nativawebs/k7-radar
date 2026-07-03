import type { DecisionType, LogisticComplexity } from "../types/business";

export type ScoreInput = {
  grossMargin: number;
  grossMarginPercent: number;
  stock: number;
  targetSales?: number;
  isPriceCompetitive?: boolean;
  contentScore: number;
  wowScore: number;
  logisticComplexity: LogisticComplexity;
  supplierScore: number;
  hasRealSalesData?: boolean;
};

export type ScoreBreakdown = {
  margin: number;
  stock: number;
  priceCompetitive: number;
  contentPotential: number;
  logisticComplexity: number;
  supplierReliable: number;
  realSalesData: number;
  total: number;
  classification: "Prioridad alta" | "Testear" | "Revisar condiciones" | "No activar";
};

export type RecommendationInput = {
  sales: number;
  salesGoal: number;
  roas: number;
  breakEvenRoas: number;
  estimatedProfit: number;
  stock: number;
  cpa: number;
  grossMargin: number;
  spend: number;
  clicks?: number;
  messages?: number;
  hasInterest?: boolean;
  weakCreativeOrCopy?: boolean;
  lowConversion?: boolean;
  limitedStock?: boolean;
  insufficientMargin?: boolean;
  unstableSupplier?: boolean;
  lowStock?: boolean;
  highLogisticComplexity?: boolean;
  notCompetitivePrice?: boolean;
};

export type Recommendation = {
  decision: DecisionType;
  label: string;
  reason: string;
};

function clampScore(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(value)));
}

export function classifyScore(score: number): ScoreBreakdown["classification"] {
  if (score >= 80) return "Prioridad alta";
  if (score >= 65) return "Testear";
  if (score >= 50) return "Revisar condiciones";
  return "No activar";
}

export function calculateProductScore(input: ScoreInput): ScoreBreakdown {
  const marginMeetsMinimum = input.grossMargin >= 8 && input.grossMarginPercent >= 30;
  const margin = marginMeetsMinimum
    ? 25
    : clampScore(Math.min(input.grossMargin / 8, input.grossMarginPercent / 30) * 25, 25);

  const targetSales = Math.max(1, input.targetSales ?? 10);
  const stockIdeal = targetSales * 2;
  const stock = input.stock >= stockIdeal ? 15 : clampScore((input.stock / stockIdeal) * 15, 15);
  const priceCompetitive = input.isPriceCompetitive ? 15 : 0;
  const contentPotential = clampScore(((input.contentScore + input.wowScore) / 10) * 15, 15);
  const logisticComplexity =
    input.logisticComplexity === "baja" ? 10 : input.logisticComplexity === "media" ? 5 : 0;
  const supplierReliable = clampScore((input.supplierScore / 5) * 10, 10);
  const realSalesData = input.hasRealSalesData ? 10 : 0;
  const total =
    margin +
    stock +
    priceCompetitive +
    contentPotential +
    logisticComplexity +
    supplierReliable +
    realSalesData;

  return {
    margin,
    stock,
    priceCompetitive,
    contentPotential,
    logisticComplexity,
    supplierReliable,
    realSalesData,
    total: clampScore(total, 100),
    classification: classifyScore(total)
  };
}

export function recommendDecision(input: RecommendationInput): Recommendation {
  if (
    input.sales >= input.salesGoal &&
    input.roas > input.breakEvenRoas &&
    input.estimatedProfit > 0 &&
    input.stock >= input.salesGoal &&
    input.cpa < input.grossMargin
  ) {
    return {
      decision: "escalar",
      label: "Escalar presupuesto",
      reason: "Ventas en meta, ROAS sobre equilibrio, utilidad positiva, stock suficiente y CPA menor al margen bruto."
    };
  }

  if (
    input.insufficientMargin ||
    input.unstableSupplier ||
    input.lowStock ||
    input.highLogisticComplexity ||
    input.notCompetitivePrice
  ) {
    return {
      decision: "descartar",
      label: "Descartar producto",
      reason: "El producto incumple condiciones comerciales criticas definidas para margen, proveedor, stock, logistica o precio."
    };
  }

  if (input.spend > 0 && input.sales === 0 && input.cpa > input.grossMargin && (input.lowConversion || input.limitedStock)) {
    return {
      decision: "pausar",
      label: "Pausar campana",
      reason: "Hay gasto sin ventas, CPA proyectado mayor al margen, baja conversion o stock limitado."
    };
  }

  if ((input.clicks ?? 0) > 0 || (input.messages ?? 0) > 0 || input.hasInterest || input.weakCreativeOrCopy) {
    return {
      decision: "ajustar",
      label: "Ajustar oferta, hook o ficha",
      reason: "Hay senales de interes con pocas ventas, por lo que conviene ajustar creativo, copy, oferta o ficha."
    };
  }

  return {
    decision: "mantener_test",
    label: "Mantener test",
    reason: "No hay datos suficientes para escalar, ajustar, pausar o descartar con seguridad."
  };
}

export function isWooCommerceSaleOk(status: string): boolean {
  return status === "processing";
}
