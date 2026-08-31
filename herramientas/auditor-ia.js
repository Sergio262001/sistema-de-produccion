#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  AUDITOR IA — modo CON COSTO. Opcional, siempre bajo tu control.
//
//  El validador determinista (validar.js) ya cubre lo que se puede
//  verificar con reglas: XSS, contraste, RLS, tokens muertos, alt.
//  Esto cubre SOLO lo que necesita criterio: jerarquía visual,
//  claridad del copy, coherencia de la experiencia.
//
//  Reglas de economía que aplica siempre:
//   · Modelo por defecto: Haiku 4.5, el más barato de la familia.
//   · Prompt caching en el system prompt (no cambia entre archivos).
//   · Estima el costo ANTES de gastar y te deja cancelar.
//   · Nunca corre solo: hay que pedirlo explícitamente.
//
//  Uso:
//    node auditor-ia.js <ruta> --estimar        → solo dice cuánto costaría
//    node auditor-ia.js <ruta>                  → audita (pide confirmación)
//    node auditor-ia.js <ruta> --si             → audita sin preguntar
//    node auditor-ia.js <ruta> --modelo opus    → sube de modelo
// ════════════════════════════════════════════════════════════

import { readFileSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createInterface } from 'node:readline/promises';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = resolve(AQUI, '..');

// ── Catálogo de modelos y precios (USD por millón de tokens) ──
export const MODELOS = {
  haiku:  { id: 'claude-haiku-4-5', entrada: 1.00, salida: 5.00,  etiqueta: 'Haiku 4.5 · el más barato' },
  sonnet: { id: 'claude-sonnet-5',  entrada: 2.00, salida: 10.00, etiqueta: 'Sonnet 5 · equilibrado' },
  opus:   { id: 'claude-opus-5',    entrada: 5.00, salida: 25.00, etiqueta: 'Opus 5 · el más capaz' },
};
export const MODELO_POR_DEFECTO = 'haiku';

const SYSTEM = `Eres el auditor de UX/UI de un estudio de diseño web colombiano.

Revisas entregables construidos en HTML/CSS/JS vanilla. El estudio ya corre un
validador determinista que cubre contraste WCAG, alt text, XSS por innerHTML,
tokens CSS muertos, foco por teclado y RLS de Supabase.

NO repitas nada de eso. Tu trabajo es exclusivamente lo que una regla no puede ver:

1. Jerarquía visual — ¿lo primero que ve el ojo es lo más importante?
2. Claridad del texto — ¿suena a plantilla genérica o a este negocio?
3. Coherencia — ¿los patrones se repiten o cada sección inventa el suyo?
4. Fricción — ¿qué va a confundir a alguien que entra por primera vez?
5. Confianza — ¿esto se ve como algo por lo que alguien pagaría?

Formato de salida, obligatorio: una lista, máximo 6 hallazgos, ordenada por
importancia. Cada uno en UNA línea con esta forma exacta:

LINEA|SEVERIDAD|HALLAZGO|QUÉ HACER

donde SEVERIDAD es alto, medio o bajo. Sin introducción, sin cierre, sin
markdown. Si el archivo está bien, devuelve una sola línea: "0|bajo|Sin
hallazgos de criterio|Nada que corregir".

Escribe en español, directo, sin adjetivos de relleno.`;

// ── Recolección de archivos ───────────────────────────────────
const IGNORAR = new Set(['node_modules', '.git', 'dist', 'build', 'versiones', 'comparacion']);

function recolectar(dir, acc = []) {
  let entradas;
  try { entradas = readdirSync(dir); } catch { return acc; }
  for (const n of entradas) {
    if (IGNORAR.has(n)) continue;
    const r = join(dir, n);
    let st; try { st = statSync(r); } catch { continue; }
    if (st.isDirectory()) recolectar(r, acc);
    else if (extname(n) === '.html') acc.push(r);
  }
  return acc;
}

/** Aproximación de tokens: ~4 caracteres por token en HTML/código */
export function estimarTokens(texto) {
  return Math.ceil(texto.length / 4);
}

export function estimarCosto(archivos, modeloClave = MODELO_POR_DEFECTO) {
  const m = MODELOS[modeloClave] || MODELOS[MODELO_POR_DEFECTO];
  const sistemaTokens = estimarTokens(SYSTEM);
  let entrada = 0;
  const detalle = [];

  for (const { ruta, texto } of archivos) {
    const t = estimarTokens(texto) + sistemaTokens;
    entrada += t;
    detalle.push({ ruta, tokens: t });
  }
  const salida = archivos.length * 400;         // ~6 hallazgos de una línea

  const usd = (entrada / 1e6) * m.entrada + (salida / 1e6) * m.salida;
  return {
    modelo: m.id,
    etiqueta: m.etiqueta,
    archivos: archivos.length,
    tokensEntrada: entrada,
    tokensSalida: salida,
    usd: Math.round(usd * 10000) / 10000,
    cop: Math.round(usd * 4000),                // referencia aproximada
    detalle,
  };
}

