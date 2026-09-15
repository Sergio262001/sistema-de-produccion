#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  HOOK · después de editar, validar.
//
//  "Corre el validador antes de decir que está listo" era una regla escrita
//  en tres skills, y dependía de que alguien se acordara. Esto la hace
//  automática: cada vez que Claude edita un `demo.html` de una base o un
//  archivo de un proyecto de cliente, el validador corre sobre esa carpeta.
//
//  Si hay ERRORES, se le devuelven a Claude para que los arregle antes de
//  seguir. Los avisos no: son para revisar, y devolverlos en cada edición
//  sería ruido — y el ruido es lo que hace que se deje de mirar.
//
//  Nunca rompe la edición: si algo falla aquí, sale en silencio. Un hook
//  que tumba el trabajo por un fallo propio es peor que no tener hook.
//
//  Entrada: el JSON de Claude Code por stdin (tool_input.file_path).
// ════════════════════════════════════════════════════════════

import { resolve, join, dirname, sep, extname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const EXTENSIONES = new Set(['.html', '.js', '.css', '.sql', '.yml']);
const MAX_ERRORES = 10;

/** Qué carpeta validar según el archivo editado, o null si no toca. */
export function carpetaAValidar(archivo, raiz = RAIZ) {
  if (!archivo) return null;
  const abs = resolve(archivo);
  // En Windows la misma ruta llega como `c:\...` o `C:\...`.
  if (abs.slice(0, raiz.length).toLowerCase() !== raiz.toLowerCase()) return null;
  if (!EXTENSIONES.has(extname(abs).toLowerCase())) return null;

  const rel = abs.slice(raiz.length + 1).split(sep).join('/');

  const base = rel.match(/^(Sistema-de-Produccion\/Sistema-de-Produccion\/02-bases\/[^/]+)\/demo\.html$/);
  if (base) return base[1];

  const cliente = rel.match(/^(Proyectos-Clientes\/[^/]+)\//);
  if (cliente && !/\/(node_modules|dist)\//.test(rel)) return cliente[1];

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

  const archivo = datos?.tool_input?.file_path || datos?.tool_response?.filePath;
  const carpeta = carpetaAValidar(archivo);
  if (!carpeta) return;

  const { validar } = await import(pathToFileURL(join(RAIZ, 'herramientas', 'validar.js')).href);
  const r = validar(join(RAIZ, carpeta));
  const errores = (r.hallazgos || []).filter((h) => h.severidad === 'error');
  if (!errores.length) return;

  const lineas = errores.slice(0, MAX_ERRORES).map((h) =>
    '- ' + h.ruta + ':' + h.linea + ' [' + h.regla + '] ' + h.mensaje
    + (h.pista ? '\n  ↳ ' + h.pista : ''));
  if (errores.length > MAX_ERRORES) {
    lineas.push('- … y ' + (errores.length - MAX_ERRORES) + ' más. '
      + 'Corre `node herramientas/validar.js ' + carpeta + '` para verlos todos.');
  }

  process.stdout.write(JSON.stringify({
    decision: 'block',
    reason: 'El validador encontró ' + errores.length + ' error(es) en `'
      + carpeta + '` después de esta edición. Arréglalos antes de seguir:\n\n'
      + lineas.join('\n'),
  }));
}

if (process.argv[1] && process.argv[1].endsWith('validar-tras-editar.mjs')) {
  principal().catch(() => {}).finally(() => process.exit(0));
}
