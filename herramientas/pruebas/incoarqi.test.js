// ════════════════════════════════════════════════════════════
//  EL PRIMER CLIENTE REAL.
//
//  INCOARQI S.A.S. — cotización 001-2026, landing corporativa, $300.000 COP.
//  Es la primera vez que el sistema produce un entregable que alguien paga,
//  y expuso TRES bugs que 312 pruebas no veían:
//
//   1. `--ficha` leía solo cliente/base/linea/marca y tiraba el resto: los
//      bloques de página no llegaban. Se generó la landing sin titular, sin
//      servicios, sin proceso y sin sectores.
//   2. El parser de YAML no soportaba listas de objetos. Una lista de
//      servicios es lo más natural que puede pedir una ficha, y el formato
//      no la podía expresar.
//   3. `POR DEFINIR` llegaba al HTML. El cliente habría visto
//      "Dónde estamos: POR DEFINIR" en su propia página.
//
//  Estas pruebas corren contra su ficha REAL. Si alguien rompe el camino de
//  `--ficha`, se enteran aquí y no delante del cliente.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { leerYaml } from '../lib/yaml.js';
import { construirFicha, adaptarEntregable, ponerBloquePagina } from '../crear-proyecto.js';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const RAIZ = resolve(AQUI, '..');
const FICHA = join(RAIZ, 'Proyectos-Clientes', 'incoarqi', 'contexto.yml');
const BASES = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion', '02-bases');

const hayFicha = existsSync(FICHA);
const leer = () => leerYaml(readFileSync(FICHA, 'utf8'));

/** La cadena real: ficha en disco → ficha construida → HTML del cliente. */
function entregable() {
  const dado = leer();
  const ejemplo = leerYaml(readFileSync(join(BASES, dado.base, 'contexto.ejemplo.yml'), 'utf8'));
  const ficha = construirFicha(ejemplo, {
    proyecto: dado.proyecto, cliente: dado.cliente,
    base: dado.base, linea: dado.linea, ficha: dado,
  });
  const html = adaptarEntregable(
    readFileSync(join(BASES, dado.base, 'demo.html'), 'utf8'),
    ficha.marca, dado.cliente, ficha);
  return { html, ficha, dado };
}

// ══════════ EL YAML TIENE QUE PODER EXPRESAR LA FICHA ══════════

test('el YAML lee listas de objetos en bloque', () => {
  // Bug 2. Antes esto devolvía el string 'titulo: "Ingeniería"'.
  const f = leerYaml([
    'servicios:',
    '  - titulo: "Ingeniería"',
    '    desc:   "Civil y eléctrica"',
    '  - titulo: "Construcción"',
    '    desc:   "Obra nueva"',
  ].join('\n'));
  assert.equal(f.servicios.length, 2);
  assert.equal(f.servicios[0].titulo, 'Ingeniería');
  assert.equal(f.servicios[0].desc, 'Civil y eléctrica');
  assert.equal(f.servicios[1].titulo, 'Construcción');
});

test('el YAML lee mapas en línea', () => {
  const f = leerYaml('pasos:\n  - { titulo: "Conocer", texto: "Entendemos" }\n');
  assert.equal(f.pasos[0].titulo, 'Conocer');
  assert.equal(f.pasos[0].texto, 'Entendemos');
});

test('una coma DENTRO del texto no parte el mapa en línea', () => {
  // "Control de costos, tiempo y calidad" es texto real del cliente.
  const f = leerYaml('l:\n  - { titulo: "Control", texto: "Costos, tiempo y calidad" }\n');
  assert.equal(f.l[0].texto, 'Costos, tiempo y calidad');
});

test('las listas de texto simple siguen funcionando', () => {
  const f = leerYaml('sectores:\n  - "Vivienda"\n  - "Comercial"\n');
  assert.deepEqual(f.sectores, ['Vivienda', 'Comercial']);
});

test('una lista de objetos no se come las claves que vienen después', () => {
  const f = leerYaml([
    'pagina:',
    '  servicios:',
    '    - titulo: "A"',
    '      desc: "a"',
    '  sectores:',
    '    - "X"',
    'otra_clave: "sobrevive"',
  ].join('\n'));
  assert.equal(f.pagina.servicios[0].titulo, 'A');
  assert.deepEqual(f.pagina.sectores, ['X']);
  assert.equal(f.otra_clave, 'sobrevive', 'el mapa de la lista se quedó abierto');
});

// ══════════ LA FICHA REAL DEL CLIENTE ══════════

test('la ficha de INCOARQI existe y se lee completa', (t) => {
  if (!hayFicha) return t.skip('sin la ficha del cliente en disco');
  const f = leer();
  assert.equal(f.cliente, 'INCOARQI S.A.S.');
  assert.equal(f.base, 'landing-modular');
  assert.equal(f.pagina.servicios.length, 6, 'los 6 servicios del brochure');
  assert.equal(f.pagina.diferencial.length, 6, 'los 6 diferenciales');
  assert.equal(f.pagina.proceso.length, 8, 'los 8 pasos del proceso');
  assert.equal(f.pagina.sectores.length, 10, 'los 10 sectores');
  assert.equal(f.marca.acento, '#C9A227', 'el dorado es media identidad');
});

