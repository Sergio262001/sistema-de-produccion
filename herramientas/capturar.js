#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  CAPTURAR — ver la página, no solo compilarla.
//
//  Uso:
//    node capturar.js <ruta.html|URL>              una captura
//    node capturar.js <ruta.html> --dirs           una por dirección de arte
//    node capturar.js <URL> --ancho 1440           ancho de ventana
//    node capturar.js <ruta> --movil               375 px, como un teléfono
//    node capturar.js --bases                      las 5 bases con dirección
//    node capturar.js --referencias                el tablero de referencias
//
//  Las capturas van a `capturas/` (ignorada por git) salvo que pases --salida.
// ════════════════════════════════════════════════════════════

import { readFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { capturar, capturarDirecciones, nombreDe, encontrarNavegador } from './lib/captura.js';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = resolve(AQUI, '..');
const BASES = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion', '02-bases');
const C = { verde: '\x1b[32m', rojo: '\x1b[31m', gris: '\x1b[90m', neg: '\x1b[1m', off: '\x1b[0m' };

/** Las bases que tienen direcciones de arte. Comparar sirve solo en estas. */
const CON_DIRECCION = ['ecommerce-completo', 'menu-con-panel-admin',
                       'carrito-reutilizable', 'marketplace', 'landing-modular'];

/**
 * EL TABLERO DE REFERENCIAS.
 *
 * Las páginas de 01-documentos/7-referencias-de-diseno.md, para poder MIRARLAS
 * en vez de leer descripciones de ellas. Se capturan una vez y quedan en
 * disco: no hace falta volver a salir a internet para consultarlas.
 */
const REFERENCIAS = [
  // Landing y servicios — el método, no la piel
  { url: 'https://stripe.com',            nota: 'landing · un acento, contraste alto' },
  { url: 'https://linear.app',            nota: 'landing · monocromo + morado' },
  { url: 'https://vercel.com',            nota: 'landing · blanco sobre negro' },
  // Tienda — la foto vende, la página se quita del medio
  { url: 'https://www.apple.com',         nota: 'tienda · negro/blanco/gris, foto manda' },
  { url: 'https://www.allbirds.com',      nota: 'tienda · paleta como argumento' },
  { url: 'https://www.ascolour.com',       nota: 'tienda · neutros, tipo refinada' },
  // Menú — los dos mundos de la categoría
  { url: 'https://noma.dk',               nota: 'menu · restraint editorial' },
  { url: 'https://www.atomixnyc.com',     nota: 'menu · paleta contenida, foto brilla' },
  { url: 'https://www.sweetgreen.com',    nota: 'menu · fast-casual con tipo propia' },
  { url: 'https://www.nandos.co.uk',      nota: 'menu · color vivo, CTA directa' },
];

function args(lista) {
  const o = { _: [] };
  for (let i = 0; i < lista.length; i++) {
    const a = lista[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      const siguiente = lista[i + 1];
      if (siguiente && !siguiente.startsWith('--')) { o[k] = siguiente; i++; }
      else o[k] = true;
    } else o._.push(a);
  }
  return o;
}

function anunciar(r, etiqueta) {
  if (r.ok) {
    const kb = Math.round(r.bytes / 1024);
    console.log('  ' + C.verde + '✔' + C.off + ' ' + etiqueta
      + C.gris + '  ' + kb + ' KB' + C.off);
  } else {
    console.log('  ' + C.rojo + '✖' + C.off + ' ' + etiqueta + C.gris + '  ' + r.error + C.off);
  }
}

async function principal() {
  const a = args(process.argv.slice(2));

  const navegador = encontrarNavegador();
  if (!navegador) {
    console.error('\n' + C.rojo + '✖ No encontré Chrome ni Edge.' + C.off
      + '\n  Instala uno, o pon la ruta en la variable CHROME_BIN.\n');
    process.exit(1);
  }

  const ancho = a.movil ? 375 : Number(a.ancho) || 1280;
  const alto = Number(a.alto) || (a.movil ? 1200 : 1400);
  const carpeta = a.carpeta ? resolve(a.carpeta) : join(RAIZ, 'capturas');
  mkdirSync(carpeta, { recursive: true });

  console.log('\n' + C.neg + 'Capturas' + C.off + C.gris
    + '  ' + navegador.split(/[\\/]/).pop() + '  ·  ' + ancho + '×' + alto + C.off);
  console.log(C.gris + '  → ' + carpeta + C.off + '\n');

  // ── El tablero de referencias ──
  if (a.referencias) {
    const destino = join(carpeta, 'referencias');
    mkdirSync(destino, { recursive: true });
    let bien = 0;
    for (const r of REFERENCIAS) {
      const salida = join(destino, nombreDe(r.url));
      const res = await capturar({ entrada: r.url, salida, ancho: 1440, alto: 1100,
                                   espera: Number(a.espera) || 14000 });
      anunciar(res, r.nota.padEnd(42) + C.gris + r.url + C.off);
      if (res.ok) bien++;
    }
    console.log('\n  ' + bien + ' de ' + REFERENCIAS.length + ' referencias capturadas.');
    console.log(C.gris + '  Las que fallan suelen bloquear headless; ábrelas a mano.' + C.off + '\n');
    return;
  }

  // ── Las bases, una captura por dirección de arte ──
  if (a.bases) {
    for (const base of CON_DIRECCION) {
      const demo = join(BASES, base, 'demo.html');
      if (!existsSync(demo)) { console.log('  ' + C.gris + base + ': sin demo' + C.off); continue; }
      const r = await capturarDirecciones({ entrada: demo, carpeta, ancho, alto: 1600 });
      if (!r.ok && r.error) { anunciar(r, base); continue; }
      for (const h of r.hechas) anunciar(h, (base + ' · ' + h.direccion).padEnd(42));
    }
    console.log('');
    return;
  }

  // ── Una sola cosa ──
  const objetivo = a._[0];
  if (!objetivo) {
    console.error(C.rojo + '  Falta qué capturar.' + C.off
      + '\n  node capturar.js <ruta.html|URL> [--dirs] [--movil] [--ancho N]'
      + '\n  node capturar.js --bases          las 5 bases por dirección'
      + '\n  node capturar.js --referencias    el tablero de referencias\n');
    process.exit(1);
  }

  if (a.dirs) {
    const r = await capturarDirecciones({ entrada: objetivo, carpeta, ancho, alto: 1600 });
    if (!r.ok && r.error) { anunciar(r, objetivo); process.exit(1); }
    for (const h of r.hechas) anunciar(h, h.direccion);
    console.log('');
    return;
  }

  const salida = a.salida ? resolve(a.salida) : join(carpeta, nombreDe(objetivo));
  const r = await capturar({ entrada: objetivo, salida, ancho, alto,
                             espera: Number(a.espera) || undefined });
  anunciar(r, salida.replace(RAIZ, '.'));
  console.log('');
  if (!r.ok) process.exit(1);
}

principal().catch((e) => {
  console.error('\n' + C.rojo + '✖ ' + e.message + C.off + '\n');
  process.exit(1);
});
