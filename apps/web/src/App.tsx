import {
  BarChart3,
  Boxes,
  Home,
  LayoutGrid,
  List,
  LogOut,
  Megaphone,
  PlusCircle,
  RefreshCcw,
  Search,
  Trophy
} from "lucide-react";
import type { FormEvent, ReactNode } from "react";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { LoginScreen } from "./auth/LoginScreen";
import { useAuth } from "./auth/AuthProvider";
import { Badge, Button, Card, MetricCard, TrafficLight } from "./components/ui";
import {
  useProductRadar,
  type CampaignMetricRow,
  type CampaignRow,
  type EnrichedProduct
} from "./hooks/useProductRadar";
import { money, percent, labelFromKey } from "./lib/format";
import { supabase, isSupabaseConfigured } from "./lib/supabase";
import { calculateFinancials } from "./lib/calculations";
import { calculateProductScore } from "./lib/scoring";
import type { CampaignChannel, CampaignStatus, ProductStatus } from "./types/business";

type View = "dashboard" | "radar" | "top10" | "detail" | "campaigns" | "sync" | "reports";
type DisplayMode = "cards" | "list";

const navItems: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "radar", label: "Radar", icon: Search },
  { id: "top10", label: "Top 10", icon: Trophy },
  { id: "campaigns", label: "Campanas", icon: Megaphone },
  { id: "reports", label: "Reportes", icon: BarChart3 },
  { id: "sync", label: "Woo Sync", icon: RefreshCcw }
];

const productStatuses: ProductStatus[] = [
  "detectado",
  "en_analisis",
  "aprobado",
  "campana_activa",
  "escalar",
  "ajustar",
  "pausado",
  "descartado",
  "ganador"
];

const campaignStatuses: CampaignStatus[] = ["pendiente", "activa", "en_revision", "escalada", "pausada", "finalizada"];
const campaignChannels: CampaignChannel[] = ["meta_ads", "organico", "whatsapp", "catalogo", "tiktok_ads"];

