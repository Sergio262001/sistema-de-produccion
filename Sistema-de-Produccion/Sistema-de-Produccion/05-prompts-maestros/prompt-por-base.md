# Prompt por base

Un bloque específico por cada base de `02-bases/`. Úsalo junto con el
[prompt de arranque](./prompt-de-arranque.md) cuando el proyecto necesite
ajustes finos propios de esa base — pégale solo el bloque que corresponda.

---

## menu-con-panel-admin

Eres responsable de ensamblar un menú digital QR con panel admin.

- **Archivo base**: `02-bases/menu-con-panel-admin/demo.html`. La vista
  cliente lee de `DATA.categorias`; el panel admin edita esa misma
  estructura y llama a `db.save(DATA)`.
- **No cambies** la forma del objeto `DATA` (`categorias[].items[]` con
  `id, nombre, desc, precio, emoji, disp, badge`) — el esquema de
  `supabase.schema.sql` espera exactamente esos campos.
- **Auth**: el panel ya pide login (ver bloque `3.1) AUTH` del script). Si
  `CONTEXT.auth.motor` pasa a `supabase` o `firebase`, importa el adaptador
  real desde `src/core/` de la base `auth` — no reescribas la lógica de
  login a mano.
- **Si la ficha pide pedidos con pago** (no solo WhatsApp): no lo improvises
  aquí. Suma la base `carrito-reutilizable` al proyecto y conecta su
  `checkout()` al mismo `CONTEXT.apis.pagos`.
- **Entregable mínimo**: el dueño real puede loguearse, editar un producto,
  guardarlo, y ese cambio sobrevive un refresh (si el motor no es `local`).

## carrito-reutilizable

Eres responsable del motor de carrito + checkout de un proyecto de venta.

- **No mezcles** lógica de UI dentro de `src/core/cart.js` o
  `checkout.js` — son agnósticos de framework y de base de datos a propósito.
  Si necesitas un campo nuevo en el carrito, agrégalo al objeto del producto
  (`{id, nombre, precio, ...}`), nunca al motor.
- **El método de pago sale de `ctx.apis.pagos`**, nunca lo hardcodees en el
  HTML. Si es `whatsapp`, no necesitas backend. Si es `wompi`, usa
  `src/core/wompi.adapter.js` (Widget oficial) — funciona en sandbox solo con
  `WOMPI_PUBLIC_KEY`; para producción falta la firma de integridad, que se
  calcula en tu backend (instrucciones en ese mismo archivo, nunca exponer
  el secreto de integridad en el frontend). Si es `mercadopago`/`stripe`, el
  checkout devuelve `{tipo:'pago', proveedor, monto, nota}` — ese cobro
  exige crear una preferencia/sesión desde tu backend, NO se resuelve solo
  en el frontend.
- **Si el proyecto también necesita catálogo/landing**: usa
  `landing-modular` para las secciones y monta el carrito sobre su grid de
  servicios/productos, no dupliques estilos de card.
- **Entregable mínimo**: un cliente real puede agregar productos, ver el
  total correcto (con envío e impuesto si aplican) y completar el checkout
  por el método que diga la ficha.

## landing-modular

Eres responsable de una landing por secciones con captura de leads.

- **El contenido vive en el objeto `CONTENT`**, nunca en el HTML de las
  secciones. Si agregas una sección nueva, sigue el mismo patrón de
  `src/sections/*.js`: una función `render<Seccion>(content)` que devuelve
  HTML, sin tocar las demás.
- **No reordenes secciones a mano en el HTML** — la lista de servicios, por
  ejemplo, sale de `content.servicios`; si el cliente quiere otro orden,
  cambia el array en la ficha, no el JS.
- **El formulario de leads usa el adaptador de `src/data/`** — si conectas
  Supabase, crea la tabla `leads` exactamente como dice el comentario en
  `supabase.adapter.js` antes de probar el guardado.
- **Si la ficha pide agendar citas o reservas reales** (no solo un lead): no
  existe esa base todavía. Dilo explícitamente, no lo simules con el
  formulario de leads como si fuera lo mismo.
- **Entregable mínimo**: el formulario guarda el lead en el motor que diga
  la ficha y, si `apis.mensajeria` es `whatsapp`, abre el chat con el
  resumen del contacto.

## auth

Eres responsable de proteger un panel existente con login real.

- **No dupliques la lógica de auth** dentro de otra base si ya existe en
  `02-bases/auth/src/core/`. Importa `getAuth(motor)` y usa
  `login/logout/subscribe` igual que en `demo.html` de esta base.
- **El rol vive en `user_metadata.rol`** (Supabase) o en
  `Firestore: perfiles/{uid}` (Firebase) — nunca en una variable global del
  frontend, eso no es seguro ni persistente.
- **Antes de dar por hecho que el login "ya funciona"**: confirma que el
  motor real (no `local`) está conectado con las claves del `.env`. El
  adaptador `local` es solo para desarrollo — nunca lo entregues como
  solución final a un cliente.
- **RLS / reglas de seguridad van de la mano**: si agregas un rol nuevo,
  agrega también la regla de acceso correspondiente en Supabase/Firebase
  antes de considerar el trabajo terminado (buena práctica #5 de `CLAUDE.md`).
- **Entregable mínimo**: un usuario real (no el de la demo) puede loguearse
  con el rol correcto y entrar al panel que protege; alguien con el rol
  equivocado ve el mensaje de acceso denegado, no el panel.

## ecommerce-completo

Eres responsable del catálogo con inventario real de un proyecto de venta.

- **El stock es la única fuente de disponibilidad.** No agregues un campo
  `disponible` aparte — si lo encuentras en una ficha o petición del
  cliente, mapéalo a `stock` (ej. "márcalo como agotado" = poner stock en 0).
- **`cart.js`, `checkout.js` y `wompi.adapter.js` están copiados de
  `carrito-reutilizable` sin cambios** — no los reescribas aquí. Si el
  proyecto necesita una mejora al motor de carrito, hazla en
  `carrito-reutilizable` primero y luego cópiala a esta base.
- **Inventario ajustado (poco stock, alta demanda)**: no resuelvas la
  concurrencia con un simple `save()` del catálogo completo desde el panel
  — eso puede vender el mismo último producto dos veces. Usa una función
  RPC en Supabase que reste stock de forma atómica al confirmar el pedido
  (ver la nota final de `supabase.schema.sql`).
- **Entregable mínimo**: un producto con stock en 0 se muestra agotado y no
  se puede agregar al carrito sin que nadie lo marque a mano; el dueño
  real puede loguearse y cambiar precio/stock, y ese cambio se refleja en
  el catálogo sin recargar manualmente nada más.
