// ════════════════════════════════════════════════════════════
//  lib/brief.js — respuestas → ficha, y la compuerta de calidad.
//
//  Esta es la pieza que impide construir con datos inventados.
//  Si falla, un proyecto sale a producción con campos a medias.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  PASOS, FAMILIAS, BASES_CONOCIDAS,
  respuestasAFicha, validarFicha, todasLasPreguntas,
} from '../lib/brief.js';

const completas = {
  cliente: 'Casa Tela',
  dominio: 'casatela.co',
  sedes: 'una',
  objetivo: 'ecommerce-completo',
  primario: '#1B36C9',
  secundario: '#F5F7FB',
  pagos: 'whatsapp',
  motor: 'supabase',
  linea: 'starter',
};

// ══════════ ESTRUCTURA ══════════

test('cada pregunta va a un campo, y los ids no se repiten', () => {
  const qs = todasLasPreguntas();
  const ids = qs.map((q) => q.id);
  assert.equal(new Set(ids).size, ids.length, 'hay ids duplicados');
  for (const q of qs) assert.ok(q.campo, q.id + ' no dice a qué campo va');
});

test('toda opción de servicio pertenece a una familia declarada', () => {
  const servicio = todasLasPreguntas().find((q) => q.id === 'objetivo');
  const familias = new Set(FAMILIAS.map((f) => f.id));
  for (const o of servicio.opciones) {
    assert.ok(familias.has(o.familia), o.valor + ' apunta a familia inexistente');
  }
});

test('todo servicio ofrecido corresponde a una base que existe', () => {
  const servicio = todasLasPreguntas().find((q) => q.id === 'objetivo');
  for (const o of servicio.opciones) {
    assert.ok(BASES_CONOCIDAS.includes(o.valor),
      'se ofrece "' + o.valor + '" pero no es una base de 02-bases/');
  }
});

// ══════════ RESPUESTAS → FICHA ══════════

test('coloca cada respuesta en su ruta anidada', () => {
  const { ficha } = respuestasAFicha(completas);
  assert.equal(ficha.cliente, 'Casa Tela');
  assert.equal(ficha.marca.primario, '#1B36C9');
  assert.equal(ficha.entrega.dominio, 'casatela.co');
  assert.equal(ficha.base_de_datos.motor, 'supabase');
});

test('los campos de decisión (con _) no ensucian la ficha', () => {
  const { ficha } = respuestasAFicha(completas);
  assert.equal(ficha._objetivo, undefined);
  assert.equal(ficha._sedes, undefined);
});

test('resuelve la base desde el identificador del servicio', () => {
  assert.equal(respuestasAFicha({ objetivo: 'marketplace' }).base, 'marketplace');
  assert.equal(respuestasAFicha({ base: 'crm-simple' }).base, 'crm-simple');
});

test('un servicio desconocido no inventa una base', () => {
  assert.equal(respuestasAFicha({ objetivo: 'no-existe' }).base, null);
});

// ══════════ REGLAS DE NEGOCIO ══════════

test('varias sedes fuerzan línea pro, aunque se pida starter', () => {
  const { ficha, avisos } = respuestasAFicha({ ...completas, sedes: 'varias' });
  assert.equal(ficha.linea, 'pro');
  assert.ok(avisos.some((a) => /sedes/i.test(a)), 'y lo explica');
});

test('datos personales fuerzan línea pro', () => {
  const { ficha, avisos } = respuestasAFicha({ ...completas, sensibles: true });
  assert.equal(ficha.linea, 'pro');
  assert.ok(avisos.some((a) => /personales|RLS/i.test(a)));
});

test('una pasarela real avisa de quién abre la cuenta', () => {
  const { avisos } = respuestasAFicha({ ...completas, pagos: 'wompi' });
  assert.ok(avisos.some((a) => /CLIENTE|NIT/.test(a)),
    'el dinero de las ventas es del cliente, no del estudio');
});

