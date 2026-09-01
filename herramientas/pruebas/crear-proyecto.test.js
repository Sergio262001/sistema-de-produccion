// ════════════════════════════════════════════════════════════
//  crear-proyecto.js — de ficha a proyecto que arranca.
//
//  Se prueban las funciones puras (slug, adaptación del entregable,
//  .env, package.json). La generación en disco se verifica corriendo
//  el CLI, no aquí: estas pruebas no deben escribir nada.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  aSlug, listarBases, construirFicha,
  adaptarEntregable, dependenciasDe, packageJson, envDelProyecto, ponerEnContexto,
} from '../crear-proyecto.js';

// ══════════ SLUG ══════════

test('el slug quita tildes y ñ', () => {
  assert.equal(aSlug('Café Raíz'), 'cafe-raiz');
  assert.equal(aSlug('Ñandú S.A.'), 'nandu-s-a');
  assert.equal(aSlug('Panadería La Espiga'), 'panaderia-la-espiga');
});

test('el slug no deja guiones sueltos en los bordes', () => {
  assert.equal(aSlug('  ¡Hola!  '), 'hola');
  assert.equal(aSlug('--x--'), 'x');
});

// ══════════ BASES ══════════

test('las 9 bases del sistema están disponibles', () => {
  const bases = listarBases();
  for (const b of ['ecommerce-completo', 'menu-con-panel-admin', 'landing-modular',
                   'auth', 'crm-simple', 'marketplace', 'suscripciones',
                   'carrito-reutilizable', 'dashboard-analytics']) {
    assert.ok(bases.includes(b), 'falta la base ' + b);
  }
});

// ══════════ FICHA ══════════

test('la identidad de otro negocio NO se hereda del ejemplo', () => {
  // El bug real: un cliente nuevo salía con el dominio de Casa Tela.
  const ejemplo = {
    cliente: 'Casa Tela',
    marca: { primario: '#1B36C9', subtitulo: 'Tienda de telas · Bogotá', tono: 'sobrio' },
    entrega: { dominio: 'casatela.co', hosting: 'vercel' },
  };
  const ficha = construirFicha(ejemplo, {
    proyecto: 'Óptica Luz', cliente: 'Óptica Luz', base: 'crm-simple',
    marca: { primario: '#0E7490' },
  });

  assert.equal(ficha.cliente, 'Óptica Luz');
  assert.equal(ficha.marca.primario, '#0E7490', 'lo que se pasa, manda');
  assert.equal(ficha.marca.subtitulo, 'POR DEFINIR');
  assert.equal(ficha.marca.tono, 'POR DEFINIR');
  assert.equal(ficha.entrega.dominio, 'POR DEFINIR');
  assert.equal(ficha.entrega.hosting, 'vercel', 'lo que no es identidad sí se hereda');
});

test('la ficha nueva queda marcada como en construcción y fechada', () => {
  const ficha = construirFicha({}, { proyecto: 'X', cliente: 'X', base: 'auth' });
  assert.equal(ficha.entrega.estado, 'en construccion');
  assert.match(ficha.entrega.creado, /^\d{4}-\d{2}-\d{2}$/);
});

// ══════════ ENTREGABLE ══════════

const demo = [
  '<title>Base: Ecommerce · Demo</title>',
  '<style>:root{--brand:#1B36C9;--bg:#F5F7FB;}',
  '.sysbar{background:#0C1322;}',
  '.toggle button{border:0;}</style>',
  '<div class="sysbar"><div class="in"><span>base: x</span></div></div>',
  '<div class="app"><div class="logo">C</div></div>',
].join('\n');

