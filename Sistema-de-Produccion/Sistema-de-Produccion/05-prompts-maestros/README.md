# Prompts maestros

Instrucciones reutilizables (E6 del backlog) para trabajar con IA al armar
proyectos de cliente desde este sistema. El objetivo: que arrancar un
proyecto nuevo sea pegar un prompt + una ficha, no explicar el sistema desde
cero cada vez.

## Qué contiene
- **[prompt-de-arranque.md](./prompt-de-arranque.md)** — el flujo completo:
  qué leer primero, dónde crear el proyecto (fuera de este repo), cómo copiar
  cada base, cómo aplicar el contexto, qué confirmar antes de generar
  archivos, y un checklist de entrega que no se puede saltar.
- **[prompt-por-base.md](./prompt-por-base.md)** — un bloque específico por
  cada base de `02-bases/` con las reglas que no están obvias solo con leer
  el código (qué no tocar, qué confirmar, cuál es el entregable mínimo).
- **[prompt-de-revision.md](./prompt-de-revision.md)** — audita un proyecto
  ya construido: separación datos/presentación, tokens, seguridad,
  accesibilidad y performance — con severidad por hallazgo, sin corregir
  nada automáticamente.
- **[prompt-de-contenido.md](./prompt-de-contenido.md)** — genera copy
  (textos) en el tono de la ficha cuando el cliente no entregó el
  definitivo, siempre marcado como borrador pendiente de aprobación.

## Cómo se usan juntos
1. Elige la ficha de contexto del cliente (ver `04-fichas-de-contexto/`),
   y revísala contra `04-fichas-de-contexto/validador-de-ficha.md` antes
   de construir.
2. Pega `prompt-de-arranque.md` completo + la ficha.
3. Si el proyecto usa una base con reglas propias (ej. auth con roles, o
   carrito con pasarela real), pega también el bloque correspondiente de
   `prompt-por-base.md`.
4. El asistente confirma alcance (paso 1 del prompt de arranque) antes de
   tocar archivos — si no lo hace, pídeselo explícitamente.
5. Si falta copy real, usa `prompt-de-contenido.md` para un borrador — nunca
   como contenido final sin aprobación.
6. Antes de entregar, corre `prompt-de-revision.md` sobre el resultado.

## Por qué existen estos dos archivos y no uno solo
El prompt de arranque es el **proceso** (qué hacer y en qué orden, válido
para cualquier base). El prompt por base es el **detalle técnico** que
cambia según la base (qué estructura de datos no se puede romper, qué
confundir con qué). Mezclarlos en un solo archivo larguísimo haría que se
pierdan las reglas específicas en medio del proceso general.
