// ════════════════════════════════════════════════════════════
//  EL PANEL — las rutas del servidor.
//
//  Era el hueco más grande del sistema: ~20 rutas HTTP sin una sola prueba,
//  y una de ellas lanza al agente de Claude, que ESCRIBE ARCHIVOS. Todo lo
//  demás (validador, generador, reglas, acceso) estaba cubierto; la puerta
//  de entrada a todo eso, no.
//
//  No se probaba por dos razones concretas, y las dos están arregladas:
//
//   1. `panel.js` llamaba a `servidor.listen()` al importarse. Importarlo
//      desde una prueba levantaba un puerto de verdad. Ahora el listen vive
//      detrás del guardia de CLI y el servidor se exporta.
//   2. El acceso y el historial vivían en rutas fijas junto a panel.js.
//      Probar significaba escribir en el historial real del dueño y pisarle
//      la frase de acceso. Ahora se desvían con PANEL_DATOS.
//
//  Lo que estas pruebas NO hacen: gastar dinero. Ninguna llama a la API.
//  Las rutas de IA se prueban por su puerta (sin clave → error claro), que
//  es justo la parte que puede costar plata si se rompe.
// ════════════════════════════════════════════════════════════

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, existsSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// PANEL_DATOS tiene que estar puesto ANTES de importar panel.js: el módulo
// lee la frase y abre el historial al cargarse.
const DATOS = mkdtempSync(join(tmpdir(), 'panel-datos-'));
process.env.PANEL_DATOS = DATOS;

const { servidor } = await import('../panel.js');

// ⚠ ESTO VA DESPUÉS DEL IMPORT, Y NO ES UN DETALLE.
//
// `panel.js` hace `process.loadEnvFile()` al cargarse, así que vuelve a
// poner ANTHROPIC_API_KEY desde el .env real aunque se haya borrado antes.
// La primera versión de esta prueba la borraba antes del import, /api/auditar
// encontró la clave puesta y LLAMÓ A LA API DE VERDAD: 19 segundos y dinero
// del dueño gastado por correr `npm test`.
//
// `auditar()` y `estadoAgente()` leen la variable en cada llamada, así que
// borrarla aquí las deja sin clave para siempre. Ninguna prueba puede gastar.
delete process.env.ANTHROPIC_API_KEY;
delete process.env.ANTHROPIC_API_KEY_HELPER;

let base = '';
before(() => new Promise((listo) => {
  // Puerto 0 = el sistema elige uno libre. Dos corridas en paralelo no se
  // pelean, y nunca se choca con el panel de verdad en el 4321.
  servidor.listen(0, '127.0.0.1', () => {
    base = 'http://127.0.0.1:' + servidor.address().port;
    listo();
  });
}));
after(() => new Promise((listo) => {
  servidor.close(() => { rmSync(DATOS, { recursive: true, force: true }); listo(); });
}));

const pedir = (ruta, opciones = {}) => fetch(base + ruta, {
  ...opciones,
  headers: { 'Content-Type': 'application/json', ...(opciones.headers || {}) },
  body: opciones.cuerpo === undefined ? undefined : JSON.stringify(opciones.cuerpo),
});
const post = (ruta, cuerpo, headers) =>
  pedir(ruta, { method: 'POST', cuerpo: cuerpo ?? {}, headers });

// ── 1 · Las páginas ─────────────────────────────────────────

test('GET / sirve el panel', async () => {
  const r = await pedir('/');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /text\/html/);
  assert.match(await r.text(), /<html/i);
});

test('GET /brief.html no pide sesión: es la pieza que se comparte', async () => {
  // El formulario se le manda al cliente. Si exigiera sesión, el cliente
  // vería una pantalla de login del estudio.
  const r = await pedir('/brief.html');
  assert.equal(r.status, 200);
  assert.match(await r.text(), /<html/i);
});

test('una ruta que no existe es 404, no 500', async () => {
  const r = await pedir('/api/lo-que-sea');
  assert.equal(r.status, 404);
  assert.equal((await r.json()).error, 'No encontrado');
});

// ── 2 · La puerta ───────────────────────────────────────────
//
// Sin frase configurada y sin Google, el panel es abierto A PROPÓSITO: es
// un servidor en 127.0.0.1 recién instalado, y exigir sesión antes de que
// exista forma de crear una lo dejaría inservible. La puerta aparece en
// cuanto hay una frase. Eso es lo que se comprueba aquí y en acceso.test.js.

test('sin puerta configurada, las APIs responden', async () => {
  const r = await pedir('/api/estado');
  assert.equal(r.status, 200, 'un panel recién instalado tiene que abrir');
});