function statusTone(status: string) {
  if (status === "ganador" || status === "escalar" || status === "escalada") return "green";
  if (status === "descartado" || status === "pausado" || status === "pausada") return "red";
  if (status === "ajustar" || status === "en_revision") return "yellow";
  if (status === "campana_activa" || status === "aprobado" || status === "activa") return "orange";
  return "gray";
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function numberValue(formData: FormData, key: string, fallback = 0) {
  const value = Number(formData.get(key));
  return Number.isFinite(value) ? value : fallback;
}

function stringValue(formData: FormData, key: string, fallback = "") {
  return String(formData.get(key) ?? fallback).trim();
}

function getTop10Products(products: EnrichedProduct[]) {
  return products
    .filter((product) => Boolean(product.row?.is_top10))
    .sort((a, b) => {
      const positionA = a.row?.top10_position ?? 99;
      const positionB = b.row?.top10_position ?? 99;
      if (positionA !== positionB) return positionA - positionB;
      return b.score.total - a.score.total;
    })
    .slice(0, 10);
}

async function placeProductInTop10(product: EnrichedProduct, products: EnrichedProduct[], onRefresh: () => Promise<void>) {
  const currentPosition = product.row?.is_top10 ? product.row?.top10_position : null;
  const answer = window.prompt("En que puesto del Top 10 quieres colocar este producto? Escribe un numero del 1 al 10.", String(currentPosition ?? 1));
  if (!answer) return;

  const position = Number(answer);
  if (!Number.isInteger(position) || position < 1 || position > 10) {
    window.alert("El puesto debe ser un numero entero entre 1 y 10.");
    return;
  }

  const currentProduct = products.find((item) => item.row?.is_top10 && item.row?.top10_position === position && item.id !== product.id);
  if (currentProduct && !window.confirm(`El puesto ${position} esta ocupado por "${currentProduct.name}". Quieres reemplazarlo?`)) return;

  const { error: clearError } = await supabase
    .from("products")
    .update({ is_top10: false, top10_position: null, updated_at: new Date().toISOString() })
    .eq("is_top10", true)
    .eq("top10_position", position);

  if (clearError) {
    window.alert(`No se pudo liberar el puesto del Top 10: ${clearError.message}`);
    return;
  }

  const { error } = await supabase
    .from("products")
    .update({ is_top10: true, top10_position: position, updated_at: new Date().toISOString() })
    .eq("id", product.id);

  if (error) {
    window.alert(`No se pudo colocar el producto en Top 10: ${error.message}`);
    return;
  }

  await onRefresh();
}

async function removeProductFromTop10(product: EnrichedProduct, onRefresh: () => Promise<void>) {
  if (!window.confirm(`Quieres quitar "${product.name}" del Top 10?`)) return;
  const { error } = await supabase
    .from("products")
    .update({ is_top10: false, top10_position: null, updated_at: new Date().toISOString() })
    .eq("id", product.id);

  if (error) {
    window.alert(`No se pudo quitar el producto del Top 10: ${error.message}`);
    return;
  }

  await onRefresh();
}

export function App() {
  const { isLoading, user, signOut } = useAuth();
  const radar = useProductRadar();
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState("");
  const selected = radar.products.find((product) => product.id === selectedId) ?? radar.products[0];

  const today = todayKey();
  const todayPoint = radar.dashboard.find((point) => point.date === today) ?? {
    sales: 0,
    transactions: 0,
    clicks: 0,
    revenue: 0,
    spend: 0,
    profit: 0
  };

  const summary = useMemo(
    () => ({
      salesOkToday: todayPoint.sales,
      transactionsToday: todayPoint.transactions,
      clicksToday: todayPoint.clicks,
      revenueToday: todayPoint.revenue,
      estimatedProfit: todayPoint.profit,
      activeCampaigns: radar.campaigns.filter((campaign) => campaign.status === "activa").length,
      alerts: radar.products.filter((product) => product.stock < 10).length
    }),
    [radar.campaigns, radar.products, todayPoint]
  );

  if (!isSupabaseConfigured) {
    return (
      <div className="grid min-h-screen place-items-center bg-k7-soft px-4 text-k7-ink">
        <Card className="max-w-xl">
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-k7-orange text-xl font-black text-white">K7</div>
          <h1 className="mt-4 text-2xl font-black">Configura Supabase Auth</h1>
          <p className="mt-2 text-sm text-gray-600">
            Define `VITE_SUPABASE_URL` y `VITE_SUPABASE_PUBLISHABLE_KEY` en tu `.env` para activar el login.
          </p>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-k7-soft px-4 text-k7-ink">
        <div className="text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-k7-orange text-xl font-black text-white">K7</div>
          <p className="mt-3 text-sm font-bold text-gray-600">Verificando sesion...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginScreen />;

  return (
    <div className="min-h-screen bg-k7-soft text-k7-ink">
      <aside className="fixed left-0 top-0 z-20 hidden h-full w-64 border-r border-k7-line bg-white px-4 py-5 lg:block">
        <Brand />
        <nav className="mt-8 space-y-2">
          {navItems.map((item) => (
            <NavButton key={item.id} item={item} active={view === item.id} onClick={() => setView(item.id)} />
          ))}
        </nav>
      </aside>

      <main className="mx-auto max-w-7xl px-4 pb-28 pt-4 lg:ml-64 lg:px-8 lg:pb-10">
        <header className="sticky top-0 z-10 -mx-4 mb-4 border-b border-k7-line bg-white/95 px-4 py-3 backdrop-blur lg:static lg:mx-0 lg:rounded-xl lg:border lg:px-5">
          <div className="flex items-center justify-between gap-3">
            <Brand compact />
            <div className="flex items-center gap-2">
              <span className="hidden max-w-56 truncate text-sm font-semibold text-gray-500 sm:inline">{user.email}</span>
              <Button variant="muted" onClick={() => void signOut()} aria-label="Cerrar sesion">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {view === "dashboard" && (
          <Dashboard
            products={radar.products}
            campaigns={radar.campaigns}
            dashboard={radar.dashboard}
            summary={summary}
            source={radar.source}
            loading={radar.isLoading}
            goTo={(next) => setView(next)}
          />
        )}
        {view === "radar" && (
          <Radar
            products={radar.products}
            onRefresh={radar.refresh}
            onSelect={(id) => {
              setSelectedId(id);
              setView("detail");
            }}
          />
        )}
        {view === "top10" && <Top10 products={radar.products} onRefresh={radar.refresh} onSelect={(id) => { setSelectedId(id); setView("detail"); }} />}
        {view === "detail" && selected && <ProductDetail product={selected} onRefresh={radar.refresh} />}
        {view === "campaigns" && (
          <Campaigns products={radar.products} campaigns={radar.campaigns} metrics={radar.metrics} onRefresh={radar.refresh} />
        )}
        {view === "reports" && <Reports products={radar.products} campaigns={radar.campaigns} metrics={radar.metrics} dashboard={radar.dashboard} onRefresh={radar.refresh} />}
        {view === "sync" && <WooSync syncLogs={radar.syncLogs} products={radar.products} onRefresh={radar.refresh} />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-6 border-t border-k7-line bg-white px-2 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-[11px] font-semibold ${
              view === item.id ? "bg-orange-50 text-k7-orange" : "text-gray-500 hover:text-k7-orange"
            }`}
          >
            <item.icon className="mb-1 h-5 w-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-k7-orange text-lg font-black text-white">K7</div>
      {!compact && (
        <div>
          <p className="text-base font-black">K7 Product Radar</p>
          <p className="text-xs text-gray-500">Decisiones para productos ganadores</p>
        </div>
      )}
      {compact && <p className="text-base font-black sm:text-xl">K7 Product Radar</p>}
    </div>
  );
}

function NavButton({ item, active, onClick }: { item: { label: string; icon: typeof Home }; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm font-semibold ${
        active ? "bg-orange-50 text-k7-orange" : "text-gray-600 hover:bg-k7-soft hover:text-k7-orange"
      }`}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </button>
  );
}

function Dashboard({
  products,
  campaigns,
  dashboard,
  summary,
  source,
  loading,
  goTo
}: {
  products: EnrichedProduct[];
  campaigns: CampaignRow[];
  dashboard: Array<{ date: string; sales: number; transactions: number; clicks: number; revenue: number; spend: number; profit: number }>;
  summary: { salesOkToday: number; transactionsToday: number; clicksToday: number; revenueToday: number; estimatedProfit: number; activeCampaigns: number; alerts: number };
  source: "supabase" | "demo";
  loading: boolean;
  goTo: (view: View) => void;
}) {
  const top = getTop10Products(products)[0];

  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-bold text-k7-orange">Hoy</p>
        <h1 className="text-3xl font-black tracking-normal">Productos que merecen atencion hoy</h1>
        <p className="mt-1 text-sm text-gray-500">
          {loading ? "Cargando datos..." : source === "supabase" ? "Datos conectados a Supabase" : "Vista demo hasta registrar productos reales"}
        </p>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Ventas OK hoy" value={String(summary.salesOkToday)} hint="WooCommerce processing + metricas manuales" />
        <MetricCard title="Transacciones hoy" value={String(summary.transactionsToday)} hint="Ordenes importadas y registros manuales" />
        <MetricCard title="Clics hoy" value={String(summary.clicksToday)} hint="Reporte manual de marketing" />
        <MetricCard title="Monto vendido hoy" value={money(summary.revenueToday)} hint="Ingresos reales o reportados" />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Ventas diarias" data={dashboard} type="bar" dataKey="sales" />
        <ChartCard title="Tendencia de monto vendido" data={dashboard} type="line" dataKey="revenue" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Top producto actual</p>
              <h2 className="mt-1 text-2xl font-black">{top?.name ?? "Sin productos en Top 10"}</h2>
            </div>
            {top && <Badge tone="green">Score {top.score.total}</Badge>}
          </div>
          {top && (
            <div className="mt-4 grid gap-3 sm:grid-cols-4">
              <MetricMini label="Margen" value={money(top.financials.grossMargin)} />
              <MetricMini label="Ventas" value={String(top.sales)} />
              <MetricMini label="Utilidad" value={money(top.estimatedProfit)} />
              <MetricMini label="Decision" value={top.recommendation.label} />
            </div>
          )}
          <Button className="mt-4" onClick={() => goTo("top10")}>Ver Top 10</Button>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Control operativo</p>
          <h3 className="mt-1 text-xl font-black">{campaigns.length} campanas</h3>
          <p className="mt-3 text-sm text-gray-600">{summary.activeCampaigns} activas, {summary.alerts} productos con alerta de stock.</p>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => goTo("reports")}>Registrar metricas</Button>
        </Card>
      </div>
    </div>
  );
}

function ChartCard({ title, data, type, dataKey }: { title: string; data: unknown[]; type: "bar" | "line"; dataKey: string }) {
  return (
    <Card>
      <h3 className="font-black">{title}</h3>
      <div className="mt-4 h-72">
        <ResponsiveContainer width="100%" height="100%">
          {type === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey={dataKey} fill="#f97316" radius={[6, 6, 0, 0]} />
            </BarChart>
          ) : (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey={dataKey} stroke="#f97316" strokeWidth={3} dot={{ r: 3 }} />
            </LineChart>
          )}
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function MetricMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-k7-soft p-3">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="mt-1 text-sm font-black">{value}</p>
    </div>
  );
}

