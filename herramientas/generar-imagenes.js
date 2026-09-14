#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  GENERAR IMÁGENES — marcadores de vista previa y texturas.
//
//  Uso:
//    node generar-imagenes.js --ficha <ruta> --estimar
//    node generar-imagenes.js --ficha <ruta> --que portada
//    node generar-imagenes.js --ficha <ruta> --que galeria --cuantas 6
//    node generar-imagenes.js --ficha <ruta> --que todo
//    node generar-imagenes.js --ficha <ruta> --que portada --modelo pro
//
//  Las imágenes caen en la carpeta `vista-previa/` del proyecto, con un
//  `.txt` al lado que guarda el prompt exacto.
//
//  NUNCA CORRE SOLO. Estima el costo, lo muestra y espera confirmación,
//  igual que el auditor y el agente. Es regla del sistema: nada que gaste
//  dinero arranca sin que lo pidas.
// ════════════════════════════════════════════════════════════

import { readFileSync, existsSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';
import { leerYaml } from './lib/yaml.js';
import { estadoImagenes, generarImagen, estimarCosto, promptDesdeFicha,
         MODELOS_IMAGEN, MODELO_IMAGEN, TIPOS, TOPE_POR_TANDA } from './lib/imagenes.js';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
// El .env, igual que panel.js y auditor-ia.js.
try { process.loadEnvFile(join(AQUI, '.env')); } catch { /* no hay .env, normal */ }

const C = { verde: '\x1b[32m', rojo: '\x1b[31m', gris: '\x1b[90m',
            neg: '\x1b[1m', amarillo: '\x1b[33m', off: '\x1b[0m' };

function args(lista) {
  const o = {};
  for (let i = 0; i < lista.length; i++) {
    if (!lista[i].startsWith('--')) continue;
    const k = lista[i].slice(2), sig = lista[i + 1];
    o[k] = (!sig || sig.startsWith('--')) ? true : (i++, sig);
  }
  return o;
}

/** Qué imágenes pide cada tanda. `todo` es el juego completo de una landing. */
function planDe(que, cuantas, ficha) {
  const galeria = (n) => Array.from({ length: n }, (_, i) => ({
    tipo: 'galeria', nombre: 'obra-' + (i + 1),
    // El sujeto sale de los sectores que el cliente declaró: no se inventa
    // un tipo de obra que no hace.
    sujeto: (ficha.pagina?.sectores || [])
      .map((s) => (typeof s === 'string' ? s : s?.nombre))
      .filter(Boolean)[i] || '',
  }));

  if (que === 'todo') {
    return [
      { tipo: 'portada', nombre: 'portada' },
      { tipo: 'franja',  nombre: 'franja' },
      { tipo: 'sobre',   nombre: 'sobre' },
      ...galeria(Math.min(Number(cuantas) || 6, TOPE_POR_TANDA - 3)),
    ];
  }
  if (que === 'galeria') return galeria(Math.min(Number(cuantas) || 6, TOPE_POR_TANDA));
  if (TIPOS[que]) return [{ tipo: que, nombre: que }];
  return null;
}

async function principal() {
  const a = args(process.argv.slice(2));

  if (!a.ficha || typeof a.ficha !== 'string') {
    console.error('\n' + C.rojo + '  Falta --ficha' + C.off
      + '\n  node generar-imagenes.js --ficha <ruta> --que portada|galeria|todo'
      + '\n  Tipos: ' + Object.keys(TIPOS).join(', ') + ', todo\n');
    process.exit(1);
  }
  const rutaFicha = resolve(a.ficha);
  if (!existsSync(rutaFicha)) {
    console.error('\n' + C.rojo + '  No existe ' + rutaFicha + C.off + '\n');
    process.exit(1);
  }

  const ficha = leerYaml(readFileSync(rutaFicha, 'utf8'));
  const carpeta = a.carpeta ? resolve(a.carpeta)
                            : join(dirname(rutaFicha), 'vista-previa');
  const modelo = MODELOS_IMAGEN[a.modelo] ? a.modelo : MODELO_IMAGEN;
  const plan = planDe(String(a.que || 'portada'), a.cuantas, ficha);

  if (!plan) {
    console.error('\n' + C.rojo + '  No conozco "' + a.que + '".' + C.off
      + '\n  Tipos: ' + Object.keys(TIPOS).join(', ') + ', todo\n');
    process.exit(1);
  }

  const costo = estimarCosto(plan.length, modelo);
  console.log('\n' + C.neg + 'Imágenes provisionales' + C.off);
  console.log('  cliente:  ' + (ficha.cliente || '(sin nombre)'));
  console.log('  modelo:   ' + costo.modelo.etiqueta);
  console.log('  imágenes: ' + plan.length + '  ' + C.gris
    + plan.map((p) => p.nombre).join(', ') + C.off);
  console.log('  destino:  ' + C.gris + carpeta + C.off);
  console.log('  ' + C.neg + 'costo estimado: $' + costo.usd.toFixed(4) + ' USD' + C.off
    + C.gris + '  (~$' + Math.round(costo.usd * 4000).toLocaleString('es-CO') + ' COP)' + C.off);

  console.log('\n' + C.amarillo + '  Son PROVISIONALES: no se publican.' + C.off);
  console.log(C.gris + '  El validador da ERROR si una llega al entregable. Se reemplazan'
    + '\n  por el material real del cliente antes de entregar.' + C.off);

  // Una muestra del prompt, para que se vea qué se va a pedir antes de pagar.
  const muestra = promptDesdeFicha(ficha, plan[0].tipo, plan[0].sujeto);
  console.log('\n' + C.gris + '  prompt de "' + plan[0].nombre + '":' + C.off);
  console.log(C.gris + '  ' + muestra.texto.slice(0, 200) + '…' + C.off);

  if (a.estimar) { console.log('\n  ' + C.gris + '(solo estimación, no se gastó nada)' + C.off + '\n'); return; }

  const estado = await estadoImagenes();
  if (!estado.listo) {
    console.error('\n' + C.rojo + '✖ Falta ' + estado.faltan.join(' y ') + C.off + '\n');
    process.exit(1);
  }

  if (!a.si) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const r = (await rl.question('\n  ¿Generar? (s/N) ')).trim().toLowerCase();
    rl.close();
    if (r !== 's' && r !== 'si' && r !== 'sí') {
      console.log('\n  ' + C.gris + 'Cancelado. No se gastó nada.' + C.off + '\n');
      return;
    }
  }

  console.log('');
  let bien = 0;
  for (const p of plan) {
    try {
      const r = await generarImagen({ ficha, carpeta, modelo, ...p });
      console.log('  ' + C.verde + '✔' + C.off + ' ' + p.nombre
        + C.gris + '  → ' + r.archivo.split(/[\\/]/).pop() + C.off);
      bien++;
    } catch (e) {
      console.log('  ' + C.rojo + '✖' + C.off + ' ' + p.nombre + C.gris + '  ' + e.message + C.off);
    }
  }

  console.log('\n  ' + bien + ' de ' + plan.length + ' generadas.');
  console.log(C.gris + '  Cada una deja un .txt con el prompt exacto, para poder repetirla.' + C.off);
  console.log(C.gris + '  Siguiente: apunta la ficha de vista previa a estos archivos y captura.' + C.off + '\n');
}

principal().catch((e) => {
  console.error('\n' + C.rojo + '✖ ' + e.message + C.off + '\n');
  process.exit(1);
});
