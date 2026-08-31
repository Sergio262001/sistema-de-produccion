# Base técnica: Dashboard Analytics

Panel de métricas protegido con login, que lee los datos que **ya generan
otras bases** del mismo proyecto (`leads` de `landing-modular`, `productos`
y `pedidos` de `ecommerce-completo` / `carrito-reutilizable`) — no inventa
ninguna tabla propia.

## Qué resuelve
El dueño entra con su usuario y ve: ingresos, ventas, ticket promedio y
productos más vendidos; total de leads y leads de los últimos 7 días en un
gráfico de barras; cuántos productos están agotados y el valor total del
inventario en stock.

**Qué cuenta como venta:** solo los pedidos en `confirmado`, `preparando`,
`enviado` o `entregado`. Un pedido `nuevo` todavía no se confirmó y uno
`cancelado` nunca fue venta. Explícale esta regla al cliente en la entrega
— si no, va a cuadrar caja y va a creer que el panel pierde ventas.

Si el proyecto no corrió el esquema de pedidos, la sección de ventas sale
vacía con un mensaje que lo dice. No rompe y no inventa números.

## Lo que esta base NO incluye (léelo antes de prometerlo a un cliente)
**Tráfico/visitas reales de Google Analytics no están aquí.** Traer
sesiones, usuarios o pageviews de GA4 requiere la **GA4 Data API**, que se
autentica con una cuenta de servicio — esa credencial nunca puede vivir en
el frontend, necesita un backend. Sin ese backend, este dashboard se queda
en las métricas que ya viven en tu propia base de datos (leads, inventario).
No lo vendas como "analítica completa" si esa pieza no está conectada — el
demo lo dice explícitamente en la barra superior.

## Cómo usarla en un proyecto nuevo
1. **Requiere** que el proyecto ya tenga la base `landing-modular` y/o
   `ecommerce-completo` con sus tablas creadas (`leads` y/o `productos`).
2. **Copia** esta carpeta.
3. **Llena** `contexto.ejemplo.yml` y renómbralo `contexto.<cliente>.yml`.
4. **Configura** las claves: copia `.env.example` a `.env` y rellénalo —
   son las mismas `SUPABASE_URL`/`SUPABASE_ANON_KEY` que ya usan las otras
   bases del mismo proyecto.
5. Listo: el dashboard lee de las mismas tablas, sin duplicar datos.

## Estructura
```
dashboard-analytics/
├─ demo.html                 ← versión de un solo archivo (KPIs + gráfico + login)
├─ contexto.ejemplo.yml      ← ficha de contexto del proyecto
├─ .env.example              ← plantilla de claves (sin secretos)
└─ src/
   ├─ data/
   │  ├─ adapter.js          ← selector de motor (interfaz única)
   │  ├─ local.adapter.js    ← datos de ejemplo en memoria
   │  ├─ supabase.adapter.js ← lee leads/productos de Supabase
   │  └─ firebase.adapter.js ← lee leads/productos de Firestore
   └─ styles/
      └─ tokens.css
```

## El principio clave
**El dashboard solo muestra lo que el cliente ya tiene en su propia base de
datos.** Si más adelante construyes una base que registra pedidos reales
(hoy ni `carrito-reutilizable` ni `ecommerce-completo` guardan el pedido
completado, solo abren WhatsApp/Wompi), este dashboard puede extenderse
para mostrar ventas — pero no antes de que esa tabla exista de verdad.

## Si quieres tráfico real de GA4 más adelante
Necesitas: una cuenta de servicio de Google Cloud con acceso a la propiedad
GA4, y un backend (cualquier función serverless) que llame a la GA4 Data
API con esa credencial y expongala a este dashboard por un endpoint propio
— nunca pongas la cuenta de servicio en el frontend. Cuando ese backend
exista, agrega un adaptador nuevo aquí (`ga4.adapter.js`) que lo consuma,
siguiendo el mismo patrón `load()` de los demás.

## Demo rápida
Abre `demo.html`. Usa `admin@casatela.co` / `admin123` para entrar. Verás
KPIs y el gráfico calculados sobre datos de ejemplo en memoria — con
Supabase/Firebase reales, son los leads y el inventario reales del cliente.