function ViewToggle({ mode, setMode }: { mode: DisplayMode; setMode: (mode: DisplayMode) => void }) {
  return (
    <div className="flex rounded-xl border border-k7-line bg-white p-1">
      <button onClick={() => setMode("cards")} className={`rounded-lg px-3 py-2 ${mode === "cards" ? "bg-orange-50 text-k7-orange" : "text-gray-500"}`}>
        <LayoutGrid className="h-4 w-4" />
      </button>
      <button onClick={() => setMode("list")} className={`rounded-lg px-3 py-2 ${mode === "list" ? "bg-orange-50 text-k7-orange" : "text-gray-500"}`}>
        <List className="h-4 w-4" />
      </button>
    </div>
  );
}

function Radar({ products, onRefresh, onSelect }: { products: EnrichedProduct[]; onRefresh: () => Promise<void>; onSelect: (id: string) => void }) {
  const [mode, setMode] = useState<DisplayMode>("cards");

  return (
    <ViewFrame eyebrow="Radar de Productos" title="Productos candidatos">
      <ProductForm onSaved={onRefresh} />
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-500">{products.length} productos en seguimiento</p>
        <ViewToggle mode={mode} setMode={setMode} />
      </div>
      {mode === "cards" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              products={products}
              onRefresh={onRefresh}
              onSelect={() => onSelect(product.id)}
            />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-k7-line bg-white">
          {products.map((product) => (
            <div key={product.id} className="grid gap-2 border-b border-k7-line p-4 sm:grid-cols-[1fr_100px_100px_120px_170px] sm:items-center">
              <button onClick={() => onSelect(product.id)} className="text-left font-black hover:text-k7-orange">{product.name}</button>
              <span>Stock {product.stock}</span>
              <span>Score {product.score.total}</span>
              <Badge tone={product.row?.is_top10 ? "green" : statusTone(product.status) as never}>
                {product.row?.is_top10 ? `Top ${product.row?.top10_position ?? ""}` : labelFromKey(product.status)}
              </Badge>
              <Button variant="secondary" onClick={() => void placeProductInTop10(product, products, onRefresh)}>
                {product.row?.is_top10 ? "Mover Top 10" : "Colocar Top 10"}
              </Button>
            </div>
          ))}
        </div>
      )}
    </ViewFrame>
  );
}

