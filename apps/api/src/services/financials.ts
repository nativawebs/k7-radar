import { calculateFinancials, calculateProductScore } from "@k7/business";
import { prisma } from "../prisma.js";

export async function recalculateProduct(productId: string, options?: { adInvestment?: number; targetSales?: number }) {
  const product = await prisma.product.findUniqueOrThrow({ where: { id: productId } });
  const financials = calculateFinancials({
    supplierCost: Number(product.supplierCost),
    salePrice: Number(product.idealSalePrice),
    extraCosts: 0,
    adInvestment: options?.adInvestment ?? 0,
    targetSales: options?.targetSales ?? 1,
    targetProfit: 100
  });

  await prisma.productFinancial.create({
    data: {
      productId: product.id,
      supplierCost: product.supplierCost,
      salePrice: product.idealSalePrice,
      extraCosts: 0,
      adInvestment: options?.adInvestment ?? 0,
      targetSales: options?.targetSales ?? 1,
      grossMargin: financials.grossMargin,
      grossMarginPercent: financials.grossMarginPercent,
      breakEvenCpa: financials.breakEvenCpa,
      plannedCpa: financials.plannedCpa,
      breakEvenRoas: financials.breakEvenRoas,
      targetProfit: 100,
      projectedProfit: financials.projectedProfit,
      salesNeededForTarget: financials.salesNeededForTarget
    }
  });

  const score = calculateProductScore({
    grossMargin: financials.grossMargin,
    grossMarginPercent: financials.grossMarginPercent,
    stock: product.stock,
    targetSales: options?.targetSales,
    isPriceCompetitive: product.isPriceCompetitive,
    contentScore: product.contentScore,
    wowScore: product.wowScore,
    logisticComplexity: product.logisticComplexity,
    supplierScore: product.supplierScore,
    hasRealSalesData: product.hasRealSalesData
  });

  const updated = await prisma.product.update({
    where: { id: product.id },
    data: { priorityScore: score.total }
  });

  return { product: updated, financials, score };
}
