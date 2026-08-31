# Onboarding — cómo sumar a 1–2 personas

Para cuando el estudio crezca de una persona a un equipo pequeño. Sigue
este orden — cada paso asume que el anterior ya se hizo.

## Día 1 — Entender el sistema, no escribir código todavía
1. Lee `CLAUDE.md` completo (raíz del repo). Es el contexto permanente:
   qué es esto, cómo está organizado, qué reglas son innegociables.
2. Abre `indice.html` y recorre cada demo de `02-bases/` — entender qué
   hace cada base antes de tocar una.
3. Lee `07-operacion-equipo/guia-de-estilo-de-codigo.md` — las convenciones
   que hacen que todo se vea como hecho por una sola persona.
4. Lee `05-prompts-maestros/prompt-de-arranque.md` — así sabe el proceso
   completo antes de que le toque ejecutarlo.

## Día 2 — Primera tarea guiada, no un proyecto real todavía
1. Pide que copie una base existente (ej. `landing-modular`) a una carpeta
   de prueba y la adapte con una ficha de contexto inventada (no uses
   datos de un cliente real para la primera práctica).
2. Que corra `04-fichas-de-contexto/validador-de-ficha.md` sobre esa ficha
   de prueba antes de "construir".
3. Que corra `05-prompts-maestros/prompt-de-revision.md` sobre su propio
   resultado al final — así practica el estándar de calidad desde el día 2,
   no como una sorpresa en su primera entrega real.

## Primera tarea real
1. Asigna algo de alcance acotado primero (ej. una landing simple, línea
   Starter) antes de algo con auth/pagos/inventario.
2. Revisa su primer entregable con `prompt-de-revision.md` tú también, en
   paralelo — no asumas que el checklist solo lo corre la otra persona.
3. Si encuentra un patrón que no está documentado (porque solo vivía en tu
   cabeza), ese es el momento de agregarlo a la guía de estilo o al README
   de la base correspondiente — no lo dejes pasar.

## Qué NO hacer al sumar a alguien
- No le des acceso a `.env` de clientes reales antes de que entienda la
  regla de "secretos solo en `.env`, nunca en la ficha ni en el código".
- No le asignes una base que tú mismo no hayas entregado a un cliente real
  todavía — si tú no sabes si funciona en producción, no puedes guiarlo.
- No saltes el paso de "primera tarea guiada" aunque tenga experiencia
  previa — el sistema tiene convenciones propias que no son obvias desde
  afuera (ver guía de estilo).

## Cuando ya hay 2+ personas trabajando en paralelo
Llegado ese punto, retoma `Tablero de proyectos`
(`07-operacion-equipo/tablero-de-proyectos.md`) para no perder de vista qué
tiene cada uno entre manos.
