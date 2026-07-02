# K7 Product Radar — Contrato de Negocio

**Versión:** 1.0  
**Estado:** Documento de la verdad  
**Proyecto:** Kiosko7 Ecommerce  
**Uso:** Guía funcional, comercial y técnica para Codex  

---

## 0. Regla principal del documento

Este documento define las reglas de negocio de la herramienta **K7 Product Radar**.

Codex debe usar este archivo como fuente de verdad para construir la PWA, la API, la base de datos, los cálculos, los estados, los módulos y las pantallas.

No se deben agregar funcionalidades, reglas, estados, campos o cálculos que no estén definidos en este documento.

Si algo no está definido aquí, debe quedar pendiente, configurable o marcado como decisión futura.

---

## 1. Objetivo del sistema

Crear una herramienta interna para Kiosko7 que permita detectar, analizar, priorizar y controlar los productos con mayor potencial comercial.

El sistema debe ayudar a alcanzar la meta de **$100**, medida como utilidad estimada después de costo proveedor y pauta publicitaria.

La herramienta debe permitir sacar los **10 productos prioritarios o ganadores** para decidir cuáles productos merecen campaña, cuáles deben ajustarse y cuáles deben descartarse.

El sistema debe dejar de funcionar como un simple registro de productos y convertirse en un **tablero de decisión comercial**.

---

## 2. Principio estratégico

La prioridad no es publicar la mayor cantidad de productos.

La prioridad es:

**Encontrar, comunicar, medir y escalar productos con potencial real de venta.**

El sistema debe apoyar este flujo:

1. Detectar productos.
2. Validar margen.
3. Validar stock.
4. Activar campaña.
5. Medir ventas reales.
6. Decidir si se escala, ajusta, pausa o descarta.

---

## 3. Concepto central de la herramienta

La herramienta debe responder estas preguntas:

1. ¿Qué producto tiene potencial real?
2. ¿Cuánto margen deja?
3. ¿Cuánto se puede invertir en publicidad sin perder?
4. ¿Cuántas ventas necesita para cumplir la meta?
5. ¿El producto se debe escalar, ajustar, pausar o descartar?

---

## 4. Nombre del sistema

Nombre interno definido:

**K7 Product Radar**

Alternativas documentadas, pero no principales:

- K7 Growth Radar
- K7 Winner Finder
- K7 Performance Lab
- K7 Product Hunter
- Kiosko7 Radar Comercial

El nombre principal a usar en la interfaz y estructura del proyecto es:

**K7 Product Radar**

---

## 5. Reglas generales de arquitectura

El sistema debe ser:

- PWA.
- Responsive.
- Mobile first.
- API first.
- Visualmente minimalista.
- Intuitivo.
- Menos es más.

La interfaz debe evitar pantallas saturadas.

La primera pantalla debe responder:

**“Estos son los productos que merecen atención hoy.”**

---

## 6. Stack técnico definido

### Frontend

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- PWA installable.
- Mobile first.
- Interfaz basada en cards.

### Backend

- Node.js.
- TypeScript.
- Fastify o NestJS.
- Prisma ORM.
- JWT Auth o Supabase Auth.
- API modular.
- OpenAPI / Swagger.
- Jobs programados para sincronizar WooCommerce.

### Base de datos

- PostgreSQL.
- Supabase como opción recomendada.

Supabase puede usarse para:

- Auth.
- Base de datos.
- Storage.
- RLS.
- Panel visual.
- API rápida.

---

## 7. Módulos principales

El sistema debe contener estos módulos:

1. Dashboard Ejecutivo.
2. Radar de Productos.
3. Calculadora de Rentabilidad.
4. Top 10 Productos.
5. Producto Detalle.
6. Campañas.
7. Métricas de campaña.
8. Sincronización WooCommerce.
9. Historial de decisiones.

No se debe construir un sistema gigante en el MVP.

Primero debe construirse como **MVP de decisión**.

---

## 8. Dashboard Ejecutivo

El Dashboard Ejecutivo debe mostrar una vista rápida de:

- Ventas OK hoy.
- Utilidad estimada.
- Productos activos.
- Top 10 productos prioritarios.
- Campañas en prueba.
- Productos para escalar.
- Productos para descartar.
- Alertas de stock bajo.

La pantalla debe estar orientada a decisiones, no a decoración visual.

