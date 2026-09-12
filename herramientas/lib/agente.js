// ════════════════════════════════════════════════════════════
//  EL AGENTE — Claude adentro del panel.
//
//  Usa el Claude Agent SDK (@anthropic-ai/claude-agent-sdk), que es
//  Claude Code empaquetado como librería: ya trae leer, escribir,
//  editar, buscar y ejecutar comandos. Corre en TU máquina, sobre
//  TUS archivos.
//
//  CORREAS, y por qué cada una:
//
//  1. Presupuesto por sesión (maxBudgetUsd). El riesgo real de un
//     agente no es lo que cuesta: es que se quede dando vueltas.
//  2. Turnos máximos. Segundo freno, por si el presupuesto no corta.
//  3. La fábrica es de solo lectura. `cwd` es Proyectos-Clientes/,
//     así que 02-bases/ entra como directorio adicional para LEER,
//     y las herramientas destructivas están prohibidas.
//  4. El validador gratis corre ANTES. Lo que una regla resuelve por
//     $0 nunca debe llegar al modelo.
// ════════════════════════════════════════════════════════════

import { join } from 'node:path';

export const MODELOS_AGENTE = {
  haiku:  { id: 'claude-haiku-4-5', etiqueta: 'Haiku 4.5 · el más barato' },
  sonnet: { id: 'claude-sonnet-5',  etiqueta: 'Sonnet 5 · equilibrado' },
  opus:   { id: 'claude-opus-5',    etiqueta: 'Opus 5 · el más capaz' },
};
export const MODELO_AGENTE = 'sonnet';

/** Techo por sesión, en dólares. Se puede bajar desde el panel, no subir a ciegas. */
export const PRESUPUESTO_POR_DEFECTO = 0.50;
export const PRESUPUESTO_MAXIMO = 3.00;

/**
 * DE DÓNDE SALE EL DINERO — y por qué esto existe.
 *
 * El SDK puede autenticarse de dos maneras, y la diferencia es la factura:
 *
 *   'suscripcion'  Usa el login de Claude Code (OAuth de claude.ai). NO gasta
 *                  por token: consume los límites de tu plan. Es lo correcto
 *                  para trabajar sentado frente al panel.
 *   'api'          Usa ANTHROPIC_API_KEY. Se paga por token, sin límites de
 *                  plan. Es lo correcto para tandas largas y desatendidas.
 *
 * El detalle que lo forzaba todo a 'api': `herramientas/.env` tiene la clave,
 * `panel.js` la carga en process.env, y el subproceso HEREDA process.env. O
 * sea que había clave siempre, aunque no se quisiera usar. La opción `env` del
 * SDK reemplaza el entorno del subproceso por completo — así que para el modo
 * suscripción se pasa un entorno igual pero SIN la clave.
 */
export const COBROS = {
  suscripcion: { etiqueta: 'Mi suscripción · sin costo por token' },
  api:         { etiqueta: 'API · se paga por token' },
};
export const COBRO_POR_DEFECTO = 'suscripcion';

/** El entorno del subproceso según de dónde deba salir el dinero. */
export function entornoSegunCobro(cobro) {
  const env = { ...process.env };
  if (cobro === 'api') return env;
  // Modo suscripción: se quitan TODAS las vías de credencial por clave, o el
  // CLI la encuentra por otro lado y vuelve a cobrar por token sin avisar.
  delete env.ANTHROPIC_API_KEY;
  delete env.ANTHROPIC_AUTH_TOKEN;
  delete env.ANTHROPIC_API_KEY_HELPER;
  return env;
}

