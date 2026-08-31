# Base técnica: Carrito Reutilizable

Motor de carrito + checkout, pensado para ser el núcleo de venta de cualquier
otra base (menú con pedidos, ecommerce, marketplace). No depende de UI ni de
motor de base de datos: solo gestiona estado y entrega un resumen para pagar.

## Qué resuelve
Catálogo → agregar al carrito → drawer con cantidades y total → checkout por
**WhatsApp** (sin pasarela) o por **pasarela de pago** (Wompi, Mercado Pago,
Stripe), según lo que elija el proyecto.

## Cómo usarla en un proyecto nuevo
1. **Copia** esta carpeta.
2. **Llena** `contexto.ejemplo.yml` con los datos del cliente y renómbralo
   `contexto.<cliente>.yml`. Ahí eliges el método de pago.
3. **Configura** las claves: copia `.env.example` a `.env` y rellénalo.
4. **Elige el método** en `apis.pagos` (whatsapp | wompi | mercadopago | stripe).
5. Listo: el mismo carrito se tematiza y conecta según el contexto.

## Estructura
```
carrito-reutilizable/
├─ demo.html              ← versión de un solo archivo (úsala para ver/probar)
├─ contexto.ejemplo.yml   ← ficha de contexto (configuración del proyecto)
├─ .env.example           ← plantilla de claves (sin secretos)
└─ src/
   ├─ core/
   │  ├─ cart.js              ← estado del carrito (add/remove/qty), reactivo
   │  ├─ checkout.js          ← arma el resumen y decide a dónde va el pedido
   │  └─ wompi.adapter.js     ← Widget oficial de Wompi, listo para usar con tu public key
   └─ styles/
      └─ tokens.css           ← variables de diseño (vienen del contexto)
```

## El principio clave
**El carrito no sabe de UI ni de base de datos.** `cart.js` solo lleva el
estado y notifica a quien esté suscrito; cualquier base puede importarlo y
dibujarlo con su propio diseño. `checkout.js` solo decide el destino del
pedido según `apis.pagos` del contexto — el resto (cobrar de verdad) vive en
el backend del proyecto con sus claves del `.env`.

## Conectar un método de pago real
- **WhatsApp** (Starter, sin pasarela): solo necesitas `WHATSAPP_NUM`. El
  checkout abre `wa.me` con el pedido ya armado como texto.
- **Wompi** (Pro): `checkout()` devuelve `{ tipo: 'widget', proveedor: 'wompi', abrir }`.
  Llama `abrir(state, ctx, { publicKey: WOMPI_PUBLIC_KEY }, onResult)` — abre
  el Widget oficial de Wompi (`src/core/wompi.adapter.js`), **sin backend**
  para probar en sandbox. Para producción necesitas además la firma de
  integridad calculada en tu backend (instrucciones y ejemplo en Node dentro
  de ese mismo archivo) — la llave de integridad nunca va en el frontend.
- **Mercado Pago / Stripe** (Pro): ambos exigen crear una preferencia/sesión
  de pago desde tu backend (no es seguro hacerlo solo en el frontend con la
  clave privada). `checkout()` devuelve `{ tipo: 'pago', proveedor, monto, nota }`
  con esa instrucción — tu backend crea la preferencia/sesión con el SDK del
  proveedor y redirige al cliente a la URL que te devuelva.

## Línea Starter vs Pro
- **Starter:** checkout por WhatsApp, un solo carrito, sin backend de pagos.
- **Pro:** pasarela real (Wompi/Mercado Pago/Stripe), impuestos y envío
  configurables desde la ficha, listo para conectarse a inventario real.

## Demo rápida
Abre `demo.html` en el navegador. Trae un catálogo de ejemplo y el checkout en
modo **whatsapp**: agrega productos, abre el carrito y pulsa "Pedir por
WhatsApp" para ver el resumen armado.

Para probar el **widget real de Wompi**: cambia `CONTEXT.apis.pagos` a
`"wompi"` y pon tu *public key* de sandbox (la consigues gratis creando una
cuenta de pruebas en wompi.co) en `CONTEXT.apis.wompi_public_key`, dentro del
mismo archivo. Sin esa llave, el botón solo explica cómo conseguirla — no
falla en silencio ni simula un pago falso.
