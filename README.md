# Cotizador Altaterra

Aplicación de cotización para **Corporación Altaterra · Bosques del Sol II**.

Repositorio: https://github.com/josephstakeland/cotizador-corporacion-altaterra.git

## Roles

- **Admin:** precios, disponibilidad, editor de plano (polilínea/rectángulo, verde disponible / rojo vendido), RUC, logos y usuarios.
- **Asesor:** selecciona lotes disponibles, aplica descuento e inicial, descarga PDF de cotización.

## Acceso local de prueba

- Admin: `admin@altaterra.pe` / `Admin123!`
- Asesor: `asesor@altaterra.pe` / `Asesor123!`

El primer usuario que se registre también queda como admin si aún no hay ninguno.

## Desarrollo

```bash
npm install
npm run dev
```

La app arranca en modo local (`VITE_DATA_MODE=local`). Los 257 lotes de la lista de precios se precargan. El admin dibuja cada figura y la vincula al lote (Mz + número).

## Supabase (recomendado para asesores en distintos equipos)

No se pudo crear un proyecto nuevo porque la cuenta free ya tiene 2 proyectos. Cuando tengas un proyecto **dedicado** (no el CRM existente):

1. Ejecuta [`supabase/migrations/001_init.sql`](supabase/migrations/001_init.sql) en el SQL editor.
2. En Netlify o `.env`:

```
VITE_DATA_MODE=supabase
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=tu_publishable_key
```

## Deploy en Netlify

1. Conecta este repositorio.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Variables: las de `.env.example`
5. El archivo `netlify.toml` ya incluye el redirect SPA `/* → /index.html`.

## Cotización

El PDF replica el formato de `documentos/Cotizacion_Corporacion_Altaterra_Bosques_del_Sol_II.pdf`: logos, detalle de lotes, inicial, saldo y cuotas a 24/36 meses (división simple). El RUC se configura en **Empresa**.
