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
levanta el panel; `npm test` corre 174 pruebas. Cero dependencias en el modo
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
  174 pruebas pasando.
- `Sistema-de-Produccion/` — las 10 bases. Fotos de producto en 2 de 9;
  logo y banner del cliente en 2 de 9; direcciones de arte en 1 de 9.
- `Proyectos-Clientes/` — los entregables. **Los generados antes del
  2026-09-01 están rotos** (les falta el arreglo de la página en blanco):
  regenerarlos o borrarlos.

### Deuda que no hay que redescubrir

- `lib/acceso.js` **es el login y no tiene ni una prueba.**
- `prueba-ecommerce` sigue con `localAuth` contra RLS — el pendiente
  original, todavía abierto.
- `backend-pro` nunca se probó contra Wompi real.
- Doble carpeta `Sistema-de-Produccion/Sistema-de-Produccion/`.
- `08-pagina-del-estudio` tiene 4 copias de 2 archivos.
- `panel.html` son 1.144 líneas en un archivo.

## Cómo trabajar
- Confirma a qué proyecto y a qué base pertenece la tarea antes de construir.
- Propón el plan antes de editar muchos archivos; cambios revisables.
- Si una pieza sirve a varias bases, constrúyela una vez y reutilízala.
