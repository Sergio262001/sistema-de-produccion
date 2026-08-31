# CLAUDE.md — Escritorio de trabajo (raíz)

Este archivo se carga automáticamente al abrir Claude Code desde
`Escritorio/sistema-de-procuccion/`. Es el mapa de los tres proyectos que
viven aquí. **Léelo antes de actuar** y luego abre el `CLAUDE.md` o
`AGENTS.md` del proyecto concreto que toque la tarea.

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

## Estado y siguiente hilo abierto (al 2026-08-31)
El único pendiente técnico realmente activo está en
[`Proyectos-Clientes/prueba-ecommerce/README.md`](Proyectos-Clientes/prueba-ecommerce/README.md):
el catálogo ya lee de Supabase real, pero **guardar desde el panel admin
falla** porque el login usa `localAuth` y las políticas RLS exigen una
sesión real de Supabase Auth. Arreglarlo = cambiar `src/main.js` para que
llame a `supabase.auth.signInWithPassword(...)` y crear el usuario en
Authentication → Users.

Todo lo demás del backlog está bloqueado por credenciales (`GA4_ID`,
`WOMPI_PUBLIC_KEY`) o por decisiones de negocio (precios, productización),
no por código pendiente.

## Deuda conocida (no descubrirla de nuevo cada sesión)
- **Solo `Informatecol/` está en git.** El sistema de producción y los
  proyectos de cliente viven únicamente en OneDrive, sin historial.
- **Doble anidación** `Sistema-de-Produccion/Sistema-de-Produccion/` —
  una carpeta de más que rompe enlaces relativos.
- **`esc()` está copiado a mano en 7 de 9 `demo.html`.** Es la función de
  seguridad que corrigió un XSS almacenado real. Si se arregla un bug ahí,
  hay que propagarlo a las 7 copias.
- **`backend-pro` nunca se probó contra Wompi real** — sigue la
  documentación oficial pero no se ha validado en sandbox. No venderlo
  como probado.
- **Sin tests de ningún tipo** en el sistema de producción.
- `08-pagina-del-estudio` tiene 4 copias de 2 archivos (`versiones/` y
  `comparacion/`).

## Cómo trabajar
- Confirma a qué proyecto y a qué base pertenece la tarea antes de construir.
- Propón el plan antes de editar muchos archivos; cambios revisables.
- Si una pieza sirve a varias bases, constrúyela una vez y reutilízala.