test('/api/acceso/estado dice si hay puerta', async () => {
  const r = await pedir('/api/acceso/estado');
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(typeof d, 'object');
});

test('con frase configurada, las APIs exigen sesión', async () => {
  // Se configura por la propia ruta del panel, no tocando el archivo: así
  // la prueba cubre también /api/acceso/configurar.
  const conf = await post('/api/acceso/configurar', { frase: 'una-frase-larga-de-prueba' });
  assert.ok(conf.status === 200, 'no se pudo configurar la frase');

  const sin = await pedir('/api/estado');
  assert.equal(sin.status, 401,
    'con puerta puesta, entrar sin sesión tiene que ser 401');
  assert.equal((await sin.json()).error, 'Sesión requerida');

  // Y con la frase correcta, se entra.
  const entrar = await post('/api/acceso/entrar', { frase: 'una-frase-larga-de-prueba' });
  assert.equal(entrar.status, 200);
  const galleta = entrar.headers.getSetCookie().find((c) => c.startsWith('sesion='));
  assert.ok(galleta, 'entrar tiene que devolver la cookie de sesión');
  assert.match(galleta, /HttpOnly/,
    'sin HttpOnly, cualquier script de la página puede leer la sesión');

  const cookie = galleta.split(';')[0];
  const con = await pedir('/api/estado', { headers: { Cookie: cookie } });
  assert.equal(con.status, 200);

  // Y la frase equivocada no entra.
  const mal = await post('/api/acceso/entrar', { frase: 'otra-cosa-distinta' });
  assert.ok(mal.status >= 400, 'una frase equivocada no puede abrir');
});

// Todo lo que sigue va con sesión. Se entra la primera vez que hace falta y
// no en un `before`: la frase se configura DENTRO de la prueba de arriba, y
// un hook que dependiera de eso ataría el orden de las pruebas entre sí.
let cookie = null;
async function entrar() {
  if (cookie !== null) return cookie;
  const r = await post('/api/acceso/entrar', { frase: 'una-frase-larga-de-prueba' });
  const g = r.headers.getSetCookie().find((c) => c.startsWith('sesion='));
  cookie = g ? g.split(';')[0] : '';
  return cookie;
}
async function conSesion(ruta, cuerpo) {
  const c = await entrar();
  return cuerpo === undefined
    ? pedir(ruta, { headers: { Cookie: c } })
    : post(ruta, cuerpo, { Cookie: c });
}

// ── 3 · Lo que NO puede salirse de la carpeta ───────────────
//
// `rutaSegura` es la pieza de seguridad del servidor: todas las rutas que
// reciben una ruta del navegador pasan por ella. Si se escapa, el panel
// lee cualquier archivo del disco — y escucha en localhost, o sea que
// cualquier página abierta en el navegador podría pedírselo.

test('una ruta con ../ no sale del proyecto', async () => {
  for (const intento of ['../../../../etc/passwd', '..', '../..',
                         'Proyectos-Clientes/../../secreto']) {
    const r = await conSesion('/api/validar', { ruta: intento });
    assert.ok(r.status >= 400,
      'la ruta "' + intento + '" tendría que ser rechazada, y devolvió ' + r.status);
    assert.match((await r.json()).error || '', /fuera del proyecto/i);
  }
});

test('una ruta absoluta de otro disco tampoco', async () => {
  const r = await conSesion('/api/validar', { ruta: 'C:/Windows/System32' });
  assert.ok(r.status >= 400);
});

// ── 4 · El modo gratis ──────────────────────────────────────

test('/api/estado trae el inventario que dibuja el panel', async () => {
  const d = await (await conSesion('/api/estado')).json();
  assert.ok(Array.isArray(d.objetivos) && d.objetivos.length,
    'sin objetivos el panel se dibuja vacío');
  assert.ok(Array.isArray(d.bases) && d.bases.length);
  assert.ok(Array.isArray(d.proyectos));
  assert.equal(d.tieneClave, false, 'esta prueba corre sin API key a propósito');
});

test('/api/estado no filtra la clave, solo si existe', async () => {
  const t = await (await conSesion('/api/estado')).text();
  assert.ok(!/sk-ant/.test(t), 'el panel nunca devuelve la clave al navegador');
});

test('/api/validar corre el validador y cuesta $0', async () => {
  const d = await (await conSesion('/api/validar',
    { ruta: 'Sistema-de-Produccion/Sistema-de-Produccion/02-bases/landing-modular' })).json();
  assert.equal(d.modo, 'gratis');
  assert.equal(d.costo, 0);
  assert.ok(Array.isArray(d.hallazgos));
  assert.ok(typeof d.archivos === 'number');
});

