// ════════════════════════════════════════════════════════════
//  lib/colores.js — contraste WCAG 2.1.
//  Es matemática con respuesta conocida, así que se puede
//  contrastar contra los valores publicados en la norma.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aRgb, contraste, evaluar } from '../lib/colores.js';

const cerca = (a, b, tol = 0.02) => Math.abs(a - b) <= tol;

test('lee hex de 6, hex de 3 y rgb()', () => {
  assert.deepEqual(aRgb('#1B36C9'), { r: 27, g: 54, b: 201 });
  assert.deepEqual(aRgb('#fff'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(aRgb('FFFFFF'), { r: 255, g: 255, b: 255 });
  assert.deepEqual(aRgb('rgb(27, 54, 201)'), { r: 27, g: 54, b: 201 });
});

test('devuelve null con algo que no es color', () => {
  assert.equal(aRgb('azul'), null);
  assert.equal(aRgb(''), null);
  assert.equal(aRgb(null), null);
  assert.equal(contraste('#fff', 'no-es-color'), null);
});

test('los extremos conocidos de la norma', () => {
  assert.ok(cerca(contraste('#000000', '#FFFFFF'), 21), 'negro sobre blanco = 21:1');
  assert.ok(cerca(contraste('#FFFFFF', '#FFFFFF'), 1), 'un color contra sí mismo = 1:1');
});

test('el orden de los colores no cambia el resultado', () => {
  assert.equal(contraste('#1B36C9', '#FFFFFF'), contraste('#FFFFFF', '#1B36C9'));
});

test('un gris a mitad de camino falla el mínimo de texto normal', () => {
  // #777 sobre blanco ronda 4.48:1 — justo por debajo del 4.5 exigido
  const r = evaluar('#777777', '#FFFFFF');
  assert.equal(r.pasa, false);
  assert.equal(r.minimo, 4.5);
  assert.ok(r.ratio > 4.4 && r.ratio < 4.5, 'ratio real: ' + r.ratio);
});

test('ese mismo gris sí pasa como texto grande', () => {
  const r = evaluar('#777777', '#FFFFFF', { grande: true });
  assert.equal(r.pasa, true, 'el mínimo baja a 3:1 en texto grande');
  assert.equal(r.minimo, 3);
});

test('AAA exige más que AA', () => {
  // #666 sobre blanco ronda 5.74 — cómodo para AA, insuficiente para AAA
  assert.equal(evaluar('#666666', '#FFFFFF').pasa, true, 'pasa AA');
  assert.equal(evaluar('#666666', '#FFFFFF', { nivel: 'AAA' }).pasa, false,
    'el mismo color no llega a AAA');
});

test('#595959 sobre blanco da exactamente 7.00, el valor de referencia WCAG', () => {
  // Es el gris más claro que alcanza AAA. Si este número se mueve,
  // la fórmula de luminancia se rompió.
  assert.equal(evaluar('#595959', '#FFFFFF').ratio, 7);
  assert.equal(evaluar('#595959', '#FFFFFF', { nivel: 'AAA' }).pasa, true);
});

test('los tokens del sistema pasan sobre su propio fondo', () => {
  // --ink sobre --bg, los valores que usan las bases
  const r = evaluar('#0F1626', '#F5F7FB');
  assert.equal(r.pasa, true, 'el texto principal del sistema debe ser legible');
  assert.ok(r.ratio > 15, 'con holgura: ' + r.ratio);
});