---

## 9. Radar de Productos

El Radar de Productos sirve para registrar productos candidatos.

Cada producto debe poder guardar los siguientes datos:

- Nombre del producto.
- Código Dropi.
- Link del producto.
- Link proveedor.
- Stock actual.
- Costo proveedor.
- Precio de mercado.
- Precio ideal de venta.
- Precio mínimo aceptable.
- Categoría / nicho.
- Proveedor.
- Complejidad logística.
- Nivel wow.
- Estado del contenido.
- Observaciones.
- Imagen principal.
- Producto WooCommerce relacionado.
- SKU WooCommerce.
- Estado del producto.

---

## 10. Estados de producto

Estados definidos para producto:

- Detectado.
- En análisis.
- Aprobado para test.
- Campaña activa.
- Escalar.
- Ajustar.
- Pausado.
- Descartado.
- Ganador.

En formato técnico pueden usarse:

- `detectado`
- `en_analisis`
- `aprobado`
- `campana_activa`
- `escalar`
- `ajustar`
- `pausado`
- `descartado`
- `ganador`

No se deben crear otros estados de producto sin aprobación.

---

## 11. Calculadora de Rentabilidad

Cada producto debe calcular automáticamente los siguientes indicadores.

### 11.1 Margen bruto unitario

```text
precio_venta - costo_proveedor - costos_extra
```

### 11.2 Margen porcentual

```text
margen_bruto / precio_venta * 100
```

### 11.3 CPA máximo para no perder

```text
margen_bruto
```

### 11.4 CPA planificado

```text
inversión_publicitaria / meta_ventas
```

### 11.5 Utilidad proyectada

```text
(margen_bruto * meta_ventas) - inversión_publicitaria
```

### 11.6 ROAS mínimo de equilibrio

```text
precio_venta / margen_bruto
```

### 11.7 Ventas necesarias para ganar $100

```text
(100 + inversión_publicitaria) / margen_bruto
```

---

## 12. Ejemplo de cálculo definido

Ejemplo documentado:

- Costo proveedor: $10.
- Precio venta: $25.
- Margen bruto: $15.
- Inversión pauta: $30.

Cálculo:

```text
(100 + 30) / 15 = 8.6
```

Resultado:

El producto necesita **9 ventas** para cumplir la meta.

---

## 13. Filtros del embudo de producto

Antes de activar campaña, un producto debe pasar por filtros.

Los filtros definidos son:

1. Margen.
2. Stock.
3. Precio competitivo.
4. Complejidad logística.
5. Potencial publicitario.

---

## 14. Filtro 1: Margen

Regla recomendada:

- Margen bruto mínimo: $8.
- Margen porcentual mínimo: 30%.

Si el margen es bajo, el producto solo sirve si tiene alta rotación o ticket alto.

---

## 15. Filtro 2: Stock

Regla recomendada:

- Stock mínimo: 10 unidades.
- Stock ideal: 2x o 3x la meta de ventas.

Si el sistema detecta que el stock es bajo frente a la meta de ventas, debe marcar alerta.

---

## 16. Filtro 3: Precio competitivo

El precio ideal de venta debe estar dentro del rango aceptable del mercado.

Campos relacionados:

- Precio mercado bajo.
- Precio mercado promedio.
- Precio mercado alto.
- Precio ideal Kiosko7.

Reglas:

- Si el precio ideal está muy por encima del mercado, baja el score.
- Si el precio ideal está alineado con mercado y deja margen, sube el score.

---

## 17. Filtro 4: Complejidad logística

Opciones:

- Baja.
- Media.
- Alta.

Ejemplos de alta complejidad:

- Producto frágil.
- Producto pesado.
- Producto con tallas o variaciones.
- Producto con alta probabilidad de devolución.
- Proveedor inestable.

---

## 18. Filtro 5: Potencial publicitario

El potencial publicitario se mide con puntaje manual de 1 a 5.

Debe responder:

- ¿Tiene efecto wow?
- ¿Se entiende rápido en video?
- ¿Resuelve un dolor claro?
- ¿Se puede mostrar antes/después?
- ¿Tiene gancho para estados, reels o catálogo?

---

## 19. Score de producto ganador

Cada producto debe tener un puntaje de 0 a 100.

Distribución definida:

| Factor | Peso |
|---|---:|
| Margen bruto | 25 pts |
| Stock disponible | 15 pts |
| Precio competitivo | 15 pts |
| Potencial de contenido | 15 pts |
| Complejidad logística baja | 10 pts |
| Proveedor confiable | 10 pts |
| Data real de ventas | 10 pts |

Total: 100 pts.

---

## 20. Clasificación por score

| Score | Decisión |
|---:|---|
| 80 - 100 | Prioridad alta |
| 65 - 79 | Testear |
| 50 - 64 | Revisar condiciones |
| Menos de 50 | No activar |

---

## 21. Módulo de campañas

Cuando un producto pasa los filtros, puede activarse como campaña.

Cada campaña debe guardar:

- Producto.
- Fecha inicio.
- Fecha fin.
- Presupuesto estimado.
- Presupuesto real gastado.
- Meta ventas.
- Meta utilidad.
- Canal.
- Responsable.
- Estado campaña.
- Observaciones.
- Link del anuncio.
- Link del creativo.
- Hook principal.
- Ángulo de venta.
- Oferta.
- CTA.

Canales definidos:

- Meta Ads.
- Orgánico.
- WhatsApp.
- Catálogo.
- TikTok Ads.

---

## 22. Estados de campaña

Estados definidos para campaña:

- Pendiente.
- Activa.
- En revisión.
- Escalar.
- Ajustar.
- Pausar.
- Finalizada.

En formato técnico pueden usarse:

- `pendiente`
- `activa`
- `en_revision`
- `escalada`
- `pausada`
- `finalizada`

No se deben crear otros estados de campaña sin aprobación.

---

## 23. Integración WooCommerce

La integración con WooCommerce debe usarse para actualizar ventas reales de los productos.

Solo deben contarse como **Venta OK** las ventas provenientes de pedidos WooCommerce con estado:

```text
processing
```

Equivalente visual/comercial:

```text
procesando
```

Los pedidos con otro estado no deben contarse como venta OK dentro del cálculo principal.

---

## 24. Flujo WooCommerce recomendado

### 24.1 Webhook

WooCommerce debe poder enviar eventos al sistema cuando:

- Se crea un pedido.
- Se actualiza un pedido.
- Cambia el estado del pedido.
- Se actualiza un producto.

Endpoint definido:

```text
POST /api/webhooks/woocommerce/orders
```

### 24.2 Sincronización programada

El sistema debe consultar WooCommerce cada 10 o 15 minutos.

Endpoint WooCommerce esperado:

```text
GET /wp-json/wc/v3/orders?status=processing
```

La sincronización debe leer los productos dentro de cada pedido.

### 24.3 Regla de seguridad de datos

Debe usarse webhook para actualización rápida y cron job como respaldo.

Esto evita pérdida de datos si un webhook falla.

---

## 25. Relación entre producto interno, Dropi y WooCommerce

Cada producto interno debe poder guardar:

- `woo_product_id`
- `woo_sku`
- `dropi_code`
- `internal_product_id`

Regla ideal:

El SKU de WooCommerce debería ser igual al código Dropi.

Esto permite relacionar ventas sin errores.

---

## 26. Modelo de datos sugerido

### 26.1 Tabla: products

```text
id
name
dropi_code
dropi_url
supplier_name
supplier_cost
market_price
ideal_sale_price
min_sale_price
stock
category
niche
woo_product_id
woo_sku
logistic_complexity
wow_score
supplier_score
content_score
status
priority_score
created_at
updated_at
```

---

### 26.2 Tabla: product_financials

```text
id
product_id
supplier_cost
sale_price
extra_costs
gross_margin
gross_margin_percent
break_even_cpa
break_even_roas
target_profit
sales_needed_for_target
created_at
```

---

### 26.3 Tabla: campaigns

```text
id
product_id
name
channel
status
start_date
end_date
planned_budget
real_spend
sales_goal
profit_goal
main_hook
offer
cta
creative_url
ad_url
responsible
created_at
updated_at
```

---

### 26.4 Tabla: campaign_sales

```text
id
campaign_id
product_id
woo_order_id
woo_order_status
quantity
unit_price
line_total
order_date
synced_at
```

---

### 26.5 Tabla: campaign_metrics