function buildProductPayload(form: FormData, status: ProductStatus) {
  const financials = calculateFinancials({
    supplierCost: numberValue(form, "supplier_cost"),
    salePrice: numberValue(form, "ideal_sale_price"),
    targetSales: 10
  });
  const score = calculateProductScore({
    grossMargin: financials.grossMargin,
    grossMarginPercent: financials.grossMarginPercent,
    stock: numberValue(form, "stock"),
    targetSales: 10,
    isPriceCompetitive: Boolean(form.get("is_price_competitive")),
    contentScore: numberValue(form, "content_score", 1),
    wowScore: numberValue(form, "wow_score", 1),
    logisticComplexity: stringValue(form, "logistic_complexity", "media") as never,
    supplierScore: numberValue(form, "supplier_score", 1),
    hasRealSalesData: Boolean(form.get("has_real_sales_data"))
  });

  return {
    name: stringValue(form, "name"),
    dropi_code: stringValue(form, "dropi_code") || null,
    supplier_name: stringValue(form, "supplier_name") || null,
    supplier_cost: numberValue(form, "supplier_cost"),
    ideal_sale_price: numberValue(form, "ideal_sale_price"),
    market_price_average: numberValue(form, "market_price_average"),
    stock: numberValue(form, "stock"),
    category: stringValue(form, "category") || null,
    woo_sku: stringValue(form, "woo_sku") || stringValue(form, "dropi_code") || null,
    logistic_complexity: stringValue(form, "logistic_complexity", "media"),
    wow_score: numberValue(form, "wow_score", 1),
    content_score: numberValue(form, "content_score", 1),
    supplier_score: numberValue(form, "supplier_score", 1),
    is_price_competitive: Boolean(form.get("is_price_competitive")),
    has_real_sales_data: Boolean(form.get("has_real_sales_data")),
    priority_score: score.total,
    status,
    updated_at: new Date().toISOString()
  };
}