test('cobrar por WhatsApp no dispara ese aviso', () => {
  const { avisos } = respuestasAFicha(completas);
  assert.ok(!avisos.some((a) => /NIT/.test(a)));
});

test('el motor local queda marcado como temporal', () => {
  const { avisos } = respuestasAFicha({ ...completas, motor: 'local' });
  assert.ok(avisos.some((a) => /temporal/i.test(a)));
});

test('sin fotos o sin contenido, queda dicho', () => {
  const { avisos } = respuestasAFicha({ ...completas, fotos: false, contenido_listo: 'no' });
  assert.ok(avisos.some((a) => /fotos/i.test(a)));
  assert.ok(avisos.some((a) => /[Cc]ontenido/.test(a)));
});

// ══════════ LA COMPUERTA ══════════

test('una ficha completa pasa', () => {
  assert.equal(validarFicha(completas).listo, true);
});

test('una ficha vacía no pasa y dice qué falta', () => {
  const v = validarFicha({});
  assert.equal(v.listo, false);
  assert.ok(v.faltan.length > 0);
  for (const f of v.faltan) assert.ok(f.pregunta, 'cada faltante nombra su pregunta');
});

test('falta un campo obligatorio → no pasa', () => {
  const sinDominio = { ...completas };
  delete sinDominio.dominio;
  const v = validarFicha(sinDominio);
  assert.equal(v.listo, false);
  assert.ok(v.faltan.some((f) => f.id === 'dominio'));
});

test('un campo opcional vacío no bloquea', () => {
  const sinTono = { ...completas };
  delete sinTono.tono;
  assert.equal(validarFicha(sinTono).listo, true);
});

test('rechaza un nombre que es un marcador de posición', () => {
  for (const nombre of ['Cliente X', 'prueba', 'Negocio 1', 'TEST']) {
    const v = validarFicha({ ...completas, cliente: nombre });
    assert.equal(v.listo, false, '"' + nombre + '" debería rechazarse');
  }
});

test('no rechaza un nombre real que contiene una de esas palabras', () => {
  assert.equal(validarFicha({ ...completas, cliente: 'Cliente Feliz SAS' }).listo, true);
});

// ══════════ NORMALIZACIONES — bugs vistos con un brief real ══════════

test('al WhatsApp sin indicativo se le antepone 57', () => {
  const { ficha, avisos } = respuestasAFicha({ ...completas, whatsapp: '3666778839' });
  assert.equal(ficha.apis.whatsapp_num, '573666778839',
    'un wa.me sin indicativo no abre');
  assert.ok(avisos.some((a) => /indicativo/i.test(a)), 'y avisa para que se confirme');
});

test('un WhatsApp que ya trae el 57 no se duplica', () => {
  const { ficha } = respuestasAFicha({ ...completas, whatsapp: '573001234567' });
  assert.equal(ficha.apis.whatsapp_num, '573001234567');
});

test('un WhatsApp con espacios y signos se limpia', () => {
  const { ficha } = respuestasAFicha({ ...completas, whatsapp: '+57 300 123 4567' });
  assert.equal(ficha.apis.whatsapp_num, '573001234567');
});

test('un número que no cuadra se conserva pero se avisa', () => {
  const { ficha, avisos } = respuestasAFicha({ ...completas, whatsapp: '12345' });
  assert.equal(ficha.apis.whatsapp_num, '12345', 'no se inventa un número');
  assert.ok(avisos.some((a) => /no parece.*válido/i.test(a)));
});

test('"no" como dominio se vuelve "por comprar"', () => {
  for (const r of ['no', 'No', 'ninguno', 'todavía no']) {
    const { ficha } = respuestasAFicha({ ...completas, dominio: r });
    assert.equal(ficha.entrega.dominio, 'por comprar', 'respuesta: ' + r);
  }
});

test('un dominio real no se toca', () => {
  const { ficha } = respuestasAFicha({ ...completas, dominio: 'tacosmauricio.co' });
  assert.equal(ficha.entrega.dominio, 'tacosmauricio.co');
});
