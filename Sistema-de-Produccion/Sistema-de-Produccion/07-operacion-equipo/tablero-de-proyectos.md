# Tablero de proyectos — seguimiento de entregas

Plantilla mínima para llevar el estado de los proyectos en curso. No exige
ninguna herramienta externa (Trello/Notion/Linear) — puedes copiar esta
tabla a la herramienta que prefieras, o usarla tal cual en este archivo
mientras el equipo sea pequeño.

## Columnas
| Columna | Significa |
|---|---|
| **Cliente** | nombre del proyecto/cliente |
| **Base(s)** | qué base(s) de `02-bases/` usa (de la ficha de contexto) |
| **Estado** | `brief` → `propuesta` → `construcción` → `revisión` → `entregado` → `soporte` |
| **Bloqueo** | qué falta para avanzar (ej. "esperando fotos del cliente", "falta cuenta Wompi") |
| **Responsable** | quién lo está construyendo (si hay más de una persona) |
| **Próxima fecha** | el siguiente compromiso con el cliente |

## Tabla (cópiala y llénala)
| Cliente | Base(s) | Estado | Bloqueo | Responsable | Próxima fecha |
|---|---|---|---|---|---|
| _Ej: Café Raíz_ | menu-con-panel-admin | construcción | — | — | — |

## Reglas de uso
1. **Un proyecto no pasa a `construcción`** sin que la ficha de contexto
   haya pasado `04-fichas-de-contexto/validador-de-ficha.md`.
2. **Un proyecto no pasa a `entregado`** sin haber corrido
   `05-prompts-maestros/prompt-de-revision.md` sobre el resultado.
3. **La columna `Bloqueo` nunca debe quedar vacía si el estado lleva más de
   una semana sin moverse** — si no hay bloqueo y no avanza, es una señal
   de que falta priorizarlo, no de que "está bien como está".
4. Cuando el equipo crezca lo suficiente para que esta tabla en Markdown ya
   no alcance, ese es el momento de migrar a una herramienta real — no
   antes, para no pagar por gestión que un archivo de texto resuelve igual.
