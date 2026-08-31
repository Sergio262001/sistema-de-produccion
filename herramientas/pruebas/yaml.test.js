// ════════════════════════════════════════════════════════════
//  lib/yaml.js — lee y escribe las fichas de contexto.
//  Si esto se rompe, todas las fichas se leen mal y el generador
//  construye proyectos con datos equivocados.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerYaml, escribirYaml } from '../lib/yaml.js';

test('lee pares clave: valor', () => {
  const f = leerYaml('cliente: Casa Tela\nlinea: pro');
  assert.equal(f.cliente, 'Casa Tela');
  assert.equal(f.linea, 'pro');
});

test('lee mapas anidados', () => {
  const f = leerYaml([
    'base_de_datos:',
    '  motor: supabase',
    '  acceso: rls_por_rol',
  ].join('\n'));
  assert.deepEqual(f.base_de_datos, { motor: 'supabase', acceso: 'rls_por_rol' });
});

test('lee listas en bloque y en línea', () => {
  const f = leerYaml([
    'env:',
    '  - SUPABASE_URL',
    '  - GA4_ID',
    'idiomas: [es, en]',
  ].join('\n'));
  assert.deepEqual(f.env, ['SUPABASE_URL', 'GA4_ID']);
  assert.deepEqual(f.idiomas, ['es', 'en']);
});

// ── El bug: un color hexadecimal empieza por # y se comía como comentario ──
test('NO trata el # de un color como comentario', () => {
  const f = leerYaml('marca:\n  primario: "#1B36C9"');
  assert.equal(f.marca.primario, '#1B36C9',
    'el # dentro de comillas es parte del valor, no un comentario');
});

test('sí quita los comentarios de verdad', () => {
  const f = leerYaml('motor: supabase   # esto es un comentario\n# linea entera');
  assert.equal(f.motor, 'supabase');
  assert.equal(f.linea, undefined);
});

test('conserva como texto los números que vienen entre comillas', () => {
  // Un teléfono con ceros a la izquierda dejaría de serlo si se volviera número
  const f = leerYaml('whatsapp_num: "573001234567"');
  assert.equal(f.whatsapp_num, '573001234567');
  assert.equal(typeof f.whatsapp_num, 'string');
});

test('convierte números y booleanos sin comillas', () => {
  const f = leerYaml('envio: 8000\nimpuesto: 0\nnecesita_auth: true');
  assert.equal(f.envio, 8000);
  assert.equal(f.impuesto, 0);
  assert.equal(f.necesita_auth, true);
});

test('ignora líneas vacías sin perder el nivel de anidación', () => {
  const f = leerYaml([
    'marca:',
    '  primario: "#000"',
    '',
    '  secundario: "#FFF"',
  ].join('\n'));
  assert.equal(f.marca.secundario, '#FFF');
});

// ── Ida y vuelta: lo que escribimos se tiene que poder volver a leer ──
test('escribir y volver a leer devuelve la misma ficha', () => {
  const original = {
    cliente: 'Casa Tela',
    linea: 'pro',
    base_de_datos: { motor: 'supabase' },
    marca: { primario: '#1B36C9', inicial: 'C' },
    env: ['SUPABASE_URL', 'GA4_ID'],
  };
  const vuelta = leerYaml(escribirYaml(original));
  assert.deepEqual(vuelta, original);
});

test('al escribir, entrecomilla lo que se leería mal', () => {
  const salida = escribirYaml({ marca: { primario: '#1B36C9' }, creado: '2026-08-31' });
  assert.match(salida, /primario: "#1B36C9"/);
  assert.match(salida, /creado: "2026-08-31"/,
    'una fecha sin comillas se leería como número');
});

test('no explota con entrada vacía o basura', () => {
  assert.deepEqual(leerYaml(''), {});
  assert.deepEqual(leerYaml('\n\n   \n'), {});
  assert.doesNotThrow(() => leerYaml('esto no es yaml ::: {[}'));
});