// ── Llamada a la API ──────────────────────────────────────────
async function cliente() {
  let Anthropic;
  try {
    ({ default: Anthropic } = await import('@anthropic-ai/sdk'));
  } catch {
    throw new Error(
      'Falta el SDK. Instálalo solo si vas a usar el modo con costo:\n' +
      '  cd herramientas && npm install @anthropic-ai/sdk'
    );
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      'Falta ANTHROPIC_API_KEY.\n' +
      '  Consíguela en console.anthropic.com y ponla en herramientas/.env'
    );
  }
  return new Anthropic();
}

export async function auditar(archivos, modeloClave = MODELO_POR_DEFECTO) {
  const api = await cliente();
  const m = MODELOS[modeloClave] || MODELOS[MODELO_POR_DEFECTO];
  const resultados = [];
  let costoReal = 0;

  for (const { ruta, texto } of archivos) {
    const respuesta = await api.messages.create({
      model: m.id,
      max_tokens: 1500,
      system: [{
        type: 'text',
        text: SYSTEM,
        // El system prompt es idéntico en cada archivo: cachearlo abarata
        // mucho una auditoría de varios archivos seguidos.
        cache_control: { type: 'ephemeral' },
      }],
      messages: [{
        role: 'user',
        content: 'Audita este entregable. Ruta: ' + ruta + '\n\n' + texto,
      }],
    });

    const u = respuesta.usage;
    costoReal += (u.input_tokens / 1e6) * m.entrada + (u.output_tokens / 1e6) * m.salida;

    const crudo = respuesta.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
    const hallazgos = crudo.split('\n')
      .map((l) => l.trim())
      .filter((l) => l.includes('|'))
      .map((l) => {
        const [linea, severidad, mensaje, accion] = l.split('|').map((x) => x.trim());
        return { linea: parseInt(linea, 10) || 0, severidad, mensaje, accion };
      })
      .filter((h) => h.mensaje);

    resultados.push({ ruta, hallazgos, uso: u });
  }

  return { resultados, costoReal: Math.round(costoReal * 10000) / 10000, modelo: m.id };
}

// ── CLI ───────────────────────────────────────────────────────
const C = { rojo: '\x1b[31m', amar: '\x1b[33m', verde: '\x1b[32m', gris: '\x1b[90m', neg: '\x1b[1m', off: '\x1b[0m' };

if (process.argv[1] && process.argv[1].endsWith('auditor-ia.js')) {
  const args = process.argv.slice(2);
  const objetivo = args.find((a) => !a.startsWith('--')) || RAIZ;
  const soloEstimar = args.includes('--estimar');
  const sinPreguntar = args.includes('--si');
  const iModelo = args.indexOf('--modelo');
  const modeloClave = iModelo !== -1 ? args[iModelo + 1] : MODELO_POR_DEFECTO;

  const abs = resolve(objetivo);
  if (!existsSync(abs)) {
    console.error(C.rojo + 'No existe: ' + objetivo + C.off);
    process.exit(1);
  }

  const rutas = statSync(abs).isDirectory() ? recolectar(abs) : [abs];
  const archivos = rutas.map((r) => ({
    ruta: relative(RAIZ, r).split(String.fromCharCode(92)).join('/'),
    texto: readFileSync(r, 'utf8'),
  }));

  if (!archivos.length) {
    console.log('No hay archivos .html que auditar en ' + objetivo);
    process.exit(0);
  }

  const est = estimarCosto(archivos, modeloClave);
  console.log('\n' + C.neg + 'Auditoría IA · modo con costo' + C.off);
  console.log('  modelo:   ' + est.etiqueta);
  console.log('  archivos: ' + est.archivos);
  console.log('  tokens:   ~' + est.tokensEntrada.toLocaleString() + ' entrada / ~' + est.tokensSalida.toLocaleString() + ' salida');
  console.log('  ' + C.neg + 'costo estimado: $' + est.usd.toFixed(4) + ' USD' + C.off + C.gris + '  (~$' + est.cop.toLocaleString() + ' COP)' + C.off + '\n');

  if (soloEstimar) process.exit(0);

  let seguir = sinPreguntar;
  if (!seguir) {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    const r = await rl.question('¿Ejecutar y gastar ese monto? (s/N) ');
    rl.close();
    seguir = /^s(i)?$/i.test(r.trim());
  }
  if (!seguir) {
    console.log(C.gris + '\nCancelado. No se gastó nada.' + C.off + '\n');
    process.exit(0);
  }

  try {
    const { resultados, costoReal } = await auditar(archivos, modeloClave);
    console.log('');
    for (const { ruta, hallazgos } of resultados) {
      console.log(C.neg + ruta + C.off);
      if (!hallazgos.length) { console.log('  ' + C.gris + 'sin respuesta legible' + C.off + '\n'); continue; }
      for (const h of hallazgos) {
        const col = h.severidad === 'alto' ? C.rojo : h.severidad === 'medio' ? C.amar : C.gris;
        console.log('  ' + col + '●' + C.off + ' ' + String(h.linea).padStart(4) + '  ' + h.mensaje);
        if (h.accion) console.log('         ' + C.gris + '↳ ' + h.accion + C.off);
      }
      console.log('');
    }
    console.log(C.verde + 'Costo real: $' + costoReal.toFixed(4) + ' USD' + C.off + '\n');
  } catch (e) {
    console.error('\n' + C.rojo + e.message + C.off + '\n');
    process.exit(1);
  }
}