function ProductForm({
  onSaved,
  product,
  title = "Crear producto a medir",
  submitLabel,
  onCancel
}: {
  onSaved: () => Promise<void>;
  product?: EnrichedProduct;
  title?: string;
  submitLabel?: string;
  onCancel?: () => void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formElement = event.currentTarget;
    setSaving(true);
    const form = new FormData(formElement);
    const payload = buildProductPayload(form, product?.status ?? "detectado");
    const query = product
      ? supabase.from("products").update(payload).eq("id", product.id)
      : supabase.from("products").insert({ id: crypto.randomUUID(), ...payload });
    const { error } = await query;

    if (error) {
      setSaving(false);
      window.alert(`No se pudo guardar el producto: ${error.message}`);
      return;
    }

    if (!product) formElement.reset();
    setSaving(false);
    await onSaved();
    onCancel?.();
  }

  const row = product?.row;
  const actionLabel = submitLabel ?? (product ? "Guardar cambios" : "Crear producto");

  return (
    <Card>
      <h3 className="font-black">{title}</h3>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Input name="name" label="Nombre" required defaultValue={product?.name} />
        <Input name="dropi_code" label="Codigo Dropi" defaultValue={row?.dropi_code ?? ""} />
        <Input name="supplier_name" label="Proveedor" defaultValue={product?.supplierName === "Sin proveedor" ? "" : product?.supplierName} />
        <Input name="category" label="Categoria" defaultValue={product?.category === "Sin categoria" ? "" : product?.category} />
        <Input name="supplier_cost" label="Costo proveedor" type="number" step="0.01" required defaultValue={product?.supplierCost} />
        <Input name="ideal_sale_price" label="Precio ideal" type="number" step="0.01" required defaultValue={product?.idealSalePrice} />
        <Input name="market_price_average" label="Precio mercado prom." type="number" step="0.01" defaultValue={product?.marketPriceAverage} />
        <Input name="stock" label="Stock" type="number" required defaultValue={product?.stock} />
        <Input name="woo_sku" label="SKU WooCommerce" defaultValue={row?.woo_sku ?? ""} />
        <Select name="logistic_complexity" label="Complejidad" options={["baja", "media", "alta"]} defaultValue={product?.logisticComplexity ?? "media"} />
        <Input name="wow_score" label="Wow 1-5" type="number" min="1" max="5" defaultValue={product?.wowScore ?? 3} />
        <Input name="content_score" label="Contenido 1-5" type="number" min="1" max="5" defaultValue={product?.contentScore ?? 3} />
        <Input name="supplier_score" label="Proveedor 1-5" type="number" min="1" max="5" defaultValue={product?.supplierScore ?? 3} />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input name="is_price_competitive" type="checkbox" className="h-4 w-4 accent-k7-orange" defaultChecked={product?.isPriceCompetitive} />
          Precio competitivo
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input name="has_real_sales_data" type="checkbox" className="h-4 w-4 accent-k7-orange" defaultChecked={product?.hasRealSalesData} />
          Tiene data real
        </label>
        <div className="flex flex-wrap gap-2 sm:col-span-2 xl:col-span-4">
          <Button type="submit" disabled={saving}>{saving ? "Guardando..." : actionLabel}</Button>
          {onCancel && (
            <Button type="button" variant="muted" onClick={onCancel}>
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </Card>
  );
}

function ProductCard({
  product,
  products,
  onRefresh,
  onSelect
}: {
  product: EnrichedProduct;
  products: EnrichedProduct[];
  onRefresh: () => Promise<void>;
  onSelect: () => void;
}) {
  const light = product.financials.grossMargin >= 8 && product.financials.grossMarginPercent >= 30 ? "green" : product.stock < 10 ? "red" : "yellow";
  return (
    <Card className="flex h-full flex-col">
      <button onClick={onSelect} className="flex-1 text-left">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-black">{product.name}</h3>
            <p className="text-sm text-gray-500">{product.category} - {product.supplierName}</p>
          </div>
          <TrafficLight value={light} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <MetricMini label="Stock" value={String(product.stock)} />
          <MetricMini label="Margen" value={money(product.financials.grossMargin)} />
          <MetricMini label="Score" value={`${product.score.total}/100`} />
          <MetricMini label="Estado" value={labelFromKey(product.status)} />
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Badge tone={statusTone(product.status) as never}>{labelFromKey(product.status)}</Badge>
          {product.row?.is_top10 && <Badge tone="green">Top {product.row?.top10_position ?? ""}</Badge>}
        </div>
      </button>
      <Button className="mt-4 w-full" variant={product.row?.is_top10 ? "muted" : "secondary"} onClick={() => void placeProductInTop10(product, products, onRefresh)}>
        {product.row?.is_top10 ? "Mover en Top 10" : "Colocar en Top 10"}
      </Button>
    </Card>
  );
}

function Top10({ products, onRefresh, onSelect }: { products: EnrichedProduct[]; onRefresh: () => Promise<void>; onSelect: (id: string) => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const topProducts = getTop10Products(products);

  return (
    <ViewFrame eyebrow="Top 10" title="Productos elegidos desde Radar">
      <div className="space-y-3">
        {topProducts.length === 0 && (
          <Card>
            <p className="text-sm font-semibold text-gray-500">Todavia no hay productos colocados en Top 10 desde Radar.</p>
          </Card>
        )}
        {topProducts.map((product, index) => (
          <div key={product.id} className="space-y-3">
            <Card className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <button onClick={() => onSelect(product.id)} className="flex flex-1 items-center gap-3 text-left">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-k7-orange font-black text-white">{product.row?.top10_position ?? index + 1}</div>
                <div>
                  <h3 className="font-black">{product.name}</h3>
                  <p className="text-sm text-gray-500">Score {product.score.total} - Margen {money(product.financials.grossMargin)} - Stock {product.stock}</p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-3">
                    <MetricMini label="Ventas Woo" value={String(product.sales)} />
                    <MetricMini label="Vendido" value={money(product.revenue)} />
                    <MetricMini label="Utilidad est." value={money(product.estimatedProfit)} />
                  </div>
                </div>
              </button>
              <div className="flex flex-col gap-2 sm:items-end">
                <DecisionButtons product={product} onRefresh={onRefresh} />
                <div className="flex flex-wrap gap-2">
                  <Button variant="ghost" onClick={() => onSelect(product.id)}>Ver</Button>
                  <Button variant="secondary" onClick={() => void placeProductInTop10(product, products, onRefresh)}>Mover</Button>
                  <Button variant="secondary" onClick={() => setEditingId(editingId === product.id ? null : product.id)}>Editar</Button>
                  <Button variant="muted" onClick={() => void removeProductFromTop10(product, onRefresh)}>Quitar Top 10</Button>
                  <Button variant="danger" onClick={() => void deleteProduct(product.id, onRefresh)}>Eliminar</Button>
                </div>
              </div>
            </Card>
            {editingId === product.id && (
              <ProductForm
                product={product}
                onSaved={onRefresh}
                title={`Editar ${product.name}`}
                submitLabel="Guardar producto"
                onCancel={() => setEditingId(null)}
              />
            )}
          </div>
        ))}
      </div>
    </ViewFrame>
  );
}

function ProductDetail({ product, onRefresh }: { product: EnrichedProduct; onRefresh: () => Promise<void> }) {
  return (
    <ViewFrame eyebrow="Producto Detalle" title={product.name}>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge tone={statusTone(product.status) as never}>{labelFromKey(product.status)}</Badge>
            <Badge tone="orange">Score {product.score.total}/100</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricMini label="Codigo Dropi" value={product.row?.dropi_code ?? "Sin codigo"} />
            <MetricMini label="SKU Woo" value={product.row?.woo_sku ?? "Sin SKU"} />
            <MetricMini label="Costo proveedor" value={money(product.supplierCost)} />
            <MetricMini label="Precio ideal venta" value={money(product.idealSalePrice)} />
            <MetricMini label="Margen bruto" value={money(product.financials.grossMargin)} />
            <MetricMini label="Margen porcentual" value={percent(product.financials.grossMarginPercent)} />
            <MetricMini label="ROAS minimo" value={String(product.financials.breakEvenRoas)} />
            <MetricMini label="Ventas para $100" value={String(product.financials.salesNeededForTarget)} />
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-black">Recomendacion automatica</h3>
          <p className="mt-2 text-2xl font-black text-k7-orange">{product.recommendation.label}</p>
          <p className="mt-3 text-sm text-gray-600">{product.recommendation.reason}</p>
          <DecisionButtons product={product} onRefresh={onRefresh} />
          <Button className="mt-3" variant="danger" onClick={() => void deleteProduct(product.id, onRefresh)}>Eliminar producto</Button>
        </Card>
      </div>
    </ViewFrame>
  );
}

async function deleteProduct(productId: string, onRefresh: () => Promise<void>) {
  if (!window.confirm("Quieres eliminar este producto? Esta accion no se puede deshacer.")) return;
  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) {
    window.alert(`No se pudo eliminar el producto: ${error.message}`);
    return;
  }
  await onRefresh();
}

function DecisionButtons({ product, onRefresh }: { product: EnrichedProduct; onRefresh: () => Promise<void> }) {
  async function decide(status: ProductStatus) {
    const { error } = await supabase.from("products").update({ status, updated_at: new Date().toISOString() }).eq("id", product.id);
    if (error) {
      window.alert(`No se pudo actualizar el estado: ${error.message}`);
      return;
    }
    const { error: logError } = await supabase.from("decision_logs").insert({
      id: crypto.randomUUID(),
      product_id: product.id,
      decision: status === "pausado" ? "pausar" : status === "descartado" ? "descartar" : status === "ajustar" ? "ajustar" : "escalar",
      reason: `Accion manual desde Top 10: ${labelFromKey(status)}`,
      score_before: product.score.total,
      score_after: product.score.total
    });
    if (logError) window.alert(`El estado cambio, pero no se guardo el log: ${logError.message}`);
    await onRefresh();
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button variant="success" onClick={() => void decide("escalar")}>Escalar</Button>
      <Button variant="warning" onClick={() => void decide("ajustar")}>Ajustar</Button>
      <Button variant="muted" onClick={() => void decide("pausado")}>Pausar</Button>
      <Button variant="danger" onClick={() => void decide("descartado")}>Descartar</Button>
    </div>
  );
}

function Campaigns({
  products,
  campaigns,
  metrics,
  onRefresh
}: {
  products: EnrichedProduct[];
  campaigns: CampaignRow[];
  metrics: CampaignMetricRow[];
  onRefresh: () => Promise<void>;
}) {
  const [mode, setMode] = useState<DisplayMode>("cards");

  return (
    <ViewFrame eyebrow="Campanas" title="Pruebas comerciales y gasto publicitario">
      <CampaignForm products={products} onSaved={onRefresh} />
      <MetricForm campaigns={campaigns} onSaved={onRefresh} />
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-500">{campaigns.length} campanas registradas</p>
        <ViewToggle mode={mode} setMode={setMode} />
      </div>
      {mode === "cards" ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} products={products} metrics={metrics} onRefresh={onRefresh} />
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-k7-line bg-white">
          {campaigns.map((campaign) => (
            <CampaignListRow key={campaign.id} campaign={campaign} products={products} metrics={metrics} />
          ))}
        </div>
      )}
    </ViewFrame>
  );
}

