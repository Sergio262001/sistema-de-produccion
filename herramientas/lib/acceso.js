// ════════════════════════════════════════════════════════════
//  ACCESO AL PANEL
//
//  QUÉ PROTEGE Y QUÉ NO — léelo antes de confiar en esto:
//
//  ✅ Protege de que alguien que se siente en tu computador, o que
//     esté en tu misma red wifi, abra el panel y cree/borre proyectos
//     o gaste tu saldo de API.
//
//  ❌ NO protege los archivos: quien tenga acceso al disco los lee
//     igual, sin pasar por aquí. Esto es una puerta del panel, no
//     cifrado del sistema de producción.
//
//  La frase se guarda como hash scrypt con sal (nunca en claro).
//  La sesión es un token firmado con HMAC que vive en una cookie.
// ════════════════════════════════════════════════════════════

import { randomBytes, scryptSync, timingSafeEqual, createHmac } from 'node:crypto';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const DURACION_MS = 12 * 60 * 60 * 1000;   // 12 horas

/** Comparación en tiempo constante: no filtra información por cuánto tarda */
function igualSeguro(a, b) {
  const ba = Buffer.from(a, 'utf8'), bb = Buffer.from(b, 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function crearAcceso(directorio) {
  const archivo = join(directorio, '.acceso.json');

  const leer = () => {
    if (!existsSync(archivo)) return null;
    try { return JSON.parse(readFileSync(archivo, 'utf8')); } catch { return null; }
  };

  return {
    /** ¿Ya hay una frase configurada? */
    configurado() { return leer() !== null; },

    /** Primera vez: define la frase de acceso */
    configurar(frase) {
      if (!frase || frase.length < 8) {
        return { ok: false, error: 'La frase debe tener al menos 8 caracteres.' };
      }
      const sal = randomBytes(16).toString('hex');
      const hash = scryptSync(frase, sal, 64).toString('hex');
      const secreto = randomBytes(32).toString('hex');   // firma las sesiones
      writeFileSync(archivo, JSON.stringify({ sal, hash, secreto }, null, 2), 'utf8');
      return { ok: true };
    },

    /** Verifica la frase y devuelve un token de sesión firmado */
    entrar(frase) {
      const datos = leer();
      if (!datos) return { ok: false, error: 'Todavía no hay frase configurada.' };

      const intento = scryptSync(String(frase || ''), datos.sal, 64).toString('hex');
      if (!igualSeguro(intento, datos.hash)) {
        return { ok: false, error: 'Frase incorrecta.' };
      }

      const vence = Date.now() + DURACION_MS;
      const cuerpo = String(vence);
      const firma = createHmac('sha256', datos.secreto).update(cuerpo).digest('hex');
      return { ok: true, token: cuerpo + '.' + firma, vence };
    },

    /** ¿El token de la cookie es válido y no venció? */
    valido(token) {
      const datos = leer();
      if (!datos || !token) return false;

      const [cuerpo, firma] = String(token).split('.');
      if (!cuerpo || !firma) return false;

      const esperada = createHmac('sha256', datos.secreto).update(cuerpo).digest('hex');
      if (!igualSeguro(firma, esperada)) return false;

      return Number(cuerpo) > Date.now();
    },
  };
}

/** Lee una cookie del encabezado, sin dependencias */
export function leerCookie(encabezado, nombre) {
  if (!encabezado) return null;
  for (const parte of encabezado.split(';')) {
    const [k, ...v] = parte.trim().split('=');
    if (k === nombre) return decodeURIComponent(v.join('='));
  }
  return null;
}
