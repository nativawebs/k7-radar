import {
  BarChart3,
  Boxes,
  Calculator,
  Home,
  LogOut,
  Megaphone,
  PlusCircle,
  RefreshCcw,
  Search,
  Trophy
} from "lucide-react";
import type { ReactNode } from "react";
import { useMemo, useState } from "react";
import { LoginScreen } from "./auth/LoginScreen";
import { useAuth } from "./auth/AuthProvider";
import { enrichedProducts } from "./data/demo";
import { labelFromKey, money, percent } from "./lib/format";
import { isSupabaseConfigured } from "./lib/supabase";
import { Badge, Button, Card, MetricCard, TrafficLight } from "./components/ui";

type View = "dashboard" | "radar" | "top10" | "detail" | "newCampaign" | "campaigns" | "sync";

const navItems: Array<{ id: View; label: string; icon: typeof Home }> = [
  { id: "dashboard", label: "Dashboard", icon: Home },
  { id: "radar", label: "Radar", icon: Search },
  { id: "top10", label: "Top 10", icon: Trophy },
  { id: "campaigns", label: "Campanas", icon: Megaphone },
  { id: "sync", label: "Woo Sync", icon: RefreshCcw }
];

function statusTone(status: string) {
  if (status === "ganador" || status === "escalar") return "green";
  if (status === "descartado") return "red";
  if (status === "ajustar") return "yellow";
  if (status === "campana_activa" || status === "aprobado") return "orange";
  return "gray";
}