function CampaignForm({ products, onSaved }: { products: EnrichedProduct[]; onSaved: () => Promise<void> }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await supabase.from("campaigns").insert({
      id: crypto.randomUUID(),
      product_id: stringValue(form, "product_id"),
      name: stringValue(form, "name"),
      channel: stringValue(form, "channel", "meta_ads"),
      status: stringValue(form, "status", "pendiente"),
      planned_budget: numberValue(form, "planned_budget"),
      real_spend: 0,
      sales_goal: numberValue(form, "sales_goal", 1),
      profit_goal: numberValue(form, "profit_goal", 100),
      main_hook: stringValue(form, "main_hook") || null,
      offer: stringValue(form, "offer") || null,
      cta: stringValue(form, "cta") || null,
      responsible: stringValue(form, "responsible") || null
    });
    event.currentTarget.reset();
    await onSaved();
  }

  return (
    <Card>
      <h3 className="font-black">Crear campana</h3>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-semibold">
          Producto
          <select name="product_id" required className="mt-1 min-h-11 w-full rounded-xl border border-k7-line px-3">
            <option value="">Seleccionar</option>
            {products.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
          </select>
        </label>
        <Input name="name" label="Nombre campana" required />
        <Select name="channel" label="Canal" options={campaignChannels} />
        <Select name="status" label="Estado" options={campaignStatuses} />
        <Input name="planned_budget" label="Presupuesto estimado" type="number" step="0.01" />
        <Input name="sales_goal" label="Meta ventas" type="number" defaultValue="1" />
        <Input name="profit_goal" label="Meta utilidad" type="number" defaultValue="100" />
        <Input name="responsible" label="Responsable" />
        <Input name="main_hook" label="Hook principal" />
        <Input name="offer" label="Oferta" />
        <Input name="cta" label="CTA" />
        <Button type="submit" className="sm:col-span-2 xl:col-span-4">Crear campana</Button>
      </form>
    </Card>
  );
}

function MetricForm({ campaigns, onSaved }: { campaigns: CampaignRow[]; onSaved: () => Promise<void> }) {
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const spend = numberValue(form, "spend");
    const sales = numberValue(form, "sales");
    const revenue = numberValue(form, "revenue");
    await supabase.from("campaign_metrics").insert({
      id: crypto.randomUUID(),
      campaign_id: stringValue(form, "campaign_id"),
      date: stringValue(form, "date", todayKey()),
      spend,
      impressions: numberValue(form, "impressions"),
      clicks: numberValue(form, "clicks"),
      messages: numberValue(form, "messages"),
      sales,
      revenue,
      estimated_profit: revenue - spend,
      cpa: sales > 0 ? spend / sales : spend,
      roas: spend > 0 ? revenue / spend : 0,
      conversion_rate: numberValue(form, "clicks") > 0 ? sales / numberValue(form, "clicks") : 0
    });
    event.currentTarget.reset();
    await onSaved();
  }

  return (
    <Card>
      <h3 className="font-black">Registrar reporte de marketing</h3>
      <form onSubmit={handleSubmit} className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <label className="text-sm font-semibold">
          Campana
          <select name="campaign_id" required className="mt-1 min-h-11 w-full rounded-xl border border-k7-line px-3">
            <option value="">Seleccionar</option>
            {campaigns.map((campaign) => <option key={campaign.id} value={campaign.id}>{campaign.name}</option>)}
          </select>
        </label>
        <Input name="date" label="Fecha" type="date" defaultValue={todayKey()} />
        <Input name="spend" label="Gasto publicidad" type="number" step="0.01" />
        <Input name="revenue" label="Monto vendido" type="number" step="0.01" />
        <Input name="sales" label="Ventas" type="number" />
        <Input name="clicks" label="Clics" type="number" />
        <Input name="messages" label="Mensajes" type="number" />
        <Input name="impressions" label="Impresiones" type="number" />
        <Button type="submit" className="sm:col-span-2 xl:col-span-4">Guardar metricas</Button>
      </form>
    </Card>
  );
}

