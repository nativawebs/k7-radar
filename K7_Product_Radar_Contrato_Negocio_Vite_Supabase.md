# K7 Product Radar — Documento de la Verdad y Contrato de Negocio

**Versión:** 2.0  
**Estado:** Documento de la verdad  
**Proyecto:** Kiosko7 Ecommerce  
**Uso:** Guía funcional, comercial, visual y técnica para Codex  
**Stack definido:** React + Vite + TypeScript + Tailwind CSS + Supabase  
**Tipo de app:** PWA responsive, mobile first, uso personal y equipo interno

---

## 0. Regla principal del documento

Este documento define las reglas de negocio, estructura funcional, lineamientos visuales y arquitectura técnica de la herramienta **K7 Product Radar**.

Codex debe usar este archivo como **fuente única de verdad** para construir la aplicación.

No se deben agregar funcionalidades, reglas, estados, campos, cálculos, módulos o integraciones que no estén definidos en este documento.

Si algo no está definido aquí, debe quedar pendiente, configurable o marcado como decisión futura.

---

## 1. Decisión técnica actualizada

La herramienta debe construirse como una PWA simple y funcional para uso personal y del equipo interno de Kiosko7.

La tecnología queda definida así:

- **Frontend:** React.
- **Build tool:** Vite.
- **Lenguaje:** TypeScript.
- **Estilos:** Tailwind CSS.
- **Base de datos:** Supabase PostgreSQL.
- **Auth:** Supabase Auth.
- **Storage:** Supabase Storage, si se requiere guardar imágenes o creativos.
- **Funciones seguras:** Supabase Edge Functions solo cuando sea necesario proteger credenciales o ejecutar sincronizaciones.
- **Deploy recomendado:** Vercel para el frontend.
- **Arquitectura:** Frontend + Supabase, sin backend Node/Fastify/Nest independiente.

### 1.1 Regla de simplicidad técnica

Codex no debe crear un backend separado con Node.js, Fastify, NestJS, Express, Prisma ni servidor independiente.

La app debe funcionar con:

1. React + Vite como frontend.
2. Supabase como base de datos, autenticación y API.
3. Supabase Edge Functions únicamente para procesos que no deben ejecutarse desde el navegador, especialmente WooCommerce.

### 1.2 Motivo de esta decisión

La herramienta debe ser fácil de subir, mantener y usar.

La prioridad es tener una app funcional, clara y rápida, no una arquitectura compleja que obligue a desplegar backend y frontend por separado.

---

## 2. Objetivo del sistema

Crear una herramienta interna para Kiosko7 que permita detectar, analizar, priorizar y controlar los productos con mayor potencial comercial.

El sistema debe ayudar a alcanzar la meta de **$100**, medida como utilidad estimada después de costo proveedor y pauta publicitaria.

La herramienta debe permitir sacar los **10 productos prioritarios o ganadores** para decidir cuáles productos merecen campaña, cuáles deben ajustarse y cuáles deben descartarse.

El sistema no debe funcionar como un simple registro de productos.

Debe funcionar como un **tablero de decisión comercial**.

---

## 3. Principio estratégico

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

## 4. Concepto central de la herramienta

La herramienta debe responder estas preguntas:

1. ¿Qué producto tiene potencial real?
2. ¿Cuánto margen deja?
3. ¿Cuánto se puede invertir en publicidad sin perder?
4. ¿Cuántas ventas necesita para cumplir la meta?
5. ¿El producto se debe escalar, ajustar, pausar o descartar?

---

## 5. Nombre del sistema

Nombre interno definido:

**K7 Product Radar**

El nombre principal a usar en la interfaz y estructura del proyecto es:

**K7 Product Radar**

---

## 6. Reglas generales de arquitectura

El sistema debe ser:

- PWA.
- Responsive.
- Mobile first.
- API first usando Supabase.
- Visualmente minimalista.
- Intuitivo.
- Fácil de usar en celular.
- Menos es más.

La interfaz debe evitar pantallas saturadas.

La primera pantalla debe responder:

**“Estos son los productos que merecen atención hoy.”**

---

## 7. Stack técnico obligatorio

### 7.1 Frontend

- React.
- Vite.
- TypeScript.
- Tailwind CSS.
- PWA installable.
- Mobile first.
- Interfaz basada en cards.
- Dashboard con gráficos.

### 7.2 UI sugerida