const INSTRUCCIONES = `Eres el asistente del panel de un estudio de diseño web colombiano.
Trabajas sobre un sistema de producción real, no sobre un ejemplo.

CÓMO ESTÁ ORGANIZADO
- \`Sistema-de-Produccion/Sistema-de-Produccion/02-bases/\` es LA FÁBRICA:
  10 bases técnicas reutilizables. Es de SOLO LECTURA para ti. Si algo hay
  que arreglar ahí, lo dices — no lo tocas.
- \`Proyectos-Clientes/<slug>/\` son los entregables. Ahí sí trabajas.
- Cada proyecto tiene su \`contexto.yml\` (la ficha) y su \`.env\` (secretos).

HERRAMIENTAS DEL ESTUDIO — úsalas, no las reimplementes
- \`node herramientas/validar.js <ruta>\` — control de calidad determinista:
  XSS, contraste WCAG, RLS faltante, tokens muertos, secretos, accesibilidad.
  Cuesta $0. Córrelo antes de opinar sobre calidad.
- \`node herramientas/capturar.js <ruta|URL>\` — TOMA UNA CAPTURA y la deja en
  \`capturas/\`. Úsala siempre que toques un HTML: que compile no es que se vea
  bien. \`--dirs\` toma una por dirección de arte; \`--movil\` a 375 px.
  Después de capturar, ABRE la imagen con Read. Una captura sin mirar no sirve.
- \`node herramientas/crear-proyecto.js --cliente "X" --base <base>\` — genera
  un proyecto completo. No armes carpetas a mano. \`--destino\` para pruebas.
- \`cd herramientas && npm test\` corre 281 pruebas.

LAS SKILLS SON EL CRITERIO DEL ESTUDIO — cárgalas, no improvises
- \`direccion-de-arte\` antes de tocar un token, elegir tipografía u opinar
  sobre si algo se ve bien. Trae la lista de defaults PROHIBIDOS.
- \`entregable-cliente\` antes de generar o editar algo en Proyectos-Clientes/.
- \`revision-visual\` para criticar una página renderizada.
- \`base-tecnica\` antes de editar un demo.html de 02-bases/.
- \`ficha-de-contexto\` para leer o escribir un contexto.yml.

LOS ROLES — delega, no lo hagas todo tú
Tienes subagentes con su propio modelo. Úsalos con la herramienta Task:
- \`disenador\` decide criterio visual (mira capturas, NO escribe código).
- \`constructor\` aplica cambios.
- \`auditor\` corre el validador y las pruebas.
- \`redactor\` escribe copy en el tono de la ficha.

REGLAS QUE NO SE NEGOCIAN
1. Vanilla HTML/CSS/JS. Nada de frameworks pesados.
2. Comentarios y nombres en español.
3. Secretos SOLO en \`.env\`. Si ves una clave en el código, es un error grave.
4. Nunca inventes datos del cliente. Si falta algo en la ficha, PREGUNTA.
   Un campo mal asumido se nota en la entrega.
5. Los adaptadores de \`src/\` se copian tal cual, no se reescriben.

CÓMO RESPONDER
- En español, directo, sin relleno.
- Antes de escribir archivos, di qué vas a hacer.
- Cuando termines algo que se pueda verificar, verifícalo y muestra la salida real.
- Si algo no se puede hacer, dilo claro en vez de aproximar.`;

