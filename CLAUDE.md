# CLAUDE.md — Escritorio de trabajo (raíz)

Este archivo se carga automáticamente al abrir Claude Code desde
`Escritorio/sistema-de-procuccion/`. Es el mapa de los tres proyectos que
viven aquí. **Léelo antes de actuar** y luego abre el `CLAUDE.md` o
`AGENTS.md` del proyecto concreto que toque la tarea.

## EMPIEZA POR AQUÍ

**[`01-documentos/5-bitacora-2026-08-31.md`](Sistema-de-Produccion/Sistema-de-Produccion/01-documentos/5-bitacora-2026-08-31.md)**
— qué se construyó en la última sesión, los bugs que aparecieron, lo que
sigue pendiente y las reglas de trabajo que salieron de equivocarse.
Léelo antes de tocar código.

**[`herramientas/`](herramientas/) es la fábrica operable.** `node panel.js`
levanta el panel; `npm test` corre 452 pruebas. Cero dependencias en el modo
gratis. Su [`README`](herramientas/README.md) explica cada pieza.

---

## Sobre el dueño
- Diseñador web/gráfico UX/UI, Colombia. **Responder siempre en español.**
- Stack: Supabase, Firebase, Figma, GA4, HTML/CSS/JS vanilla, y
  React/Next+TypeScript en Informatecol.
- Correo de las cuentas de infraestructura: `sagilt26@gmail.com`.

## Los tres proyectos

### 1. `Sistema-de-Produccion/Sistema-de-Produccion/` — la fábrica
Sistema de producción del estudio: 10 bases técnicas reutilizables que se
configuran con una ficha de contexto YAML y se convierten en el producto
final del cliente. Flujo: `CONTEXTO → BASE TÉCNICA → PRODUCTO FINAL`.

**→ Su [`CLAUDE.md`](Sistema-de-Produccion/Sistema-de-Produccion/CLAUDE.md)
es el contexto completo y manda sobre este archivo para cualquier tarea de
ese repo.** Ahí están las buenas prácticas obligatorias, las convenciones de
código y el estado detallado.

Reglas que no se negocian:
- Vanilla HTML/CSS/JS. Nada de frameworks pesados sin acordarlo.
- Cada base es autocontenida; `demo.html` abre con doble clic (sin imports ES).
- Comentarios y nombres en español.
- Secretos solo en `.env`, nunca en la ficha ni en el código.
- Línea principal del negocio: **ecommerce**. El menú QR es secundario.

### 2. `Informatecol/` — plataforma de verificación de noticias
Monorepo con git activo. Express 5 + TypeScript + Prisma / Next 15 +
Tailwind v3 / PostgreSQL en Supabase. Licencia AGPL-3.0, sin fines de lucro.

**→ Sus reglas están en [`.agents/AGENTS.md`](Informatecol/.agents/AGENTS.md)**
y son de cumplimiento obligatorio: DRY, Clean Architecture, SOLID, estilos
centralizados en componentes React con `clsx`/`tailwind-merge`, y entrada
obligatoria en `ChangeLog.md` antes de cerrar cada tarea.

Trae dos skills locales en `.agents/skills/`: `supabase` y
`supabase-postgres-best-practices`. **Ese segundo skill aplica igual de bien
a los `supabase.schema.sql` de las bases del sistema de producción** — vale
la pena consultarlo cuando se toque RLS o índices en cualquiera de los dos
proyectos.

### 3. `Proyectos-Clientes/` — los entregables
Un proyecto real de cliente por subcarpeta, con su propio git y su propio
`.env`. **Nunca se construye un entregable dentro de
`Sistema-de-Produccion/`** — esa es la fábrica, no la entrega.

- `prueba-ecommerce/` — prueba interna (sin cliente) de la base
  `ecommerce-completo` contra un Supabase real. Vite como servidor de dev.

## Estado (al 2026-09-01)

Todo está en **git y subido**: `github.com/Sergio262001/sistema-de-produccion`
(privado). El detalle completo de la última sesión está en la bitácora que
enlaza arriba; esto es solo el resumen.

- `herramientas/` — la fábrica operable: panel, formulario de brief,
  validador, generador, auditor con IA, agente de Claude e historial.
  452 pruebas pasando.
- `Sistema-de-Produccion/` — las 10 bases. Fotos de producto en 4 de 9;
  logo y banner del cliente en 4 de 9; direcciones de arte en 5 de 9.
  **Franja, sección partida, texturas y portada a sangre en las 4 bases de
  venta** (`03-componentes-ui/inmersivo.*` + `herramientas/llevar-inmersivo.js`).
  **Plantillas** (`torre`/`revista`/`ficha` — la maqueta, no la piel):
  solo en `landing-modular`.
- `Proyectos-Clientes/` — solo dos: `incoarqi` (cliente real) y
  `prueba-ecommerce` (prueba interna). Las nueve carpetas de prueba del
  generador se borraron el 2026-09-14; el `.gitignore` es ahora una LISTA
  BLANCA y las generaciones sin ficha se marcan con `ES-UNA-PRUEBA.md`.

### Deuda que no hay que redescubrir

- `prueba-ecommerce` sigue con `localAuth` contra RLS — el pendiente
  original, todavía abierto.
- `backend-pro` nunca se probó contra Wompi real.
- Doble carpeta `Sistema-de-Produccion/Sistema-de-Produccion/`.
- `08-pagina-del-estudio` tiene 4 copias de 2 archivos.
- `panel.html` son 1.144 líneas en un archivo.

## Skills y hooks (`.claude/`)

- **5 skills** en `.claude/skills/`: `direccion-de-arte`, `revision-visual`,
  `entregable-cliente`, `base-tecnica`, `ficha-de-contexto`. Son lo que lee el
  agente de Claude del panel. **Si cambias cómo funciona algo del sistema,
  actualiza la skill que lo explica en el mismo commit** — el 2026-09-15 cuatro
  de las cinco estaban dos días atrasadas.
- **2 hooks** en `.claude/settings.json` (scripts en `.claude/hooks/`):
  - `validar-tras-editar` — después de editar un `demo.html` de una base o
    cualquier archivo de un entregable, corre el validador sobre esa carpeta y
    devuelve los **errores** a Claude. Los avisos no.
  - `proteger-inmersivo` — niega editar a mano la zona entre marcadores
    `INMERSIVO` de las bases de venta: `llevar-inmersivo.js` la sobrescribe.
- Se revisan o apagan con `/hooks`. Sus pruebas: `herramientas/pruebas/hooks.test.js`.

## Cómo trabajar
- Confirma a qué proyecto y a qué base pertenece la tarea antes de construir.
- Propón el plan antes de editar muchos archivos; cambios revisables.
- Si una pieza sirve a varias bases, constrúyela una vez y reutilízala.
