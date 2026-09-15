// ════════════════════════════════════════════════════════════
//  LOS HOOKS DE CLAUDE CODE.
//
//  `.claude/hooks/` convierte dos reglas que vivían solo en las skills en
//  cosas que pasan solas:
//
//   · validar-tras-editar  — después de editar una base o un entregable, el
//                            validador corre y los ERRORES vuelven a Claude.
//   · proteger-inmersivo   — no se puede editar a mano la zona que
//                            `llevar-inmersivo.js` sobrescribe.
//
//  Un hook que falla en silencio es peor que no tener hook: parece que la
//  regla está protegida y no lo está. Estas pruebas corren los dos scripts
//  con el mismo JSON que les manda Claude Code.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, resolve } from 'node:path';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const RAIZ = resolve(AQUI, '..');
const HOOKS = join(RAIZ, '.claude', 'hooks');
const BASES = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion', '02-bases');

function correr(script, entrada) {
  const r = spawnSync(process.execPath, [join(HOOKS, script)], {
    input: typeof entrada === 'string' ? entrada : JSON.stringify(entrada),
    encoding: 'utf8',
  });
  let json = null;
  try { json = JSON.parse(r.stdout); } catch { /* sin salida = deja pasar */ }
  return { codigo: r.status, json, stdout: r.stdout };
}

// ── validar-tras-editar ─────────────────────────────────────

const validar = (file_path) =>
  correr('validar-tras-editar.mjs', { tool_name: 'Edit', tool_input: { file_path } });

test('una base limpia no devuelve nada', () => {
  const r = validar(join(BASES, 'ecommerce-completo', 'demo.html'));
  assert.equal(r.codigo, 0);
  assert.equal(r.stdout, '', 'si una base limpia devuelve algo, cada edición es ruido');
});

test('un archivo fuera de bases y entregables no se valida', () => {
  const r = validar(join(AQUI, 'panel.js'));
  assert.equal(r.stdout, '');
});

test('un entregable con error devuelve block con el hallazgo', () => {
  const dir = join(RAIZ, 'Proyectos-Clientes', 'zz-prueba-hook-' + process.pid);
  try {
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'index.html'),
      '<html lang="es"><body><script>const U=[{password:"admin123"}];</script></body></html>');
    const r = validar(join(dir, 'index.html'));
    assert.equal(r.codigo, 0, 'el hook nunca rompe la edición con su código de salida');
    assert.equal(r.json?.decision, 'block',
      'con errores, Claude tiene que enterarse ANTES de seguir');
    assert.match(r.json.reason, /clave-demo/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test('una entrada que no es JSON no rompe nada', () => {
  const r = correr('validar-tras-editar.mjs', 'esto no es json');
  assert.equal(r.codigo, 0);
  assert.equal(r.stdout, '');
});

test('la ruta se reconoce aunque venga con otra caja de letra (Windows)', async () => {
  const { carpetaAValidar } = await import('../../.claude/hooks/validar-tras-editar.mjs');
  const demo = join(BASES, 'marketplace', 'demo.html');
  const cambiada = demo[0] === demo[0].toUpperCase()
    ? demo[0].toLowerCase() + demo.slice(1)
    : demo[0].toUpperCase() + demo.slice(1);
  assert.match(carpetaAValidar(cambiada, RAIZ) || '', /02-bases\/marketplace$/,
    'Claude Code manda `c:\\...` y `C:\\...` para el mismo archivo');
});

test('node_modules y dist de un entregable no disparan el validador', async () => {
  const { carpetaAValidar } = await import('../../.claude/hooks/validar-tras-editar.mjs');
  const p = join(RAIZ, 'Proyectos-Clientes', 'x', 'node_modules', 'y', 'a.js');
  assert.equal(carpetaAValidar(p, RAIZ), null);
});

// ── proteger-inmersivo ──────────────────────────────────────

const DEMO = join(BASES, 'ecommerce-completo', 'demo.html');
const actual = () => readFileSync(DEMO, 'utf8').replace(/\r\n/g, '\n');
const decision = (entrada) =>
  correr('proteger-inmersivo.mjs', entrada).json?.hookSpecificOutput?.permissionDecision || 'deja';

test('editar DENTRO de la zona INMERSIVO se niega', () => {
  assert.equal(decision({ tool_name: 'Edit',
    tool_input: { file_path: DEMO, old_string: '.tex-trama{', new_string: '.x{' } }), 'deny',
    'un arreglo ahí se pierde en la próxima corrida de llevar-inmersivo.js');
});

test('editar FUERA de la zona se deja', () => {
  assert.equal(decision({ tool_name: 'Edit', tool_input: { file_path: DEMO,
    old_string: '<section class="bloques" id="bloques" hidden></section>', new_string: 'x' } }),
    'deja', 'bloquear el resto del archivo haría inservible el hook');
});

test('un Write que cambia la zona se niega; uno que no, se deja', () => {
  const t = actual();
  assert.equal(decision({ tool_name: 'Write',
    tool_input: { file_path: DEMO, content: t.replace('.tex-trama{', '.tex-X{') } }), 'deny');
  assert.equal(decision({ tool_name: 'Write',
    tool_input: { file_path: DEMO, content: t + '\n<!-- nada -->' } }), 'deja');
});

test('el motivo dice dónde va el arreglo', () => {
  const r = correr('proteger-inmersivo.mjs', { tool_name: 'Edit',
    tool_input: { file_path: DEMO, old_string: '.tex-trama{', new_string: '.x{' } });
  const motivo = r.json.hookSpecificOutput.permissionDecisionReason;
  assert.match(motivo, /03-componentes-ui\/inmersivo/);
  assert.match(motivo, /llevar-inmersivo\.js/);
});

test('landing-modular no está protegida: su versión es la suya', () => {
  assert.equal(decision({ tool_name: 'Edit', tool_input: {
    file_path: join(BASES, 'landing-modular', 'demo.html'),
    old_string: '.tex-trama{', new_string: '.x{' } }), 'deja');
});

test('un MultiEdit con una sola edición dentro se niega entero', () => {
  assert.equal(decision({ tool_name: 'MultiEdit', tool_input: { file_path: DEMO, edits: [
    { old_string: '<section class="bloques" id="bloques" hidden></section>', new_string: 'x' },
    { old_string: '.tex-trama{', new_string: '.x{' },
  ] } }), 'deny');
});

test('las zonas se encuentran con CRLF igual que con LF', async () => {
  const { zonasInmersivo } = await import('../../.claude/hooks/proteger-inmersivo.mjs');
  const h = await import('../llevar-inmersivo.js');
  const abre = [h.MARCA_CSS_ABRE, h.MARCA_JS_ABRE];
  assert.equal(zonasInmersivo(actual(), abre, h.MARCA_CSS_CIERRA).length, 2,
    'cada base de venta tiene dos zonas: la de CSS y la de JS');
});

// ── La configuración ────────────────────────────────────────

test('.claude/settings.json registra los dos hooks', () => {
  const s = JSON.parse(readFileSync(join(RAIZ, '.claude', 'settings.json'), 'utf8'));
  const cmd = (ev) => (s.hooks?.[ev] || []).flatMap((m) => m.hooks.map((h) => h.command)).join(' ');
  assert.match(cmd('PreToolUse'), /proteger-inmersivo\.mjs/);
  assert.match(cmd('PostToolUse'), /validar-tras-editar\.mjs/);
  for (const ev of ['PreToolUse', 'PostToolUse']) {
    assert.match(s.hooks[ev][0].matcher, /Edit/);
    assert.match(s.hooks[ev][0].matcher, /Write/);
  }
});
