// ════════════════════════════════════════════════════════════
//  LAS PLANTILLAS — la estructura de la página, no su piel.
//
//  Una DIRECCIÓN DE ARTE cambia tipografía, color y forma: el mismo sitio
//  con otra ropa. Una PLANTILLA cambia dónde van las cosas. Esa es la
//  diferencia que pidió el dueño ("plantillas, cool, diferentes, como
//  WordPress") y la que estas pruebas defienden: si alguien deja las tres
//  plantillas apuntando al mismo CSS, vuelven a ser una sola con otro
//  nombre y aquí se cae.
//
//   torre    hero a pantalla completa, la foto manda, el texto abajo
//   revista  hero partido en dos columnas: texto | foto
//   ficha    el hero es una banda; se va rápido al contenido (sin fotos)
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { ponerBloquePagina } from '../crear-proyecto.js';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const BASE = join(AQUI, '..', 'Sistema-de-Produccion', 'Sistema-de-Produccion',
                  '02-bases', 'landing-modular', 'demo.html');
const demo = readFileSync(BASE, 'utf8');

const PLANTILLAS = ['torre', 'revista', 'ficha'];

// ── 1 · La ficha manda ──────────────────────────────────────

test('la plantilla de la ficha llega al contexto del entregable', () => {
  for (const p of PLANTILLAS) {
    const r = ponerBloquePagina('pagina:{},', { plantilla: p });
    assert.match(r, new RegExp('"plantilla":"' + p + '"'),
      'la plantilla ' + p + ' no llegó al HTML');
  }
});

test('una plantilla inventada no se escribe (el HTML cae en ficha)', () => {
  const r = ponerBloquePagina('pagina:{},', { plantilla: 'parallax-3d' });
  assert.ok(!/"plantilla"/.test(r),
    'un valor desconocido no puede colarse al entregable');
});

test('sin plantilla en la ficha tampoco se inventa una', () => {
  const r = ponerBloquePagina('pagina:{},', {});
  assert.ok(!/"plantilla"/.test(r));
});

test('POR DEFINIR no cuenta como plantilla', () => {
  const r = ponerBloquePagina('pagina:{},', { plantilla: 'POR DEFINIR' });
  assert.ok(!/"plantilla"/.test(r));
});

// ── 2 · La base sabe aplicarla ──────────────────────────────

