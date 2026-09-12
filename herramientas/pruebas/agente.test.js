// ════════════════════════════════════════════════════════════
//  EL AGENTE Y SUS ROLES.
//
//  Aquí se prueba lo que decide QUIÉN puede hacer QUÉ y CON QUÉ DINERO.
//  Es config, no lógica, y por eso es peligrosa: una lista blanca sin la
//  herramienta correcta no lanza ningún error — simplemente el modelo no
//  puede usar la capacidad, y nadie se entera.
//
//  Fue exactamente lo que pasó: `allowedTools` no incluía `Skill` ni `Task`,
//  así que skills y subagentes eran imposibles aunque existieran. El sistema
//  funcionaba "bien" y a nadie le saltaba una alarma.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';
import { ROLES, COBROS, COBRO_POR_DEFECTO, entornoSegunCobro,
         estadoAgente, MODELOS_AGENTE, PRESUPUESTO_MAXIMO } from '../lib/agente.js';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const RAIZ = resolve(AQUI, '..');
const SKILLS = join(RAIZ, '.claude', 'skills');

// ══════════ DE DÓNDE SALE EL DINERO ══════════

test('el modo suscripción NO lleva credencial de API', () => {
  // Si se cuela una, el CLI cobra por token sin avisar: es la diferencia
  // entre consumir el plan y consumir la tarjeta.
  const env = entornoSegunCobro('suscripcion');
  for (const v of ['ANTHROPIC_API_KEY', 'ANTHROPIC_AUTH_TOKEN', 'ANTHROPIC_API_KEY_HELPER']) {
    assert.equal(env[v], undefined, v + ' se colaría y cobraría por token');
  }
});

test('el modo suscripción conserva el resto del entorno', () => {
  // `env` REEMPLAZA el entorno del subproceso, no lo mezcla: sin PATH, el
  // CLI no arranca.
  const env = entornoSegunCobro('suscripcion');
  assert.ok(env.PATH || env.Path, 'sin PATH el subproceso no encuentra node');
});

test('el modo api sí conserva la clave cuando existe', () => {
  const antes = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'sk-ant-de-prueba';
  try {
    assert.equal(entornoSegunCobro('api').ANTHROPIC_API_KEY, 'sk-ant-de-prueba');
  } finally {
    if (antes === undefined) delete process.env.ANTHROPIC_API_KEY;
    else process.env.ANTHROPIC_API_KEY = antes;
  }
});

test('el modo por defecto es el que no cuesta por token', () => {
  assert.equal(COBRO_POR_DEFECTO, 'suscripcion',
    'el default no puede ser el que gasta dinero');
  assert.ok(COBROS.suscripcion && COBROS.api);
});

test('sin clave, suscripción arranca y api no', async () => {
  const antes = process.env.ANTHROPIC_API_KEY;
  delete process.env.ANTHROPIC_API_KEY;
  try {
    const sub = await estadoAgente('suscripcion');
    const api = await estadoAgente('api');
    assert.equal(sub.faltan.length, 0, 'suscripción no debería exigir clave');
    assert.ok(api.faltan.some((f) => f.includes('ANTHROPIC_API_KEY')));
    assert.ok(api.faltan.some((f) => f.includes('suscripción')),
      'el mensaje tiene que decir que hay otra salida, no solo que falta la clave');
  } finally {
    if (antes !== undefined) process.env.ANTHROPIC_API_KEY = antes;
  }
});

// ══════════ LOS ROLES ══════════

test('están los cuatro roles y cada uno declara lo suyo', () => {
  assert.deepEqual(Object.keys(ROLES).sort(),
    ['auditor', 'constructor', 'disenador', 'redactor']);
  for (const [nombre, r] of Object.entries(ROLES)) {
    assert.ok(r.description, nombre + ' sin description: el modelo no sabe cuándo usarlo');
    assert.ok(r.prompt && r.prompt.length > 200, nombre + ' sin prompt de verdad');
    assert.ok(r.model, nombre + ' sin modelo propio');
    assert.ok(Array.isArray(r.tools) && r.tools.length, nombre + ' sin herramientas');
  }
});

test('EL DISEÑADOR NO PUEDE ESCRIBIR', () => {
  // Es la decisión de diseño del sistema de roles: un rol que decide y además
  // implementa se salta su propio criterio — escribe primero y justifica
  // después. Sin manos, tiene que decir qué cambiar y a qué valor.
  for (const prohibida of ['Write', 'Edit', 'NotebookEdit']) {
    assert.ok(!ROLES.disenador.tools.includes(prohibida),
      'el diseñador con ' + prohibida + ' deja de ser un crítico');
  }
  assert.ok(ROLES.disenador.tools.includes('Read'), 'pero tiene que poder LEER la captura');
  assert.ok(ROLES.disenador.tools.includes('Bash'), 'y poder correr capturar.js');
});

test('el que decide es el caro; el que ejecuta, más barato', () => {
  // Si el constructor costara igual o más que el diseñador, la separación de
  // roles no compraría nada.
  const precio = { 'claude-opus-5': 3, 'claude-sonnet-5': 2, 'claude-haiku-4-5': 1 };
  assert.equal(ROLES.disenador.model, 'claude-opus-5', 'el criterio va en el modelo capaz');
  assert.ok(precio[ROLES.constructor.model] < precio[ROLES.disenador.model],
    'el constructor tiene que ser más barato que el diseñador');
  assert.equal(ROLES.auditor.model, 'claude-haiku-4-5',
    'auditar es casi todo determinista: va en el más barato');
});

