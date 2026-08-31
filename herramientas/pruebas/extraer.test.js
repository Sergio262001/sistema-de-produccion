// ════════════════════════════════════════════════════════════
//  lib/extraer.js — convierte lo que manda el cliente en respuestas.
//
//  Los tres primeros casos son BUGS REALES que aparecieron probando
//  con un brief de verdad. Están aquí para que no vuelvan.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { extraerPorPatrones, leerBloqueBrief } from '../lib/extraer.js';

// ══════════ REGRESIONES ══════════

test('regresión · "le escribo de parte de X" no mete "parte de" en el nombre', () => {
  const { respuestas } = extraerPorPatrones(
    'Buenas, le escribo de parte de Panaderia La Espiga.');
  assert.equal(respuestas.cliente, 'Panaderia La Espiga',
    'capturaba "parte de Panaderia La Espiga"');
});

test('regresión · un dominio .com.co no se corta en .com', () => {
  const { respuestas } = extraerPorPatrones('Nuestro dominio es laespiga.com.co');
  assert.equal(respuestas.dominio, 'laespiga.com.co',
    'la alternancia tomaba .com primero y perdía el .co');
});

test('regresión · "una tienda en línea" no cuenta como sede física', () => {
  const { respuestas } = extraerPorPatrones(
    'Tenemos 3 sedes en Medellin. Queremos una tienda en linea para vender.');
  assert.equal(respuestas.sedes, 'varias',
    '"una tienda" disparaba el guardia de singular y anulaba las 3 sedes');
  assert.equal(respuestas.linea, 'pro', 'multisede obliga a pro');
});

// ══════════ MULTISEDE ══════════

test('una sola sede no es multisede', () => {
  const { respuestas } = extraerPorPatrones('Tenemos una sede en Bogota.');
  assert.equal(respuestas.sedes, undefined);
  assert.equal(respuestas.linea, undefined);
});

test('cuenta sedes escritas con letra', () => {
  const { respuestas } = extraerPorPatrones('Tenemos dos sucursales.');
  assert.equal(respuestas.sedes, 'varias');
});

test('datos personales también obligan a pro', () => {
  const { respuestas } = extraerPorPatrones(
    'Guardamos la historia clinica de cada paciente.');
  assert.equal(respuestas.sensibles, true);
  assert.equal(respuestas.linea, 'pro');
});

// ══════════ CAMPOS SUELTOS ══════════

test('normaliza el WhatsApp con indicativo', () => {
  assert.equal(extraerPorPatrones('escribeme al 3105557788').respuestas.whatsapp,
    '573105557788');
  assert.equal(extraerPorPatrones('mi numero es +57 310 555 7788').respuestas.whatsapp,
    '573105557788');
});

test('toma los dos primeros colores como primario y fondo', () => {
  const { respuestas } = extraerPorPatrones('Los colores son #8B4513 y #F5EFE6');
  assert.equal(respuestas.primario, '#8B4513');
  assert.equal(respuestas.secundario, '#F5EFE6');
  assert.equal(respuestas.tienemarca, true);
});

test('no confunde un correo con el dominio del negocio', () => {
  const { respuestas } = extraerPorPatrones('Escribime a contacto@gmail.com');
  assert.equal(respuestas.dominio, undefined,
    'gmail.com no es el dominio del cliente');
});

test('elige la base por lo que el cliente describe', () => {
  const casos = [
    ['Queremos vender por internet con inventario', 'ecommerce-completo'],
    ['Necesitamos mostrar la carta del restaurante',  'menu-con-panel-admin'],
    ['Una pagina para que pidan cita en la clinica',  'landing-modular'],
    ['Un marketplace con varios vendedores',          'marketplace'],
  ];
  for (const [texto, esperada] of casos) {
    assert.equal(extraerPorPatrones(texto).respuestas.objetivo, esperada, texto);
  }
});

test('lo que el documento no dice, queda vacío', () => {
  const { respuestas } = extraerPorPatrones('Hola, quiero una pagina.');
  assert.equal(respuestas.cliente, undefined);
  assert.equal(respuestas.whatsapp, undefined);
  assert.equal(respuestas.primario, undefined);
});

// ══════════ BLOQUE DEL FORMULARIO ══════════

const bloque = (obj) =>
  'BRIEF\n\n--- BRIEF-ESTUDIO v1 ---\n' + JSON.stringify(obj) + '\n--- FIN BRIEF ---';

test('el bloque del formulario se lee exacto, no por patrones', () => {
  const r = extraerPorPatrones(bloque({
    servicio: 'crm-simple', cliente: 'Óptica Luz', linea: 'pro', fotos: false,
  }));
  assert.equal(r.fuente, 'formulario');
  assert.equal(r.costo, 0);
  assert.equal(r.respuestas.cliente, 'Óptica Luz');
  assert.equal(r.respuestas.fotos, false, 'un false explícito no se pierde');
  assert.equal(r.base, 'crm-simple');
});

test('el bloque gana sobre lo que digan los patrones', () => {
  const texto = 'Somos Panaderia Otra y queremos un menu QR.\n'
    + bloque({ servicio: 'ecommerce-completo', cliente: 'El Nombre Correcto' });
  const r = extraerPorPatrones(texto);
  assert.equal(r.respuestas.cliente, 'El Nombre Correcto');
  assert.equal(r.base, 'ecommerce-completo');
});

test('un bloque con JSON roto cae a los patrones en vez de explotar', () => {
  const texto = 'Somos Cafe Raiz.\n--- BRIEF-ESTUDIO v1 ---\n{roto,,}\n--- FIN BRIEF ---';
  assert.equal(leerBloqueBrief(texto), null);
  const r = extraerPorPatrones(texto);
  assert.equal(r.fuente, 'texto libre');
  assert.equal(r.respuestas.cliente, 'Cafe Raiz');
});

test('no explota con entrada vacía', () => {
  assert.doesNotThrow(() => extraerPorPatrones(''));
  assert.doesNotThrow(() => extraerPorPatrones(null));
  assert.deepEqual(extraerPorPatrones('').respuestas, {});
});

test('"somos una panaderia artesanal" no se confunde con un nombre', () => {
  const { respuestas } = extraerPorPatrones('Somos una panaderia artesanal de barrio.');
  assert.equal(respuestas.cliente, undefined,
    'exigir mayúscula en el nombre evita capturar una descripción');
});
