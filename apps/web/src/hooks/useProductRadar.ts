import { useCallback, useEffect, useMemo, useState } from "react";
import { enrichProduct, type ProductDemo } from "../data/demo";
import { supabase } from "../lib/supabase";
import type { CampaignChannel, CampaignStatus, LogisticComplexity, ProductStatus } from "../types/business";

export type ProductRow = {
  id: string;
  name: string;
  dropi_code: string | null;
  dropi_url: string | null;
  product_url: string | null;
  supplier_url: string | null;
  supplier_name: string | null;
  supplier_cost: number | null;
  market_price: number | null;
  market_price_average: number | null;
  ideal_sale_price: number | null;
  min_sale_price: number | null;
  stock: number | null;
  category: string | null;
  niche: string | null;
  woo_product_id: string | null;
  woo_sku: string | null;
  logistic_complexity: LogisticComplexity | null;
  wow_score: number | null;
  supplier_score: number | null;
  content_score: number | null;
  has_real_sales_data: boolean | null;
  is_price_competitive: boolean | null;
  status: ProductStatus | null;
  priority_score: number | null;
  is_top10: boolean | null;
  top10_position: number | null;
  observations: string | null;
  main_image_url: string | null;
};

export type CampaignRow = {
  id: string;
  product_id: string;
  name: string;
  channel: CampaignChannel;
  status: CampaignStatus;
  start_date: string | null;
  end_date: string | null;
  planned_budget: number;
  real_spend: number;
  sales_goal: number;
  profit_goal: number;
  main_hook: string | null;
  sales_angle: string | null;
  offer: string | null;
  cta: string | null;
  creative_url: string | null;
  ad_url: string | null;
  responsible: string | null;
  observations: string | null;
};

export type CampaignSaleRow = {
  id: string;
  campaign_id: string | null;
  product_id: string;
  woo_order_id: string;
  woo_order_status: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  order_date: string;
};

export type CampaignMetricRow = {
  id: string;
  campaign_id: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  messages: number;
  sales: number;
  revenue: number;
  estimated_profit: number;
  cpa: number;
  roas: number;
  conversion_rate: number;
};

export type SyncLogRow = {
  status: "success" | "error";
  imported_orders: number | null;
  imported_lines: number | null;
  error_message: string | null;
  synced_at: string | null;
};

export type EnrichedProduct = ReturnType<typeof enrichProduct> & {
  row?: ProductRow;
};

export type DashboardPoint = {
  date: string;
  sales: number;
  transactions: number;
  clicks: number;
  revenue: number;
  spend: number;
  profit: number;
};

type RadarState = {
  products: EnrichedProduct[];
  campaigns: CampaignRow[];
  metrics: CampaignMetricRow[];
  sales: CampaignSaleRow[];
  syncLogs: SyncLogRow[];
  dashboard: DashboardPoint[];
  isLoading: boolean;
  source: "supabase" | "demo";
  refresh: () => Promise<void>;
};

function toNumber(value: number | string | null | undefined, fallback = 0) {
  return Number(value ?? fallback);
}

function dayKey(value?: string | null) {
  if (!value) return new Date().toISOString().slice(0, 10);
  return new Date(value).toISOString().slice(0, 10);
}

function mapProduct(row: ProductRow, campaigns: CampaignRow[], salesRows: CampaignSaleRow[], metricRows: CampaignMetricRow[]): ProductDemo {
  const productCampaignIds = campaigns.filter((campaign) => campaign.product_id === row.id).map((campaign) => campaign.id);
  const productSales = salesRows.filter((sale) => sale.product_id === row.id);
  const productMetrics = metricRows.filter((metric) => productCampaignIds.includes(metric.campaign_id));
  const sales = productSales.reduce((sum, sale) => sum + toNumber(sale.quantity), 0) + productMetrics.reduce((sum, metric) => sum + toNumber(metric.sales), 0);
  const adSpend = productMetrics.reduce((sum, metric) => sum + toNumber(metric.spend), 0);
  const clicks = productMetrics.reduce((sum, metric) => sum + toNumber(metric.clicks), 0);
  const messages = productMetrics.reduce((sum, metric) => sum + toNumber(metric.messages), 0);

  return {
    id: row.id,
    name: row.name,
    stock: toNumber(row.stock),
    supplierCost: toNumber(row.supplier_cost),
    idealSalePrice: toNumber(row.ideal_sale_price),
    marketPriceAverage: toNumber(row.market_price_average ?? row.market_price),
    category: row.category ?? "Sin categoria",
    supplierName: row.supplier_name ?? "Sin proveedor",
    logisticComplexity: row.logistic_complexity ?? "media",
    wowScore: toNumber(row.wow_score, 1),
    contentScore: toNumber(row.content_score, 1),
    supplierScore: toNumber(row.supplier_score, 1),
    status: row.status ?? "detectado",
    isPriceCompetitive: Boolean(row.is_price_competitive),
    hasRealSalesData: Boolean(row.has_real_sales_data || productSales.length > 0 || sales > 0),
    sales,
    adSpend,
    clicks,
    messages
  };
}

