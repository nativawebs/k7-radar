# K7 Product Radar - Propuesta tecnica MVP

## Fuente de verdad

El proyecto se implementa estrictamente desde `K7_Product_Radar_Contrato_Negocio.md`. No se agregan estados, modulos, formulas, integraciones ni reglas fuera de ese documento. Los puntos sin umbral exacto quedan como campos manuales, configurables o decisiones futuras.

## Estructura de carpetas

```text
apps/
  api/        Fastify + TypeScript, API first
  web/        React + Vite + TypeScript + Tailwind, PWA mobile first
packages/
  business/  Estados, formulas, scoring y recomendaciones compartidas
prisma/      Esquema PostgreSQL/Supabase
docs/        Propuesta tecnica y documentacion del MVP
```

## Esquema de base de datos

- `products`: radar de productos candidatos, vinculo Dropi/WooCommerce, stock, scores y estado.
- `product_financials`: calculos de margen, CPA, ROAS, utilidad y ventas necesarias.
- `campaigns`: campanas por producto, canal, presupuesto, metas, hook, oferta y estado.
- `campaign_sales`: ventas WooCommerce `processing` asociadas a producto/campana.
- `campaign_metrics`: gasto y metricas manuales iniciales.
- `decision_logs`: historial de decisiones permitidas.
- `sync_logs`: ultima sincronizacion, errores y conteo importado.
- `unmatched_woocommerce_products`: productos vendidos sin vinculo interno.

## Modelos Prisma

Los modelos Prisma replican las tablas sugeridas por el contrato y restringen estados con enums:

- `ProductStatus`
- `CampaignStatus`
- `LogisticComplexity`
- `CampaignChannel`
- `DecisionType`
- `SyncStatus`

## Endpoints API

Productos:

- `GET /api/products`
- `POST /api/products`
- `GET /api/products/:id`
- `PATCH /api/products/:id`
- `DELETE /api/products/:id`
- `POST /api/products/:id/calculate-score`
- `GET /api/products/top-10`
- `GET /api/products/:id/financials`

Campanas:

- `GET /api/campaigns`
- `POST /api/campaigns`
- `GET /api/campaigns/:id`
- `PATCH /api/campaigns/:id`
- `POST /api/campaigns/:id/activate`
- `POST /api/campaigns/:id/pause`
- `POST /api/campaigns/:id/close`

WooCommerce:

- `POST /api/webhooks/woocommerce/orders`
- `POST /api/sync/woocommerce/orders`
- `GET /api/sync/woocommerce/status`
- `GET /api/woocommerce/unmatched-products`

Dashboard:

- `GET /api/dashboard/summary`
- `GET /api/dashboard/top-products`
- `GET /api/dashboard/alerts`
- `GET /api/dashboard/daily-performance`

Auth:

- `POST /api/auth/login`
- `GET /api/auth/me`

## Componentes frontend

- Shell mobile first con navegacion inferior en mobile.
- Dashboard con cards ejecutivas.
- Radar de productos en cards.
- Top 10 con ranking y accion recomendada.
- Detalle de producto con rentabilidad, filtros, campanas, WooCommerce e historial.
- Nueva campana.
- Campanas.
- WooCommerce Sync.
- Componentes UI: `Button`, `Badge`, `Card`, `MetricCard`, `TrafficLight`, `BottomNav`.

## Flujo WooCommerce

1. Webhook recibe pedidos en `POST /api/webhooks/woocommerce/orders`.
2. Solo se procesan pedidos con estado `processing`.
3. Se leen `line_items`.
4. Se asocia venta por `woo_product_id` o `woo_sku`.
5. Si no existe relacion, se registra como producto sin vincular.
6. La sincronizacion manual consulta `GET /wp-json/wc/v3/orders?status=processing`.
7. `sync_logs` guarda ultima sincronizacion, errores y conteos.

## Flujo de calculo de score

El score usa la distribucion del contrato:

- Margen bruto: 25 pts.
- Stock disponible: 15 pts.
- Precio competitivo: 15 pts.
- Potencial de contenido: 15 pts.
- Complejidad logistica baja: 10 pts.
- Proveedor confiable: 10 pts.
- Data real de ventas: 10 pts.

Los umbrales definidos se usan cuando existen. Los criterios sin umbral exacto se tratan como entradas manuales o configurables.

## Orden de implementacion por fases

1. Arquitectura base, Prisma, estados y endpoints principales.
2. Frontend mobile first con pantallas obligatorias.
3. Calculos financieros, scoring y Top 10.
4. Campanas y metricas manuales.
5. Sincronizacion WooCommerce.
6. Dashboard, alertas y recomendaciones.
