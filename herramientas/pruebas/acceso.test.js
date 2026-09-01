// ════════════════════════════════════════════════════════════
//  ACCESO AL PANEL — el único código de seguridad del sistema.
//
//  Estuvo sin una sola prueba mientras el resto llegaba a 174. Es
//  exactamente al revés de como debería ser: lo que decide quién entra
//  es lo que más barato sale de romper sin que nadie se entere.
//
//  Se prueban las dos caras de cada regla. Un candado que se abre con
//  la llave correcta no está probado: hay que ver que NO se abre con
//  la equivocada, ni con una firma cambiada, ni con el tiempo vencido.
//
//  Escribe en una carpeta temporal, nunca en la del proyecto.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHmac } from 'node:crypto';
import { crearAcceso, leerCookie } from '../lib/acceso.js';

/** Un acceso limpio en su propia carpeta temporal. */
function nuevo() {
  const dir = mkdtempSync(join(tmpdir(), 'acceso-'));
  return { acceso: crearAcceso(dir), dir, borrar: () => rmSync(dir, { recursive: true, force: true }) };
}

// ══════════ LA FRASE ══════════

test('sin frase configurada no se entra de ninguna manera', () => {
  const { acceso, borrar } = nuevo();
  assert.equal(acceso.tieneFrase(), false);
  assert.equal(acceso.entrar('loquesea').ok, false);
  assert.equal(acceso.entrar('').ok, false);
  borrar();
});

test('la frase correcta abre; la incorrecta no', () => {
  const { acceso, borrar } = nuevo();
  acceso.configurar('taller-de-barrio-2026');
  assert.equal(acceso.entrar('taller-de-barrio-2026').ok, true);
  assert.equal(acceso.entrar('taller-de-barrio-2025').ok, false);
  assert.equal(acceso.entrar('Taller-De-Barrio-2026').ok, false, 'distingue mayúsculas');
  assert.equal(acceso.entrar('taller-de-barrio-2026 ').ok, false, 'y espacios');
  borrar();
});

test('una frase corta se rechaza al configurarla', () => {
  const { acceso, borrar } = nuevo();
  assert.equal(acceso.configurar('corta').ok, false);
  assert.equal(acceso.configurar('').ok, false);
  assert.equal(acceso.configurar(null).ok, false);
  assert.equal(acceso.tieneFrase(), false, 'y no queda nada configurado');
  assert.equal(acceso.configurar('ochoymas').ok, true, 'ocho justos sí');
  borrar();
});

test('la frase nunca se guarda en claro', () => {
  const { acceso, dir, borrar } = nuevo();
  acceso.configurar('mi-frase-secreta-larga');
  const guardado = readFileSync(join(dir, '.acceso.json'), 'utf8');
  assert.ok(!guardado.includes('mi-frase-secreta-larga'),
    'si está en claro, leer el archivo es entrar');
  const d = JSON.parse(guardado);
  assert.ok(d.sal && d.hash, 'hash con sal, no la frase');
  assert.notEqual(d.hash, d.sal);
  borrar();
});

test('la misma frase da hashes distintos en instalaciones distintas', () => {
  // Sin sal por instalación, un mismo hash delataría que dos paneles
  // comparten frase, y una tabla precalculada valdría para los dos.
  const a = nuevo(), b = nuevo();
  a.acceso.configurar('la-misma-frase-aqui');
  b.acceso.configurar('la-misma-frase-aqui');
  const ha = JSON.parse(readFileSync(join(a.dir, '.acceso.json'), 'utf8')).hash;
  const hb = JSON.parse(readFileSync(join(b.dir, '.acceso.json'), 'utf8')).hash;
  assert.notEqual(ha, hb);
  a.borrar(); b.borrar();
});

test('cambiar la frase invalida la anterior', () => {
  const { acceso, borrar } = nuevo();
  acceso.configurar('frase-vieja-larga');
  acceso.configurar('frase-nueva-larga');
  assert.equal(acceso.entrar('frase-vieja-larga').ok, false);
  assert.equal(acceso.entrar('frase-nueva-larga').ok, true);
  borrar();
});

// ══════════ LA SESIÓN ══════════

test('el token que emite el login vale', () => {
  const { acceso, borrar } = nuevo();
  acceso.configurar('frase-de-prueba-larga');
  const r = acceso.entrar('frase-de-prueba-larga');
  assert.equal(acceso.valido(r.token), true);
  assert.equal(acceso.viaDe(r.token), 'frase');
  borrar();
});

test('un token manipulado no vale', () => {
  const { acceso, borrar } = nuevo();
  const { token } = acceso.emitirSesion('google');
  const [cuerpo, firma] = [token.slice(0, token.lastIndexOf('.')),
                           token.slice(token.lastIndexOf('.') + 1)];

  // Alargar la sesión reescribiendo el vencimiento: la firma deja de cuadrar.
  const masTiempo = (Date.now() + 999 * 24 * 3600 * 1000) + '|google';
  assert.equal(acceso.valido(masTiempo + '.' + firma), false);

  // Cambiar la vía para aparentar que se entró con Google.
  assert.equal(acceso.valido(cuerpo.replace('google', 'frase') + '.' + firma), false);

  // Tocar un carácter de la firma.
  const rota = firma.slice(0, -1) + (firma.endsWith('a') ? 'b' : 'a');
  assert.equal(acceso.valido(cuerpo + '.' + rota), false);
  borrar();
});