test('el auditor no escribe ni opina: solo verifica', () => {
  assert.ok(!ROLES.auditor.tools.includes('Write'));
  assert.ok(ROLES.auditor.tools.includes('Bash'), 'necesita correr el validador y npm test');
});

test('cada rol carga las skills que le tocan', () => {
  assert.ok(ROLES.disenador.skills.includes('direccion-de-arte'));
  assert.ok(ROLES.disenador.skills.includes('revision-visual'));
  assert.ok(ROLES.constructor.skills.includes('entregable-cliente'));
  assert.ok(ROLES.redactor.skills.includes('ficha-de-contexto'));
});

test('todo modelo de rol existe en el catálogo del panel', () => {
  const ids = Object.values(MODELOS_AGENTE).map((m) => m.id);
  for (const [nombre, r] of Object.entries(ROLES)) {
    assert.ok(ids.includes(r.model),
      nombre + ' usa "' + r.model + '", que no está en MODELOS_AGENTE');
  }
});

// ══════════ LAS SKILLS EXISTEN Y SON USABLES ══════════

test('las cinco skills del estudio están en disco', () => {
  assert.ok(existsSync(SKILLS), 'falta .claude/skills/ en la raíz del escritorio');
  const hay = readdirSync(SKILLS);
  for (const s of ['direccion-de-arte', 'entregable-cliente', 'revision-visual',
                   'base-tecnica', 'ficha-de-contexto']) {
    assert.ok(hay.includes(s), 'falta la skill ' + s);
    assert.ok(existsSync(join(SKILLS, s, 'SKILL.md')), s + ' sin SKILL.md');
  }
});

test('cada SKILL.md declara nombre y descripción', () => {
  for (const s of readdirSync(SKILLS)) {
    const t = readFileSync(join(SKILLS, s, 'SKILL.md'), 'utf8');
    assert.match(t, /^---\r?\n/, s + ': sin frontmatter, no se descubre');
    assert.match(t, /\nname:\s*\S+/, s + ': sin name');
    assert.match(t, /\ndescription:\s*\S+/, s + ': sin description — el modelo '
      + 'decide si la carga leyendo esa línea');
    const nombre = t.match(/\nname:\s*(\S+)/)[1];
    assert.equal(nombre, s, 'el name tiene que coincidir con la carpeta');
  }
});

test('toda skill que un rol pide existe en disco', () => {
  const hay = readdirSync(SKILLS);
  for (const [nombre, r] of Object.entries(ROLES)) {
    for (const s of (r.skills || [])) {
      assert.ok(hay.includes(s), nombre + ' pide la skill "' + s + '", que no existe');
    }
  }
});

// ══════════ LA LISTA BLANCA — el fallo silencioso original ══════════

test('el agente principal habilita Skill y Task', () => {
  // Sin estas dos en allowedTools, ni las skills ni los roles existen para el
  // modelo. No lanza error: simplemente no puede. Así estuvo desde el inicio.
  const fuente = readFileSync(join(AQUI, 'lib', 'agente.js'), 'utf8');
  const bloque = fuente.slice(fuente.indexOf('const base = soloLectura'),
                              fuente.indexOf('const definicion'));
  assert.match(bloque, /'Skill'/, 'sin Skill en la lista blanca, las skills no existen');
  assert.match(bloque, /'Task'/, 'sin Task, no se puede delegar a ningún rol');
});

test('se pasan las skills y los roles al SDK', () => {
  const fuente = readFileSync(join(AQUI, 'lib', 'agente.js'), 'utf8');
  assert.match(fuente, /^\s*skills:/m, 'falta la opción `skills`');
  assert.match(fuente, /^\s*agents:/m, 'falta la opción `agents`');
  assert.match(fuente, /settingSources:.*'project'/,
    "sin 'project' en settingSources no se cargan los CLAUDE.md");
  assert.match(fuente, /^\s*env: entornoSegunCobro\(cobro\)/m,
    'sin `env`, el subproceso hereda la clave y siempre cobra por token');
});

test('el modo solo lectura no deja escribir', () => {
  const fuente = readFileSync(join(AQUI, 'lib', 'agente.js'), 'utf8');
  const bloque = fuente.slice(fuente.indexOf('const base = soloLectura'),
                              fuente.indexOf('const definicion'));
  const lectura = bloque.slice(0, bloque.indexOf(':'));
  assert.ok(!lectura.includes('Write'));
});

test('las instrucciones no le mienten al modelo sobre su entorno', () => {
  // Decían "92 pruebas" cuando eran 281 y "9 bases" cuando son 10. Un agente
  // al que le das datos falsos de su propio entorno decide raro.
  const fuente = readFileSync(join(AQUI, 'lib', 'agente.js'), 'utf8');
  assert.ok(!fuente.includes('92 pruebas'), 'quedó el número viejo de pruebas');
  assert.ok(!fuente.includes('9 bases técnicas'), 'quedó el número viejo de bases');

  const reales = readdirSync(join(RAIZ, 'Sistema-de-Produccion',
    'Sistema-de-Produccion', '02-bases')).length;
  const dice = fuente.match(/(\d+) bases técnicas/);
  assert.ok(dice, 'las instrucciones deberían decir cuántas bases hay');
  assert.equal(Number(dice[1]), reales,
    'dice ' + dice[1] + ' bases y en disco hay ' + reales);
});

test('el presupuesto máximo sigue siendo un techo bajo', () => {
  assert.ok(PRESUPUESTO_MAXIMO <= 5,
    'el techo por sesión no debería poder subir a ciegas');
});