- Tailwind CSS como base visual.
- Componentes propios simples.
- shadcn/ui permitido si ayuda a acelerar formularios, cards, tabs, dialogs y tablas.
- Recharts permitido para gráficos del dashboard.

Codex debe mantener la interfaz limpia y ligera.

### 7.3 Supabase

Supabase debe usarse para:

- Auth.
- Base de datos PostgreSQL.
- Storage si se requieren imágenes.
- Row Level Security.
- API automática.
- RPC o funciones SQL cuando aplique.
- Edge Functions para sincronización WooCommerce y webhooks.

### 7.4 Lo que no debe usarse en esta versión

Codex no debe usar:

- Backend Node.js independiente.
- Fastify.
- NestJS.
- Express.
- Prisma.
- Servidor API separado.
- Deploy de backend separado del frontend.

---

## 8. Identidad visual obligatoria

La interfaz debe usar una línea visual simple y directa.

### 8.1 Colores principales

- **Color primario:** Blanco.
- **Color secundario:** Naranja.
- **Color de texto principal:** Negro.

### 8.2 Paleta Tailwind definida

Usar esta lógica visual:

```text
Fondo principal: bg-white
Texto principal: text-neutral-950
Texto secundario: text-neutral-600
Bordes: border-neutral-200
Fondos suaves: bg-neutral-50
Color secundario: orange-500
Hover secundario: orange-600
Active secundario: orange-700
```

### 8.3 Botones principales

Botón principal:

```text
bg-orange-500 text-white hover:bg-orange-600 active:bg-orange-700
```

Botón secundario:

```text
bg-white text-neutral-950 border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100
```

Botón peligro o pausa:

```text
bg-white text-neutral-950 border border-neutral-300 hover:bg-neutral-100 active:bg-neutral-200
```

### 8.4 Reglas visuales

- El blanco debe dominar la interfaz.
- El naranja debe usarse para acciones, acentos, gráficos destacados, CTA y estados activos.
- El negro debe usarse para títulos, textos importantes y números clave.
- No usar degradados como base del sistema.
- No saturar con colores.
- Los colores funcionales para alertas o semáforos pueden usarse solo en badges, indicadores o estados específicos.

### 8.5 Hover y active

Todo botón, card clicable, tab, item de menú o acción debe tener estado:

- Default.
- Hover.
- Active.
- Disabled cuando aplique.

La app debe sentirse rápida y táctil en móvil.

---

## 9. Módulos principales

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

## 10. Dashboard Ejecutivo

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

## 11. Dashboard con gráficos

El dashboard debe incluir gráficos para medir campañas, ventas y rendimiento de productos.

### 11.1 KPIs superiores

Cards principales del dashboard:

- Ventas OK hoy.
- Ingresos estimados hoy.
- Utilidad estimada hoy.
- Gasto publicitario registrado.
- Campañas activas.
- Productos en alerta.
- Mejor producto por utilidad.
- Producto con peor rendimiento.

### 11.2 Gráficos obligatorios

El dashboard debe tener gráficos simples y útiles:

1. **Ventas OK por día**  
   Muestra la evolución de ventas reales provenientes de WooCommerce con estado `processing`.

2. **Utilidad estimada por día**  
   Muestra la utilidad calculada después de costo proveedor y pauta registrada.

3. **Rendimiento por campaña**  
   Compara campañas activas por ventas, gasto, utilidad y ROAS.

4. **Top 10 productos por score**  
   Muestra los productos prioritarios con mejor puntaje.

5. **Inversión vs ventas**  
   Compara gasto publicitario registrado contra ventas obtenidas.

6. **ROAS por campaña**  
   Muestra qué campañas están por encima o por debajo del ROAS mínimo.

### 11.3 Filtros del dashboard

El dashboard debe permitir filtrar por:

- Rango de fechas.
- Producto.
- Campaña.
- Canal.
- Estado de campaña.

### 11.4 Regla para gráficos

Los gráficos deben ayudar a decidir.

No deben ser decorativos.

Cada gráfico debe responder una pregunta clara:

- ¿Qué producto vende?
- ¿Qué campaña funciona?
- ¿Qué producto deja utilidad?
- ¿Qué campaña quema presupuesto?
- ¿Qué producto debe escalarse?

---

## 12. Radar de Productos

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

## 13. Estados de producto

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

En formato técnico deben usarse:

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

## 14. Calculadora de Rentabilidad

Cada producto debe calcular automáticamente los siguientes indicadores.

