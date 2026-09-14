// ════════════════════════════════════════════════════════════
//  IMÁGENES GENERADAS — y la barrera que impide publicarlas.
//
//  Este módulo genera marcadores para ENSEÑARLE al cliente cómo va a
//  quedar su página. No son su obra. La parte peligrosa no es generarlas:
//  es que una se cuele al sitio publicado.
//
//  Una foto generada de un edificio que el cliente no construyó, puesta en
//  su galería de proyectos, es portafolio falso — y el que queda expuesto
//  delante de SU cliente es él, no el estudio.
//
//  Por eso la mitad de estas pruebas son sobre la regla del validador, no
//  sobre la generación. La garantía no puede ser que alguien se acuerde.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { TIPOS, MODELOS_IMAGEN, MODELO_IMAGEN, TOPE_POR_TANDA,
         promptDesdeFicha, estimarCosto, esProvisional, claveDe,
         estadoImagenes } from '../lib/imagenes.js';
import { reglaProvisional, REGLAS } from '../lib/reglas.js';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

const fichaEjemplo = {
  cliente: 'INCOARQI S.A.S.',
  marca: { primario: '#16294D', subtitulo: 'Ingeniería · Construcción' },
  pagina: { hero: { titular: 'Diseñamos, planeamos y construimos' },
            sectores: [{ nombre: 'Vivienda' }, 'Comercial'] },
};

// ══════════ LA BARRERA: lo provisional NO se publica ══════════

test('la regla está registrada y como ERROR, no como aviso', () => {
  const r = REGLAS.find((x) => x.id === 'provisional');
  assert.ok(r, 'la regla no está en el registro del validador');
  const hallazgos = reglaProvisional({
    ruta: 'Proyectos-Clientes/x/index.html',
    lineas: ['<img src="./vista-previa/portada.svg">'],
  });
  assert.equal(hallazgos.length, 1);
  assert.equal(hallazgos[0].severidad, 'error',
    'como aviso se ignora; tiene que impedir la entrega');
  assert.equal(hallazgos[0].regla, 'provisional');
});

test('caza las dos formas de material provisional', () => {
  const casos = [
    '<img src="./vista-previa/obra-1.svg">',
    '<img src="vista-previa/portada.png">',
    'foto:"./vista-previa/franja.svg"',
    '<img src="/img/portada-provisional.png">',
    'background:url("hero-provisional.webp")',
  ];
  for (const linea of casos) {
    const h = reglaProvisional({ ruta: 'Proyectos-Clientes/x/index.html', lineas: [linea] });
    assert.equal(h.length, 1, 'no lo cazó: ' + linea);
  }
});

test('no confunde rutas que solo se parecen', () => {
  const inocentes = [
    '<img src="./fotos/vista-previa-del-local.jpg">',   // no está en la carpeta
    '<img src="./img/provisional.png">',                 // sin el guion
    '<p>Es una vista previa del proyecto</p>',           // texto, no ruta
  ];
  for (const linea of inocentes) {
    const h = reglaProvisional({ ruta: 'Proyectos-Clientes/x/index.html', lineas: [linea] });
    assert.equal(h.length, 0, 'falso positivo: ' + linea);
  }
});

test('la fábrica y la propia vista previa están exentas', () => {
  // El demo de la base y los archivos que VIVEN en vista-previa/ pueden
  // referenciarlos: es justamente donde ese material existe.
  const linea = ['<img src="./vista-previa/portada.svg">'];
  for (const ruta of [
    'Sistema-de-Produccion/Sistema-de-Produccion/02-bases/landing-modular/demo.html',
    'Proyectos-Clientes/x/vista-previa/indice.html',
    'Proyectos-Clientes/x/vista-previa/portada-provisional.svg',
  ]) {
    assert.equal(reglaProvisional({ ruta, lineas: linea }).length, 0,
      'no debería marcar: ' + ruta);
  }
});

test('un archivo referenciado se reporta UNA vez', () => {
  // El mismo logo aparece en el <head>, en el CONTEXT y en el marcado.
  // Tres hallazgos idénticos entierran los demás.
  const h = reglaProvisional({
    ruta: 'Proyectos-Clientes/x/index.html',
    lineas: ['<img src="./vista-previa/logo.svg">', 'logo:"./vista-previa/logo.svg"',
             'otra vez ./vista-previa/logo.svg aquí'],
  });
  assert.equal(h.length, 1);
});

test('esProvisional reconoce las dos convenciones', () => {
  assert.equal(esProvisional('./vista-previa/obra-1.svg'), true);
  assert.equal(esProvisional('img\\vista-previa\\x.png'), true, 'también en Windows');
  assert.equal(esProvisional('portada-provisional.png'), true);
  assert.equal(esProvisional('./fotos/obra-real.jpg'), false);
});

// ══════════ EL PROMPT SALE DE LA FICHA ══════════

test('el prompt se arma desde el contexto del cliente', () => {
  const p = promptDesdeFicha(fichaEjemplo, 'portada');
  assert.match(p.texto, /Diseñamos, planeamos y construimos/,
    'el sujeto sale de lo que el cliente dijo de sí mismo');
  assert.match(p.texto, /navy blue/, 'el color sale de marca.primario');
  assert.equal(p.proporcion, '16:9');
});