```text
id
campaign_id
date
spend
impressions
clicks
messages
sales
revenue
estimated_profit
cpa
roas
conversion_rate
created_at
```

Al inicio estos datos pueden ser manuales.

Luego puede conectarse Meta Ads API.

---

### 26.6 Tabla: decision_logs

```text
id
product_id
campaign_id
decision
reason
score_before
score_after
created_by
created_at
```

Decisiones permitidas:

- Escalar.
- Ajustar.
- Pausar.
- Descartar.
- Mantener test.

---

## 27. Motor de decisión

El sistema debe recomendar acciones automáticamente según el rendimiento del producto y campaña.

Las recomendaciones definidas son:

- Escalar.
- Ajustar.
- Pausar.
- Descartar.

---

## 28. Regla de decisión: Escalar

Condiciones:

- Ventas iguales o superiores a la meta.
- ROAS mayor al mínimo.
- Utilidad positiva.
- Stock suficiente.
- CPA menor al margen bruto.

Resultado:

```text
Recomendación: Escalar presupuesto
```

---

## 29. Regla de decisión: Ajustar

Condiciones:

- Hay clics o mensajes.
- Hay interés.
- Pocas ventas.
- Buen margen.
- Creativo o copy débil.

Resultado:

```text
Recomendación: Ajustar oferta, hook o ficha del producto
```

---

## 30. Regla de decisión: Pausar

Condiciones:

- Gasto alto.
- Cero ventas.
- CPA proyectado mayor al margen.
- Baja conversión.
- Stock limitado.

Resultado:

```text
Recomendación: Pausar campaña
```

---

## 31. Regla de decisión: Descartar

Condiciones:

- Margen insuficiente.
- Proveedor inestable.
- Stock bajo.
- Complejidad logística alta.
- Precio poco competitivo.

Resultado:

```text
Recomendación: Descartar producto
```

---

## 32. Pantallas de la PWA

### 32.1 Home Dashboard

Debe mostrar cards principales:

- Ventas OK hoy.
- Utilidad estimada hoy.
- Campañas activas.
- Productos en alerta.
- Top producto del día.
- Producto con mejor margen.
- Producto con peor rendimiento.

---

### 32.2 Radar

Lista de productos candidatos.

En móvil debe verse como cards.

Cada card debe mostrar:

- Nombre.
- Stock.
- Margen.
- Score.
- Estado.
- Botón: Ver análisis.

---

### 32.3 Top 10

Ranking automático de productos.

Debe mostrar:

- Posición.
- Producto.
- Score.
- Margen.
- Stock.
- Ventas.
- Utilidad.
- Estado.
- Acción recomendada.

---

### 32.4 Producto Detalle

Debe contener secciones:

- Datos generales.
- Rentabilidad.
- Filtros.
- Campañas relacionadas.
- Ventas WooCommerce.
- Historial de decisiones.
- Notas comerciales.

---

### 32.5 Nueva Campaña

Formulario simple con:

- Producto.
- Presupuesto.
- Meta ventas.
- Meta utilidad.
- Canal.
- Hook.
- Oferta.
- Fecha inicio.
- Fecha fin.

---

### 32.6 WooCommerce Sync

Pantalla técnica sencilla con:

- Última sincronización.
- Pedidos procesando importados.
- Errores.
- Productos sin vincular.
- Botón sincronizar ahora.

---

## 33. API endpoints sugeridos

### 33.1 Productos

```text
GET /api/products
POST /api/products
GET /api/products/:id
PATCH /api/products/:id
DELETE /api/products/:id
```

---

### 33.2 Scoring

```text
POST /api/products/:id/calculate-score
GET /api/products/top-10
GET /api/products/:id/financials
```

---

### 33.3 Campañas

```text
GET /api/campaigns
POST /api/campaigns
GET /api/campaigns/:id
PATCH /api/campaigns/:id
POST /api/campaigns/:id/activate
POST /api/campaigns/:id/pause
POST /api/campaigns/:id/close
```

---

### 33.4 WooCommerce

```text
POST /api/webhooks/woocommerce/orders
POST /api/sync/woocommerce/orders
GET /api/sync/woocommerce/status
GET /api/woocommerce/unmatched-products
```

---

### 33.5 Dashboard

```text
GET /api/dashboard/summary
GET /api/dashboard/top-products
GET /api/dashboard/alerts
GET /api/dashboard/daily-performance
```