export function App() {
  const { isLoading, user, signOut } = useAuth();
  const [view, setView] = useState<View>("dashboard");
  const [selectedId, setSelectedId] = useState(enrichedProducts[0]?.id ?? "");
  const selected = enrichedProducts.find((product) => product.id === selectedId) ?? enrichedProducts[0];
  const summary = useMemo(() => {
    const salesOkToday = enrichedProducts.reduce((sum, product) => sum + product.sales, 0);
    const estimatedProfit = enrichedProducts.reduce((sum, product) => sum + product.estimatedProfit, 0);
    return {
      salesOkToday,
      estimatedProfit,
      activeCampaigns: enrichedProducts.filter((product) => product.status === "campana_activa").length,
      alerts: enrichedProducts.filter((product) => product.stock < 10).length
    };
  }, []);

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
              <Button onClick={() => setView("newCampaign")} className="gap-2">
                Nueva campana
              </Button>
              <Button variant="muted" onClick={() => void signOut()} aria-label="Cerrar sesion">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </header>

        {view === "dashboard" && <Dashboard summary={summary} goTo={(next) => setView(next)} />}
        {view === "radar" && <Radar onSelect={(id) => { setSelectedId(id); setView("detail"); }} />}
        {view === "top10" && <Top10 onSelect={(id) => { setSelectedId(id); setView("detail"); }} />}
        {view === "detail" && selected && <ProductDetail product={selected} />}
        {view === "newCampaign" && selected && <NewCampaign productName={selected.name} />}
        {view === "campaigns" && <Campaigns />}
        {view === "sync" && <WooSync />}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-k7-line bg-white px-2 py-2 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] lg:hidden">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setView(item.id)}
            className={`flex min-h-14 flex-col items-center justify-center rounded-xl text-xs font-semibold ${
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

function Dashboard({ summary, goTo }: { summary: { salesOkToday: number; estimatedProfit: number; activeCampaigns: number; alerts: number }; goTo: (view: View) => void }) {
  const top = enrichedProducts[0];
  const worst = enrichedProducts[enrichedProducts.length - 1];
  return (
    <div className="space-y-5">
      <section>
        <p className="text-sm font-bold text-k7-orange">Hoy</p>
        <h1 className="text-3xl font-black tracking-normal">Productos que merecen atencion hoy</h1>
      </section>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Ventas OK hoy" value={String(summary.salesOkToday)} hint="Solo pedidos WooCommerce processing" />
        <MetricCard title="Utilidad estimada" value={money(summary.estimatedProfit)} hint="Despues de costo proveedor y pauta" />
        <MetricCard title="Campanas activas" value={String(summary.activeCampaigns)} hint="Productos en prueba comercial" />
        <MetricCard title="Alertas de stock" value={String(summary.alerts)} hint="Stock menor al minimo recomendado" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">Top producto del dia</p>
              <h2 className="mt-1 text-2xl font-black">{top.name}</h2>
            </div>
            <Badge tone="green">Score {top.score.total}</Badge>
          </div>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <MetricMini label="Margen" value={money(top.financials.grossMargin)} />
            <MetricMini label="Ventas para $100" value={String(top.financials.salesNeededForTarget)} />
            <MetricMini label="Decision" value={top.recommendation.label} />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="success">Escalar</Button>
            <Button variant="warning">Ajustar</Button>
            <Button variant="muted">Pausar</Button>
            <Button variant="danger">Descartar</Button>
          </div>
        </Card>
        <Card>
          <p className="text-sm text-gray-500">Peor rendimiento</p>
          <h3 className="mt-1 text-xl font-black">{worst.name}</h3>
          <p className="mt-3 text-sm text-gray-600">{worst.recommendation.reason}</p>
          <Button className="mt-4 w-full" variant="secondary" onClick={() => goTo("top10")}>Ver Top 10</Button>
        </Card>
      </div>
    </div>
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

function Radar({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <ViewFrame eyebrow="Radar de Productos" title="Productos candidatos">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {enrichedProducts.map((product) => (
          <ProductCard key={product.id} product={product} onSelect={() => onSelect(product.id)} />
        ))}
      </div>
    </ViewFrame>
  );
}

function ProductCard({ product, onSelect }: { product: (typeof enrichedProducts)[number]; onSelect: () => void }) {
  const light = product.financials.grossMargin >= 8 && product.financials.grossMarginPercent >= 30 ? "green" : product.stock < 10 ? "red" : "yellow";
  return (
    <Card>
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
      <div className="mt-4 flex items-center justify-between gap-3">
        <Badge tone={statusTone(product.status) as any}>{labelFromKey(product.status)}</Badge>
        <Button onClick={onSelect}>Ver analisis</Button>
      </div>
    </Card>
  );
}

function Top10({ onSelect }: { onSelect: (id: string) => void }) {
  return (
    <ViewFrame eyebrow="Top 10" title="Ranking automatico de productos">
      <div className="space-y-3">
        {enrichedProducts.map((product, index) => (
          <Card key={product.id} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-k7-orange font-black text-white">{index + 1}</div>
              <div>
                <h3 className="font-black">{product.name}</h3>
                <p className="text-sm text-gray-500">
                  Score {product.score.total} - Margen {money(product.financials.grossMargin)} - Stock {product.stock}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={statusTone(product.status) as any}>{product.recommendation.label}</Badge>
              <Button variant="secondary" onClick={() => onSelect(product.id)}>Abrir</Button>
            </div>
          </Card>
        ))}
      </div>
    </ViewFrame>
  );
}

function ProductDetail({ product }: { product: (typeof enrichedProducts)[number] }) {
  return (
    <ViewFrame eyebrow="Producto Detalle" title={product.name}>
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge tone={statusTone(product.status) as any}>{labelFromKey(product.status)}</Badge>
            <Badge tone="orange">Score {product.score.total}/100</Badge>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <MetricMini label="Costo proveedor" value={money(product.supplierCost)} />
            <MetricMini label="Precio ideal venta" value={money(product.idealSalePrice)} />
            <MetricMini label="Margen bruto" value={money(product.financials.grossMargin)} />
            <MetricMini label="Margen porcentual" value={percent(product.financials.grossMarginPercent)} />
            <MetricMini label="CPA maximo" value={money(product.financials.breakEvenCpa)} />
            <MetricMini label="CPA planificado" value={money(product.financials.plannedCpa)} />
            <MetricMini label="ROAS minimo" value={String(product.financials.breakEvenRoas)} />
            <MetricMini label="Ventas para $100" value={String(product.financials.salesNeededForTarget)} />
          </div>
        </Card>
        <Card>
          <h3 className="text-lg font-black">Recomendacion automatica</h3>
          <p className="mt-2 text-2xl font-black text-k7-orange">{product.recommendation.label}</p>
          <p className="mt-3 text-sm text-gray-600">{product.recommendation.reason}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="success">Escalar</Button>
            <Button variant="warning">Ajustar</Button>
            <Button variant="muted">Pausar</Button>
            <Button variant="danger">Descartar</Button>
          </div>
        </Card>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Checklist title="Filtros" items={["Margen", "Stock", "Precio competitivo", "Complejidad logistica", "Potencial publicitario"]} />
        <Checklist title="WooCommerce" items={["Ventas processing", "Vinculo por SKU", "Productos sin vincular"]} />
        <Checklist title="Historial" items={["Escalar", "Ajustar", "Pausar", "Descartar", "Mantener test"]} />
      </div>
    </ViewFrame>
  );
}

function Checklist({ title, items }: { title: string; items: string[] }) {
  return (
    <Card>
      <h3 className="font-black">{title}</h3>
      <div className="mt-3 space-y-2">
        {items.map((item) => (
          <div key={item} className="flex items-center gap-2 text-sm text-gray-700">
            <span className="h-2 w-2 rounded-full bg-k7-orange" />
            {item}
          </div>
        ))}
      </div>
    </Card>
  );
}

function NewCampaign({ productName }: { productName: string }) {
  return (
    <ViewFrame eyebrow="Nueva Campana" title="Activar prueba comercial">
      <Card className="max-w-3xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {["Producto", "Presupuesto", "Meta ventas", "Meta utilidad", "Canal", "Hook", "Oferta", "Fecha inicio", "Fecha fin"].map((field) => (
            <label key={field} className="text-sm font-semibold">
              {field}
              <input
                className="mt-1 min-h-11 w-full rounded-xl border border-k7-line px-3 outline-none focus:border-k7-orange focus:ring-2 focus:ring-orange-100"
                placeholder={field === "Producto" ? productName : field}
              />
            </label>
          ))}
        </div>
        <Button className="mt-5 w-full sm:w-auto">Activar</Button>
      </Card>
    </ViewFrame>
  );
}

function Campaigns() {
  return (
    <ViewFrame eyebrow="Campanas" title="Pruebas comerciales activas">
      <div className="grid gap-4 lg:grid-cols-2">
        {enrichedProducts.map((product) => (
          <Card key={product.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="font-black">{product.name}</h3>
                <p className="text-sm text-gray-500">Meta ventas: 10 - Canal: Meta Ads</p>
              </div>
              <Badge tone="orange">Activa</Badge>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <MetricMini label="Gasto" value={money(product.adSpend)} />
              <MetricMini label="Ventas" value={String(product.sales)} />
              <MetricMini label="ROAS" value={String(Math.round(product.roas * 100) / 100)} />
            </div>
          </Card>
        ))}
      </div>
    </ViewFrame>
  );
}

function WooSync() {
  return (
    <ViewFrame eyebrow="WooCommerce Sync" title="Ventas reales processing">
      <div className="grid gap-4 lg:grid-cols-3">
        <MetricCard title="Ultima sincronizacion" value="Pendiente" hint="Webhook + sincronizacion manual" />
        <MetricCard title="Pedidos importados" value="0" hint="Solo estado processing" />
        <MetricCard title="Sin vincular" value="0" hint="Por woo_product_id o woo_sku" />
      </div>
      <Card className="mt-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-lg font-black">Sincronizacion manual</h3>
            <p className="text-sm text-gray-500">Consulta /wp-json/wc/v3/orders?status=processing</p>
          </div>
          <Button>
            <RefreshCcw className="mr-2 inline h-4 w-4" />
            Sincronizar ahora
          </Button>
        </div>
      </Card>
    </ViewFrame>
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