test('sin datos NO se inventa un tipo de obra', () => {
  // Es la regla madre: nunca inventes datos del cliente. Si no dijo a qué
  // se dedica, el prompt se queda genérico en vez de suponerlo.
  const p = promptDesdeFicha({}, 'galeria');
  assert.match(p.texto, /a modern building under construction/);
  assert.ok(!/hospital|school|bridge|restaurant/i.test(p.texto));
});

test('todo prompt de obra pide RENDER, no fotografía', () => {
  // La diferencia no es estética: una imagen que se ve como render dice
  // "esto es una propuesta"; una que se ve como foto documental miente
  // sobre obra que no existe.
  for (const tipo of ['portada', 'franja', 'sobre', 'galeria']) {
    const p = promptDesdeFicha(fichaEjemplo, tipo);
    assert.match(p.texto, /visualization render/i, tipo + ' no pide render');
    assert.match(p.texto, /not documentary photography/i,
      tipo + ' no descarta la foto documental');
  }
});

test('ningún prompt pide texto ni logos dentro de la imagen', () => {
  for (const tipo of Object.keys(TIPOS)) {
    assert.match(promptDesdeFicha(fichaEjemplo, tipo).texto, /No text, no logos/i,
      tipo + ': un logo inventado dentro de la imagen es peor que ninguno');
  }
});

test('la textura es abstracta a propósito', () => {
  // Es el único tipo que no representa nada real, y por eso el único sin
  // reparos para un entregable publicado.
  const p = promptDesdeFicha(fichaEjemplo, 'textura');
  assert.match(p.texto, /Abstract/i);
  assert.match(p.texto, /Not a photograph of any object or place/i);
});

test('un tipo desconocido falla en vez de inventar uno', () => {
  assert.throws(() => promptDesdeFicha(fichaEjemplo, 'inventado'),
    /Tipo de imagen desconocido/);
});

// ══════════ EL DINERO ══════════

test('el modelo por defecto es el más barato', () => {
  assert.equal(MODELO_IMAGEN, 'rapido');
  const precios = Object.values(MODELOS_IMAGEN).map((m) => m.usd);
  assert.equal(MODELOS_IMAGEN.rapido.usd, Math.min(...precios));
});

test('la estimación no pasa del tope por tanda', () => {
  const e = estimarCosto(999, 'pro');
  assert.equal(e.cuantas, TOPE_POR_TANDA,
    'sin tope, un error de dedo cuesta una tanda de cien imágenes');
  assert.ok(e.usd < 2, 'la tanda más cara se fue a $' + e.usd);
});

test('el juego completo de una landing cuesta centavos', () => {
  const e = estimarCosto(9, 'rapido');
  assert.ok(e.usd < 0.2, 'nueve imágenes cuestan $' + e.usd);
});

// ══════════ LA DEPENDENCIA ES OPCIONAL ══════════

test('sin clave lo dice y no revienta', async () => {
  const antes = { g: process.env.GOOGLE_GENAI_API_KEY, m: process.env.GEMINI_API_KEY };
  delete process.env.GOOGLE_GENAI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    assert.equal(claveDe(), '');
    const e = await estadoImagenes();
    assert.equal(e.listo, false);
    assert.ok(e.faltan.some((f) => f.includes('GOOGLE_GENAI_API_KEY')));
    assert.ok(e.faltan.some((f) => f.includes('aistudio.google.com')),
      'el mensaje tiene que decir DÓNDE se consigue');
  } finally {
    if (antes.g) process.env.GOOGLE_GENAI_API_KEY = antes.g;
    if (antes.m) process.env.GEMINI_API_KEY = antes.m;
  }
});

test('acepta los dos nombres de variable que usa la gente', () => {
  assert.equal(claveDe({ GOOGLE_GENAI_API_KEY: 'a' }), 'a');
  assert.equal(claveDe({ GEMINI_API_KEY: 'b' }), 'b', 'el que todos escriben de memoria');
});

test('el modo gratis no importa el SDK', () => {
  // Si `lib/imagenes.js` importara @google/genai arriba, el sistema entero
  // dejaría de arrancar sin esa dependencia. El import va DENTRO de la
  // función, y solo se ejecuta si de verdad se va a generar algo.
  const fuente = readFileSync(join(AQUI, 'lib', 'imagenes.js'), 'utf8');
  const cabecera = fuente.slice(0, fuente.indexOf('export const MODELOS_IMAGEN'));
  assert.ok(!cabecera.includes("from '@google/genai'"),
    'el SDK no puede importarse en la cabecera: es una dependencia opcional');
  assert.match(fuente, /await import\('@google\/genai'\)/);
});

test('cada imagen deja escrito su prompt', () => {
  // Sin el .txt, en un mes nadie sabe cómo se generó ni cómo repetirla.
  const fuente = readFileSync(join(AQUI, 'lib', 'imagenes.js'), 'utf8');
  assert.match(fuente, /\.txt'/, 'no escribe el prompt al lado de la imagen');
  assert.match(fuente, /-provisional/,
    'el nombre del archivo tiene que decir que es provisional');
});

test('el CLI no gasta sin confirmación', () => {
  const cli = readFileSync(join(AQUI, 'generar-imagenes.js'), 'utf8');
  assert.match(cli, /if \(a\.estimar\)/, 'falta el modo --estimar');
  assert.match(cli, /¿Generar\?/, 'falta la confirmación antes de gastar');
  assert.match(cli, /costo estimado/, 'tiene que decir cuánto antes de pedirla');
});