test('basura y vacíos no pasan por token', () => {
  const { acceso, borrar } = nuevo();
  acceso.emitirSesion();
  for (const malo of [null, undefined, '', 'sinpunto', '.', '|.', 'a.b',
                      '9999999999999|frase', {}, 0]) {
    assert.equal(acceso.valido(malo), false, 'aceptó: ' + JSON.stringify(malo));
  }
  borrar();
});

test('un token vencido no vale, aunque la firma sea perfecta', () => {
  const { acceso, dir, borrar } = nuevo();
  acceso.emitirSesion();   // fuerza la creación del secreto
  const { secreto } = JSON.parse(readFileSync(join(dir, '.acceso.json'), 'utf8'));

  // Se firma con el secreto REAL un cuerpo ya caducado: la firma cuadra y
  // aun así tiene que rechazarse. Es lo que pasa 12 horas después de entrar.
  const cuerpo = (Date.now() - 1000) + '|frase';
  const firma = createHmac('sha256', secreto).update(cuerpo).digest('hex');
  assert.equal(acceso.valido(cuerpo + '.' + firma), false);

  // Y el control: el mismo cuerpo con fecha futura sí vale, así que lo que
  // falla arriba es la caducidad y no otra cosa.
  const vivo = (Date.now() + 60000) + '|frase';
  const firmaViva = createHmac('sha256', secreto).update(vivo).digest('hex');
  assert.equal(acceso.valido(vivo + '.' + firmaViva), true);
  borrar();
});

test('la sesión dura 12 horas, no más', () => {
  const { acceso, borrar } = nuevo();
  const { vence } = acceso.emitirSesion();
  const horas = (vence - Date.now()) / 3600000;
  assert.ok(horas > 11.9 && horas <= 12.01, 'duró ' + horas.toFixed(2) + ' horas');
  borrar();
});

test('el token de una instalación no vale en otra', () => {
  const a = nuevo(), b = nuevo();
  const { token } = a.acceso.emitirSesion();
  assert.equal(a.acceso.valido(token), true);
  assert.equal(b.acceso.valido(token), false,
    'cada panel firma con su propio secreto');
  a.borrar(); b.borrar();
});

test('el secreto de firma se crea solo, sin frase de por medio', () => {
  const { acceso, dir, borrar } = nuevo();
  const { token } = acceso.emitirSesion('google');
  assert.equal(acceso.valido(token), true, 'entrar con Google no necesita frase');
  assert.equal(acceso.tieneFrase(), false);
  assert.ok(JSON.parse(readFileSync(join(dir, '.acceso.json'), 'utf8')).secreto);
  borrar();
});

test('un archivo de acceso corrupto no tumba el panel ni deja entrar', () => {
  const { acceso, dir, borrar } = nuevo();
  writeFileSync(join(dir, '.acceso.json'), '{ esto no es json', 'utf8');
  assert.equal(acceso.tieneFrase(), false);
  assert.equal(acceso.valido('cualquier.cosa'), false);
  assert.doesNotThrow(() => acceso.emitirSesion(), 'debe poder rehacerse');
  borrar();
});

// ══════════ EL `state` DE OAUTH (anti-CSRF) ══════════

test('el estado de OAuth solo se valida con su propia firma', () => {
  const { acceso, borrar } = nuevo();
  const firma = acceso.firmarEstado('nonce-123');
  assert.equal(acceso.verificarEstado('nonce-123', firma), true);
  assert.equal(acceso.verificarEstado('nonce-124', firma), false,
    'otro nonce con la misma firma es un intento de CSRF');
  assert.equal(acceso.verificarEstado('nonce-123', 'inventada'), false);
  assert.equal(acceso.verificarEstado('nonce-123', ''), false);
  borrar();
});

test('dos instalaciones no se validan el estado entre sí', () => {
  const a = nuevo(), b = nuevo();
  assert.equal(b.acceso.verificarEstado('n', a.acceso.firmarEstado('n')), false);
  a.borrar(); b.borrar();
});

// ══════════ COOKIES ══════════

test('leerCookie encuentra la suya y solo la suya', () => {
  const enc = 'otra=1; panel=abc.def; parecida_panel=no';
  assert.equal(leerCookie(enc, 'panel'), 'abc.def');
  assert.equal(leerCookie(enc, 'otra'), '1');
  assert.equal(leerCookie(enc, 'noexiste'), null);
  assert.equal(leerCookie(enc, 'pane'), null, 'no debe casar por prefijo');
});

test('leerCookie aguanta encabezados raros', () => {
  assert.equal(leerCookie(null, 'panel'), null);
  assert.equal(leerCookie('', 'panel'), null);
  assert.equal(leerCookie('panel=', 'panel'), '');
  assert.equal(leerCookie('  panel=x  ', 'panel'), 'x', 'con espacios alrededor');
});

test('leerCookie devuelve el valor entero aunque lleve "="', () => {
  // Un token en base64 puede terminar en "=" y partirlo lo rompe.
  assert.equal(leerCookie('panel=a=b=c', 'panel'), 'a=b=c');
});

test('leerCookie decodifica lo que el navegador escapó', () => {
  assert.equal(leerCookie('panel=a%20b', 'panel'), 'a b');
});
