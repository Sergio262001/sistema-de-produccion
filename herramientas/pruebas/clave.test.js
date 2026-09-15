// ════════════════════════════════════════════════════════════
//  LA CLAVE DEL PANEL.
//
//  Las bases traen `admin123` escrita en el código Y impresa en la pantalla
//  de login. Para una demo de la fábrica está bien. Lo que no podía seguir
//  pasando es que viajara tal cual al entregable: significaba que TODOS los
//  proyectos que vende el estudio salían con la misma contraseña, publicada
//  en su propia pantalla de entrada. Un cliente que abriera la página de
//  otro cliente entraba a su panel.
//
//  Estas pruebas defienden las tres piezas del arreglo: una frase única por
//  proyecto, el cartel que la anunciaba fuera, y la regla del validador que
//  impide que vuelva por una copia y pega.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { generarClave, esClaveDemo, CLAVES_DEMO } from '../lib/clave.js';
import { reglaClaveDemo } from '../lib/reglas.js';
import { crearProyecto, adaptarEntregable, accesoMd } from '../crear-proyecto.js';

const CON_PANEL = 'ecommerce-completo';

function enCarpetaTemporal(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'clave-'));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

// ── 1 · La frase ────────────────────────────────────────────

test('cada llamada da una frase distinta', () => {
  const vistas = new Set();
  for (let i = 0; i < 200; i++) vistas.add(generarClave());
  assert.ok(vistas.size > 195,
    'si dos proyectos comparten frase, el arreglo no arregló nada');
});

test('la frase se puede dictar por teléfono', () => {
  for (let i = 0; i < 50; i++) {
    const c = generarClave();
    assert.match(c, /^[a-z]+-[a-z]+-[a-z]+-\d{2}$/,
      'tres palabras y dos dígitos: quien la usa la recibe por WhatsApp y la ' +
      'teclea en un móvil. Una cadena aleatoria termina en un papel pegado ' +
      'al monitor');
    assert.ok(!/[áéíóúñ]/.test(c), 'sin tildes ni ñ: se dictan y se teclean mal');
    const [a, b, d] = c.split('-');
    assert.ok(a !== b && b !== d && a !== d,
      '"torre-torre-torre-12" parece un error, no una clave');
  }
});

test('ninguna clave de demo se cuela como frase generada', () => {
  for (let i = 0; i < 100; i++) assert.equal(esClaveDemo(generarClave()), false);
  for (const d of CLAVES_DEMO) assert.equal(esClaveDemo(d), true);
  assert.equal(esClaveDemo('  ADMIN123 '), true, 'sin importar espacios ni caja');
});

// ── 2 · El entregable ───────────────────────────────────────

test('el entregable sale con la frase del proyecto, no con admin123', () => {
  enCarpetaTemporal((tmp) => {
    const destino = join(tmp, 'p');
    const r = crearProyecto({ cliente: 'Tienda Uno', base: CON_PANEL, destino });
    assert.ok(r.ok, r.error);

    const html = readFileSync(join(destino, 'index.html'), 'utf8');
    for (const d of CLAVES_DEMO) {
      assert.ok(!new RegExp("password:\\s*['\"]" + d + "['\"]").test(html),
        'la clave de demo ' + d + ' llegó al entregable');
    }
    const env = readFileSync(join(destino, '.env'), 'utf8');
    const frase = (env.match(/^PANEL_CLAVE=(.+)$/m) || [])[1];
    assert.ok(frase, 'la frase tiene que quedar en el .env');
    assert.ok(html.includes(frase), 'y ser la que abre el panel');
  });
});

test('dos proyectos no comparten clave', () => {
  enCarpetaTemporal((tmp) => {
    const frases = ['a', 'b'].map((n) => {
      const destino = join(tmp, n);
      crearProyecto({ cliente: 'Tienda ' + n, base: CON_PANEL, destino });
      return (readFileSync(join(destino, '.env'), 'utf8')
        .match(/^PANEL_CLAVE=(.+)$/m) || [])[1];
    });
    assert.notEqual(frases[0], frases[1],
      'el bug original era justamente este: la misma clave en todos');
  });
});