test('quita la sysbar: el andamiaje de demo no va al cliente', () => {
  const out = adaptarEntregable(demo, {}, 'Casa Tela');
  assert.ok(!out.includes('<div class="sysbar">'), 'queda el marcado de la sysbar');
  assert.ok(!/\.sysbar\{/.test(out), 'queda el CSS huérfano de la sysbar');
  assert.ok(out.includes('<div class="app">'), 'no debe tocar el contenido real');
});

test('aplica los tokens de marca del cliente', () => {
  const out = adaptarEntregable(demo, { primario: '#8B4513', secundario: '#F5EFE6' }, 'X');
  assert.match(out, /--brand:#8B4513/);
  assert.match(out, /--bg:#F5EFE6/);
});

test('pone el nombre del cliente en el título y la inicial en el logo', () => {
  const out = adaptarEntregable(demo, { inicial: 'T' }, 'Taller Norte');
  assert.match(out, /<title>Taller Norte<\/title>/);
  assert.match(out, /class="logo">T</);
});

test('sin tokens de marca, el entregable no se rompe', () => {
  const out = adaptarEntregable(demo, {}, 'X');
  assert.match(out, /--brand:#1B36C9/, 'conserva el valor de la base');
});

// ══════════ QUE ARRANQUE ══════════

test('instala solo el cliente de base de datos que la ficha pide', () => {
  assert.deepEqual(dependenciasDe({ base_de_datos: { motor: 'supabase' } }),
    { '@supabase/supabase-js': '^2.45.0' });
  assert.deepEqual(dependenciasDe({ base_de_datos: { motor: 'firebase' } }),
    { firebase: '^12.15.0' });
  assert.deepEqual(dependenciasDe({ base_de_datos: { motor: 'local' } }), {},
    'sin motor remoto no hace falta ningún cliente');
});

test('el package.json trae los comandos para correr y validar', () => {
  const p = JSON.parse(packageJson('casa-tela', { base_de_datos: { motor: 'supabase' } }));
  assert.equal(p.name, 'casa-tela');
  assert.equal(p.type, 'module');
  assert.ok(p.scripts.dev, 'sin dev no arranca');
  assert.ok(p.scripts.validar, 'sin validar no hay puerta antes de entregar');
  assert.ok(p.devDependencies.vite, 'Vite es lo que permite leer el .env');
});

test('el .env trae lo que la ficha sabe y marca lo que falta', () => {
  const env = envDelProyecto({
    cliente: 'Casa Tela',
    base_de_datos: { motor: 'supabase' },
    apis: { whatsapp_num: '573001234567', pagos: 'wompi', analitica: 'ga4' },
  });
  assert.match(env, /DB_MOTOR=supabase/);
  assert.match(env, /WHATSAPP_NUM=573001234567/, 'lo conocido va puesto');
  assert.match(env, /SUPABASE_URL=FALTA/, 'lo desconocido queda visible');
  assert.match(env, /WOMPI_PUBLIC_KEY=FALTA/);
  assert.match(env, /GA4_ID=FALTA/);
  assert.match(env, /NUNCA se commitea/, 'la advertencia va en el archivo');
});

test('el .env avisa de quién abre la cuenta de la pasarela', () => {
  const env = envDelProyecto({ apis: { pagos: 'wompi' }, base_de_datos: { motor: 'local' } });
  assert.match(env, /EL CLIENTE/, 'el dinero de las ventas es del cliente');
});

test('un WhatsApp sin definir no se cuela como si fuera real', () => {
  const env = envDelProyecto({ apis: { whatsapp_num: 'POR DEFINIR' } });
  assert.ok(!/WHATSAPP_NUM=POR DEFINIR/.test(env),
    'un marcador de posición no debe quedar como valor');
});

// ══════════ EL CONTEXT DEL ENTREGABLE ══════════
// Se entregó una página que decía "Café Raíz" para un cliente llamado
// "tacos mauricio": los reemplazos eran cosméticos y applyTheme() leía
// el CONTEXT del ejemplo y lo sobreescribía todo al arrancar.

const demoCtx = [
  '<script>',
  'const CONTEXT = {',
  '  cliente: "Café Raíz",',
  '  linea: "starter",',
  '  marca: { primario:"#1F6B4A", inicial:"R", subtitulo:"Cafetería · Bogotá" },',
  '  base_de_datos:{ motor:"local" },',
  '  apis:{ whatsapp_num:"573001234567", pagos:"wompi" },',
  '};',
  '</script>',
].join('\n');

test('el CONTEXT toma el cliente y la marca reales', () => {
  const out = ponerEnContexto(demoCtx,
    { primario: '#2f54ff', inicial: 't', subtitulo: 'tacos' }, 'tacos mauricio');
  assert.match(out, /cliente: "tacos mauricio"/);
  assert.match(out, /primario:"#2f54ff"/);
  assert.match(out, /inicial:"t"/);
  assert.ok(!out.includes('Café Raíz'), 'no puede quedar el nombre del ejemplo');
});

test('el WhatsApp del entregable es el del cliente, no el del ejemplo', () => {
  const out = ponerEnContexto(demoCtx, {}, 'X',
    { apis: { whatsapp_num: '573666778839', pagos: 'whatsapp' } });
  assert.match(out, /whatsapp_num:"573666778839"/,
    'si no, el botón escribe al número de otro negocio');
  assert.match(out, /pagos:"whatsapp"/);
});

test('lo que la ficha no define se queda como estaba', () => {
  const out = ponerEnContexto(demoCtx, { primario: '#000' }, 'X');
  assert.match(out, /subtitulo:"Cafetería · Bogotá"/,
    'mejor el valor del ejemplo que un hueco');
});

test('un POR DEFINIR no se escribe en el entregable', () => {
  const out = ponerEnContexto(demoCtx, { inicial: 'POR DEFINIR' }, 'X');
  assert.ok(!out.includes('"POR DEFINIR"'), 'eso es una nota interna, no un valor');
  assert.match(out, /inicial:"R"/);
});

test('sin bloque CONTEXT devuelve el html intacto', () => {
  const html = '<html><body>hola</body></html>';
  assert.equal(ponerEnContexto(html, { primario: '#000' }, 'X'), html);
});