function buildDashboard(metrics: CampaignMetricRow[], sales: CampaignSaleRow[]): DashboardPoint[] {
  const points = new Map<string, DashboardPoint>();

  for (const sale of sales) {
    const date = dayKey(sale.order_date);
    const point = points.get(date) ?? { date, sales: 0, transactions: 0, clicks: 0, revenue: 0, spend: 0, profit: 0 };
    point.sales += toNumber(sale.quantity);
    point.transactions += 1;
    point.revenue += toNumber(sale.line_total);
    points.set(date, point);
  }

  for (const metric of metrics) {
    const date = dayKey(metric.date);
    const point = points.get(date) ?? { date, sales: 0, transactions: 0, clicks: 0, revenue: 0, spend: 0, profit: 0 };
    point.sales += toNumber(metric.sales);
    point.clicks += toNumber(metric.clicks);
    point.revenue += toNumber(metric.revenue);
    point.spend += toNumber(metric.spend);
    point.profit += toNumber(metric.estimated_profit);
    points.set(date, point);
  }

  return Array.from(points.values()).sort((a, b) => a.date.localeCompare(b.date)).slice(-14);
}

export function useProductRadar(): RadarState {
  const [state, setState] = useState<Omit<RadarState, "refresh">>({
    products: [],
    campaigns: [],
    metrics: [],
    sales: [],
    syncLogs: [],
    dashboard: [],
    isLoading: true,
    source: "supabase"
  });

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, isLoading: true }));

    const [{ data: products, error: productsError }, { data: campaigns }, { data: sales }, { data: metrics }, { data: syncLogs }] =
      await Promise.all([
        supabase.from("products").select("*").order("priority_score", { ascending: false }),
        supabase.from("campaigns").select("*").order("created_at", { ascending: false }),
        supabase.from("campaign_sales").select("*").order("order_date", { ascending: false }),
        supabase.from("campaign_metrics").select("*").order("date", { ascending: false }),
        supabase.from("sync_logs").select("status, imported_orders, imported_lines, error_message, synced_at").order("synced_at", {
          ascending: false
        })
      ]);

    if (productsError) {
      window.alert(`No se pudieron cargar los productos desde Supabase: ${productsError.message}`);
      setState({
        products: [],
        campaigns: (campaigns ?? []) as CampaignRow[],
        metrics: (metrics ?? []) as CampaignMetricRow[],
        sales: (sales ?? []) as CampaignSaleRow[],
        syncLogs: (syncLogs ?? []) as SyncLogRow[],
        dashboard: buildDashboard((metrics ?? []) as CampaignMetricRow[], (sales ?? []) as CampaignSaleRow[]),
        isLoading: false,
        source: "supabase"
      });
      return;
    }

    if (!products?.length) {
      setState({
        products: [],
        campaigns: (campaigns ?? []) as CampaignRow[],
        metrics: (metrics ?? []) as CampaignMetricRow[],
        sales: (sales ?? []) as CampaignSaleRow[],
        syncLogs: (syncLogs ?? []) as SyncLogRow[],
        dashboard: buildDashboard((metrics ?? []) as CampaignMetricRow[], (sales ?? []) as CampaignSaleRow[]),
        isLoading: false,
        source: "supabase"
      });
      return;
    }

    const campaignRows = (campaigns ?? []) as CampaignRow[];
    const saleRows = (sales ?? []) as CampaignSaleRow[];
    const metricRows = (metrics ?? []) as CampaignMetricRow[];
    const enriched = (products as ProductRow[])
      .map((product) => ({
        ...enrichProduct(mapProduct(product, campaignRows, saleRows, metricRows)),
        row: product
      }))
      .sort((a, b) => b.score.total - a.score.total);

    setState({
      products: enriched,
      campaigns: campaignRows,
      metrics: metricRows,
      sales: saleRows,
      syncLogs: (syncLogs ?? []) as SyncLogRow[],
      dashboard: buildDashboard(metricRows, saleRows),
      isLoading: false,
      source: "supabase"
    });
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return useMemo(() => ({ ...state, refresh }), [refresh, state]);
}
