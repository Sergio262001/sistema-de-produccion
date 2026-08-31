# Estructura de repos — estándar para proyectos de cliente

Un único estándar de carpetas para **cualquier proyecto de cliente**, sin
importar qué base(s) de `02-bases/` use. Sirve para que tú, o alguien que se
sume al equipo, sepa exactamente dónde está cada cosa sin tener que
preguntar — el mismo objetivo que ya cumplen las fichas de contexto, pero
para la estructura del repo en sí.

Esto formaliza el paso 2 de
[`05-prompts-maestros/prompt-de-arranque.md`](../05-prompts-maestros/prompt-de-arranque.md);
si alguna vez se contradicen, gana este archivo y se actualiza el prompt.

## Dónde vive cada proyecto
Todo proyecto de cliente se crea en
`Escritorio/sistema-de-procuccion/Proyectos-Clientes/<cliente-slug>/` —
carpeta hermana de este repo (`Sistema-de-Produccion/`), nunca dentro de él.
Ver `Proyectos-Clientes/README.md` para el detalle de esa carpeta.

## Estructura estándar (dentro de cada `<cliente-slug>/`)
```
<cliente-slug>/
├─ README.md              ← qué es, qué base(s) usa, cómo correrlo localmente
├─ CLAUDE.md               ← (opcional) contexto del proyecto si usas IA para mantenerlo
├─ .gitignore              ← copiado de la base; nunca subir .env
├─ .env.example             ← plantilla de claves, sin secretos
├─ .env                    ← claves reales — NUNCA se commitea
├─ contexto.yml            ← la ficha de contexto ya llena, sin secretos
├─ index.html              ← punto de entrada (el demo.html de la base, adaptado)
└─ src/                    ← copiado de la base, sin reescribir adaptadores
   ├─ core/ o data/         ← según la base (auth/carrito usan core/, menú/landing usan data/)
   └─ styles/
      └─ tokens.css
```

## Reglas no negociables
1. **Un repo Git por cliente**, siempre, desde el primer commit — nunca
   "ya lo subo cuando esté listo".
2. **`.env` nunca se commitea.** Si por error se subió, rota las claves del
   proveedor (Supabase/Firebase/Wompi) — no basta con borrarlo del historial.
3. **`contexto.yml` sí se commitea**, porque no tiene secretos (solo nombres
   de variables, nunca valores). Es la documentación viva del proyecto.
4. **`index.html` es el entregable real**, no `demo.html` — quita la
   `.sysbar` y cualquier rótulo que diga "demo" antes de entregar.
5. **El nombre del repo es el slug del cliente** (`cafe-raiz`, no
   `proyecto-2`, no `cliente-nuevo`) — así se identifica sin abrir el README.

## Cuando el proyecto combina varias bases
Si la ficha de contexto lista más de una base en `bases:` (ej. landing +
carrito), no dupliques `src/` por cada una si comparten algo — fusiona
`src/data/` o `src/core/` en una sola capa de datos del proyecto, manteniendo
la interfaz `load/save` o `login/logout` de cada adaptador igual a como está
en la base original.

## Para cuando el equipo crezca (referencia, no bloqueante hoy)
Cuando se sume una segunda persona, este mismo archivo es la base de la
"Guía de estilo de código" y el "Onboarding" (E9, P2 — pendientes hasta que
haya alguien real a quien onboardear, no antes).
