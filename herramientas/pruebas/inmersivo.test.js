// ════════════════════════════════════════════════════════════
//  INMERSIVO EN LAS BASES DE VENTA.
//
//  La franja, la sección partida y las texturas vivían SOLO en
//  `landing-modular`. La línea principal del negocio es ecommerce, y las
//  bases que más se venden eran las más planas: cero franjas, cero
//  texturas, cero portadas a sangre.
//
//  La pieza está construida UNA vez en `03-componentes-ui/inmersivo.{css,js}`
//  y `llevar-inmersivo.js` la copia a cada base entre marcadores. Estas
//  pruebas defienden las dos mitades: que el injerto funcione, y que las
//  cuatro bases lo tengan de verdad.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { BASES_DE_VENTA, aplicar, injertar, ponerSeccionFranja,
         MARCA_CSS_ABRE, MARCA_CSS_CIERRA } from '../llevar-inmersivo.js';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const SISTEMA = join(AQUI, '..', 'Sistema-de-Produccion', 'Sistema-de-Produccion');
const demo = (b) => readFileSync(join(SISTEMA, '02-bases', b, 'demo.html'), 'utf8');

// ── 1 · Las cuatro bases la tienen ──────────────────────────

test('las cuatro bases de venta tienen la pieza', () => {
  for (const b of BASES_DE_VENTA) {
    const t = demo(b);
    assert.ok(t.includes(MARCA_CSS_ABRE), b + ' no tiene el CSS');
    assert.match(t, /\.tex-plano\{/, b + ' sin texturas');
    assert.match(t, /\.franja\{/, b + ' sin franja');
    assert.match(t, /\.partida\{/, b + ' sin sección partida');
    assert.match(t, /\.hero\.oscuro\{/, b + ' sin portada a sangre');
  }
});

test('y además la PINTAN: el CSS sin la llamada no se ve', () => {
  // El error silencioso más fácil aquí: copiar el CSS, olvidar la llamada,
  // y que la demo se vea exactamente igual que antes.
  for (const b of BASES_DE_VENTA) {
    const t = demo(b);
    assert.match(t, /pintarFranja\(\);/, b + ' nunca llama a pintarFranja()');
    assert.match(t, /id="franja"/, b + ' no tiene la sección');
    assert.match(t, /heroInmersivo\(hero/, b + ' no usa el hero a sangre');
    assert.match(t, /bloquePartido\(titulo/, b + ' no usa la sección partida');
  }
});

test('la demo de cada base ENSEÑA la pieza, no solo la trae', () => {
  // Una pieza que no se ve en la demo es una pieza que nadie va a usar:
  // la demo es el catálogo con el que se vende.
  for (const b of BASES_DE_VENTA) {
    const t = demo(b);
    assert.match(t, /franja\s*:\s*\{\s*frase/,
      b + ': su ficha de ejemplo no trae frase de franja');
    assert.match(t, /fondo\s*:\s*"oscuro"/,
      b + ': su ficha de ejemplo no enciende la portada a sangre');
  }
});

test('landing-modular NO se sobrescribe', () => {
  // Ahí nació la pieza y su versión es más avanzada: plantillas, galería,
  // sectores, proceso. Copiarle la versión reducida sería una regresión.
  assert.ok(!BASES_DE_VENTA.includes('landing-modular'));
  const t = demo('landing-modular');
  assert.ok(!t.includes(MARCA_CSS_ABRE),
    'landing-modular no lleva marcadores: su versión es la suya');
  assert.match(t, /data-plantilla/, 'y conserva las plantillas');
});

// ── 2 · El injerto ──────────────────────────────────────────

test('injertar mete el bloque antes del ancla', () => {
  const r = injertar('AAA\nANCLA\nBBB', '<!--i-->', '<!--f-->', 'CONTENIDO', 'ANCLA');
  assert.match(r, /<!--i-->\nCONTENIDO\n<!--f-->\n\nANCLA/);
});

test('correrlo dos veces no duplica nada', () => {
  // Es la propiedad que hace que arreglar el componente sea "editar y
  // volver a correr". Sin esto, cada corrida añadiría otra copia del CSS.
  const una = injertar('X\nANCLA', '<!--i-->', '<!--f-->', 'V1', 'ANCLA');
  const dos = injertar(una, '<!--i-->', '<!--f-->', 'V1', 'ANCLA');
  assert.equal(una, dos);
});

test('y reemplaza lo de en medio cuando el componente cambia', () => {
  const v1 = injertar('X\nANCLA', '<!--i-->', '<!--f-->', 'VIEJO', 'ANCLA');
  const v2 = injertar(v1, '<!--i-->', '<!--f-->', 'NUEVO', 'ANCLA');
  assert.ok(v2.includes('NUEVO'));
  assert.ok(!v2.includes('VIEJO'), 'quedó la versión anterior pegada');
});

test('sin ancla devuelve null en vez de escribir en cualquier parte', () => {
  assert.equal(injertar('nada que ver', '<!--i-->', '<!--f-->', 'X', 'ANCLA'), null);
});

test('un marcador de apertura sin cierre es un error, no un destrozo', () => {
  assert.throws(() => injertar('<!--i-->\nsuelto', '<!--i-->', '<!--f-->', 'X', 'A'),
    /sin cierre/);
});

test('la sección de la franja no se duplica', () => {
  const html = '  <section class="franja" id="franja" hidden></section>\n'
             + '  <section class="bloques"></section>';
  assert.equal(ponerSeccionFranja(html), html);
});

test('aplicar() sobre una base de mentira no revienta, avisa', () => {
  const r = aplicar('<html><body>sin estilos ni nada</body></html>');
  assert.equal(r.ok, false);
  assert.match(r.error, /style/);
});

// ── 3 · La regla que la pieza defiende ──────────────────────

test('sin foto y sin textura, el texto toma el ancho: no queda hueco', () => {
  // La mitad de la regla que más fácil se olvida. Reservar espacio en el
  // diseño NO es dejar un rectángulo gris en la entrega publicada.
  const js = readFileSync(join(SISTEMA, '03-componentes-ui', 'inmersivo.js'), 'utf8');
  assert.match(js, /sin-img/);
  const css = readFileSync(join(SISTEMA, '03-componentes-ui', 'inmersivo.css'), 'utf8');
  assert.match(css, /\.partida\.sin-img\{grid-template-columns:1fr/);
});

test('la textura va DETRÁS de la foto', () => {
  // Cuando el cliente manda la foto, la textura deja de verse sin tocar
  // una línea. Si estuviera encima, habría que ir a quitarla a mano.
  const css = readFileSync(join(SISTEMA, '03-componentes-ui', 'inmersivo.css'), 'utf8');
  assert.match(css, /\.con-textura > \.textura\{[^}]*z-index:-3/);
  assert.match(css, /\.franja img\{[^}]*z-index:-2/);
});

test('sin color-mix la textura no se pinta y no se rompe nada', () => {
  const css = readFileSync(join(SISTEMA, '03-componentes-ui', 'inmersivo.css'), 'utf8');
  assert.match(css, /@supports not \(background: color-mix/);
});

test('una textura inventada no pinta nada, no cae en una de respaldo', () => {
  const js = readFileSync(join(SISTEMA, '03-componentes-ui', 'inmersivo.js'), 'utf8');
  assert.match(js, /if\(!TEXTURAS\.includes\(n\)\) return '';/,
    'una textura que no corresponde al negocio miente, y es peor que ninguna');
});

test('la sangre no deja scroll horizontal', () => {
  // `100vw` incluye la barra de scroll y el ancho útil no: la banda
  // sobresale ~15px y aparece un scroll lateral que rompe el diseño entero.
  const css = readFileSync(join(SISTEMA, '03-componentes-ui', 'inmersivo.css'), 'utf8');
  assert.match(css, /html\{overflow-x:clip;\}/);
  assert.match(css, /@supports not \(overflow-x: clip\)/,
    'donde no haya clip hace falta el respaldo');
});

test('la sección partida ocupa la fila entera en la rejilla de bloques', () => {
  // Las bases de venta meten sus bloques en una rejilla de tarjetas de
  // 240px. Una sección partida ahí dentro es una tarjeta rota con la
  // imagen saliéndose por encima de la de al lado — pasó, y se vio.
  const css = readFileSync(join(SISTEMA, '03-componentes-ui', 'inmersivo.css'), 'utf8');
  assert.match(css, /\.bloques > \.partida\{grid-column:1 \/ -1;\}/);
});

test('el hero a sangre anula el max-width del hero de las bases', () => {
  // Las bases de venta le ponen `max-width:58ch` al hero. Con portada a
  // sangre eso dejaba la banda cortada a media página — se vio en la
  // primera captura de ecommerce-completo.
  const css = readFileSync(join(SISTEMA, '03-componentes-ui', 'inmersivo.css'), 'utf8');
  assert.match(css, /\.hero\.oscuro\{[\s\S]*?max-width:none;\}/);
  assert.match(css, /\.hero\.oscuro > h2\{max-width/,
    'el límite pasa al texto, no desaparece');
});

test('correrlo sobre un archivo con CRLF no falla en silencio', () => {
  // En Windows git reescribe los demo.html con CRLF. Las sustituciones del
  // hero y del bloque "sobre" buscan bloques de VARIAS líneas: sin
  // normalizar, no encontraban nada, el CSS entraba y el hero se quedaba
  // como estaba. `--revisar` decía "le falta la pieza" a las cuatro bases
  // que sí la tenían.
  const lf = readFileSync(join(SISTEMA, '02-bases', 'ecommerce-completo',
                               'demo.html'), 'utf8').replace(/\r\n/g, '\n');
  const crlf = lf.replace(/\n/g, '\r\n');
  const a = aplicar(lf), b = aplicar(crlf);
  assert.ok(a.ok && b.ok);
  assert.equal(a.html, b.html,
    'el resultado no puede depender de cómo terminen las líneas');
});