function CampaignCard({ campaign, products, metrics, onRefresh }: { campaign: CampaignRow; products: EnrichedProduct[]; metrics: CampaignMetricRow[]; onRefresh?: () => Promise<void> }) {
  const product = products.find((item) => item.id === campaign.product_id);
  const totals = campaignTotals(campaign.id, metrics);
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-black">{campaign.name}</h3>
          <p className="text-sm text-gray-500">{product?.name ?? "Producto no encontrado"} - {labelFromKey(campaign.channel)}</p>
        </div>
        <Badge tone={statusTone(campaign.status) as never}>{labelFromKey(campaign.status)}</Badge>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        <MetricMini label="Gasto" value={money(totals.spend)} />
        <MetricMini label="Ventas" value={String(totals.sales)} />
        <MetricMini label="ROAS" value={String(Math.round(totals.roas * 100) / 100)} />
      </div>
      {onRefresh && <CampaignActions campaign={campaign} onRefresh={onRefresh} />}
    </Card>
  );
}

function CampaignListRow({ campaign, products, metrics }: { campaign: CampaignRow; products: EnrichedProduct[]; metrics: CampaignMetricRow[] }) {
  const product = products.find((item) => item.id === campaign.product_id);
  const totals = campaignTotals(campaign.id, metrics);
  return (
    <div className="grid gap-2 border-b border-k7-line p-4 sm:grid-cols-[1fr_1fr_90px_90px_90px]">
      <span className="font-black">{campaign.name}</span>
      <span className="text-gray-600">{product?.name ?? "Producto no encontrado"}</span>
      <span>{money(totals.spend)}</span>
      <span>{totals.sales} ventas</span>
      <span>ROAS {Math.round(totals.roas * 100) / 100}</span>
    </div>
  );
}

function CampaignActions({ campaign, onRefresh }: { campaign: CampaignRow; onRefresh: () => Promise<void> }) {
  async function updateStatus(status: CampaignStatus) {
    await supabase.from("campaigns").update({ status, updated_at: new Date().toISOString() }).eq("id", campaign.id);
    await onRefresh();
  }

  async function remove() {
    await supabase.from("campaigns").delete().eq("id", campaign.id);
    await onRefresh();
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <Button variant="success" onClick={() => void updateStatus("escalada")}>Escalar</Button>
      <Button variant="warning" onClick={() => void updateStatus("en_revision")}>Revisar</Button>
      <Button variant="muted" onClick={() => void updateStatus("pausada")}>Pausar</Button>
      <Button variant="danger" onClick={() => void remove()}>Eliminar</Button>
    </div>
  );
}

function campaignTotals(campaignId: string, metrics: CampaignMetricRow[]) {
  const rows = metrics.filter((metric) => metric.campaign_id === campaignId);
  const spend = rows.reduce((sum, metric) => sum + Number(metric.spend ?? 0), 0);
  const revenue = rows.reduce((sum, metric) => sum + Number(metric.revenue ?? 0), 0);
  const sales = rows.reduce((sum, metric) => sum + Number(metric.sales ?? 0), 0);
  return { spend, revenue, sales, roas: spend > 0 ? revenue / spend : 0 };
}

function Reports({
  products,
  campaigns,
  metrics,
  dashboard,
  onRefresh
}: {
  products: EnrichedProduct[];
  campaigns: CampaignRow[];
  metrics: CampaignMetricRow[];
  dashboard: Array<{ date: string; sales: number; transactions: number; clicks: number; revenue: number; spend: number; profit: number }>;
  onRefresh: () => Promise<void>;
}) {
  const totalSpend = metrics.reduce((sum, metric) => sum + Number(metric.spend ?? 0), 0);
  const totalRevenue = metrics.reduce((sum, metric) => sum + Number(metric.revenue ?? 0), 0);
  const totalClicks = metrics.reduce((sum, metric) => sum + Number(metric.clicks ?? 0), 0);
  const totalSales = metrics.reduce((sum, metric) => sum + Number(metric.sales ?? 0), 0);
  return (
    <ViewFrame eyebrow="Reportes" title="KPIs alimentados por marketing">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Gasto total" value={money(totalSpend)} hint="Reportado manualmente" />
        <MetricCard title="Monto vendido" value={money(totalRevenue)} hint="Marketing + WooCommerce" />
        <MetricCard title="ROAS general" value={String(totalSpend > 0 ? Math.round((totalRevenue / totalSpend) * 100) / 100 : 0)} hint="Ventas / gasto" />
        <MetricCard title="Conversion" value={percent(totalClicks > 0 ? (totalSales / totalClicks) * 100 : 0)} hint="Ventas / clics" />
      </div>
      <MetricForm campaigns={campaigns} onSaved={onRefresh} />
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Inversion vs ventas" data={dashboard} type="bar" dataKey="spend" />
        <ChartCard title="Tendencia de utilidad" data={dashboard} type="line" dataKey="profit" />
      </div>
      <Card>
        <h3 className="font-black">Productos por score</h3>
        <div className="mt-3 space-y-2">
          {products.slice(0, 10).map((product) => (
            <div key={product.id} className="flex items-center justify-between border-b border-k7-line py-2">
              <span className="font-semibold">{product.name}</span>
              <Badge tone="orange">{product.score.total}/100</Badge>
            </div>
          ))}
        </div>
      </Card>
    </ViewFrame>
  );
}

