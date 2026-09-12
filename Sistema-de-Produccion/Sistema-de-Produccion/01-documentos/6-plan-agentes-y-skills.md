# Plan · Skills y agentes con rol

Escrito el 2026-09-01, después de auditar lo que hay. Responde a tres cosas
que pediste: mejorar "lo de las skills", un **agente con rol de diseñador**, y
que el sistema sea **dinámico** en vez de "meh".

---

## 1 · El diagnóstico, con pruebas

### No hay ni una skill en este proyecto

```
./Informatecol/.agents/skills/supabase/SKILL.md                      ← otro proyecto
./Informatecol/.agents/skills/supabase-postgres-best-practices/      ← otro proyecto
```

Eso es todo lo que existe en el escritorio. **En `sistema-de-produccion` hay
cero skills.** Lo que pediste en el primer mensaje de toda esta historia
—"quiero conectarte skills, como impeccable.style"— nunca se construyó. En su
lugar hay un texto de 40 líneas dentro de `herramientas/lib/agente.js`, la
constante `INSTRUCCIONES`.

### Y aunque existieran, el agente no podría usarlas

`lib/agente.js` pasa una lista blanca de herramientas:

```js
allowedTools: ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit']
```

No está `Skill`, no está `Task`. Y no se pasa la opción `skills`. Con esa
configuración, hoy: **skills imposibles, subagentes imposibles.**

### El SDK sí lo soporta todo — está instalado y sin usar

`@anthropic-ai/claude-agent-sdk@0.3.252`, opciones que existen y no se tocan:

| Opción | Qué permite |
|---|---|
| `agents` | **Subagentes con su propio prompt, modelo y herramientas** |
| `skills` | `'all'` o una lista de nombres |
| `hooks` | Interceptar antes/después de cada herramienta |
| `canUseTool` | Aprobar o rechazar por llamada |
| `settingSources` | Qué `settings.json` y `CLAUDE.md` cargar |

`AgentDefinition` acepta `description`, `prompt`, `tools`, `disallowedTools`,
`model` y `skills`. O sea: **los roles ya son una función del SDK**, no hay que
inventar nada.

### Las instrucciones le mienten al modelo

El prompt del agente dice hoy:

- *"corre 92 pruebas"* — son **281**.
- *"9 bases técnicas"* — son **10**.

Un agente al que le das datos falsos sobre su propio entorno toma decisiones
raras y no sabes por qué.

### El criterio de diseño no existe en ningún lugar ejecutable

Las tres direcciones de arte, los tokens, "nunca inventes datos del cliente",
"un bloque vacío no se pinta", `urlSegura()`, `esc()` — todo eso vive en
**comentarios de código y en la bitácora**. El modelo no lo lee. Y el auditor
de IA (`auditor-ia.js`) tiene su propio criterio escrito a mano, **distinto**
del del agente: dos verdades paralelas que se desincronizan solas.

---

## 2 · Lo que de verdad hace que esté "meh"

**El ciclo está abierto.** Se construye una página y **nadie la mira.**

En toda la sesión de hoy dije seis veces "no puedo abrir un navegador". Las 281
pruebas comprueban que el HTML compila, que los `id` existen, que el catálogo
llegó. Ninguna comprueba que **se vea bien**, porque ninguna lo ve.

Y esto ya no es teoría. **Chrome puede tomar capturas sin instalar nada:**

```
chrome.exe --headless=new --screenshot=out.png --window-size=1280,1400 file:///...demo.html
```

Lo corrí. Funciona (118 KB, 2 segundos). Miré la captura del menú y en diez
segundos encontré defectos que las 281 pruebas no ven:

| Defecto | Por qué ninguna prueba lo caza |
|---|---|
| **Los recuadros de foto vacíos dominan la página.** En boutique el hueco es 120×150 px con un emoji de 38 px dentro: un rectángulo gris enorme y casi vacío por plato | Es geometría renderizada. El HTML es correcto |
| **La carta queda altísima.** El alto del ítem lo manda el recuadro vacío, no el texto: ~130 px entre platos. Parece desarmada, no aireada | Ídem |
| **El precio queda a un océano del nombre** a 1280 px de ancho, sin nada que los conecte. Error clásico de carta | Ídem |
| **El logo en boutique** quedó un cuadrado verde plano y duro al quitarle el radio | Ídem |

**Ese es el verdadero cuello de botella.** No es que falten prompts: es que
nadie cierra el ciclo mirando el resultado. Cerrarlo es lo que convierte esto
de "genera HTML" a "diseña".

---

## 3 · El plan

### Fase 1 · Las skills: el criterio del estudio, ejecutable

Cinco skills en `.claude/skills/` en la raíz del escritorio, para que **las
lean tanto Claude Code como el agente del panel**:

| Skill | Qué contiene | Por qué |
|---|---|---|
| `direccion-de-arte` | Las tres direcciones con sus valores reales de token, cuándo usar cada una, y la lista de lo que NO se hace (hero centrado, emoji de icono, todo redondeado) | Es la skill que arregla "la creatividad es básica" |
| `entregable-cliente` | Nunca inventar datos · `POR DEFINIR` · bloque vacío no se pinta · `esc()` y `urlSegura()` siempre · la identidad del ejemplo no se hereda | Las reglas que costaron 5 bugs aprender |
| `base-tecnica` | Cómo funciona una base: `CONTEXT`, `applyTheme`, adaptadores, qué nunca se toca, los marcadores `@demo-only` | Evita que el agente rompa la fábrica |
| `revision-visual` | Cómo criticar una página **renderizada**: qué mirar y en qué orden | Solo sirve con la Fase 2 |
| `ficha-de-contexto` | El contrato del YAML y la compuerta de validación | Para que no invente campos |

