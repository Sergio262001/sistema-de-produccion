# Base técnica: Suscripciones

Selector de planes + registro de quién está suscrito a cuál, con cancelar.
**No automatiza el cobro mes a mes** — eso es responsabilidad de un backend
conectado a un proveedor con API de cobro recurrente.

## Qué resuelve
Cliente ve los planes con sus beneficios → se suscribe → queda registrado
con fecha de inicio → puede cancelar cuando quiera. El renovar y cobrar
automáticamente cada ciclo es la pieza que falta a propósito (ver abajo).

## Por qué el cobro recurrente no está aquí
Wompi (el conector que ya tenemos en `carrito-reutilizable`) no tiene una
API de suscripciones — está pensado para cobros puntuales. Cobro recurrente
real existe en **Stripe Billing** o **Mercado Pago "preapproval"**, y ambos
necesitan:
1. Crear el plan/suscripción del lado del proveedor con su clave secreta
   (nunca en el frontend).
2. Un **webhook** en tu backend que escuche cuando un cobro se repite, falla
   o se cancela, y actualice el `estado` en tu base de datos.
Sin ese backend, esta base es honesta: solo lleva el registro de intención
de suscripción, no mueve dinero solo.

## Cómo usarla en un proyecto nuevo
1. **Copia** esta carpeta.
2. **Llena** `contexto.ejemplo.yml` — especialmente `planes` (sin cifras de
   ejemplo, pon los precios y beneficios reales del cliente).
3. **Configura** las claves: copia `.env.example` a `.env`.
4. Si vas a automatizar el cobro: construye el backend con el proveedor que
   elijas, y conecta su webhook para que actualice `suscripciones.estado`.

## Estructura
```
suscripciones/
├─ demo.html                 ← versión de un solo archivo (planes + estado)
├─ contexto.ejemplo.yml      ← ficha de contexto (planes reales del cliente)
├─ .env.example              ← plantilla de claves (sin secretos)
└─ src/
   ├─ data/
   │  ├─ adapter.js          ← selector de motor (interfaz única)
   │  ├─ local.adapter.js    ← planes/suscripciones en memoria
   │  ├─ supabase.adapter.js ← conecta con Supabase
   │  └─ firebase.adapter.js ← conecta con Firestore
   └─ styles/
      └─ tokens.css
```

## Interfaz de datos
`load()` trae `{ planes, suscripciones }`; `suscribir(email, planId)` crea
el registro; `cancelar(id)` lo marca como cancelado. Ninguna de las tres
mueve dinero — eso vive en el backend de pagos, no en esta capa.

## Demo rápida
Abre `demo.html`. Elige un plan y suscríbete — verás tu estado y podrás
cancelar. Es un registro real en memoria, sin cobro de por medio (la barra
superior lo dice explícitamente).
