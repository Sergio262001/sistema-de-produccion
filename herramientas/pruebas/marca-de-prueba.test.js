// ════════════════════════════════════════════════════════════
//  LA MARCA DE PRUEBA.
//
//  Durante meses el generador dejó sus pruebas dentro de
//  `Proyectos-Clientes/`, junto a los entregables de verdad. Se acumularon
//  NUEVE carpetas (cafe-muestra, casa-tela, clinica-sur, tacos-juan,
//  tacos-mauricio, taller-norte, panaderia-la-espiga, floristeria-el-jardin,
//  cafe-raiz), tres se colaron a git, el .gitignore fue creciendo con un
//  parche por carpeta, y al final ya nadie distinguía cuál era un cliente.
//
//  El arreglo es que la carpeta lo diga de sí misma: sin ficha de cliente,
//  el generador escribe ES-UNA-PRUEBA.md. El validador salta esas carpetas
//  y el panel las etiqueta.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, existsSync, readFileSync,
         writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { crearProyecto, esPrueba, tieneFichaDeCliente,
         MARCA_PRUEBA } from '../crear-proyecto.js';
import { validar } from '../validar.js';

function enCarpetaTemporal(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'marca-'));
  try { return fn(dir); } finally { rmSync(dir, { recursive: true, force: true }); }
}

// ── Quién es una prueba y quién no ──────────────────────────

test('sin ficha de cliente, el proyecto se marca como prueba', () => {
  enCarpetaTemporal((tmp) => {
    const destino = join(tmp, 'p');
    const r = crearProyecto({
      cliente: 'Negocio De Prueba', base: 'landing-modular', destino,
    });
    assert.ok(r.ok, r.error);
    assert.ok(existsSync(join(destino, MARCA_PRUEBA)),
      'una generación sin ficha SALE del contexto.ejemplo.yml de la base: ' +
      'el contenido es de un negocio inventado y tiene que decirlo');
    assert.ok(esPrueba(destino));
  });
});

test('con ficha de cliente NO se marca', () => {
  enCarpetaTemporal((tmp) => {
    const destino = join(tmp, 'p');
    const r = crearProyecto({
      cliente: 'Cliente Real', base: 'landing-modular', destino,
      ficha: { pagina: { hero: { titular: 'Algo que escribió una persona' } } },
    });
    assert.ok(r.ok, r.error);
    assert.ok(!existsSync(join(destino, MARCA_PRUEBA)),
      'marcar un entregable real como prueba lo haría invisible al validador');
    assert.ok(!esPrueba(destino));
  });
});

test('la seña de cliente es que la ficha traiga bloques llenos', () => {
  assert.equal(tieneFichaDeCliente({}), false);
  assert.equal(tieneFichaDeCliente(null), false);
  assert.equal(tieneFichaDeCliente({ pagina: {} }), false,
    'un bloque vacío no es una respuesta del cliente');
  assert.equal(tieneFichaDeCliente({ pagina: { hero: {} } }), true);
  assert.equal(tieneFichaDeCliente({ apis: { whatsapp_num: '3...' } }), true);
  assert.equal(tieneFichaDeCliente({ entrega: { dominio: 'x.com' } }), true);
});

// ── La consecuencia: el validador deja de gritar por ellas ──

test('el validador salta las carpetas marcadas', () => {
  enCarpetaTemporal((tmp) => {
    // Un archivo con un error que el validador SIEMPRE ve.
    // Una imagen sin alt: el hallazgo más simple y estable del validador.
    const malo = "<img src=\"foto.jpg\">";
    const prueba = join(tmp, 'una-prueba');
    const real   = join(tmp, 'un-cliente');
    for (const d of [prueba, real]) {
      mkdirSync(d, { recursive: true });
      writeFileSync(join(d, 'index.html'), malo, 'utf8');
    }
    writeFileSync(join(prueba, MARCA_PRUEBA), 'es una prueba', 'utf8');

    const r = validar(tmp);
    const rutas = r.hallazgos.map((h) => h.ruta).join(' ');
    assert.ok(!/una-prueba/.test(rutas),
      'los hallazgos de una prueba son ruido: hablan de un negocio de ejemplo');
    assert.ok(/un-cliente/.test(rutas),
      'y los de un entregable de verdad tienen que seguir saliendo');
  });
});

test('apuntar el validador A la carpeta de prueba sí la revisa', () => {
  enCarpetaTemporal((tmp) => {
    writeFileSync(join(tmp, MARCA_PRUEBA), 'es una prueba', 'utf8');
    writeFileSync(join(tmp, 'index.html'), '<img src="foto.jpg">', 'utf8');
    const r = validar(tmp);
    assert.ok(r.hallazgos.length > 0,
      'si la nombras explícitamente, sabes lo que estás pidiendo');
  });
});

// ── Lo que dice la marca ────────────────────────────────────

test('la marca explica cómo no volver a dejarla ahí', () => {
  enCarpetaTemporal((tmp) => {
    const destino = join(tmp, 'p');
    crearProyecto({ cliente: 'X', base: 'landing-modular', destino });
    const t = readFileSync(join(destino, MARCA_PRUEBA), 'utf8');
    assert.match(t, /--destino/,
      'la salida tiene que decir cómo generar fuera de Proyectos-Clientes/');
    assert.match(t, /--ficha/,
      'y cómo se genera un proyecto de verdad');
    assert.match(t, /[Bb][óo]rrala/,
      'tiene que dejar claro que se puede borrar sin pensarlo');
  });
});