test('todo el contenido del brochure llega al HTML del cliente', (t) => {
  if (!hayFicha) return t.skip('sin la ficha del cliente en disco');
  const { html } = entregable();
  // Bug 1: con `--ficha` leyendo solo 4 campos, nada de esto llegaba.
  for (const trozo of [
    'INCOARQI',
    'Diseñamos, planeamos, construimos y transformamos',
    'Gerencia y gestión de proyectos',   // servicio 4
    'Análisis de precios unitarios',     // dentro de un servicio
    'Integración',                       // diferencial 1
    'Compromiso',                        // diferencial 6
    'Presupuestar',                      // paso 4
    'Entregar',                          // paso 8
    'Adecuaciones locativas',            // sector 8
    'Obras civiles',                     // sector 10
    '#16294D',                           // azul marino
    '#C9A227',                           // dorado
  ]) {
    assert.ok(html.includes(trozo), 'no llegó al entregable: ' + trozo);
  }
});

test('POR DEFINIR nunca llega al HTML', (t) => {
  if (!hayFicha) return t.skip('sin la ficha del cliente en disco');
  // Bug 3. Es una nota interna para el estudio, no un valor: el cliente
  // habría visto "Dónde estamos: POR DEFINIR" en su propia página.
  const { html, dado } = entregable();
  assert.ok(dado.pagina.ubicacion.direccion.includes('POR DEFINIR'),
    'la prueba se apoya en que la ficha TIENE un POR DEFINIR pendiente');
  assert.ok(!html.includes('POR DEFINIR'), 'se colaría a la vista del cliente');
});

test('no queda nada del ejemplo en el entregable', (t) => {
  if (!hayFicha) return t.skip('sin la ficha del cliente en disco');
  const { html } = entregable();
  for (const ajeno of ['Estudio Lumen', 'Menús digitales', 'wireframe',
                       '573001234567', 'sysbar', '@demo-only']) {
    assert.ok(!html.includes(ajeno), 'se coló del ejemplo: ' + ajeno);
  }
});

test('el WhatsApp de relleno del brochure NO se publica', (t) => {
  if (!hayFicha) return t.skip('sin la ficha del cliente en disco');
  // El brochure trae 300 123 4567, que es un número inventado. Publicarlo
  // sería un botón que escribe a nadie.
  const { html } = entregable();
  assert.ok(!html.includes('3001234567'), 'el número de relleno llegó al HTML');
});

test('el entregable arranca: compila y no pide ids que no existen', (t) => {
  if (!hayFicha) return t.skip('sin la ficha del cliente en disco');
  const { html } = entregable();
  const bloques = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(bloques.length);
  for (const b of bloques) assert.doesNotThrow(() => new Function(b[1]));

  const declarados = new Set([...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]));
  const pedidos = [...html.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(pedidos)].filter((i) => !declarados.has(i)), []);
});

// ══════════ LAS SECCIONES QUE SE COTIZARON ══════════

test('la landing tiene las 7 secciones de la cotización', () => {
  const base = readFileSync(join(BASES, 'landing-modular', 'demo.html'), 'utf8');
  // Portada, Servicios, Diferencial, Proceso, Galería, Sectores, Contacto.
  for (const id of ['hero', 'servicios', 'diferencial', 'proceso',
                    'galeria', 'sectores', 'leads']) {
    assert.match(base, new RegExp('id="' + id + '"'), 'falta la sección ' + id);
  }
  for (const f of ['pintarDiferencial', 'pintarProceso', 'pintarGaleria',
                   'pintarSectores']) {
    assert.match(base, new RegExp('function ' + f + '\\('), 'falta ' + f);
  }
});

test('una sección sin contenido no se pinta', () => {
  // La galería de INCOARQI está vacía hasta que lleguen las fotos: no debe
  // dejar un título con un hueco debajo.
  const vacia = ponerBloquePagina('pagina:{},', {});
  assert.ok(!vacia.includes('galeria'), 'sin fotos no hay clave de galería');
  const conFotos = ponerBloquePagina('pagina:{},',
    { galeria: [{ src: 'https://ej.co/a.jpg', pie: 'Obra' }] });
  assert.ok(conFotos.includes('a.jpg'));
});

test('la galería descarta lo que no es una URL', () => {
  const r = ponerBloquePagina('pagina:{},', {
    galeria: ['https://ej.co/ok.jpg', 'C:/fotos/local.jpg', 'javascript:alert(1)', ''],
  });
  assert.ok(r.includes('ok.jpg'));
  assert.ok(!r.includes('local.jpg'), 'una ruta del disco del cliente no existe en el servidor');
  assert.ok(!r.includes('javascript:'), 'un src así se ejecuta');
});

test('el proceso conserva el ORDEN, que es la información', () => {
  const r = ponerBloquePagina('pagina:{},', {
    proceso: [{ titulo: 'Conocer' }, { titulo: 'Analizar' }, { titulo: 'Entregar' }],
  });
  const i = r.indexOf('Conocer'), j = r.indexOf('Analizar'), k = r.indexOf('Entregar');
  assert.ok(i < j && j < k, 'un proceso desordenado no es un proceso');
});

test('el material que falta queda escrito para el cliente', (t) => {
  const doc = join(RAIZ, 'Proyectos-Clientes', 'incoarqi', 'QUE-NECESITO-DE-USTEDES.md');
  if (!existsSync(doc)) return t.skip('sin el documento del cliente');
  const t2 = readFileSync(doc, 'utf8');
  // Lo que bloquea la entrega tiene que estar dicho, no descubrirse después.
  for (const clave of ['Logo', 'WhatsApp', 'Dominio']) {
    assert.ok(t2.includes(clave), 'el documento no menciona: ' + clave);
  }
});