### 14.1 Margen bruto unitario

```text
precio_venta - costo_proveedor - costos_extra
```

### 14.2 Margen porcentual

```text
margen_bruto / precio_venta * 100
```

### 14.3 CPA máximo para no perder

```text
margen_bruto
```

### 14.4 CPA planificado

```text
inversión_publicitaria / meta_ventas
```

### 14.5 Utilidad proyectada

```text
(margen_bruto * meta_ventas) - inversión_publicitaria
```

### 14.6 ROAS mínimo de equilibrio

```text
precio_venta / margen_bruto
```

### 14.7 Ventas necesarias para ganar $100

```text
(100 + inversión_publicitaria) / margen_bruto
```

---

## 15. Ejemplo de cálculo definido

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

## 16. Filtros del embudo de producto

Antes de activar campaña, un producto debe pasar por filtros.

Los filtros definidos son:

1. Margen.
2. Stock.
3. Precio competitivo.
4. Complejidad logística.
5. Potencial publicitario.

---

## 17. Filtro 1: Margen

Regla recomendada:

- Margen bruto mínimo: $8.
- Margen porcentual mínimo: 30%.

Si el margen es bajo, el producto solo sirve si tiene alta rotación o ticket alto.

---

## 18. Filtro 2: Stock

Regla recomendada:

- Stock mínimo: 10 unidades.
- Stock ideal: 2x o 3x la meta de ventas.

Si el sistema detecta que el stock es bajo frente a la meta de ventas, debe marcar alerta.

---

## 19. Filtro 3: Precio competitivo

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

## 20. Filtro 4: Complejidad logística

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

## 21. Filtro 5: Potencial publicitario

El potencial publicitario se mide con puntaje manual de 1 a 5.

Debe responder:

- ¿Tiene efecto wow?
- ¿Se entiende rápido en video?
- ¿Resuelve un dolor claro?
- ¿Se puede mostrar antes/después?
- ¿Tiene gancho para estados, reels o catálogo?

---

## 22. Score de producto ganador

Cada producto debe tener un puntaje de 0 a 100.

Distribución definida:

| Factor                     |   Peso |
| -------------------------- | -----: |
| Margen bruto               | 25 pts |
| Stock disponible           | 15 pts |
| Precio competitivo         | 15 pts |
| Potencial de contenido     | 15 pts |
| Complejidad logística baja | 10 pts |
| Proveedor confiable        | 10 pts |
| Data real de ventas        | 10 pts |

Total: 100 pts.

---

## 23. Clasificación por score

|       Score | Decisión            |
| ----------: | ------------------- |
|    80 - 100 | Prioridad alta      |
|     65 - 79 | Testear             |
|     50 - 64 | Revisar condiciones |
| Menos de 50 | No activar          |

---

## 24. Módulo de campañas

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

## 25. Estados de campaña

Estados definidos para campaña:

- Pendiente.
- Activa.
- En revisión.
- Escalar.
- Ajustar.
- Pausar.
- Finalizada.

En formato técnico deben usarse:

- `pendiente`
- `activa`
- `en_revision`
- `escalada`
- `pausada`
- `finalizada`

No se deben crear otros estados de campaña sin aprobación.

---

## 26. Métricas de campaña

El sistema debe permitir registrar métricas de campaña.

Al inicio, las métricas pueden ser manuales.

Cada registro de métricas debe permitir guardar:

- Fecha.
- Campaña.
- Gasto.
- Impresiones.
- Clics.
- Mensajes.
- Ventas.
- Ingresos.
- Utilidad estimada.
- CPA.
- ROAS.
- Tasa de conversión.

La integración con Meta Ads API queda como función futura y no pertenece al MVP.

---

## 27. Integración WooCommerce

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

## 28. Regla técnica para WooCommerce

Las credenciales de WooCommerce no deben exponerse en el frontend.

Por eso, WooCommerce debe integrarse mediante **Supabase Edge Functions**.

Codex debe crear Edge Functions para:

1. Recibir webhooks de WooCommerce.
2. Sincronizar pedidos con estado `processing`.
3. Registrar errores de sincronización.
4. Actualizar ventas reales asociadas a productos y campañas.
5. Mostrar productos vendidos que no se pudieron vincular.

No se debe llamar directamente a WooCommerce desde React si eso expone claves o secretos.

---

## 29. Flujo WooCommerce recomendado

### 29.1 Webhook

WooCommerce debe poder enviar eventos al sistema cuando:

- Se crea un pedido.
- Se actualiza un pedido.
- Cambia el estado del pedido.
- Se actualiza un producto.

Función definida:

```text
supabase/functions/woocommerce-webhook-orders
```

### 29.2 Sincronización manual/programada

El sistema debe permitir sincronizar WooCommerce desde una acción manual en la pantalla WooCommerce Sync.

La sincronización debe consultar pedidos con estado:

```text
GET /wp-json/wc/v3/orders?status=processing
```

Función definida:

```text
supabase/functions/sync-woocommerce-orders
```

### 29.3 Regla de respaldo

Debe usarse webhook para actualización rápida y sincronización manual/programada como respaldo.

Esto evita pérdida de datos si un webhook falla.

---

## 30. Relación entre producto interno, Dropi y WooCommerce

Cada producto interno debe poder guardar:

- `woo_product_id`
- `woo_sku`
- `dropi_code`
- `internal_product_id`

Regla ideal:

El SKU de WooCommerce debería ser igual al código Dropi.

Esto permite relacionar ventas sin errores.

---

## 31. Modelo de datos Supabase sugerido

Codex debe crear el esquema en SQL para Supabase.

No usar Prisma.

### 31.1 Tabla: products

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

### 31.2 Tabla: product_financials

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

### 31.3 Tabla: campaigns

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

### 31.4 Tabla: campaign_sales

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

### 31.5 Tabla: campaign_metrics

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

### 31.6 Tabla: decision_logs

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

### 31.7 Tabla: sync_logs

Tabla necesaria para WooCommerce Sync.

```text
id
source
status
message
records_processed
errors_count
created_at
```

---

### 31.8 Tabla: unmatched_woocommerce_products

Tabla necesaria para productos vendidos en WooCommerce que no se pueden asociar a un producto interno.

```text
id
woo_product_id
woo_sku
product_name
woo_order_id
quantity
line_total
order_date
created_at
```

---

## 32. Contrato de API usando Supabase

No debe existir backend REST propio.

La app debe consumir datos mediante:

- Supabase Client desde React.
- Tablas Supabase.
- Views SQL si se requieren reportes.
- RPC SQL para cálculos si aplica.
- Supabase Edge Functions para WooCommerce.

### 32.1 Operaciones de productos

Equivalentes funcionales:

```text
Listar productos
Crear producto
Ver producto
Editar producto
Eliminar producto
Calcular score
Obtener Top 10
Obtener rentabilidad
```

### 32.2 Operaciones de campañas

Equivalentes funcionales:

```text
Listar campañas
Crear campaña
Ver campaña
Editar campaña
Activar campaña
Pausar campaña
Cerrar campaña
Registrar métricas manuales
```

### 32.3 Operaciones dashboard

Equivalentes funcionales:

```text
Resumen del dashboard
Top productos
Alertas
Rendimiento diario
Rendimiento por campaña
ROAS por campaña
Inversión vs ventas
```

### 32.4 Edge Functions WooCommerce

Funciones obligatorias:

```text
supabase/functions/woocommerce-webhook-orders
supabase/functions/sync-woocommerce-orders
```

---

## 33. Motor de decisión

El sistema debe recomendar acciones automáticamente según el rendimiento del producto y campaña.

Las recomendaciones definidas son:

- Escalar.
- Ajustar.
- Pausar.
- Descartar.

---

## 34. Regla de decisión: Escalar

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

## 35. Regla de decisión: Ajustar

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

## 36. Regla de decisión: Pausar

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

## 37. Regla de decisión: Descartar

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

## 38. Pantallas de la PWA

### 38.1 Home Dashboard

Debe mostrar cards principales:

- Ventas OK hoy.
- Utilidad estimada hoy.
- Campañas activas.
- Productos en alerta.
- Top producto del día.
- Producto con mejor margen.
- Producto con peor rendimiento.

Debe incluir los gráficos definidos en la sección de Dashboard con gráficos.

---

### 38.2 Radar

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

### 38.3 Top 10

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

### 38.4 Producto Detalle

Debe contener secciones:

- Datos generales.
- Rentabilidad.
- Filtros.
- Campañas relacionadas.
- Ventas WooCommerce.
- Historial de decisiones.
- Notas comerciales.

---

### 38.5 Nueva Campaña

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

### 38.6 Campañas

Debe mostrar:

