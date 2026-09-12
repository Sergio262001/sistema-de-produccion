// ════════════════════════════════════════════════════════════
//  LAS CAPTURAS — los ojos del sistema.
//
//  Estas pruebas cubren la parte pura (rutas, nombres, navegador) y UNA
//  captura real de una base, porque lo único que demuestra que la tubería
//  funciona es un PNG en disco.
//
//  La captura real se salta sola si no hay Chrome: en esta máquina hay, pero
//  una prueba que exige un navegador instalado no debe tumbar la suite de
//  nadie más.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, rmSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encontrarNavegador, aDireccion, nombreDe, capturar,
         capturarDirecciones, DIRECCIONES } from '../lib/captura.js';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const BASES = resolve(AQUI, '..', 'Sistema-de-Produccion', 'Sistema-de-Produccion', '02-bases');
const hayNavegador = Boolean(encontrarNavegador());

// ══════════ RUTAS Y URL ══════════

test('una URL se deja tal cual', () => {
  assert.equal(aDireccion('https://stripe.com'), 'https://stripe.com');
  assert.equal(aDireccion('http://localhost:4321/x'), 'http://localhost:4321/x');
});

test('una ruta de disco se vuelve file:// con barras normales', () => {
  const d = aDireccion(join(BASES, 'ecommerce-completo', 'demo.html'));
  assert.match(d, /^file:\/\/\//, 'sin file:// Chrome no abre nada');
  assert.ok(!d.includes('\\'), 'las barras invertidas de Windows rompen el file://');
  assert.match(d, /demo\.html$/);
});

test('el nombre del archivo distingue entre bases', () => {
  // Todas las bases tienen un demo.html: si el nombre sale del archivo solo,
  // las 5 capturas se sobreescriben entre ellas.
  const a = nombreDe(join(BASES, 'ecommerce-completo', 'demo.html'));
  const b = nombreDe(join(BASES, 'menu-con-panel-admin', 'demo.html'));
  assert.notEqual(a, b, 'dos bases distintas no pueden dar el mismo nombre');
  assert.match(a, /ecommerce-completo/);
  assert.match(b, /menu-con-panel-admin/);
});

test('el nombre de una URL sale del dominio, sin www', () => {
  assert.equal(nombreDe('https://www.apple.com'), 'apple-com.png');
  assert.match(nombreDe('https://linear.app'), /^linear-app\.png$/);
});

test('el sufijo separa las direcciones de arte', () => {
  const base = join(BASES, 'ecommerce-completo', 'demo.html');
  const nombres = DIRECCIONES.map((d) => nombreDe(base, d));
  assert.equal(new Set(nombres).size, 3, 'las tres capturas se sobreescribirían');
  for (const d of DIRECCIONES) assert.ok(nombres.some((n) => n.includes(d)));
});

test('el nombre siempre es un archivo .png usable', () => {
  for (const entrada of ['https://ej.com/a/b?c=1&d=2', 'C:/x/y/z.html', '', 'á é í']) {
    const n = nombreDe(entrada);
    assert.match(n, /\.png$/);
    assert.ok(!/[<>:"|?*\\/]/.test(n.replace(/\.png$/, '')),
      'el nombre "' + n + '" no es válido como archivo en Windows');
  }
});

// ══════════ EL NAVEGADOR ══════════

test('CHROME_BIN manda sobre la búsqueda automática', () => {
  const antes = process.env.CHROME_BIN;
  process.env.CHROME_BIN = 'C:/no/existe/chrome.exe';
  try {
    // No existe, así que debe ignorarlo y seguir buscando (o devolver null).
    const r = encontrarNavegador();
    assert.ok(r === null || !r.includes('no/existe'),
      'una ruta inexistente en CHROME_BIN no debe devolverse');
  } finally {
    if (antes === undefined) delete process.env.CHROME_BIN;
    else process.env.CHROME_BIN = antes;
  }
});

test('sin navegador, capturar avisa en vez de lanzar', async (t) => {
  if (hayNavegador) return t.skip('hay navegador en esta máquina');
  const r = await capturar({ entrada: 'https://ej.com', salida: join(tmpdir(), 'x.png') });
  assert.equal(r.ok, false);
  assert.match(r.error, /Chrome|Edge/);
});

// ══════════ UNA CAPTURA DE VERDAD ══════════

test('captura una base real y deja un PNG con peso', async (t) => {
  if (!hayNavegador) return t.skip('sin Chrome ni Edge instalado');
  const dir = mkdtempSync(join(tmpdir(), 'cap-'));
  try {
    const r = await capturar({
      entrada: join(BASES, 'ecommerce-completo', 'demo.html'),
      salida: join(dir, 'prueba.png'), ancho: 900, alto: 700,
    });
    assert.equal(r.ok, true, r.error);
    assert.ok(existsSync(r.archivo));
    // Un PNG de una página con contenido pesa decenas de KB. Si pesa 2 KB,
    // se capturó una página en blanco y la prueba tiene que fallar.
    assert.ok(r.bytes > 10000, 'la captura pesa ' + r.bytes + ' bytes: página vacía');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('una base sin `direccion` no se captura por direcciones', async () => {
  // `auth` no tiene direcciones de arte: debe decirlo, no generar tres
  // capturas idénticas.
  const r = await capturarDirecciones({
    entrada: join(BASES, 'auth', 'demo.html'), carpeta: tmpdir(),
  });
  assert.equal(r.ok, false);
  assert.match(r.error, /direccion/);
});

test('las tres direcciones dan tres archivos distintos', async (t) => {
  if (!hayNavegador) return t.skip('sin Chrome ni Edge instalado');
  const dir = mkdtempSync(join(tmpdir(), 'caps-'));
  const base = join(BASES, 'menu-con-panel-admin', 'demo.html');
  try {
    const r = await capturarDirecciones({ entrada: base, carpeta: dir, ancho: 800, alto: 900 });
    assert.equal(r.ok, true);
    assert.equal(r.hechas.length, 3);
    const rutas = new Set(r.hechas.filter((h) => h.ok).map((h) => h.archivo));
    assert.equal(rutas.size, 3, 'las tres se escribieron encima');
    // Y la copia temporal que se usa para parchear la dirección no queda
    // tirada al lado del demo original.
    for (const d of DIRECCIONES) {
      assert.ok(!existsSync(join(BASES, 'menu-con-panel-admin', '.captura-' + d + '.html')),
        'quedó una copia temporal sin borrar en la carpeta de la base');
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('capturar NO modifica el demo original', async (t) => {
  if (!hayNavegador) return t.skip('sin Chrome ni Edge instalado');
  const { readFileSync } = await import('node:fs');
  const base = join(BASES, 'carrito-reutilizable', 'demo.html');
  const antes = readFileSync(base, 'utf8');
  const dir = mkdtempSync(join(tmpdir(), 'cap-int-'));
  try {
    await capturarDirecciones({ entrada: base, carpeta: dir, ancho: 700, alto: 600 });
    assert.equal(readFileSync(base, 'utf8'), antes,
      'la fábrica no se toca para tomar una captura');
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