---

## 34. Roles de usuario

### 34.1 Admin

Tiene control total.

---

### 34.2 Ecommerce

Puede:

- Registrar productos.
- Validar margen.
- Activar productos para test.
- Revisar resultados.
- Proponer escalar o descartar.

---

### 34.3 Marketing

Puede:

- Ver productos aprobados.
- Agregar hooks.
- Registrar creativos.
- Actualizar gasto publicitario.
- Reportar métricas.

---

### 34.4 Dirección

Debe ver:

- Dashboard.
- Decisiones.
- Productos recomendados.

Dirección no debe editar todo.

El objetivo es evitar caos y mantener control.

---

## 35. Reglas visuales de interfaz

La interfaz debe ser limpia y directa.

Debe usar:

- Cards grandes.
- Badges de estado.
- Semáforos de rentabilidad.
- Botones claros.
- Vista optimizada para celular.

Botones principales definidos:

- Activar.
- Escalar.
- Ajustar.
- Pausar.
- Descartar.

---

## 36. MVP obligatorio

El MVP debe contener únicamente:

1. Login.
2. Registro de productos.
3. Calculadora de margen.
4. Score automático.
5. Top 10 productos.
6. Activación de campañas.
7. Registro manual de gasto publicitario.
8. Integración WooCommerce para ventas con estado procesando.
9. Dashboard con utilidad estimada.
10. Recomendación: escalar, ajustar, pausar o descartar.

---

## 37. Funciones futuras documentadas

Después del MVP se pueden agregar:

- Meta Ads API.
- Scraping o carga automática de Dropi.
- Alertas por WhatsApp.
- Reportes PDF.
- IA para hooks.
- IA para descripción de producto.
- Predicción de productos ganadores.

Estas funciones no pertenecen al MVP.

---

## 38. Reglas de implementación para Codex

Codex debe construir primero el flujo mínimo que permita tomar decisiones comerciales.

La prioridad no es almacenar productos.

La prioridad es que el sistema pueda indicar:

- Este producto merece pauta.
- Este producto necesita mejor hook.
- Este producto necesita ajuste de ficha.
- Este producto está quemando presupuesto.
- Este producto debe escalar.
- Este producto debe pausarse.
- Este producto debe descartarse.

---

## 39. Reglas de datos y sincronización

1. La venta real se toma desde WooCommerce.
2. Solo se cuenta como venta OK el pedido con estado `processing`.
3. Las ventas deben asociarse por `woo_product_id` o `woo_sku`.
4. El `woo_sku` idealmente debe coincidir con el `dropi_code`.
5. Si un producto vendido en WooCommerce no se puede asociar con un producto interno, debe aparecer en productos sin vincular.
6. El sistema debe registrar errores de sincronización.
7. El sistema debe mostrar la última sincronización.
8. El sistema debe permitir sincronización manual desde la pantalla WooCommerce Sync.

---

## 40. Reglas de campos configurables

Los siguientes elementos existen en la lógica, pero no tienen umbral numérico exacto definido en este documento:

- Gasto alto.
- Baja conversión.
- Hay interés.
- Creativo débil.
- Copy débil.
- Proveedor inestable.
- Precio muy por encima del mercado.

Codex no debe inventar valores definitivos para esos puntos.

Debe tratarlos como:

- Campos manuales.
- Criterios configurables.
- Variables pendientes de definición.

---

## 41. Criterio final del producto ganador

Un producto ganador no se define solo por ventas.

Un producto ganador debe combinar:

- Margen atractivo.
- Stock suficiente.
- Precio competitivo.
- Potencial de contenido.
- Baja complejidad logística.
- Proveedor confiable.
- Data real de ventas.
- Utilidad positiva.

---

## 42. Resultado esperado del sistema

El sistema debe permitir que Kiosko7 opere como ecommerce de performance.

Debe ayudar a pasar de operar como catálogo a operar con:

- Búsqueda sistemática.
- Experimentación.
- Medición.
- Priorización.
- Escalamiento.
- Descarte rápido.

El resultado esperado no es tener más productos publicados.

El resultado esperado es tener mejores decisiones sobre qué productos activar, medir y escalar.

---

## 43. Frase guía del sistema

**K7 Product Radar existe para encontrar, medir y escalar productos con potencial real de venta.**

