# Proyectos de clientes

Cada proyecto real de cliente vive en su propia subcarpeta aquí — **nunca
dentro de `Sistema-de-Produccion/`**, que es la fábrica de bases, no el
lugar de entrega (ver `CLAUDE.md` de ese repo).

## Estructura esperada por cliente
```
Proyectos-Clientes/
└─ <cliente-slug>/              ← ej. casa-tela, cafe-raiz
   ├─ .git/                    ← repo propio, independiente de Sistema-de-Produccion
   ├─ .gitignore
   ├─ .env                     ← claves reales — nunca se commitea
   ├─ contexto.yml             ← la ficha de contexto ya llena, sin secretos
   ├─ index.html               ← el entregable real (copiado y adaptado del demo.html de la base)
   └─ src/                     ← copiado de la base usada, sin reescribir adaptadores
```
Esto es exactamente lo que describe
`Sistema-de-Produccion/07-operacion-equipo/estructura-de-repos.md` — esa es
la referencia completa, esto solo fija dónde vive cada carpeta en tu disco.

## Cómo arranca un proyecto nuevo aquí
1. Le pasas a Claude la ficha de contexto del cliente (llena o por llenar)
   y le dices qué base(s) de `Sistema-de-Produccion/02-bases/` usar.
2. Claude sigue `Sistema-de-Produccion/05-prompts-maestros/prompt-de-arranque.md`
   y crea la carpeta `Proyectos-Clientes/<cliente-slug>/` con todo copiado
   y adaptado.
3. Tú das las claves reales (Supabase, Wompi, GA4...) cuando las tengas —
   van al `.env` de esa carpeta del cliente, nunca al repo del sistema.

## Lo único que tú tienes que hacer
**Darme el contexto del cliente** (brief, ficha, o simplemente contarme qué
necesita) y decirme qué base se parece más. Yo me encargo de crear la
carpeta aquí, copiar y adaptar el código, y avisarte si falta algo — no
necesitas saber dónde vive cada archivo técnico para que esto funcione.