// ════════════════════════════════════════════════════════════
//  LOS ROLES.
//
//  Un agente solo es un generalista caro. Cuatro roles con su propio modelo
//  ponen el dinero donde está el criterio: el que DECIDE es el caro, el que
//  EJECUTA es más barato, y el que solo corre comandos es el más barato de
//  todos. Que el constructor cueste menos que el diseñador es toda la idea.
//
//  El diseñador NO tiene Write ni Edit a propósito. Un rol que decide y
//  además implementa se salta su propio criterio: escribe primero y justifica
//  después. Sin manos, tiene que escribir qué cambiar y a qué valor — que es
//  justamente el entregable que sirve.
// ════════════════════════════════════════════════════════════
export const ROLES = {
  disenador: {
    description: 'Decide la dirección de arte mirando la página renderizada. '
      + 'Úsalo cuando haya que juzgar si algo se ve bien, elegir paleta o '
      + 'tipografía, o criticar un entregable. No escribe código.',
    model: 'claude-opus-5',
    tools: ['Read', 'Glob', 'Grep', 'Bash', 'Skill'],
    skills: ['direccion-de-arte', 'revision-visual'],
    prompt: `Eres el director de arte de un estudio de diseño web colombiano.

Tu trabajo es MIRAR y DECIDIR. No escribes código: escribes qué cambiar y a
qué valor exacto, para que otro lo aplique.

CÓMO TRABAJAS, en este orden y sin saltarte pasos:
1. Corre \`node herramientas/capturar.js <ruta>\` (--dirs si la base tiene
   direcciones de arte).
2. ABRE la captura con Read. Si no la miraste, no tienes nada que decir.
3. Carga la skill \`direccion-de-arte\` y revisa la lista de PROHIBIDOS.
4. Entrega máximo 6 hallazgos, ordenados por importancia. Cada uno dice:
   dónde, qué se ve, qué cambiar, y a qué valor.

NO reportes nada que el validador gratis ya cubra (contraste, alt, XSS,
tokens muertos, foco). Córrelo tú mismo primero: \`node herramientas/validar.js\`.

No afirmes un defecto que no puedas confirmar en el CSS. Un color raro en una
captura comprimida puede ser el antialias. Verifica antes de acusar.

En español, directo. Sin introducción, sin cierre, sin adjetivos de relleno.`,
  },

  constructor: {
    description: 'Aplica cambios de código en los entregables. Úsalo después '
      + 'de que el diseñador decidió, o para tareas mecánicas claras.',
    model: 'claude-sonnet-5',
    tools: ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit', 'Skill'],
    skills: ['entregable-cliente', 'base-tecnica'],
    prompt: `Aplicas cambios en los entregables de un estudio de diseño web.

Mecánica, no criterio: si el cambio ya está decidido, lo implementas; si no
está decidido, lo dices en vez de inventarlo.

Carga \`entregable-cliente\` antes de tocar Proyectos-Clientes/ y
\`base-tecnica\` antes de tocar una base. La fábrica (02-bases/) es de solo
lectura: si el arreglo va ahí, lo reportas.

Nunca inventes datos del cliente. Todo lo que escribe otra persona pasa por
esc() antes de innerHTML. No inyectes código con heredocs ni con node -e: las
barras invertidas de las regex se pierden y ya rompió el sistema tres veces.

Cuando termines, corre \`npm test\` y el validador, y muestra la salida real.`,
  },

  auditor: {
    description: 'Corre el validador y las pruebas y reporta la salida real. '
      + 'Úsalo para verificar, no para opinar.',
    model: 'claude-haiku-4-5',
    tools: ['Read', 'Glob', 'Grep', 'Bash'],
    prompt: `Verificas. No opinas.

Corres \`node herramientas/validar.js <ruta>\` y \`cd herramientas && npm test\`,
y reportas la salida REAL: cuántos errores, cuántos avisos, cuántas pruebas
pasan y cuáles fallan.

Si algo falla, citas el archivo y la línea. No propones el arreglo: eso es de
otro rol. No adornes ni resumas de más — el número exacto es el entregable.`,
  },

  redactor: {
    description: 'Escribe el copy de un entregable en el tono de la ficha. '
      + 'Úsalo para titulares, descripciones y textos de sección.',
    model: 'claude-sonnet-5',
    tools: ['Read', 'Glob', 'Grep', 'Write', 'Edit', 'Skill'],
    skills: ['ficha-de-contexto', 'entregable-cliente'],
    prompt: `Escribes el copy de los entregables de un estudio colombiano.

El tono sale de \`marca.tono\` en la ficha, no de tu gusto. Lee la ficha antes
de escribir una palabra.

TODO lo que escribas es BORRADOR y va marcado como tal. El cliente conoce su
negocio; tú no. Nunca inventes un dato: ni una fecha de fundación, ni un
número de clientes, ni un premio, ni un testimonio. Si el hueco necesita un
dato que no está en la ficha, lo dejas señalado como pendiente.

Español de Colombia, directo, sin adjetivos de relleno y sin palabras de
marketing vacías.`,
  },
};

