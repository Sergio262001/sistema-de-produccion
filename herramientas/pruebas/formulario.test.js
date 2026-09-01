// ════════════════════════════════════════════════════════════
//  brief.html — el formulario del cliente, ejecutado de verdad.
//
//  Existe por un fallo que ninguna otra prueba veía: se usó la
//  constante NO_APLICA sin declararla nunca. El archivo compilaba,
//  el validador daba 0 errores, y la página cargaba — pero al pasar
//  del paso 1 al 2 el script lanzaba ReferenceError, no se dibujaba
//  nada, y el formulario parecía saltar hasta el final.
//
//  La lección: comprobar que el JavaScript COMPILA no basta. Hay que
//  EJECUTARLO. Estas pruebas recorren los 6 pasos en un DOM mínimo.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');

/** DOM mínimo: lo justo para que el script del formulario corra. */
function montarDom() {
  const nodos = {};
  const el = (id) => {
    const o = { _id: id, innerHTML: '', textContent: '', className: '', dataset: {}, value: '',
      classList: { add() {}, remove() {}, toggle() {}, contains: () => false },
      querySelector: () => el(), querySelectorAll: () => [], appendChild() {},
      onclick: null, scrollIntoView() {}, setAttribute() {}, getAttribute: () => null,
      closest: () => el() };
    Object.defineProperty(o, 'nextElementSibling', { get: () => el() });
    return o;
  };
  globalThis.document = {
    documentElement: { style: { setProperty() {} }, setAttribute() {}, getAttribute: () => null },
    getElementById: (id) => (nodos[id] ||= el(id)),
    createElement: () => el(),
    querySelector: (s) => (nodos[s.replace('#', '')] ||= el(s.replace('#', ''))),
    querySelectorAll: () => [], body: el(),
  };
  globalThis.scrollTo = () => {};
  globalThis.getSelection = () => ({ removeAllRanges() {}, addRange() {} });
  Object.defineProperty(globalThis, 'navigator',
    { value: { clipboard: { writeText: async () => {} } }, configurable: true });
  // No se reemplaza URL: otros modulos usan `new URL(...)`. Solo se le
  // añaden los metodos del navegador que el formulario necesita.
  globalThis.URL.createObjectURL ??= () => '';
  globalThis.URL.revokeObjectURL ??= () => {};
  globalThis.Blob = class {};
  return nodos;
}

async function cargarFormulario() {
  const html = readFileSync(join(AQUI, 'brief.html'), 'utf8');
  const codigo = [...html.matchAll(/<script(?![^>]*src=)[^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1]).join('\n');
  const nodos = montarDom();
  const expuesto = codigo
    + '\nglobalThis.__F = { PASOS, P, TODOS, control, camposDe, pintar,'
    + ' SET:(v)=>{SERVICIO=v;}, PASO:(n)=>{i=n;}, R };';
  await import('data:text/javascript;base64,'
    + Buffer.from(expuesto + '\n//' + Date.now()).toString('base64'));
  return { F: globalThis.__F, nodos };
}

test('el script del formulario se ejecuta sin lanzar', async () => {
  const { F } = await cargarFormulario();
  assert.ok(F.PASOS.length >= 5, 'debería tener los pasos definidos');
});

test('los 6 pasos dibujan contenido — ninguno se salta', async () => {
  const { F, nodos } = await cargarFormulario();
  F.SET('menu-con-panel-admin');

  for (let n = 0; n < F.PASOS.length; n++) {
    F.PASO(n);
    assert.doesNotThrow(() => F.pintar(),
      'el paso "' + F.PASOS[n].id + '" lanzó al dibujarse');
    assert.ok(nodos.contenido.innerHTML.length > 30,
      'el paso "' + F.PASOS[n].id + '" no dibujó nada');
  }
});

test('cada campo de cada paso se dibuja, en todos los servicios', async () => {
  const { F } = await cargarFormulario();
  for (const s of F.TODOS) {
    F.SET(s.id);
    for (const paso of F.PASOS) {
      for (const id of F.camposDe(paso)) {
        assert.doesNotThrow(() => F.control(id),
          'servicio "' + s.id + '", campo "' + id + '"');
      }
    }
  }
});

test('toda pregunta declarada tiene texto y tipo', async () => {
  const { F } = await cargarFormulario();
  for (const [id, p] of Object.entries(F.P)) {
    assert.ok(p.q, 'la pregunta "' + id + '" no tiene enunciado');
    assert.ok(p.t, 'la pregunta "' + id + '" no tiene tipo');
  }
});

test('todo campo referido en un paso existe en P', async () => {
  const { F } = await cargarFormulario();
  for (const paso of F.PASOS) {
    for (const id of (paso.campos || [])) {
      assert.ok(F.P[id], 'el paso "' + paso.id + '" pide "' + id + '", que no está en P');
    }
  }
});

test('el paso de marca pide logo y banner', async () => {
  const { F } = await cargarFormulario();
  const marca = F.PASOS.find((p) => p.id === 'marca');
  assert.ok(marca.campos.includes('logo'),
    'sin esta pregunta el cliente no tiene dónde darnos su logo');
  assert.ok(marca.campos.includes('banner'));
  assert.equal(F.P.logo.t, 'url');
  assert.equal(F.P.banner.t, 'url');
});

test('un campo de tipo url se dibuja con su vista previa', async () => {
  const { F } = await cargarFormulario();
  const html = F.control('logo');
  assert.match(html, /type="url"/);
  assert.match(html, /id="prev-logo"/, 'sin la zona de previa no se ve si carga');
  assert.match(html, /No aplica/, 'el logo no es obligatorio: debe poder no aplicar');
});

test('todo servicio ofrecido apunta a una base real', async () => {
  const { F } = await cargarFormulario();
  const { listarBases } = await import('../crear-proyecto.js');
  const bases = listarBases();
  for (const s of F.TODOS) {
    assert.ok(bases.includes(s.id),
      'se ofrece "' + s.id + '" pero no existe esa base');
  }
});