test('el cartel que anunciaba la clave no va al entregable', () => {
  enCarpetaTemporal((tmp) => {
    const destino = join(tmp, 'p');
    crearProyecto({ cliente: 'Tienda Dos', base: CON_PANEL, destino });
    const html = readFileSync(join(destino, 'index.html'), 'utf8');
    assert.ok(!/Demo:\s*<b>/.test(html),
      'publicar la llave en la puerta es peor que no tener puerta');
    assert.match(html, /no protege los datos/,
      'y en su lugar tiene que quedar dicho qué es y qué no es esta pantalla');
  });
});

test('la frase NO se escribe en contexto.yml (la ficha se sube a git)', () => {
  enCarpetaTemporal((tmp) => {
    const destino = join(tmp, 'p');
    crearProyecto({ cliente: 'Tienda Tres', base: CON_PANEL, destino });
    const env = readFileSync(join(destino, '.env'), 'utf8');
    const frase = (env.match(/^PANEL_CLAVE=(.+)$/m) || [])[1];
    const ficha = readFileSync(join(destino, 'contexto.yml'), 'utf8');
    assert.ok(!ficha.includes(frase));
  });
});

test('ACCESO.md queda fuera de git, igual que el .env', () => {
  enCarpetaTemporal((tmp) => {
    const destino = join(tmp, 'p');
    crearProyecto({ cliente: 'Tienda Cuatro', base: CON_PANEL, destino });
    const ig = readFileSync(join(destino, '.gitignore'), 'utf8');
    assert.match(ig, /^ACCESO\.md$/m,
      'el archivo lleva la frase escrita: si se sube, la frase se sube');
  });
});

test('ACCESO.md dice que esto NO es autenticación', () => {
  const t = accesoMd('Tienda Cinco', 'torre-espiga-muelle-47');
  assert.match(t, /torre-espiga-muelle-47/);
  assert.match(t, /No es autenticaci[óo]n/i,
    'vender una puerta como cerradura es como se pierde un cliente');
  assert.match(t, /F12/, 'hay que decir POR QUÉ no protege');
  assert.match(t, /Supabase Auth/, 'y cuál es el camino de verdad');
  assert.match(t, /RLS/);
});

test('sin clave, adaptarEntregable no toca nada', () => {
  // Las pruebas viejas llaman con cuatro argumentos. Si eso rompiera el
  // HTML, el generador estaría a merced del orden de los parámetros.
  const html = "const U=[{email:'a@b.co',password:'admin123'}];";
  assert.equal(adaptarEntregable(html, {}, 'X'), html);
});

// ── 3 · La barrera ──────────────────────────────────────────

const revisar = (ruta, linea) =>
  reglaClaveDemo({ ruta, lineas: [linea] });

test('la regla caza una clave de demo en un entregable', () => {
  const h = revisar('Proyectos-Clientes/x/index.html',
    "const U=[{email:'a@b.co',password:'admin123'}];");
  assert.equal(h.length, 1);
  assert.equal(h[0].severidad, 'error', 'no se entrega y punto');
  assert.equal(h[0].regla, 'clave-demo');
  assert.match(h[0].pista, /crear-proyecto/, 'la pista tiene que decir cómo salir');
});

test('en las bases la clave de demo es legítima', () => {
  const h = revisar(
    'Sistema-de-Produccion/Sistema-de-Produccion/02-bases/auth/demo.html',
    "const USERS=[{email:'a@b.co',password:'admin123'}];");
  assert.equal(h.length, 0,
    'una demo de la fábrica necesita credenciales de demo');
});

test('un campo llamado "password" no es una contraseña', () => {
  // El falso positivo que casi hace inservible la regla: marcaba el
  // <input type="password" name="password"> de todas las cajas de login.
  const h = revisar('Proyectos-Clientes/x/index.html',
    '<input type="password" name="password" placeholder="Contraseña" required>');
  assert.equal(h.length, 0);
});

test('una línea no genera cuatro hallazgos', () => {
  const h = revisar('Proyectos-Clientes/x/index.html',
    "password:'admin123' clave:'demo123' pass:'123456'");
  assert.equal(h.length, 1, 'un aviso por línea, no uno por clave conocida');
});
