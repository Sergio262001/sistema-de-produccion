#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  VALIDADOR — modo GRATIS del control de calidad.
//  Cero IA, cero red, cero costo. Corre en segundos.
//
//  Uso:
//    node validar.js                    → valida todo el sistema
//    node validar.js <ruta>             → valida una carpeta o archivo
//    node validar.js --json             → salida JSON (la usa el panel)
//    node validar.js --solo-errores     → omite los avisos
// ════════════════════════════════════════════════════════════

import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { REGLAS } from './lib/reglas.js';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = resolve(AQUI, '..');
const BARRA = String.fromCharCode(92);   // separador de Windows, sin escapes

const IGNORAR = new Set(['node_modules', '.git', 'dist', 'build', '.next', 'versiones', 'comparacion']);
const EXTENSIONES = new Set(['.html', '.js', '.css', '.sql', '.yml']);

function recorrer(dir, acc = []) {
  let entradas;
  try { entradas = readdirSync(dir); } catch { return acc; }
  for (const nombre of entradas) {
    if (IGNORAR.has(nombre)) continue;
    const ruta = join(dir, nombre);
    let st;
    try { st = statSync(ruta); } catch { continue; }
    if (st.isDirectory()) recorrer(ruta, acc);
    else if (EXTENSIONES.has(extname(nombre))) acc.push(ruta);
  }
  return acc;
}

export function validar(objetivo = RAIZ) {
  const abs = resolve(objetivo);
  if (!existsSync(abs)) return { error: `No existe: ${objetivo}`, hallazgos: [] };

  const archivos = statSync(abs).isDirectory() ? recorrer(abs) : [abs];
  const hallazgos = [];

  for (const ruta of archivos) {
    let texto;
    try { texto = readFileSync(ruta, 'utf8'); } catch { continue; }
    if (texto.length > 2_000_000) continue;           // salta bundles gigantes

    const rel = relative(RAIZ, ruta).split(BARRA).join('/');
    const lineas = texto.split(/\r?\n/);
    const ext = extname(ruta);

    for (const regla of REGLAS) {
      if (!regla.extensiones.includes(ext)) continue;
      try {
        hallazgos.push(...regla.fn({ ruta: rel, texto, lineas }));
      } catch (e) {
        // una regla rota nunca debe tumbar la validación entera
        hallazgos.push({
          ruta: rel, linea: 1, severidad: 'aviso', regla: 'interno',
          mensaje: `La regla "${regla.id}" falló: ${e.message}`, pista: '',
        });
      }
    }
  }

  return { archivos: archivos.length, hallazgos };
}

// ── Presentación ──────────────────────────────────────────────
const C = {
  rojo: '\x1b[31m', amar: '\x1b[33m', verde: '\x1b[32m',
  gris: '\x1b[90m', neg: '\x1b[1m', off: '\x1b[0m',
};

function imprimir({ archivos, hallazgos }, soloErrores) {
  const lista = soloErrores ? hallazgos.filter((h) => h.severidad === 'error') : hallazgos;
  const errores = hallazgos.filter((h) => h.severidad === 'error').length;
  const avisos  = hallazgos.filter((h) => h.severidad === 'aviso').length;

  console.log(`\n${C.neg}Validación · modo gratis${C.off} ${C.gris}(${archivos} archivos, 0 tokens, $0)${C.off}\n`);

  if (!lista.length) {
    console.log(`${C.verde}✔ Sin hallazgos. Listo para entregar.${C.off}\n`);
    return 0;
  }

  const porArchivo = new Map();
  for (const h of lista) {
    if (!porArchivo.has(h.ruta)) porArchivo.set(h.ruta, []);
    porArchivo.get(h.ruta).push(h);
  }

  for (const [ruta, hs] of [...porArchivo].sort()) {
    console.log(`${C.neg}${ruta}${C.off}`);
    for (const h of hs.sort((a, b) => a.linea - b.linea)) {
      const icono = h.severidad === 'error' ? `${C.rojo}✖` : `${C.amar}⚠`;
      console.log(`  ${icono} ${String(h.linea).padStart(4)}${C.off}  ${h.mensaje}  ${C.gris}[${h.regla}]${C.off}`);
      if (h.pista) console.log(`         ${C.gris}↳ ${h.pista}${C.off}`);
    }
    console.log('');
  }

  console.log(`${C.rojo}${errores} error(es)${C.off} · ${C.amar}${avisos} aviso(s)${C.off}\n`);
  return errores > 0 ? 1 : 0;
}

// ── Entrada ───────────────────────────────────────────────────
const args = process.argv.slice(2);
const esJson = args.includes('--json');
const soloErrores = args.includes('--solo-errores');
const objetivo = args.find((a) => !a.startsWith('--')) || RAIZ;

if (process.argv[1] && process.argv[1].endsWith('validar.js')) {
  const resultado = validar(objetivo);
  if (esJson) {
    console.log(JSON.stringify(resultado, null, 2));
    process.exit(0);
  }
  process.exit(imprimir(resultado, soloErrores));
}
