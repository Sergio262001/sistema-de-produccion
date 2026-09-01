// ════════════════════════════════════════════════════════════
//  lib/reglas.js — el control de calidad del modo gratis.
//
//  Cada regla existe por un motivo real. Estas pruebas fijan las
//  DOS caras: que detecte el problema, y que no marque lo que está
//  bien. Un validador con falsos positivos se deja de mirar, y
//  entonces no sirve de nada.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  reglaXss, reglaTokensMuertos, reglaAlt,
  reglaContraste, reglaTeclado, reglaRls, reglaSecretos, reglaIdFantasma,
} from '../lib/reglas.js';

/** Envuelve un texto como lo recibe una regla */
const doc = (texto, ruta = 'prueba.html') =>
  ({ ruta, texto, lineas: texto.split('\n') });

// ══════════ XSS — el bug real del panel de pedidos ══════════

test('xss · detecta innerHTML interpolando sin escapar', () => {
  const h = reglaXss(doc('el.innerHTML = `<b>${pedido.nombre}</b>`;'));
  assert.equal(h.length, 1);
  assert.equal(h[0].severidad, 'error');
  assert.equal(h[0].regla, 'xss');
});

test('xss · acepta el valor envuelto en esc()', () => {
  assert.equal(reglaXss(doc('el.innerHTML = `<b>${esc(pedido.nombre)}</b>`;')).length, 0);
  assert.equal(reglaXss(doc('el.innerHTML = `<b>${escapeHtml(n)}</b>`;')).length, 0);
});

test('xss · acepta la etiqueta de plantilla `seguro`', () => {
  assert.equal(reglaXss(doc('el.innerHTML = seguro`<b>${nombre}</b>`;')).length, 0,
    'seguro`` escapa todo lo interpolado por diseño');
});

test('xss · acepta números, que no pueden llevar marcado', () => {
  assert.equal(reglaXss(doc('el.innerHTML = `<b>${Number(total)}</b>`;')).length, 0);
});

test('xss · no marca los ejemplos dentro de comentarios', () => {
  const jsdoc = [
    '/**',
    ' *   ❌ el.innerHTML = `<b>${cliente.nombre}</b>`',
    ' */',
    '// el.innerHTML = `${otro}`',
  ].join('\n');
  assert.equal(reglaXss(doc(jsdoc)).length, 0,
    'un contraejemplo documentado no es código vulnerable');
});

test('xss · sin interpolación no hay riesgo', () => {
  assert.equal(reglaXss(doc('el.innerHTML = "<b>hola</b>";')).length, 0);
});

// ══════════ TOKENS MUERTOS — el bug de la página v1 ══════════

test('token-muerto · detecta el token declarado y nunca usado', () => {
  const css = ':root{--brand:#111;--accent:#E8A02C;}\n.b{color:var(--brand);}';
  const h = reglaTokensMuertos(doc(css));
  assert.equal(h.length, 1);
  assert.match(h[0].mensaje, /--accent/);
});

test('token-muerto · cuenta como uso el var() con valor de reserva', () => {
  const css = ':root{--brand:#111;}\n.b{color:var(--brand, #000);}';
  assert.equal(reglaTokensMuertos(doc(css)).length, 0);
});

test('token-muerto · un archivo de contrato no se marca a sí mismo', () => {
  // tokens.css declara para que OTROS consuman; exigirle que se use
  // a sí mismo llenaría el informe de ruido.
  const contrato = ':root{--brand:#111;--bg:#FFF;--ink:#000;}';
  assert.equal(reglaTokensMuertos(doc(contrato, 'tokens.css')).length, 0);
});

test('token-muerto · no confunde un token con otro que lo contiene', () => {
  const css = ':root{--ink:#000;--ink-soft:#555;}\n.a{color:var(--ink-soft);}';
  const h = reglaTokensMuertos(doc(css));
  assert.equal(h.length, 1);
  assert.match(h[0].mensaje, /--ink /, 'var(--ink-soft) no cuenta como uso de --ink');
});

// ══════════ ACCESIBILIDAD ══════════

test('alt · detecta la imagen sin alt y respeta la que lo tiene', () => {
  assert.equal(reglaAlt(doc('<img src="a.jpg">')).length, 1);
  assert.equal(reglaAlt(doc('<img src="a.jpg" alt="">')).length, 0, 'decorativa');
  assert.equal(reglaAlt(doc('<img src="a.jpg" alt="Producto">')).length, 0);
});

test('teclado · avisa si no hay foco visible', () => {
  const h = reglaTeclado(doc('<body><a href="#">x</a></body>'));
  assert.ok(h.some((x) => x.regla === 'foco'));
});

