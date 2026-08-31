// ════════════════════════════════════════════════════════════
//  PROMPTS MAESTROS, COMPUESTOS
//
//  05-prompts-maestros/ ya tiene los cuatro prompts escritos. El problema
//  no era que faltaran: era que cada vez había que abrir el archivo,
//  buscar dónde empieza "INSTRUCCIONES (copiar desde aquí)", copiar,
//  pegar, y volver a pegar la ficha del cliente aparte.
//
//  Esto los lee de los archivos REALES (no copias que se desincronizan),
//  recorta la parte que se copia, y le incrusta la ficha del proyecto.
//  Sale un bloque listo para pegar.
// ════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { escribirYaml, leerYaml } from './yaml.js';

export const CATALOGO = [
  { id: 'arranque', archivo: 'prompt-de-arranque.md',
    nombre: 'Arranque',
    para: 'Ensamblar el proyecto desde cero, con checklist de entrega.',
    necesitaFicha: true, necesitaBase: true },
  { id: 'base', archivo: 'prompt-por-base.md',
    nombre: 'Detalle de la base',
    para: 'Las reglas finas de esa base: qué no tocar, qué confirmar.',
    necesitaFicha: false, necesitaBase: true, porBase: true },
  { id: 'revision', archivo: 'prompt-de-revision.md',
    nombre: 'Revisión',
    para: 'Auditar un proyecto ya construido antes de entregarlo.',
    necesitaFicha: false, necesitaBase: false },
  { id: 'contenido', archivo: 'prompt-de-contenido.md',
    nombre: 'Contenido',
    para: 'Redactar copy en el tono de la ficha, siempre como borrador.',
    necesitaFicha: true, necesitaBase: false },
];

/**
 * Los prompts marcan dónde empieza lo copiable con
 * "## INSTRUCCIONES (copiar desde aquí)". Todo lo anterior es explicación
 * para el humano y no debe ir al prompt.
 */
export function recortarInstrucciones(texto) {
  const i = texto.search(/^##\s*INSTRUCCIONES.*$/mi);
  if (i === -1) return texto.trim();
  const desde = texto.indexOf('\n', i);
  return texto.slice(desde + 1).replace(/^\s*---\s*$/m, '').trim();
}

/** prompt-por-base.md son bloques `## <base>`. Saca solo el que toca. */
export function bloqueDeBase(texto, base) {
  const re = new RegExp('^##\\s+' + base.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*$', 'mi');
  const m = texto.match(re);
  if (!m) return null;
  const inicio = texto.indexOf(m[0]);
  const resto = texto.slice(inicio + m[0].length);
  const sig = resto.search(/^##\s+/m);
  return (m[0] + (sig === -1 ? resto : resto.slice(0, sig))).trim();
}

export function listarBasesDelPrompt(texto) {
  return [...texto.matchAll(/^##\s+([a-z0-9-]+)\s*$/gmi)].map((m) => m[1]);
}

/**
 * Devuelve el prompt listo para pegar.
 * @param {object} o
 *   dirPrompts  ruta a 05-prompts-maestros/
 *   id          cuál del CATALOGO
 *   ficha       objeto de la ficha de contexto (opcional)
 *   base        slug de la base (opcional)
 *   proyecto    ruta relativa del proyecto, para el de revisión
 */
export function componer({ dirPrompts, id, ficha, base, proyecto }) {
  const def = CATALOGO.find((c) => c.id === id);
  if (!def) return { ok: false, error: 'Prompt desconocido: ' + id };

  const ruta = join(dirPrompts, def.archivo);
  if (!existsSync(ruta)) {
    return { ok: false, error: 'No encuentro ' + def.archivo + ' en 05-prompts-maestros/' };
  }
  const crudo = readFileSync(ruta, 'utf8');

  let cuerpo;
  if (def.porBase) {
    if (!base) return { ok: false, error: 'Este prompt necesita saber qué base.' };
    cuerpo = bloqueDeBase(crudo, base);
    if (!cuerpo) {
      return { ok: false, error: 'prompt-por-base.md no tiene un bloque para "' + base + '". '
        + 'Bloques disponibles: ' + listarBasesDelPrompt(crudo).join(', ') };
    }
  } else {
    cuerpo = recortarInstrucciones(crudo);
  }

  const partes = [cuerpo];
  const avisos = [];

  if (def.necesitaFicha) {
    if (ficha && Object.keys(ficha).length) {
      partes.push('', '---', '', '## FICHA DE CONTEXTO DE ESTE PROYECTO', '',
        '```yaml', escribirYaml(ficha).trimEnd(), '```');
    } else {
      avisos.push('Este prompt necesita una ficha. Elige un proyecto arriba, '
        + 'o el prompt saldrá incompleto y el asistente tendrá que pedírtela.');
    }
  }

  if (def.necesitaBase && base && !def.porBase) {
    partes.push('', 'La base a usar es `' + base + '`. Sus reglas específicas están en '
      + '`05-prompts-maestros/prompt-por-base.md`, bloque `## ' + base + '`.');
  }

  if (id === 'revision' && proyecto) {
    partes.push('', 'El proyecto a auditar es `' + proyecto + '`.');
  }

  // Lo que el validador gratis ya cubre no tiene sentido pedírselo a un modelo.
  if (id === 'revision') {
    partes.push('',
      'Nota: contraste WCAG, `innerHTML` sin escapar, tokens declarados sin usar,',
      'RLS faltante, `alt` y foco por teclado ya los revisa un validador',
      'determinista (`herramientas/validar.js`). No repitas esos hallazgos:',
      'concéntrate en lo que una regla no puede ver.');
  }

  return { ok: true, texto: partes.join('\n'), avisos, nombre: def.nombre };
}

/** Lee la ficha de un proyecto de cliente ya generado */
export function fichaDeProyecto(dirClientes, slug) {
  const ruta = join(dirClientes, slug, 'contexto.yml');
  if (!existsSync(ruta)) return null;
  try { return leerYaml(readFileSync(ruta, 'utf8')); }
  catch { return null; }
}
