# Base técnica: Menú con Panel Admin

Base reutilizable del sistema de producción. Se configura con una **ficha de
contexto** y funciona con **Firebase, Supabase o datos locales** sin cambiar el
código de la interfaz.

## Qué resuelve
Un menú digital (QR) con vista de cliente y un **panel donde el dueño edita su
carta solo**: precios, descripciones, disponibilidad, agregar y borrar productos.

## Cómo usarla en un proyecto nuevo
1. **Copia** esta carpeta.
2. **Llena** `contexto.ejemplo.yml` con los datos del cliente y renómbralo
   `contexto.<cliente>.yml`. Ahí eliges el motor de base de datos y las APIs.
3. **Configura** las claves: copia `.env.example` a `.env` y rellénalo.
4. **Elige el motor** en `DB_MOTOR` (firebase | supabase | local).
5. Listo: el mismo código se tematiza y conecta según el contexto.

## Estructura
```
menu-base/
├─ demo.html                 ← versión de un solo archivo (úsala para ver/probar)
├─ contexto.ejemplo.yml      ← ficha de contexto (configuración del proyecto)
├─ .env.example              ← plantilla de claves (sin secretos)
└─ src/
   ├─ data/
   │  ├─ adapter.js          ← selector de motor (interfaz única)
   │  ├─ local.adapter.js    ← datos en memoria (sin backend)
   │  ├─ supabase.adapter.js ← conecta con Supabase
   │  ├─ firebase.adapter.js ← conecta con Firestore
   │  └─ seed.js             ← datos de ejemplo
   └─ styles/
      └─ tokens.css          ← variables de diseño (vienen del contexto)
```

## El principio clave
**Los datos están separados de la presentación.** El menú se dibuja igual venga
de donde venga la información. Cambiar de Firebase a Supabase es cambiar una
línea en el `.env`; cambiar la marca del cliente es editar la ficha de contexto.

## Línea Starter vs Pro
- **Starter:** una sede, motor local o Supabase simple, edición básica.
- **Pro:** auth con roles, multisucursal, pedidos con pago (Wompi/Mercado Pago),
  analítica. La misma base activa la extensión según `linea: pro` en la ficha.

## Conectar a Supabase (base de datos real)
1. Crea un proyecto en supabase.com.
2. Ve a **SQL Editor → New query**, pega `supabase.schema.sql` y ejecútalo.
   Esto crea las tablas, mete datos de ejemplo y activa las reglas de
   seguridad (lectura pública, escritura solo para usuarios autenticados).
3. En **Project Settings → API** copia la URL y la `anon key`.
4. Pégalas en tu `.env` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`) y pon
   `DB_MOTOR=supabase`.
5. El panel admin requiere login: crea un usuario en **Authentication**
   para el dueño del local.

## El panel admin está protegido (base: auth)
Antes de mostrar el panel, el demo pide login con la misma interfaz de la
base [auth](../auth/) (`login/logout`, una sola sesión activa). En esta demo
el adaptador es local y solo acepta `admin@caferaiz.co` / `admin123`; en un
proyecto real cambias `CONTEXT.auth.motor` a `supabase` o `firebase` y
conectas las claves del `.env`, igual que con la capa de datos. El rol
exigido (`CONTEXT.auth.rol_requerido`) sale de la ficha de contexto.

## Demo rápida
Abre `demo.html` en el navegador. Trae el motor **local** activo: puedes ver
la carta como cliente, y entrar al **panel admin** te pide iniciar sesión
(usa `admin@caferaiz.co` / `admin123`). En la demo los cambios y el login
viven en memoria; con Supabase/Firebase se guardan y autentican de verdad.

## Fotos de los items

Cada plato tiene dos campos de imagen y se usan en este orden:

| Campo | Qué es |
|---|---|
| `imagen` | URL de la foto real. **Es lo que vende.** |
| `emoji` | Respaldo cuando todavía no hay foto |

Si `imagen` está vacía se dibuja el emoji en un recuadro. Sirve para
arrancar, pero **no se entrega así**: nadie compra viendo un emoji.

### Dónde subir las fotos

Lo natural es **Supabase Storage**: crea un bucket público (ej. `fotos`),
sube las imágenes y pega la URL pública en el campo `imagen` desde el panel.
También sirve cualquier URL `https://` — el sistema solo acepta `http(s)` y
rutas del propio sitio; un `javascript:` o un `data:` se descartan.

### Qué pedirle al cliente

- Fotos **horizontales**, mínimo 800 px de ancho.
- Comprimidas: por encima de ~300 KB cada una, la página se siente lenta.
- Una por plato. Si faltan, se entrega con el emoji y **queda anotado como
  pendiente** — no se rellena con fotos de banco.
