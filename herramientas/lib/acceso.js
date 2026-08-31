// ════════════════════════════════════════════════════════════
//  ACCESO AL PANEL — dos vías, la misma sesión.
//
//    1. Google  — entras con tu cuenta. Solo el correo autorizado.
//    2. Frase   — respaldo. Si Google falla, cambias de red o el .env
//                 queda mal, no te quedas por fuera de tu panel.
//
//  QUÉ PROTEGE Y QUÉ NO — léelo antes de confiar en esto:
//
//  ✅ Protege de que alguien que se siente en tu computador, o esté en
//     tu misma red, abra el panel y cree/borre proyectos o gaste tu
//     saldo de API.
//
//  ❌ NO protege los archivos: quien tenga acceso al disco los lee
//     igual, sin pasar por aquí. Esto es la puerta del panel, no
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
  const ba = Buffer.from(String(a), 'utf8'), bb = Buffer.from(String(b), 'utf8');
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}

export function crearAcceso(directorio) {
  const archivo = join(directorio, '.acceso.json');

  const leer = () => {
    if (!existsSync(archivo)) return null;
    try { return JSON.parse(readFileSync(archivo, 'utf8')); } catch { return null; }
  };
  const escribir = (d) => writeFileSync(archivo, JSON.stringify(d, null, 2), 'utf8');

  /**
   * El secreto que firma las sesiones existe siempre, incluso si el usuario
   * nunca define una frase — porque entrar con Google también necesita firmar.
   */
  const asegurarSecreto = () => {
    let d = leer();
    if (!d) { d = { secreto: randomBytes(32).toString('hex') }; escribir(d); }
    else if (!d.secreto) { d.secreto = randomBytes(32).toString('hex'); escribir(d); }
    return d;
  };

  const firmar = (cuerpo, secreto) =>
    createHmac('sha256', secreto).update(cuerpo).digest('hex');

  return {
    /** ¿Hay una frase de respaldo definida? */
    tieneFrase() { return Boolean(leer()?.hash); },

    /** Define (o cambia) la frase de respaldo */
    configurar(frase) {
      if (!frase || frase.length < 8) {
        return { ok: false, error: 'La frase debe tener al menos 8 caracteres.' };
      }
      const d = asegurarSecreto();
      d.sal = randomBytes(16).toString('hex');
      d.hash = scryptSync(frase, d.sal, 64).toString('hex');
      escribir(d);
      return { ok: true };
    },

    /** Verifica la frase y devuelve una sesión */
    entrar(frase) {
      const d = leer();
      if (!d?.hash) return { ok: false, error: 'No hay frase configurada.' };
      const intento = scryptSync(String(frase || ''), d.sal, 64).toString('hex');
      if (!igualSeguro(intento, d.hash)) return { ok: false, error: 'Frase incorrecta.' };
      return this.emitirSesion('frase');
    },

    /**
     * Emite una sesión sin pedir frase. La usa el retorno de Google, ya
     * habiendo comprobado que el correo es el autorizado.
     */
    emitirSesion(via = 'frase') {
      const d = asegurarSecreto();
      const vence = Date.now() + DURACION_MS;
      const cuerpo = vence + '|' + via;
      return { ok: true, token: cuerpo + '.' + firmar(cuerpo, d.secreto), vence, via };
    },

    /** ¿El token de la cookie es válido y no venció? */
    valido(token) {
      const d = leer();
      if (!d?.secreto || !token) return false;
      const i = String(token).lastIndexOf('.');
      if (i === -1) return false;
      const cuerpo = String(token).slice(0, i), firma = String(token).slice(i + 1);
      if (!igualSeguro(firma, firmar(cuerpo, d.secreto))) return false;
      return Number(cuerpo.split('|')[0]) > Date.now();
    },

    /** Con qué vía se abrió la sesión (solo para mostrarlo en el panel) */
    viaDe(token) {
      if (!this.valido(token)) return null;
      const i = String(token).lastIndexOf('.');
      return String(token).slice(0, i).split('|')[1] || 'frase';
    },

    /** Firma corta para el parámetro `state` de OAuth (anti-CSRF) */
    firmarEstado(nonce) {
      return firmar(nonce, asegurarSecreto().secreto);
    },
    verificarEstado(nonce, firma) {
      return igualSeguro(firma, firmar(nonce, asegurarSecreto().secreto));
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