- Campañas activas.
- Campañas en revisión.
- Campañas pausadas.
- Campañas finalizadas.
- Métricas por campaña.
- Botón para registrar gasto y métricas manuales.

---

### 38.7 WooCommerce Sync

Pantalla técnica sencilla con:

- Última sincronización.
- Pedidos procesando importados.
- Errores.
- Productos sin vincular.
- Botón sincronizar ahora.

---

## 39. Roles de usuario

### 39.1 Admin

Tiene control total.

---

### 39.2 Ecommerce

Puede:

- Registrar productos.
- Validar margen.
- Activar productos para test.
- Revisar resultados.
- Proponer escalar o descartar.

---

### 39.3 Marketing

Puede:

- Ver productos aprobados.
- Agregar hooks.
- Registrar creativos.
- Actualizar gasto publicitario.
- Reportar métricas.

---

### 39.4 Dirección

Debe ver:

- Dashboard.
- Decisiones.
- Productos recomendados.

Dirección no debe editar todo.

El objetivo es evitar caos y mantener control.

---

## 40. Reglas visuales de interfaz

La interfaz debe ser limpia y directa.

Debe usar:

- Cards grandes.
- Badges de estado.
- Semáforos de rentabilidad.
- Botones claros.
- Vista optimizada para celular.
- Gráficos simples.
- Tablas solo cuando aporten claridad.

Botones principales definidos:

- Activar.
- Escalar.
- Ajustar.
- Pausar.
- Descartar.

---

## 41. Navegación mobile first

La navegación debe ser simple.

En móvil debe usarse preferentemente navegación inferior o menú compacto.

Secciones principales:

- Dashboard.
- Radar.
- Top 10.
- Campañas.
- Sync.

La experiencia móvil es prioritaria.

---

## 42. MVP obligatorio

El MVP debe contener únicamente:

1. Login con Supabase Auth.
2. Registro de productos.
3. Calculadora de margen.
4. Score automático.
5. Top 10 productos.
6. Activación de campañas.
7. Registro manual de gasto publicitario.
8. Integración WooCommerce para ventas con estado procesando mediante Supabase Edge Functions.
9. Dashboard con utilidad estimada.
10. Dashboard con gráficos de campañas y rendimiento.
11. Recomendación: escalar, ajustar, pausar o descartar.

---

## 43. Funciones futuras documentadas

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

## 44. Reglas de implementación para Codex

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

## 45. Reglas de datos y sincronización

1. La venta real se toma desde WooCommerce.
2. Solo se cuenta como venta OK el pedido con estado `processing`.
3. Las ventas deben asociarse por `woo_product_id` o `woo_sku`.
4. El `woo_sku` idealmente debe coincidir con el `dropi_code`.
5. Si un producto vendido en WooCommerce no se puede asociar con un producto interno, debe aparecer en productos sin vincular.
6. El sistema debe registrar errores de sincronización.
7. El sistema debe mostrar la última sincronización.
8. El sistema debe permitir sincronización manual desde la pantalla WooCommerce Sync.
9. Las credenciales de WooCommerce deben permanecer protegidas en Supabase.

---

## 46. Reglas de campos configurables

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

## 47. Criterio final del producto ganador

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

## 48. Estructura de proyecto esperada

Codex debe crear una estructura simple para Vite + React + Supabase.

Estructura sugerida:

```text
k7-product-radar/
  public/
    manifest.webmanifest
    icons/
  src/
    app/
    components/
    features/
      auth/
      dashboard/
      products/
      campaigns/
      woocommerce-sync/
      decisions/
    hooks/
    lib/
      supabase.ts
      calculations.ts
      scoring.ts
      formatters.ts
    routes/
    styles/
    types/
    main.tsx
  supabase/
    migrations/
    functions/
      woocommerce-webhook-orders/
      sync-woocommerce-orders/
  .env.example
  index.html
  package.json
  tailwind.config.ts
  vite.config.ts
```

---

## 49. Variables de entorno esperadas

El frontend debe usar variables públicas de Supabase:

```text
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Las credenciales privadas de WooCommerce no deben ir en Vite.

Deben vivir como secrets en Supabase Edge Functions:

```text
WOOCOMMERCE_URL=
WOOCOMMERCE_CONSUMER_KEY=
WOOCOMMERCE_CONSUMER_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
```

---

## 50. Resultado esperado del sistema

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

## 51. Frase guía del sistema

**K7 Product Radar existe para encontrar, medir y escalar productos con potencial real de venta.**