/**
 * ¿Se puede lanzar el agente? Depende del modo de cobro:
 *  - api          exige ANTHROPIC_API_KEY.
 *  - suscripcion  exige estar logueado en Claude Code (`claude` → /login).
 *    No se puede comprobar desde aquí sin lanzar el CLI, así que se informa
 *    en vez de bloquear: si no hay sesión, el SDK devuelve un error claro.
 */
export async function estadoAgente(cobro = COBRO_POR_DEFECTO) {
  const faltan = [];
  let sdk = false;
  try { await import('@anthropic-ai/claude-agent-sdk'); sdk = true; }
  catch { faltan.push('el paquete @anthropic-ai/claude-agent-sdk'); }
  if (cobro === 'api' && !process.env.ANTHROPIC_API_KEY) {
    faltan.push('la variable ANTHROPIC_API_KEY (o cambia a modo suscripción)');
  }
  return {
    listo: sdk && faltan.length === 0,
    faltan,
    cobro,
    hayClave: Boolean(process.env.ANTHROPIC_API_KEY),
    cobros: COBROS,
  };
}

/**
 * Corre el agente y va emitiendo eventos.
 *
 * @param {object} o
 *   raiz          raíz del repositorio
 *   mensaje       lo que pidió el usuario, en español
 *   modelo        clave de MODELOS_AGENTE
 *   presupuesto   techo en USD para esta sesión
 *   soloLectura   si true, el agente no puede escribir nada
 * @param {(evento) => void} emitir
 */