test('la base pone data-plantilla en <html> antes de pintar el hero', () => {
  assert.match(demo, /document\.documentElement\.setAttribute\('data-plantilla'/,
    'aplicarPlantilla() no escribe el atributo');
  const iAplicar = demo.indexOf('aplicarPlantilla();');
  // Ojo: la definición de pintarHero() está mucho antes que su llamada. Lo
  // que importa es el orden de EJECUCIÓN, así que se compara con la llamada.
  const iHero = demo.indexOf('pintarHero();');
  assert.ok(iAplicar > 0, 'aplicarPlantilla() no se llama');
  assert.ok(iAplicar < iHero,
    'la plantilla se tiene que fijar ANTES de pintar el hero: si no, el ' +
    'hero se maqueta con la plantilla anterior y hay un salto visible');
});

test('un valor desconocido cae en "ficha", la que funciona sin fotos', () => {
  assert.match(demo, /PLANTILLAS\.includes\(p\)\s*\?\s*p\s*:\s*'ficha'/);
});

// ── 3 · Son DISTINTAS, no la misma con otro nombre ──────────

test('cada plantilla trae su propio CSS', () => {
  for (const p of PLANTILLAS) {
    const reglas = demo.match(
      new RegExp('\\[data-plantilla="' + p + '"\\]', 'g')) || [];
    assert.ok(reglas.length >= 2,
      'la plantilla ' + p + ' tiene ' + reglas.length + ' reglas CSS: ' +
      'con menos de dos no cambia la estructura, solo el nombre');
  }
});

test('las tres cambian el ESQUELETO del hero, no solo el color', () => {
  // Lo que separa una plantilla de una dirección de arte: estas propiedades
  // mueven cosas de sitio. Si una plantilla solo tocara colores, sería piel.
  const trozo = (p) => {
    const i = demo.indexOf('[data-plantilla="' + p + '"]');
    const fin = demo.indexOf('/*', i);
    return demo.slice(i, fin > i ? fin : i + 1200);
  };
  assert.match(trozo('torre'), /min-height:100svh/,
    'torre tiene que ocupar la pantalla entera');
  assert.match(trozo('torre'), /align-content:end/,
    'en torre el texto se apoya abajo, encima de la foto');
  assert.match(trozo('revista'), /grid-template-columns:1\.05fr \.95fr/,
    'revista tiene que partir el hero en dos columnas');
  assert.match(trozo('ficha'), /padding-top:calc\(48px \* var\(--ritmo\)\)/,
    'ficha es una banda: el hero se encoge y da paso al contenido');
});

test('el texto del hero va envuelto para que revista lo pueda encolumnar', () => {
  assert.match(demo, /<div class="hero-txt">/,
    'sin .hero-txt, la plantilla revista no tiene qué poner en la columna 1');
  assert.match(demo, /\[data-plantilla="revista"\] \.hero\.oscuro > \.hero-txt/);
});

// ── 4 · Lo que no se puede romper ───────────────────────────

test('revista apaga el velo: su foto vive en su mitad, no debajo del texto', () => {
  assert.match(demo, /\[data-plantilla="revista"\] \.hero\.oscuro::before\{content:none;\}/,
    'sin apagar el velo, revista pinta una capa oscura sobre media página');
});

test('revista se apila en el teléfono', () => {
  const i = demo.indexOf('[data-plantilla="revista"]');
  const trozo = demo.slice(i, i + 2000);
  assert.match(trozo, /@media\(max-width:820px\)/,
    'dos columnas de hero en un teléfono dejan el titular en 4 letras de ancho');
  assert.match(trozo, /grid-template-columns:1fr/);
});

test('en torre la foto pasa POR DEBAJO de la barra', () => {
  // Sin el tirón hacia arriba, el hero empieza donde termina la barra y
  // queda una franja lisa del color del fondo encima de la portada: se lee
  // como un error de maquetación, no como una decisión.
  assert.match(demo, /\[data-plantilla="torre"\][\s\S]{0,700}?margin-top:calc\(-1 \* var\(--barra-alto\)\)/,
    'torre no tira el hero hacia arriba');
  assert.match(demo, /--barra-alto/,
    'falta la variable con el alto de la barra');
  assert.match(demo, /function medirBarra\(\)/,
    'el alto de la barra se MIDE: cambia con el ritmo de cada dirección de ' +
    'arte y con el tamaño del logo, así que un valor fijo acierta en una sola');
  assert.match(demo, /addEventListener\("resize", medirBarra\)/,
    'la barra cambia de alto al redimensionar (el nav se envuelve)');
});

test('torre no ocupa la pantalla entera en el teléfono', () => {
  // 100svh en un móvil no deja ver que hay algo debajo de la portada.
  const i = demo.indexOf('[data-plantilla="torre"]');
  const trozo = demo.slice(i, i + 1600);
  assert.match(trozo, /@media\(max-width:820px\)[\s\S]*?min-height:86svh/);
});

test('la lista de plantillas es la misma en la base y en el generador', () => {
  const enBase = demo.match(/const PLANTILLAS = \[([^\]]+)\]/);
  const gen = readFileSync(join(AQUI, 'crear-proyecto.js'), 'utf8');
  const enGen = gen.match(/const PLANTILLAS = \[([^\]]+)\]/);
  assert.ok(enBase && enGen, 'falta la lista en alguno de los dos');
  const norm = (s) => s.replace(/['"\s]/g, '').split(',').sort().join(',');
  assert.equal(norm(enBase[1]), norm(enGen[1]),
    'si las listas se separan, el generador deja pasar una plantilla que ' +
    'la base no sabe pintar, y el cliente recibe el hero por defecto');
});