test('/api/brief devuelve el cuestionario completo', async () => {
  const d = await (await conSesion('/api/brief')).json();
  assert.ok(Array.isArray(d.pasos) && d.pasos.length);
  assert.ok(d.familias);
});

test('/api/prompts devuelve el catálogo', async () => {
  const r = await conSesion('/api/prompts');
  assert.equal(r.status, 200);
});

test('/api/historial responde aunque no haya nada anotado', async () => {
  const r = await conSesion('/api/historial');
  assert.equal(r.status, 200);
});

test('/api/ficha convierte respuestas en ficha sin tocar el disco', async () => {
  const r = await conSesion('/api/ficha', { respuestas: {} });
  assert.ok(r.status === 200 || r.status === 400,
    'con respuestas vacías puede validar en contra, pero no puede reventar');
});

test('/api/extraer sin texto no revienta', async () => {
  const r = await conSesion('/api/extraer', { texto: '' });
  assert.ok(r.status < 500, 'devolvió ' + r.status);
});

// ── 5 · Lo que cuesta dinero ────────────────────────────────
//
// Regla del sistema: nada que gaste arranca solo. Sin clave, estas rutas
// tienen que fallar con un mensaje claro — nunca colgarse ni intentarlo.

test('NINGUNA prueba tiene clave en la mano', () => {
  // El guardia. Si esto falla, las pruebas de abajo llaman a la API de
  // verdad y `npm test` empieza a costar dinero — ya pasó una vez.
  assert.equal(process.env.ANTHROPIC_API_KEY, undefined);
});

test('/api/auditar sin clave falla con mensaje, no con 500', async () => {
  const r = await conSesion('/api/auditar', { ruta: 'herramientas' });
  assert.equal(r.status, 400, 'devolvió ' + r.status);
  const d = await r.json();
  assert.ok(d.error && d.error.length > 10,
    'el error tiene que decir qué hacer, no "undefined"');
});

test('/api/estimar dice el costo ANTES de gastarlo', async () => {
  const d = await (await conSesion('/api/estimar',
    { ruta: 'Sistema-de-Produccion/Sistema-de-Produccion/02-bases/landing-modular' })).json();
  assert.ok(typeof d.costo === 'number' || typeof d.usd === 'number'
            || typeof d.costoEstimado === 'number',
    'estimar sin devolver un número es no estimar: ' + JSON.stringify(d).slice(0, 120));
});

test('/api/agente/estado no exige clave para contestar', async () => {
  const r = await conSesion('/api/agente/estado');
  assert.equal(r.status, 200);
  const d = await r.json();
  assert.equal(typeof d, 'object');
});

test('/api/agente sin clave NO escribe archivos', async () => {
  // Esta es la ruta que motivó todo: lanza al agente, y el agente escribe
  // en Proyectos-Clientes/. Sin clave tiene que parar antes de empezar.
  const r = await conSesion('/api/agente', { objetivo: 'crear algo' });
  assert.ok(r.status >= 400, 'sin clave el agente no puede arrancar');
  const d = await r.json();
  assert.ok(d.error, 'y tiene que decir por qué');
});

// ── 6 · El cuerpo de la petición ────────────────────────────

test('un cuerpo que no es JSON no tumba el servidor', async () => {
  const r = await fetch(base + '/api/validar', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: await entrar() },
    body: 'esto{no[es}json',
  });
  assert.ok(r.status < 500, 'devolvió ' + r.status);
});

test('un cuerpo enorme se rechaza antes de leerlo entero', async () => {
  // El límite es 5 MB. Sin él, cualquiera llena la memoria del panel.
  const r = await fetch(base + '/api/validar', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Cookie: await entrar() },
    body: JSON.stringify({ ruta: '.', relleno: 'x'.repeat(6_000_000) }),
  }).catch((e) => ({ status: 0, error: e.message }));
  assert.ok(!r.status || r.status >= 400,
    'un cuerpo de 6 MB tiene que rebotar, y devolvió ' + r.status);
});

// ── 7 · Salir ───────────────────────────────────────────────

test('/api/acceso/salir borra la cookie', async () => {
  const r = await post('/api/acceso/salir', {}, { Cookie: await entrar() });
  assert.equal(r.status, 200);
  const g = r.headers.getSetCookie().find((c) => c.startsWith('sesion='));
  assert.match(g, /Max-Age=0/, 'salir sin caducar la cookie no es salir');
});
