// ════════════════════════════════════════════════════════════
//  Logo y banner del cliente, en las bases.
//
//  Hasta ahora el logo de todo entregable era una letra dentro de un
//  cuadro de color. Sirve para una demo; no para un negocio que ya
//  tiene su marca hecha.
//
//  Estas pruebas EJECUTAN pintarLogo() y pintarBanner() tal como
//  viajan en el demo.html, no una copia. Es la lección del bug del
//  formulario: que el archivo compile no dice nada sobre si funciona.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const BASES = resolve(AQUI, '..', 'Sistema-de-Produccion', 'Sistema-de-Produccion', '02-bases');

const CON_LOGO = ['ecommerce-completo', 'menu-con-panel-admin'];

const leerBase = (b) => readFileSync(join(BASES, b, 'demo.html'), 'utf8');

/** Saca del HTML real el texto de una función, hasta su llave de cierre. */
function extraerFuncion(texto, nombre) {
  const i = texto.indexOf('function ' + nombre + '(');
  assert.notEqual(i, -1, 'no encontré la función ' + nombre);
  let nivel = 0, empezo = false;
  for (let n = i; n < texto.length; n++) {
    if (texto[n] === '{') { nivel++; empezo = true; }
    else if (texto[n] === '}') {
      nivel--;
      if (empezo && nivel === 0) return texto.slice(i, n + 1);
    }
  }
  throw new Error('la función ' + nombre + ' no cierra');
}

/** Elemento mínimo, con lo justo que tocan las dos funciones. */
function nodo() {
  const clases = new Set();
  return {
    hijos: [], textContent: '', hidden: false, src: undefined, alt: '',
    classList: { add: (c) => clases.add(c), remove: (c) => clases.delete(c),
                 contains: (c) => clases.has(c) },
    appendChild(h) { this.hijos.push(h); },
    removeAttribute(a) { delete this[a]; },
  };
}

/** Carga urlSegura + pintarLogo + pintarBanner de una base, sin más. */
async function cargar(base) {
  const t = leerBase(base);
  const codigo = [
    extraerFuncion(t, 'urlSegura'),
    extraerFuncion(t, 'pintarLogo'),
    extraerFuncion(t, 'pintarBanner'),
    'export { pintarLogo, pintarBanner, urlSegura };',
  ].join('\n');
  globalThis.document = { createElement: () => nodo() };
  return import('data:text/javascript;base64,'
    + Buffer.from(codigo + '\n//' + base + Date.now()).toString('base64'));
}

for (const base of CON_LOGO) {
  test(base + ': el CONTEXT trae logo y banner vacíos', () => {
    const t = leerBase(base);
    assert.match(t, /\blogo\s*:\s*""/,
      'sin la clave, crear-proyecto.js no tiene dónde escribir el logo del cliente');
    assert.match(t, /\bbanner\s*:\s*""/);
  });

  test(base + ': el marcado y el CSS del banner existen', () => {
    const t = leerBase(base);
    assert.match(t, /id="banner"[^>]*hidden/,
      'el banner nace oculto: sin imagen no debe dejar un hueco');
    assert.match(t, /\.banner\[hidden\]\{display:none;\}/);
    assert.match(t, /\.logo\.conimg\{/,
      'con logo real el cuadro de color debe desaparecer');
  });

  test(base + ': sin logo se pinta la inicial', async () => {
    const { pintarLogo } = await cargar(base);
    const el = nodo();
    pintarLogo(el, { inicial: 'T', logo: '' }, 'Tacos Mauricio');
    assert.equal(el.textContent, 'T');
    assert.equal(el.hijos.length, 0, 'no debería haber <img>');
    assert.equal(el.classList.contains('conimg'), false);
  });

  test(base + ': con logo se pinta la imagen y se quita la letra', async () => {
    const { pintarLogo } = await cargar(base);
    const el = nodo();
    pintarLogo(el, { inicial: 'T', logo: 'https://cdn.ej/logo.svg' }, 'Tacos Mauricio');
    assert.equal(el.textContent, '', 'la inicial y el logo juntos se ven mal');
    assert.equal(el.hijos.length, 1);
    assert.equal(el.hijos[0].src, 'https://cdn.ej/logo.svg');
    assert.equal(el.hijos[0].alt, 'Tacos Mauricio',
      'el alt del logo es el nombre del negocio, no "logo"');
    assert.equal(el.classList.contains('conimg'), true);
  });

  test(base + ': un logo con javascript: se descarta', async () => {
    const { pintarLogo } = await cargar(base);
    const el = nodo();
    // eslint-disable-next-line no-script-url
    pintarLogo(el, { inicial: 'T', logo: 'javascript:alert(1)' }, 'X');
    assert.equal(el.hijos.length, 0, 'un src así se ejecuta en la sesión del dueño');
    assert.equal(el.textContent, 'T', 'y se cae a la inicial, no a nada');
  });

  test(base + ': sin banner el elemento queda oculto', async () => {
    const { pintarBanner } = await cargar(base);
    const el = nodo();
    el.hidden = false;
    pintarBanner(el, { banner: '' }, 'X');
    assert.equal(el.hidden, true);
    assert.equal(el.src, undefined, 'un src vacío pide la propia página al servidor');
  });

  test(base + ': con banner se muestra, diferido y con alt', async () => {
    const { pintarBanner } = await cargar(base);
    const el = nodo();
    pintarBanner(el, { banner: 'https://cdn.ej/local.jpg' }, 'Tacos Mauricio');
    assert.equal(el.hidden, false);
    assert.equal(el.src, 'https://cdn.ej/local.jpg');
    assert.equal(el.alt, 'Tacos Mauricio');
    assert.equal(el.loading, 'lazy');
  });

  // El bug que dejó una entrega en blanco: se borró un id del marcado y el
  // script murió al llamar getElementById(...).textContent sobre null.
  test(base + ': si el elemento no existe no revienta el resto del script', async () => {
    const { pintarLogo, pintarBanner } = await cargar(base);
    assert.doesNotThrow(() => pintarLogo(null, { inicial: 'T' }, 'X'));
    assert.doesNotThrow(() => pintarBanner(null, { banner: 'https://x.co/a.jpg' }, 'X'));
  });

  test(base + ': el conmutador de la demo está marcado como andamiaje', () => {
    const t = leerBase(base);
    assert.match(t, /@demo-only/, 'si no, verMarca() viaja al cliente como código muerto');
    assert.match(t, /@fin-demo/);
    const i = t.indexOf('@demo-only'), f = t.indexOf('@fin-demo');
    assert.ok(i < f && t.slice(i, f).includes('function verMarca'),
      'el marcador tiene que envolver la función, no ir suelto');
  });

  test(base + ': applyTheme llama a las dos funciones', () => {
    const t = leerBase(base);
    const cuerpo = extraerFuncion(t, 'applyTheme');
    assert.match(cuerpo, /pintarLogo\(/,
      'si applyTheme no lo llama, el logo del cliente nunca se pinta');
    assert.match(cuerpo, /pintarBanner\(/);
  });
}