Cada una se escribe **una vez** y la usan el agente, los subagentes y yo. Se
acaba la doble verdad entre `agente.js` y `auditor-ia.js`.

### Fase 2 · Cerrar el ciclo: que el agente VEA

`herramientas/lib/captura.js` — cero dependencias, usa el Chrome que ya tienes.

```
node herramientas/capturar.js <ruta-html> [--ancho 1280] [--dir mercado]
```

Toma la captura, y en las bases con conmutador toma **una por dirección de
arte**, para poder compararlas lado a lado.

Esto es lo que hace todo lo demás posible: el rol de diseñador sin ojos es un
generador de opiniones; con ojos es un diseñador.

### Fase 3 · Los roles como subagentes

Cuatro roles en la opción `agents` del SDK, **cada uno con su modelo**, que es
donde está la economía real:

| Rol | Modelo | Herramientas | Trabajo |
|---|---|---|---|
| **`disenador`** | Opus 5 | Read, Glob, Grep, captura · **sin escritura** | Mira la captura y da dirección de arte concreta: qué cambiar y a qué valor. No toca código |
| **`constructor`** | Sonnet 5 | Read, Write, Edit, Bash | Aplica lo que dijo el diseñador. Mecánica, no criterio |
| **`auditor`** | Haiku 4.5 | Read, Bash | Corre `validar.js` y `npm test` y reporta. Barato porque casi todo es determinista |
| **`redactor`** | Sonnet 5 | Read, Write | Copy en el tono de la ficha, **siempre marcado como borrador** |

El diseñador es el único en Opus porque es el único que necesita criterio. Que
el que construye sea más barato que el que decide es toda la idea.

**El ciclo cerrado:**

```
constructor → captura → disenador critica → constructor arregla → auditor verifica
```

Con un tope de vueltas (2 por defecto) para que no se quede dando círculos.

### Fase 4 · Economía

- **Prompt caching** en el system prompt y en las skills (no cambian entre
  archivos). El `auditor-ia.js` ya lo hace; el agente no.
- **Presupuesto por rol**, no solo por sesión: el diseñador en Opus con tope
  propio.
- **El validador gratis corre siempre antes.** Lo que una regla resuelve por
  $0 nunca debe llegar al modelo. Ya es la regla; hay que hacerla obligatoria
  en el ciclo.
- **Estimación antes de gastar**, como ya hace el auditor.

Costo esperado por entregable revisado, con caching y el diseñador en Opus:
**entre $0.10 y $0.40.** Se mide, no se promete.

---

## 4 · Qué necesito de ti

**De la API, nada.** La clave ya está en `herramientas/.env` y funciona. Los
frenos ya existen (`maxBudgetUsd`, `maxTurns`, herramientas prohibidas). No
hace falta que me des nada nuevo para eso.

**Lo que necesito es criterio tuyo, que no puedo inventar sin que se note:**

1. **Tres a cinco enlaces de páginas que te parezcan bien diseñadas**, y una
   que te parezca mal. Con eso el skill `direccion-de-arte` deja de ser mi
   gusto y pasa a ser el tuyo. Es lo más importante de esta lista.

2. **Cuál de las tres direcciones es "la tuya"** por defecto cuando el cliente
   no tiene opinión. Hoy el respaldo es `taller`, que elegí yo.

3. **Qué consideras terminado.** ¿Un entregable está listo cuando pasa el
   validador, o cuando tú lo abriste y te gustó? Eso decide si el ciclo para
   solo o siempre te espera.

4. **Cuánto estás dispuesto a gastar por entregable.** Un número. Si dices
   $0.20, el diseñador va en Sonnet en vez de Opus y se nota menos; si dices
   $1, va en Opus con dos vueltas de revisión.

Con el punto 1 puedo arrancar. Los otros tres tienen valor por defecto
razonable y te los propongo yo si prefieres no decidirlos ahora.

---

## 5 · Orden y tiempos

| # | Qué | Depende de |
|---|---|---|
| 1 | `capturar.js` + la captura en el panel | nada — se puede hacer ya |
| 2 | Las cinco skills | tus enlaces para la de arte |
| 3 | `agente.js`: habilitar `Skill` y `Task`, pasar `skills`, arreglar los datos falsos del prompt | 1 y 2 |
| 4 | Los cuatro roles como subagentes | 3 |
| 5 | El ciclo cerrado con tope de vueltas | 4 |
| 6 | Caching y presupuesto por rol | 5 |
| 7 | Arreglar los 4 defectos que encontró la primera captura | 1 |

El 1 y el 7 no dependen de ti y son los que más se notan. Puedo empezar por
ahí mientras decides lo demás.

---

## Lo que NO propongo, y por qué

- **Managed Agents** (que Anthropic corra el agente en su infraestructura).
  Cuesta más, agrega una dependencia de red y aquí el agente tiene que tocar
  archivos **de tu disco**. No encaja.
- **Playwright o Puppeteer.** Chrome headless hace el trabajo sin agregar
  dependencias, y la regla de cero dependencias del sistema es buena.
- **Un agente que corra solo, sin que lo lances.** Ya lo descartaste y sigue
  siendo lo correcto: nada que gaste dinero debe arrancar sin que tú lo pidas.
- **Más direcciones de arte.** Tres bien hechas valen más que seis a medias, y
  la bitácora ya lo dice.
