# Prueba Ecommerce

Proyecto de prueba personal (sin cliente real) para validar de punta a
punta la base [`ecommerce-completo`](../../Sistema-de-Produccion/Sistema-de-Produccion/02-bases/ecommerce-completo/)
conectada a un proyecto Supabase real tuyo. Usa Vite solo como servidor de
desarrollo local — para que `import.meta.env` lea el `.env` de verdad
(sin Vite, un HTML suelto no puede leer un `.env` en el navegador).

## 1. Crear las tablas en Supabase (una sola vez)
1. Entra a tu proyecto en supabase.com → **SQL Editor** → **New query**.
2. Pega el contenido completo de
   `../../Sistema-de-Produccion/Sistema-de-Produccion/02-bases/ecommerce-completo/supabase.schema.sql`
   y dale **Run**.
3. Esto crea las tablas `categorias`/`productos`, datos de ejemplo, y las
   reglas de seguridad (RLS): lectura pública, escritura solo para
   usuarios autenticados de **Supabase Auth** (no el login local de esta
   demo — ver el punto 4).

## 2. Correr el proyecto
```
npm install
npm run dev
```
Abre la URL que imprime Vite (normalmente `http://localhost:5173`). El
catálogo debe mostrar los 5 productos de ejemplo del schema, ya leídos
desde tu Supabase real.

## 3. Qué SÍ funciona en esta prueba
- Lectura del catálogo real desde Supabase (`db.load()`).
- Carrito + checkout por WhatsApp (número de ejemplo en `.env`).
- Entrar al panel admin con el login local de la demo
  (`admin@prueba.co` / `admin123`).

## 4. Qué NO funciona todavía (a propósito, no es un bug)
**Guardar cambios en el panel admin va a fallar** con un error de permisos.
El esquema SQL protege la escritura con `auth.role() = 'authenticated'`,
que es el rol que da **Supabase Auth** a un usuario real — el login local
de esta demo (`admin@prueba.co`) no crea esa sesión, solo abre la pantalla
del panel. Para que guardar funcione de verdad, hay dos caminos:
- Crear un usuario real en Supabase Auth (Authentication → Users → Add
  user) y cambiar `src/main.js` para que el login llame a
  `supabase.auth.signInWithPassword(...)` en vez del `localAuth` de prueba.
- O, solo para probar lectura/escritura sin armar el login real todavía,
  relajar temporalmente la policy de escritura en el SQL Editor — pero
  vuélvela a poner como estaba antes de usar este proyecto como base de
  algo real.

## 5. Dónde está cada cosa
- `index.html` — estructura y estilos (sin `sysbar`, ya es el formato de
  entrega real, no el de la demo del repo de bases).
- `src/main.js` — la app: contexto, catálogo, carrito, panel admin.
- `src/data/` y `src/core/` — copiados tal cual de la base
  `ecommerce-completo` (no se reescribió ningún adaptador).
- `.env` — credenciales reales de Supabase. Nunca se commitea
  (`.gitignore`).
- `contexto.yml` — la ficha de este proyecto, sin secretos.

## 6. Si esto se convierte en un cliente real
Cambia `contexto.yml`, los datos de ejemplo del SQL por el catálogo real
del cliente, el número de WhatsApp, los tokens de marca en `index.html`, y
resuelve el login real de Supabase Auth del punto 4 antes de entregarlo —
ver el checklist de `05-prompts-maestros/prompt-de-arranque.md` paso 6.
