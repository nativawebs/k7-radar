import { useEffect, useMemo, useState } from "react";
import { demoProducts, enrichProduct, type ProductDemo } from "../data/demo";
import { supabase } from "../lib/supabase";
import type { LogisticComplexity, ProductStatus } from "../types/business";

type ProductRow = {
  id: string;
  name: string;
  stock: number | null;
  supplier_cost: number | null;
  ideal_sale_price: number | null;
  market_price_average: number | null;
  market_price: number | null;
  category: string | null;
  supplier_name: string | null;
  logistic_complexity: LogisticComplexity | null;
  wow_score: number | null;
  content_score: number | null;
  supplier_score: number | null;
  status: ProductStatus | null;
  is_price_competitive: boolean | null;
  has_real_sales_data: boolean | null;
};

type CampaignSaleRow = {
  product_id: string;
  quantity: number | null;
  line_total: number | null;
};

type CampaignMetricRow = {
  campaign_id: string;
  spend: number | null;
  clicks: number | null;
  messages: number | null;
};

type SyncLogRow = {
  status: "success" | "error";
  imported_orders: number | null;
  imported_lines: number | null;
  error_message: string | null;
  synced_at: string | null;
};

type RadarState = {
  products: EnrichedProduct[];
  syncLogs: SyncLogRow[];
  isLoading: boolean;
  source: "supabase" | "demo";
};

export type EnrichedProduct = ReturnType<typeof enrichProduct>;

function toNumber(value: number | null | undefined, fallback = 0) {
  return Number(value ?? fallback);
}

function mapProduct(row: ProductRow, salesRows: CampaignSaleRow[], metricRows: CampaignMetricRow[]): ProductDemo {
  const productSales = salesRows.filter((sale) => sale.product_id === row.id);
  const sales = productSales.reduce((sum, sale) => sum + toNumber(sale.quantity), 0);
  const adSpend = metricRows.reduce((sum, metric) => sum + toNumber(metric.spend), 0);
  const clicks = metricRows.reduce((sum, metric) => sum + toNumber(metric.clicks), 0);
  const messages = metricRows.reduce((sum, metric) => sum + toNumber(metric.messages), 0);

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
    hasRealSalesData: Boolean(row.has_real_sales_data || sales > 0),
    sales,
    adSpend,
    clicks,
    messages
  };
}

export function useProductRadar(): RadarState {
  const [state, setState] = useState<RadarState>({
    products: demoProducts.map(enrichProduct).sort((a, b) => b.score.total - a.score.total),
    syncLogs: [],
    isLoading: true,
    source: "demo"
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      const [{ data: products, error: productsError }, { data: sales }, { data: metrics }, { data: syncLogs }] =
        await Promise.all([
          supabase.from("products").select("*").order("priority_score", { ascending: false }),
          supabase.from("campaign_sales").select("product_id, quantity, line_total"),
          supabase.from("campaign_metrics").select("campaign_id, spend, clicks, messages"),
          supabase.from("sync_logs").select("status, imported_orders, imported_lines, error_message, synced_at").order("synced_at", {
            ascending: false
          })
        ]);

      if (!mounted) return;

      if (productsError || !products?.length) {
        setState((current) => ({ ...current, isLoading: false, source: "demo" }));
        return;
      }

      const enriched = (products as ProductRow[])
        .map((product) => mapProduct(product, (sales ?? []) as CampaignSaleRow[], (metrics ?? []) as CampaignMetricRow[]))
        .map(enrichProduct)
        .sort((a, b) => b.score.total - a.score.total);

      setState({
        products: enriched,
        syncLogs: (syncLogs ?? []) as SyncLogRow[],
        isLoading: false,
        source: "supabase"
      });
    }

    void load();

    return () => {
      mounted = false;
    };
  }, []);

  return useMemo(() => state, [state]);
}
