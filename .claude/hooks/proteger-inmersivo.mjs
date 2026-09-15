#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  HOOK · no editar a mano lo que se copia de un componente.
//
//  Las cuatro bases de venta llevan la pieza INMERSIVO (franja, sección
//  partida, texturas, portada a sangre) copiada entre marcadores desde
//  `03-componentes-ui/inmersivo.{css,js}`. `herramientas/llevar-inmersivo.js`
//  reemplaza lo de en medio cada vez que corre.
//
//  O sea: un arreglo hecho a mano dentro de esa zona SE PIERDE en la próxima
//  corrida, sin aviso. Es la trampa exacta que la herramienta existe para
//  evitar, y estaba escrita solo en una skill.
//
//  Esto bloquea Edit / Write / MultiEdit que toquen esa zona y dice dónde va
//  el arreglo. La herramienta en sí escribe con Node, no con Edit, así que
//  no la frena.
//
//  Entrada: el JSON de Claude Code por stdin.
// ════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'node:fs';
import { resolve, join, dirname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const lf = (t) => String(t ?? '').replace(/\r\n/g, '\n');

/** Las zonas [inicio, fin) entre marcadores INMERSIVO de un texto. */
export function zonasInmersivo(texto, abre, cierra) {
  const zonas = [];
  for (const marca of abre) {
    let desde = 0;
    for (;;) {
      const i = texto.indexOf(marca, desde);
      if (i === -1) break;
      const j = texto.indexOf(cierra, i + marca.length);
      if (j === -1) { zonas.push([i, texto.length]); break; }
      zonas.push([i, j + cierra.length]);
      desde = j + cierra.length;
    }
  }
  return zonas;
}

const solapa = (a, b, zonas) => zonas.some(([z1, z2]) => a < z2 && b > z1);

/** ¿Esta operación toca la zona protegida? Devuelve el motivo o null. */
export function tocaZona({ tool_name, tool_input }, actual, abre, cierra) {
  const zonas = zonasInmersivo(actual, abre, cierra);
  if (!zonas.length) return null;

  if (tool_name === 'Write') {
    const nuevo = lf(tool_input?.content);
    const texto = (t) => zonasInmersivo(t, abre, cierra).map(([a, b]) => t.slice(a, b)).join('\n');
    return texto(nuevo) === texto(actual) ? null : 'reescribe la zona INMERSIVO';
  }

  const ediciones = tool_name === 'MultiEdit'
    ? (tool_input?.edits || [])
    : [tool_input || {}];

  for (const e of ediciones) {
    const viejo = lf(e.old_string);
    if (!viejo) continue;
    let desde = 0;
    for (;;) {
      const i = actual.indexOf(viejo, desde);
      if (i === -1) break;
      if (solapa(i, i + viejo.length, zonas)) return 'edita dentro de la zona INMERSIVO';
      desde = i + 1;
    }
  }
  return null;
}

async function leerStdin() {
  let texto = '';
  for await (const trozo of process.stdin) texto += trozo;
  return texto;
}

async function principal() {
  let datos;
  try { datos = JSON.parse(await leerStdin()); } catch { return; }

  const archivo = datos?.tool_input?.file_path;
  if (!archivo) return;
  const abs = resolve(archivo);
  if (abs.slice(0, RAIZ.length).toLowerCase() !== RAIZ.toLowerCase()) return;
  const rel = abs.slice(RAIZ.length + 1).split(sep).join('/');

  const herramienta = await import(
    pathToFileURL(join(RAIZ, 'herramientas', 'llevar-inmersivo.js')).href);
  const m = rel.match(/^Sistema-de-Produccion\/Sistema-de-Produccion\/02-bases\/([^/]+)\/demo\.html$/);
  if (!m || !herramienta.BASES_DE_VENTA.includes(m[1])) return;
  if (!existsSync(abs)) return;

  const actual = lf(readFileSync(abs, 'utf8'));
  const motivo = tocaZona(datos, actual,
    [herramienta.MARCA_CSS_ABRE, herramienta.MARCA_JS_ABRE],
    herramienta.MARCA_CSS_CIERRA);
  if (!motivo) return;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'PreToolUse',
      permissionDecision: 'deny',
      permissionDecisionReason:
        'Esta operación ' + motivo + ' de `' + m[1] + '/demo.html`. Lo que hay '
        + 'entre esos marcadores es una COPIA de `03-componentes-ui/inmersivo.css` '
        + 'y `inmersivo.js`: `llevar-inmersivo.js` lo reemplaza cada vez que corre, '
        + 'así que un arreglo hecho aquí se pierde en la próxima corrida. Haz el '
        + 'cambio en el componente y luego corre `node herramientas/llevar-inmersivo.js`.',
    },
  }));
}

if (process.argv[1] && process.argv[1].endsWith('proteger-inmersivo.mjs')) {
  principal().catch(() => {}).finally(() => process.exit(0));
}