export async function correrAgente(
  { raiz, mensaje, modelo = MODELO_AGENTE, presupuesto = PRESUPUESTO_POR_DEFECTO,
    soloLectura = false, cobro = COBRO_POR_DEFECTO, rol = null },
  emitir,
) {
  const estado = await estadoAgente(cobro);
  if (!estado.listo) {
    throw new Error('Falta ' + estado.faltan.join(' y ') + '.\n'
      + 'Instala con:  cd herramientas && npm install @anthropic-ai/claude-agent-sdk\n'
      + 'La clave se consigue en console.anthropic.com y va en herramientas/.env');
  }

  const { query } = await import('@anthropic-ai/claude-agent-sdk');
  const m = MODELOS_AGENTE[modelo] || MODELOS_AGENTE[MODELO_AGENTE];
  const techo = Math.min(Number(presupuesto) || PRESUPUESTO_POR_DEFECTO, PRESUPUESTO_MAXIMO);

  const clientes = join(raiz, 'Proyectos-Clientes');
  const sistema = join(raiz, 'Sistema-de-Produccion', 'Sistema-de-Produccion');
  const herramientas = join(raiz, 'herramientas');

  // Comandos que no tienen por qué existir en este flujo de trabajo.
  const prohibidos = [
    'Bash(rm:*)', 'Bash(del:*)', 'Bash(format:*)',
    'Bash(git push:*)', 'Bash(git reset --hard:*)',
    'Bash(curl:*)', 'Bash(wget:*)',
    'Bash(npm publish:*)',
  ];
  if (soloLectura) prohibidos.push('Write', 'Edit', 'NotebookEdit');

  // `Skill` da acceso a las skills del estudio; `Task` deja delegar a los
  // roles. Sin las dos en la lista blanca, ni las skills ni los subagentes
  // existen para el modelo — que es exactamente como estaba antes.
  const base = soloLectura
    ? ['Read', 'Glob', 'Grep', 'Bash', 'Skill', 'Task']
    : ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit', 'Skill', 'Task'];

  // Un rol concreto corre solo, sin delegar: el diseñador no necesita
  // subagentes, y dejarle Task sería invitarlo a gastar de más.
  const definicion = rol && ROLES[rol];
  const opciones = {
    model: definicion?.model || m.id,
    cwd: clientes,                                   // donde SÍ puede trabajar
    additionalDirectories: [sistema, herramientas],  // lectura de la fábrica
    systemPrompt: definicion
      ? { type: 'preset', preset: 'claude_code', append: INSTRUCCIONES + '\n\n' + definicion.prompt }
      : { type: 'preset', preset: 'claude_code', append: INSTRUCCIONES },

    // `settingSources` tiene que incluir 'project' o no se cargan los
    // CLAUDE.md — y ahí vive el mapa de los tres proyectos del escritorio.
    settingSources: ['user', 'project', 'local'],

    // El criterio del estudio, como skills. Es "la única forma de encender
    // skills": no hace falta agregar 'Skill' a allowedTools por separado,
    // pero se deja explícito porque la lista blanca de arriba es cerrada.
    skills: definicion?.skills || 'all',

    agents: rol ? undefined : ROLES,   // los roles, solo para el agente principal
    allowedTools: definicion?.tools || base,
    disallowedTools: prohibidos,
    permissionMode: 'bypassPermissions',   // el panel ya confirmó al lanzar
    maxTurns: 24,
    maxBudgetUsd: techo,

    // DE DÓNDE SALE EL DINERO. Ver el comentario de COBROS arriba: el
    // subproceso hereda process.env, así que para el modo suscripción hay
    // que pasarle un entorno explícito SIN la clave.
    env: entornoSegunCobro(cobro),
  };

  let costo = 0;
  let turnos = 0;

  emitir({ tipo: 'inicio', modelo: opciones.model, presupuesto: techo, soloLectura,
           cobro, rol: rol || null });

  // Los tipos que emite el SDK, comprobados contra el paquete real (la
  // documentación resumida no coincide): `assistant` trae bloques dentro de
  // message.content, `user` trae los resultados de herramienta, y `result`
  // cierra con el costo total y el número de turnos.
  try {
    for await (const msg of query({ prompt: mensaje, options: opciones })) {
      if (msg.type === 'assistant') {
        for (const b of msg.message?.content || []) {
          if (b.type === 'text' && b.text) {
            emitir({ tipo: 'texto', texto: b.text });
          } else if (b.type === 'tool_use') {
            turnos++;
            emitir({ tipo: 'herramienta', nombre: b.name, entrada: resumirEntrada(b.input) });
          }
          // Los bloques `thinking` no se muestran: es razonamiento interno,
          // no algo que el dueño necesite leer para decidir.
        }
      } else if (msg.type === 'user') {
        for (const b of msg.message?.content || []) {
          if (b.type === 'tool_result') {
            emitir({ tipo: 'resultado', texto: recortar(textoDe(b)) });
          }
        }
      } else if (msg.type === 'result') {
        if (typeof msg.total_cost_usd === 'number') costo = msg.total_cost_usd;
        const redondo = Math.round(costo * 10000) / 10000;
        emitir({ tipo: 'gasto', costo: redondo });
        if (msg.is_error) {
          emitir({ tipo: 'error',
            mensaje: msg.result || msg.subtype || 'el agente terminó con error',
            costo: redondo });
        } else {
          emitir({ tipo: 'fin', costo: redondo, turnos: msg.num_turns ?? turnos });
        }
      }
    }
  } catch (e) {
    emitir({ tipo: 'error', mensaje: e.message, costo: Math.round(costo * 10000) / 10000 });
    throw e;
  }

  return { costo, turnos };
}

// ── Presentación de lo que hace el agente ─────────────────────

function resumirEntrada(entrada) {
  if (!entrada || typeof entrada !== 'object') return '';
  // Lo que de verdad interesa ver: qué archivo o qué comando.
  for (const k of ['command', 'file_path', 'pattern', 'path']) {
    if (typeof entrada[k] === 'string') return recortar(entrada[k], 140);
  }
  return recortar(JSON.stringify(entrada), 140);
}

/** El contenido de un tool_result llega como texto o como lista de bloques */
function textoDe(bloque) {
  const c = bloque?.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((b) => b?.text || '').join('');
  return '';
}

function recortar(t, n = 600) {
  const s = String(t || '');
  return s.length > n ? s.slice(0, n) + '\n… (recortado)' : s;
}