function WooSync({
  syncLogs,
  products,
  onRefresh
}: {
  syncLogs: Array<{ status: string; imported_orders: number | null; imported_lines: number | null; error_message: string | null; synced_at: string | null }>;
  products: EnrichedProduct[];
  onRefresh: () => Promise<void>;
}) {
  const [syncing, setSyncing] = useState(false);
  const lastSync = syncLogs[0];
  const importedOrders = syncLogs.reduce((sum, log) => sum + Number(log.imported_orders ?? 0), 0);
  const importedLines = syncLogs.reduce((sum, log) => sum + Number(log.imported_lines ?? 0), 0);
  const errors = syncLogs.filter((log) => log.status === "error").length;
  const trackedWooProducts = products.filter((product) => product.row?.woo_sku || product.row?.woo_product_id).length;

  async function syncWooCommerce() {
    setSyncing(true);
    const { data, error } = await supabase.functions.invoke("sync-woocommerce-orders");
    setSyncing(false);

    if (error) {
      const context = (error as { context?: unknown }).context;
      let details = "";
      if (context instanceof Response) {
        try {
          const body = await context.clone().json() as { error?: string; details?: string };
          details = body.details || body.error || "";
        } catch {
          details = await context.clone().text();
        }
      }
      window.alert(`No se pudo sincronizar WooCommerce: ${details || error.message}`);
      return;
    }

    const result = data as { orders?: number; importedLines?: number; unmatchedLines?: number } | null;
    await onRefresh();
    window.alert(`WooCommerce sincronizado: ${result?.orders ?? 0} pedidos, ${result?.importedLines ?? 0} lineas importadas, ${result?.unmatchedLines ?? 0} sin vincular.`);
  }

  return (
    <ViewFrame eyebrow="WooCommerce Sync" title="Ventas reales de productos en seguimiento">
      <div className="grid gap-4 lg:grid-cols-4">
        <MetricCard title="Ultima sincronizacion" value={lastSync?.synced_at ? new Date(lastSync.synced_at).toLocaleDateString() : "Pendiente"} hint="Webhook + sincronizacion manual" />
        <MetricCard title="Pedidos importados" value={String(importedOrders)} hint="Solo estado processing" />
        <MetricCard title="Lineas importadas" value={String(importedLines)} hint="Productos Woo vinculados" />
        <MetricCard title="Errores" value={String(errors)} hint="Revisar productos sin vincular" />
      </div>
      <Card className="mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h3 className="text-lg font-black">Regla activa</h3>
            <p className="mt-2 text-sm text-gray-600">
              WooCommerce solo debe sincronizar ventas `processing` y asociarlas a productos que estamos siguiendo por `woo_product_id` o `woo_sku`.
            </p>
          </div>
          <Button onClick={() => void syncWooCommerce()} disabled={syncing}>
            {syncing ? "Sincronizando..." : "Sincronizar WooCommerce"}
          </Button>
        </div>
      </Card>
      <Card>
        <h3 className="text-lg font-black">Productos vinculados</h3>
        <p className="mt-2 text-sm text-gray-600">
          {trackedWooProducts} productos del Radar tienen SKU o ID WooCommerce configurado para recibir ventas reales.
        </p>
      </Card>
    </ViewFrame>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className = "", ...rest } = props;
  return (
    <label className="text-sm font-semibold">
      {label}
      <input className={`mt-1 min-h-11 w-full rounded-xl border border-k7-line px-3 outline-none focus:border-k7-orange focus:ring-2 focus:ring-orange-100 ${className}`} {...rest} />
    </label>
  );
}

function Select({ label, name, options, defaultValue }: { label: string; name: string; options: string[]; defaultValue?: string }) {
  return (
    <label className="text-sm font-semibold">
      {label}
      <select name={name} defaultValue={defaultValue} className="mt-1 min-h-11 w-full rounded-xl border border-k7-line px-3 outline-none focus:border-k7-orange focus:ring-2 focus:ring-orange-100">
        {options.map((option) => <option key={option} value={option}>{labelFromKey(option)}</option>)}
      </select>
    </label>
  );
}

function ViewFrame({ eyebrow, title, children }: { eyebrow: string; title: string; children: ReactNode }) {
  return (
    <div className="space-y-4">
      <section>
        <p className="text-sm font-bold text-k7-orange">{eyebrow}</p>
        <h1 className="text-2xl font-black sm:text-3xl">{title}</h1>
      </section>
      {children}
    </div>
  );
}
