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

const INSTRUCCIONES = `Eres el asistente del panel de un estudio de diseño web colombiano.
Trabajas sobre un sistema de producción real, no sobre un ejemplo.

CÓMO ESTÁ ORGANIZADO
- \`Sistema-de-Produccion/Sistema-de-Produccion/02-bases/\` es LA FÁBRICA:
  9 bases técnicas reutilizables. Es de SOLO LECTURA para ti. Si algo hay
  que arreglar ahí, lo dices — no lo tocas.
- \`Proyectos-Clientes/<slug>/\` son los entregables. Ahí sí trabajas.
- Cada proyecto tiene su \`contexto.yml\` (la ficha) y su \`.env\` (secretos).

HERRAMIENTAS DEL ESTUDIO — úsalas, no las reimplementes
- \`node herramientas/validar.js <ruta>\` — control de calidad determinista:
  XSS, contraste WCAG, RLS faltante, tokens muertos, secretos, accesibilidad.
  Cuesta $0. Córrelo antes de opinar sobre calidad.
- \`node herramientas/crear-proyecto.js --cliente "X" --base <base>\` — genera
  un proyecto completo. No armes carpetas a mano.
- \`cd <proyecto> && npm test\` en herramientas/ corre 92 pruebas.

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

/** ¿Está el SDK instalado y hay clave? */
export async function estadoAgente() {
  const faltan = [];
  let sdk = false;
  try { await import('@anthropic-ai/claude-agent-sdk'); sdk = true; }
  catch { faltan.push('el paquete @anthropic-ai/claude-agent-sdk'); }
  if (!process.env.ANTHROPIC_API_KEY) faltan.push('la variable ANTHROPIC_API_KEY');
  return { listo: sdk && faltan.length === 0, faltan };
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
  { raiz, mensaje, modelo = MODELO_AGENTE, presupuesto = PRESUPUESTO_POR_DEFECTO, soloLectura = false },
  emitir,
) {
  const estado = await estadoAgente();
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

  const opciones = {
    model: m.id,
    cwd: clientes,                                   // donde SÍ puede trabajar
    additionalDirectories: [sistema, herramientas],  // lectura de la fábrica
    systemPrompt: { type: 'preset', preset: 'claude_code', append: INSTRUCCIONES },
    allowedTools: soloLectura
      ? ['Read', 'Glob', 'Grep', 'Bash']
      : ['Read', 'Glob', 'Grep', 'Bash', 'Write', 'Edit'],
    disallowedTools: prohibidos,
    permissionMode: 'bypassPermissions',   // el panel ya confirmó al lanzar
    maxTurns: 24,
    maxBudgetUsd: techo,
  };

  let costo = 0;
  let turnos = 0;

  emitir({ tipo: 'inicio', modelo: m.id, presupuesto: techo, soloLectura });

  try {
    for await (const msg of query({ prompt: mensaje, options: opciones })) {
      if (msg.type === 'text' && msg.text) {
        emitir({ tipo: 'texto', texto: msg.text });
      } else if (msg.type === 'tool_use') {
        turnos++;
        emitir({ tipo: 'herramienta', nombre: msg.name, entrada: resumirEntrada(msg.input) });
      } else if (msg.type === 'tool_result') {
        emitir({ tipo: 'resultado', texto: recortar(textoDe(msg)) });
      } else if (msg.type === 'usage') {
        if (typeof msg.total_cost_usd === 'number') costo = msg.total_cost_usd;
        emitir({ tipo: 'gasto', costo: Math.round(costo * 10000) / 10000 });
      }
    }
    emitir({ tipo: 'fin', costo: Math.round(costo * 10000) / 10000, turnos });
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

function textoDe(msg) {
  const c = msg.content;
  if (typeof c === 'string') return c;
  if (Array.isArray(c)) return c.map((b) => b?.text || '').join('');
  return '';
}

function recortar(t, n = 600) {
  const s = String(t || '');
  return s.length > n ? s.slice(0, n) + '\n… (recortado)' : s;
}
