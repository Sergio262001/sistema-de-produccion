# Automatización y nuevos servicios — diagnóstico UX/UI + roadmap

Este documento responde tres preguntas en un solo lugar: ¿qué tan usable es
el sistema hoy para ti mismo (no para el cliente final, sino para ti
operándolo)?, ¿qué servicios nuevos —sobre todo automatizados/recurrentes—
encajan con lo ya construido?, y ¿qué mejorarías a futuro si esto crece?

Nada de lo que sigue está construido todavía. Son ideas evaluadas, no
backlog confirmado — antes de construir cualquiera, decide si de verdad la
vas a vender, igual que con cualquier otra base.

---

## 1. Diagnóstico UX/UI del sistema (auditoría a ti mismo como usuario)

Lo que ya funciona bien:
- La numeración de carpetas (`01-` a `08-`) hace obvio el orden de lectura.
- Cada base sigue el mismo patrón de archivos — una vez aprendes uno, sabes
  navegar los 9.
- `indice.html` es la entrada única — no tienes que recordar rutas.

Fricciones reales que tenías antes de hoy:
- **El índice no tenía forma de buscar.** Con 9 bases + 6 referencias, ubicar
  "¿dónde estaba lo de Wompi?" significaba leer toda la página.
- **El contador de progreso ("39/44") se desincronizaba** del estado real
  apenas avanzabas — un número que miente es peor que no tenerlo.
- **No había una respuesta directa a "¿por dónde empiezo *hoy*?"** — el
  índice asumía que ya sabías el flujo completo (brief → ficha → prompt).
- **Cero atajos de teclado/accesibilidad** en la navegación local (sin
  skip-link, sin estados de foco visibles) — menor, pero es la misma regla
  #9 de `CLAUDE.md` que exigimos en los entregables de cliente.

Lo que se corrigió hoy en `indice.html`:
- Barra de búsqueda en vivo que filtra documentos/bases/kit por texto, con
  mensaje de "sin resultados" por sección.
- Bloque "¿Por dónde empiezo hoy?" con las 3 acciones más frecuentes
  (brief, elegir ficha, prompt de arranque) arriba de todo, sin scroll.
- Skip-link y `:focus-visible` para navegación por teclado.
- Contador de backlog corregido (40/44).

## 2. Ideas de servicios nuevos — con foco en automatización y recurrencia

Filtro usado para cada idea: **¿extiende una base que ya existe, o exige una
base nueva desde cero?** Las primeras son rápidas de ofrecer ya; las
segundas son inversión a futuro.

### Extienden bases existentes (rápidas de ofrecer)
| Idea | Qué resuelve | Se apoya en | Lo que falta para venderla |
|---|---|---|---|
| Seguimiento automático de leads | Avisa cuando un lead lleva N días en estado "nuevo" sin contactar | `crm-simple` (ya tiene `estado` por cliente) | Job que recorra `estado`/fecha y dispare WhatsApp o email — hoy es 100% manual |
| Recordatorio de carrito abandonado | Recupera ventas que no llegaron a pagar | `carrito-reutilizable` / `ecommerce-completo` | Guardar el carrito antes del pago + un disparador por tiempo (backend o servicio externo tipo Make/Zapier) |
| Reporte semanal automático | El cliente recibe un resumen de ventas/leads sin entrar al panel | `dashboard-analytics` (ya calcula los KPIs) | Tarea programada que tome esos mismos KPIs y los mande por email/WhatsApp |
| Recordatorio de citas/pedidos | Reduce inasistencias (ideal para `clinica.yml`) | `crm-simple` + número de WhatsApp ya en la ficha | Integración con una API de WhatsApp Business (no es el link `wa.me`, es otra capa) |
| Encuesta post-compra/post-cita | Mide satisfacción sin pedirlo manualmente | `crm-simple` (nueva nota automática) o `carrito-reutilizable` | Un formulario corto + disparo automático tras el estado "completado" |

### Requieren una capa nueva (a futuro, no urgente)
| Idea | Qué resuelve | Por qué no es "solo otra base" |
|---|---|---|
| Programa de fidelización/puntos | Retención en ecommerce repetido | Necesita lógica de acumulación + reglas de redención — estado compartido entre compras, no una pantalla más |
| Chatbot de WhatsApp con respuestas automáticas | Atención fuera de horario, FAQ, captura a CRM | Requiere WhatsApp Business API (no el link simple que usan las bases hoy) + un motor de reglas/IA |
| Generación de contenido para redes con IA | Acelera el "Plan Marketing" ya existente en `planes-de-soporte.md` | Es un servicio de contenido, no de código — depende de marca/tono real del cliente, nunca se automatiza sin revisión humana |
| Conector a Zapier/Make | Conecta leads/ventas a Sheets, email marketing, Slack sin que tú programes cada integración | Cada cliente pide una combinación distinta — vale la pena solo si se repite 3+ veces con el mismo patrón |

### Por qué no se construyen todavía
Construir cualquiera de estas como "base 10, 11, 12..." sin un cliente real
que la pague repite el mismo riesgo que ya evitamos con MenuOS/LandingKit:
una base sin caso de uso real es trabajo no facturable que envejece sin
nadie probándola. La señal para construir una es: **un cliente la pidió dos
veces**, no "se me ocurrió que serviría".

## 3. Cómo se integran sin romper "una base, autocontenida"
Estas automatizaciones casi siempre son una **tarea programada o un webhook
externo**, no una página nueva — no califican como "base" en el sentido de
`02-bases/` porque no tienen `demo.html` ni UI propia. El patrón correcto,
cuando se construyan, es un script pequeño en `src/core/` o `src/data/` de
la base que extienden (ej. `seguimiento.js` dentro de `crm-simple/src/core/`),
documentado igual que hoy se documenta lo que cada base NO automatiza.

## 4. Roadmap a futuro del sistema en sí (no de los productos del cliente)
- **Configurador de fichas**: hoy llenar un YAML a mano es la parte más
  propensa a error de todo el flujo. Un formulario web simple que genere el
  YAML reduciría errores de copy-paste — pero solo vale la pena si llegas a
  manejar varios proyectos en paralelo (con 1-2 al mes, el YAML manual
  todavía es más rápido de mantener que construir el configurador).
- **Checklist de performance/accesibilidad automatizado**: correr Lighthouse
  (o similar) como parte del "checklist de entrega" del paso 6 de
  `prompt-de-arranque.md`, en vez de revisarlo a ojo.
- **Tablero propio del estudio**: `07-operacion-equipo/tablero-de-proyectos.md`
  ya es la plantilla; cuando haya 3+ proyectos activos a la vez, vale la
  pena pasarlo a una herramienta real (Notion/Linear) en vez de markdown.
- **Empaquetar Starter Pack / MenuOS / LandingKit** (ya pendientes en el
  backlog, E10): productizar lo que hoy se cotiza siempre a medida.
- **Historial de fichas por cliente**: si una ficha cambia después de la
  entrega (cliente pide otro color, otro producto), no hay hoy un lugar que
  registre esa evolución — vale la pena solo si empiezas a perder el rastro
  de qué se entregó vs. qué se acordó originalmente.

## Notas
- Ninguna idea de este documento tiene precio puesto a propósito — son
  candidatas, no compromisos. Cuando decidas construir una, su precio sigue
  la misma fórmula de `06-plantillas-de-negocio/lista-de-precios.md`.
- Si alguna de estas automatizaciones la pide un cliente real antes de que
  exista como base, cotízala como alcance a medida — no la prometas
  incluida "porque ya casi existe".
