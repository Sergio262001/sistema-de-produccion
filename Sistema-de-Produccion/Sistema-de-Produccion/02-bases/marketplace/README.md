# Base técnica: Marketplace

Catálogo multi-vendedor con desglose de comisión por venta. Cada producto
pertenece a un vendedor; el carrito agrupa por vendedor y muestra cuánto se
queda la plataforma y cuánto le corresponde a cada uno.

## Qué resuelve
El cliente compra productos de varios vendedores en un solo carrito → el
drawer muestra el pedido agrupado por vendedor con su comisión calculada →
el checkout informa el total, pero **la liquidación a cada vendedor es
manual** (ver por qué abajo).

## Por qué no hay split de pago automático
Repartir el dinero automáticamente entre varios vendedores en el momento
del cobro (split payment) es una función específica de la pasarela — Wompi
(el conector que ya tenemos en `carrito-reutilizable`) no la ofrece nativa.
Proveedores como **Stripe Connect** sí, pero es una integración bastante
distinta (cuentas conectadas, onboarding de cada vendedor con el
proveedor). Sin eso, el flujo realista es: cobras todo a la cuenta de la
plataforma, y le pagas a cada vendedor aparte (transferencia manual o
nómina) usando el desglose que ya calcula esta base.

## Cómo usarla en un proyecto nuevo
1. **Copia** esta carpeta.
2. **Llena** `contexto.ejemplo.yml` — define `comision_porcentaje` según el
   acuerdo real con los vendedores.
3. **Configura** las claves: copia `.env.example` a `.env`.
4. Si más adelante automatizas el split con Stripe Connect u otro
   proveedor, esa pieza se agrega al backend, no aquí.

## Estructura
```
marketplace/
├─ demo.html                 ← versión de un solo archivo (catálogo + carrito con desglose)
├─ contexto.ejemplo.yml      ← ficha de contexto (comisión, vendedores)
├─ .env.example              ← plantilla de claves (sin secretos)
└─ src/
   ├─ data/
   │  ├─ adapter.js          ← selector de motor (interfaz única)
   │  ├─ local.adapter.js    ← vendedores/productos en memoria
   │  ├─ supabase.adapter.js ← conecta con Supabase
   │  └─ firebase.adapter.js ← conecta con Firestore
   ├─ core/
   │  ├─ cart.js             ← copiado de carrito-reutilizable, sin cambios
   │  └─ checkout.js         ← desglosePorVendedor() — el cálculo de comisión
   └─ styles/
      └─ tokens.css
```

## El principio clave
**El desglose de comisión es solo aritmética, no movimiento de dinero.**
`desglosePorVendedor()` agrupa el carrito y calcula cuánto le toca a cada
vendedor — quien usa ese número para liquidar (a mano o con un backend de
split) es una decisión de negocio, no algo que esta base resuelva por ti.

## Demo rápida
Abre `demo.html`. Agrega productos de los dos vendedores de ejemplo al
carrito y ábrelo — verás el pedido agrupado por vendedor, con la comisión
de la plataforma y el neto de cada uno calculados en vivo.
