# Base técnica: Ecommerce Completo

Catálogo con inventario real, filtros por categoría, panel de administración
protegido con login, y el mismo motor de carrito + checkout que
`carrito-reutilizable`. Es la extensión Pro de venta: cuando `carrito-reutilizable`
no alcanza porque el cliente necesita controlar stock y editar su catálogo
sin pedírtelo a ti, esta es la base.

## Qué resuelve
Catálogo por categorías → cada producto muestra su stock real → si se agota,
se deshabilita solo (no hay que editarlo a mano) → el dueño entra a un panel
con login real a editar nombre/precio/stock → checkout por WhatsApp o Wompi.

## Cómo usarla en un proyecto nuevo
1. **Copia** esta carpeta.
2. **Llena** `contexto.ejemplo.yml` con los datos del cliente y renómbralo
   `contexto.<cliente>.yml`. Ahí eliges motor de datos, auth y método de pago.
3. **Configura** las claves: copia `.env.example` a `.env` y rellénalo.
4. **Ejecuta** `supabase.schema.sql` si usas Supabase (crea tablas +
   RLS + datos de ejemplo).
5. Listo: el mismo catálogo se tematiza, conecta y protege según el contexto.

## Estructura
```
ecommerce-completo/
├─ demo.html                 ← versión de un solo archivo (catálogo + panel + carrito)
├─ contexto.ejemplo.yml      ← ficha de contexto (configuración del proyecto)
├─ supabase.schema.sql       ← esquema con stock, listo para ejecutar
├─ .env.example              ← plantilla de claves (sin secretos)
└─ src/
   ├─ data/
   │  ├─ adapter.js          ← selector de motor (interfaz única)
   │  ├─ local.adapter.js    ← catálogo en memoria (sin backend)
   │  ├─ supabase.adapter.js ← conecta con Supabase
   │  ├─ firebase.adapter.js ← conecta con Firestore
   │  └─ seed.js             ← datos de ejemplo
   ├─ core/
   │  ├─ cart.js             ← copiado de carrito-reutilizable, sin cambios
   │  ├─ checkout.js         ← copiado de carrito-reutilizable, sin cambios
   │  └─ wompi.adapter.js    ← Widget oficial de Wompi, copiado sin cambios
   └─ styles/
      └─ tokens.css
```

## El principio clave
**El stock es la única fuente de disponibilidad.** No hay un campo
`disponible` aparte que alguien tenga que recordar actualizar: si
`stock <= 0`, el producto se muestra agotado y el botón de agregar se
deshabilita solo. Editar el stock desde el panel es lo único que un
administrador necesita tocar para abrir o cerrar la venta de un producto.

## Por qué el carrito está copiado, no importado
Cada base de `02-bases/` debe poder copiarse sola a un proyecto de cliente
sin depender de carpetas hermanas (ver `CLAUDE.md`). Por eso `cart.js`,
`checkout.js` y `wompi.adapter.js` están copiados tal cual desde
`carrito-reutilizable`, no importados desde ahí. Si mejoras el motor de
carrito en una base, considera traer la mejora a la otra.

## Conectar a Supabase (base de datos real)
1. Crea un proyecto en supabase.com.
2. Ve a **SQL Editor → New query**, pega `supabase.schema.sql` y ejecútalo.
3. En **Project Settings → API** copia la URL y la `anon key` a tu `.env`.
4. Pon `DB_MOTOR=supabase` y `AUTH_MOTOR=supabase`.
5. Crea un usuario en **Authentication** para el dueño del inventario.

## Pedidos
El pedido se **guarda antes** de salir a WhatsApp o a la pasarela. Ese
orden importa: si primero se abre WhatsApp y la persona no manda el
mensaje, el pedido se pierde y nadie se entera de que existió.

Cada pedido lleva un código corto (`PED-7K3F9`) que el cliente puede
dictar por teléfono, y avanza por estados: `nuevo` → `confirmado` →
`preparando` → `enviado` → `entregado` (o `cancelado`). El panel solo
ofrece las transiciones válidas, así que nadie marca "entregado" algo que
nadie preparó.

El nombre y el precio se **congelan** en cada ítem: un pedido de hace seis
meses tiene que mostrar lo que la persona pagó, no lo que cuesta hoy.

Dos cosas que hay que explicarle al cliente en la entrega:
- **Cancelar no devuelve el stock.** Una cancelación no siempre significa
  que la mercancía volvió a la bodega. Se ajusta a mano en Inventario.
- **El comprador no puede consultar su pedido en la web.** No hay política
  pública de lectura sobre `pedidos`, a propósito: con una, cualquiera
  podría listar los datos de todos los clientes.

## Concurrencia de stock — resuelto con `crear_pedido`
El riesgo clásico: dos personas pagan el último producto casi al mismo
tiempo y ambas creen que lo compraron. Con `DB_MOTOR=supabase` eso ya no
puede pasar: `pedidos.supabase.adapter.js` no hace insert + update, llama
a la función `crear_pedido` del esquema, que valida stock, crea el pedido
y lo descuenta **en una sola transacción**. La segunda persona recibe
"Solo quedan N unidades de X" en vez de una venta fantasma.

⚠️ Con `DB_MOTOR=firebase` esa garantía **no existe** (haría falta una
transacción de Firestore o una Cloud Function). Si el negocio vende
unidades escasas, usa Supabase.

## Línea Starter vs Pro
- **Starter:** no aplica directamente — esta base ya asume inventario y
  panel, que son típicamente Pro. Si el cliente solo necesita vender sin
  controlar stock, usa `carrito-reutilizable` + `landing-modular`.
- **Pro:** inventario real, panel protegido por rol, pedidos con estados,
  y la opción de sumar `02-bases/backend-pro/` para cobrar de verdad con
  Wompi (firma de integridad + confirmación por webhook + total
  recalculado en el servidor).

## Demo rápida
Abre `demo.html`. Trae el motor **local** activo: navega el catálogo por
categorías, agrega productos al carrito (los agotados no se pueden
agregar), y entra al **panel admin** (`admin@casatela.co` / `admin123`) para
editar precio y stock — verás cómo un producto en `0` se agota solo en el
catálogo sin tocar nada más.

## Fotos de los productos

Cada producto tiene dos campos de imagen y se usan en este orden:

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
- Una por producto. Si faltan, se entrega con el emoji y **queda anotado como
  pendiente** — no se rellena con fotos de banco.
