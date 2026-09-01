// ════════════════════════════════════════════════════════════
//  lib/contenido.js — el contenido real del cliente.
//  Sin esto todo entregable sale con el catálogo del ejemplo.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerContenido, aPrecio, aSemilla, ponerContenido } from '../lib/contenido.js';

const carta = [
  'Tacos',
  'Al pastor | 12000 | Piña y cilantro',
  'Carnitas | 11500',
  '',
  'Bebidas',
  'Agua de horchata | 6000',
].join('\n');

test('separa categorías de productos por la barra', () => {
  const { categorias } = leerContenido(carta);
  assert.equal(categorias.length, 2);
  assert.equal(categorias[0].nombre, 'Tacos');
  assert.equal(categorias[0].productos.length, 2);
  assert.equal(categorias[1].nombre, 'Bebidas');
});

test('lee nombre, precio y descripción', () => {
  const [tacos] = leerContenido(carta).categorias;
  assert.deepEqual(
    { ...tacos.productos[0], id: undefined },
    { id: undefined, nombre: 'Al pastor', desc: 'Piña y cilantro', precio: 12000 });
});

test('la descripción es opcional', () => {
  const [tacos] = leerContenido(carta).categorias;
  assert.equal(tacos.productos[1].desc, '');
});

test('el precio acepta como lo escriba el cliente', () => {
  assert.equal(aPrecio('18000'), 18000);
  assert.equal(aPrecio('$18.000'), 18000);
  assert.equal(aPrecio('18,000 COP'), 18000);
  assert.equal(aPrecio(''), 0);
});

test('avisa del producto sin precio en vez de inventarlo', () => {
  const { categorias, avisos } = leerContenido('Postres\nFlan | ');
  assert.equal(categorias[0].productos[0].precio, 0);
  assert.ok(avisos.some((a) => /sin precio/i.test(a)));
});

test('los ids son legibles y no se repiten', () => {
  const { categorias } = leerContenido('Tacos\nAl pastor | 1\nAl pastor | 2');
  const [a, b] = categorias[0].productos;
  assert.equal(a.id, 'al-pastor');
  assert.equal(b.id, 'al-pastor-2', 'dos productos iguales no pueden compartir id');
});

test('una categoría sin productos se omite y se avisa', () => {
  const { categorias, avisos } = leerContenido('Tacos\nAl pastor | 1\n\nPostres');
  assert.equal(categorias.length, 1, 'no se entrega una sección vacía');
  assert.ok(avisos.some((a) => /Postres/.test(a)));
});

test('productos antes de una categoría no se pierden', () => {
  const { categorias, avisos } = leerContenido('Al pastor | 12000');
  assert.equal(categorias.length, 1);
  assert.equal(categorias[0].nombre, 'Productos');
  assert.ok(avisos.some((a) => /antes de la primera/i.test(a)));
});

test('entrada vacía no produce nada ni lanza', () => {
  assert.deepEqual(leerContenido('').categorias, []);
  assert.doesNotThrow(() => leerContenido(null));
});

// ══════════ LA SEMILLA POR BASE ══════════

test('el menú usa "items" con disp; la tienda usa "productos" con stock', () => {
  const { categorias } = leerContenido(carta);
  const menu = aSemilla(categorias, 'menu-con-panel-admin');
  assert.match(menu, /items:\[/);
  assert.match(menu, /disp:true/);

  const tienda = aSemilla(categorias, 'ecommerce-completo');
  assert.match(tienda, /productos:\[/);
  assert.match(tienda, /stock:0/, 'el stock real lo pone el cliente en el panel');
});

test('la semilla es JavaScript válido', () => {
  const { categorias } = leerContenido(carta);
  const codigo = aSemilla(categorias, 'menu-con-panel-admin');
  assert.doesNotThrow(() => new Function(codigo),
    'una semilla que no compila deja la página en blanco');
});

test('un nombre con comillas no rompe la semilla', () => {
  const { categorias } = leerContenido('Tacos\nEl "especial" | 1000 | Con "todo"');
  const codigo = aSemilla(categorias, 'menu-con-panel-admin');
  assert.doesNotThrow(() => new Function(codigo));
});

// ══════════ INYECCIÓN EN EL ENTREGABLE ══════════

const html = '<script>\nlet DATA = {\n  categorias:[ {id:"x", nombre:"Ejemplo"} ]\n};\nrender();\n</script>';

test('reemplaza el catálogo de ejemplo por el del cliente', () => {
  const { categorias } = leerContenido(carta);
  const out = ponerContenido(html, categorias, 'menu-con-panel-admin');
  assert.ok(!out.includes('Ejemplo'), 'no puede quedar el catálogo del ejemplo');
  assert.match(out, /Al pastor/);
  assert.match(out, /render\(\);/, 'no toca lo que viene después');
});

test('sin contenido, deja el ejemplo intacto', () => {
  assert.equal(ponerContenido(html, [], 'menu-con-panel-admin'), html,
    'mejor datos que se ven de ejemplo que un catálogo vacío');
});