test('teclado · anular outline sin reponer el foco es error, no aviso', () => {
  const h = reglaTeclado(doc('<body><style>a{outline:none;}</style></body>'));
  // Salen dos hallazgos de foco: el aviso general de que falta :focus-visible
  // y, aparte, el ERROR de haber anulado outline. Buscamos ese segundo.
  const anulado = h.find((x) => /anula outline/i.test(x.mensaje));
  assert.ok(anulado, 'debía marcar la anulación de outline');
  assert.equal(anulado.severidad, 'error',
    'dejar la página sin foco visible no es un aviso: es inusable por teclado');
});

test('teclado · una página correcta no genera hallazgos de foco', () => {
  const ok = '<html lang="es"><body><style>:focus-visible{outline:2px solid red;}</style></body></html>';
  assert.equal(reglaTeclado(doc(ok)).length, 0);
});

// ══════════ CONTRASTE ══════════

test('contraste · marca el texto que no llega al mínimo', () => {
  const h = reglaContraste(doc(':root{--bg:#FFFFFF;--ink:#AAAAAA;}'));
  assert.equal(h.length, 1);
  assert.equal(h[0].severidad, 'error');
});

test('contraste · no marca una pareja legible', () => {
  assert.equal(reglaContraste(doc(':root{--bg:#FFFFFF;--ink:#0F1626;}')).length, 0);
});

// ══════════ RLS ══════════

test('rls · detecta la tabla sin protección', () => {
  const sql = 'create table productos (id int);\ncreate table pedidos (id int);\n'
    + 'alter table productos enable row level security;';
  const h = reglaRls(doc(sql, 'x.sql'));
  assert.equal(h.length, 1);
  assert.match(h[0].mensaje, /pedidos/);
  assert.equal(h[0].severidad, 'error');
});

test('rls · respeta el archivo que declara que no persiste nada', () => {
  const sql = '-- Esta base no usa base de datos.\ncreate table x (id int);';
  assert.equal(reglaRls(doc(sql, 'x.sql')).length, 0);
});

test('rls · solo aplica a archivos .sql', () => {
  assert.equal(reglaRls(doc('create table x (id int);', 'x.html')).length, 0);
});

// ══════════ SECRETOS ══════════

test('secreto · detecta claves que nunca deben estar en el código', () => {
  const casos = [
    'const k = "service_role";',
    'const k = "sb_secret_abcdefghijklmnop";',
    'const k = "sk_live_abcdefghijklmnop";',
    'const t = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";',
  ];
  for (const c of casos) {
    const h = reglaSecretos(doc(c, 'x.js'));
    assert.equal(h.length, 1, 'debía marcar: ' + c);
    assert.equal(h[0].severidad, 'error');
  }
});

test('secreto · el .env.example está exento', () => {
  assert.equal(reglaSecretos(doc('SUPABASE_SERVICE_ROLE=', '.env.example')).length, 0);
});

test('secreto · un comentario que menciona la clave no es una fuga', () => {
  assert.equal(reglaSecretos(doc('// nunca pongas la service_role aquí', 'x.js')).length, 0);
});

test('secreto · la anon key es pública por diseño y no se marca', () => {
  assert.equal(reglaSecretos(doc('const k = "sb_publishable_abc123";', 'x.js')).length, 0);
});

// ══════════ ID FANTASMA — el bug que entregó una página en blanco ══════════

test('id-fantasma · getElementById encadenado sobre un id inexistente es ERROR', () => {
  const html = '<body><script>document.getElementById("noExiste").textContent = "x";</script></body>';
  const h = reglaIdFantasma(doc(html));
  assert.equal(h.length, 1);
  assert.equal(h[0].severidad, 'error',
    'encadenar sobre null tumba todo el JavaScript posterior');
  assert.match(h[0].mensaje, /noExiste/);
});

test('id-fantasma · sin encadenar es solo aviso', () => {
  const html = '<body><script>const el = document.getElementById("quizas");</script></body>';
  const h = reglaIdFantasma(doc(html));
  assert.equal(h.length, 1);
  assert.equal(h[0].severidad, 'aviso');
});

test('id-fantasma · un id que sí existe no se marca', () => {
  const html = '<body><div id="app"></div><script>document.getElementById("app").textContent="x";</script></body>';
  assert.equal(reglaIdFantasma(doc(html)).length, 0);
});

test('id-fantasma · conservar el id oculto es solución válida', () => {
  // Es exactamente lo que hace crear-proyecto al quitar la barra de sistema
  const html = '<body><div hidden><span id="sysClient"></span></div>'
    + '<script>document.getElementById("sysClient").textContent="x";</script></body>';
  assert.equal(reglaIdFantasma(doc(html)).length, 0);
});

test('id-fantasma · no aplica a fragmentos sin body', () => {
  assert.equal(reglaIdFantasma(doc('document.getElementById("x").y')).length, 0);
});

test('xss · medio() construye marcado ya escapado y no se marca', () => {
  // medio() escapa la URL con urlSegura y el nombre/emoji con esc().
  assert.equal(reglaXss(doc('el.innerHTML = `${medio(p)}<div>x</div>`;')).length, 0);
});
