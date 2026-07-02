# Supabase y WooCommerce - Variables de entorno

## WooCommerce REST API

Crear credenciales en WooCommerce:

```text
WooCommerce > Ajustes > Avanzado > REST API > Agregar clave
```

Permisos recomendados para el MVP:

```text
Lectura
```

Variables:

```env
WOOCOMMERCE_BASE_URL="https://tudominio.com"
WOOCOMMERCE_CONSUMER_KEY="ck_xxx"
WOOCOMMERCE_CONSUMER_SECRET="cs_xxx"
```

La API solo cuenta pedidos con estado:

```text
processing
```

## Supabase

Variables necesarias:

```env
DATABASE_URL="postgresql://postgres.PROJECT_REF:PASSWORD@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
DIRECT_URL="postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres"
SUPABASE_URL="https://PROJECT_REF.supabase.co"
SUPABASE_ANON_KEY="ey..."
SUPABASE_SERVICE_ROLE_KEY="ey..."
```

Uso:

- `DATABASE_URL`: conexion runtime desde la API.
- `DIRECT_URL`: conexion directa para migraciones Prisma.
- `SUPABASE_URL`: URL del proyecto.
- `SUPABASE_ANON_KEY`: clave publica si luego se usa Supabase Auth o cliente web.
- `SUPABASE_SERVICE_ROLE_KEY`: solo backend, nunca frontend.

## Crear la base de datos

Con las variables reales en `.env`:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
```

Si se usa MCP/conector de Supabase, Codex puede aplicar el SQL/migracion directamente en el proyecto conectado. En este entorno no hay un MCP de Supabase activo, asi que para hacerlo desde aqui necesito que el conector este disponible o que se configure el `.env` con `DATABASE_URL` y `DIRECT_URL`.
