// ════════════════════════════════════════════════════════════
//  lib/historial.js — memoria del sistema.
//  Se prueba contra una base temporal; nunca toca la real.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { abrirHistorial } from '../lib/historial.js';

function conBase(fn) {
  const dir = mkdtempSync(join(tmpdir(), 'hist-'));
  const h = abrirHistorial(dir);
  try { fn(h); } finally {
    h.cerrar();
    try { rmSync(dir, { recursive: true, force: true }); } catch { /* windows */ }
  }
}

test('la base se abre y queda disponible', () => {
  conBase((h) => assert.equal(h.disponible(), true, h.motivo || ''));
});

test('anota y devuelve lo anotado', () => {
  conBase((h) => {
    assert.equal(h.anotar({ tipo: 'validacion', proyecto: 'casa-tela',
      resumen: '3 hallazgos', errores: 1, avisos: 2 }), true);
    const [e] = h.recientes({ proyecto: 'casa-tela' });
    assert.equal(e.tipo, 'validacion');
    assert.equal(e.errores, 1);
    assert.equal(e.avisos, 2);
    assert.match(e.fecha, /^\d{4}-\d{2}-\d{2}T/);
  });
});

test('separa los eventos por proyecto', () => {
  conBase((h) => {
    h.anotar({ tipo: 'validacion', proyecto: 'a', resumen: 'x' });
    h.anotar({ tipo: 'validacion', proyecto: 'b', resumen: 'y' });
    assert.equal(h.recientes({ proyecto: 'a' }).length, 1);
    assert.equal(h.recientes().length, 2);
  });
});

test('la tendencia dice si los hallazgos bajaron', () => {
  conBase((h) => {
    h.anotar({ tipo: 'validacion', proyecto: 'x', resumen: 'antes', errores: 5, avisos: 9 });
    h.anotar({ tipo: 'validacion', proyecto: 'x', resumen: 'ahora', errores: 1, avisos: 4 });
    const t = h.tendencia('x');
    assert.equal(t.errores, -4, 'cuatro errores menos');
    assert.equal(t.avisos, -5);
  });
});

test('sin dos mediciones no hay tendencia que reportar', () => {
  conBase((h) => {
    h.anotar({ tipo: 'validacion', proyecto: 'x', resumen: 'unica', errores: 2 });
    assert.equal(h.tendencia('x'), null);
  });
});

test('suma el gasto de IA', () => {
  conBase((h) => {
    h.anotar({ tipo: 'auditoria', resumen: 'a', costo: 0.05 });
    h.anotar({ tipo: 'agente', resumen: 'b', costo: 0.42 });
    assert.equal(h.gastoTotal(), 0.47);
  });
});

test('anotar mal no lanza: perder un registro no puede tumbar una operación', () => {
  conBase((h) => {
    assert.doesNotThrow(() => h.anotar({}));
    assert.doesNotThrow(() => h.anotar({ tipo: 'x', resumen: null }));
  });
});

test('guarda y devuelve el detalle en JSON', () => {
  conBase((h) => {
    h.anotar({ tipo: 'proyecto', proyecto: 'z', resumen: 'creado',
      detalle: { base: 'ecommerce-completo', archivos: 8 } });
    const [e] = h.recientes({ proyecto: 'z' });
    assert.deepEqual(JSON.parse(e.detalle), { base: 'ecommerce-completo', archivos: 8 });
  });
});
