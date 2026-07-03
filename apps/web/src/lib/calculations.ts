export type FinancialInput = {
  supplierCost: number;
  salePrice: number;
  extraCosts?: number;
  adInvestment?: number;
  targetSales?: number;
  targetProfit?: number;
};

export type FinancialResult = {
  grossMargin: number;
  grossMarginPercent: number;
  breakEvenCpa: number;
  plannedCpa: number;
  projectedProfit: number;
  breakEvenRoas: number;
  salesNeededForTarget: number;
};

export function roundMoney(value: number): number {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function calculateFinancials(input: FinancialInput): FinancialResult {
  const extraCosts = input.extraCosts ?? 0;
  const adInvestment = input.adInvestment ?? 0;
  const targetSales = Math.max(1, input.targetSales ?? 1);
  const targetProfit = input.targetProfit ?? 100;
  const grossMargin = input.salePrice - input.supplierCost - extraCosts;
  const grossMarginPercent = input.salePrice > 0 ? (grossMargin / input.salePrice) * 100 : 0;
  const plannedCpa = adInvestment / targetSales;
  const projectedProfit = grossMargin * targetSales - adInvestment;
  const breakEvenRoas = grossMargin > 0 ? input.salePrice / grossMargin : 0;
  const salesNeededForTarget = grossMargin > 0 ? Math.ceil((targetProfit + adInvestment) / grossMargin) : 0;

  return {
    grossMargin: roundMoney(grossMargin),
    grossMarginPercent: roundMoney(grossMarginPercent),
    breakEvenCpa: roundMoney(grossMargin),
    plannedCpa: roundMoney(plannedCpa),
    projectedProfit: roundMoney(projectedProfit),
    breakEvenRoas: roundMoney(breakEvenRoas),
    salesNeededForTarget
  };
}
