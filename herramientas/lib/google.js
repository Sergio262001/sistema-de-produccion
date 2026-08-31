// ════════════════════════════════════════════════════════════
//  ENTRAR CON GOOGLE
//
//  Flujo de código de autorización (el correcto para un servidor,
//  no el implícito que ya está desaconsejado):
//
//    1. El panel te manda a Google con un `state` firmado.
//    2. Google te devuelve a /api/acceso/google/retorno con un código.
//    3. El servidor cambia ese código por un id_token, hablando
//       DIRECTO con Google por TLS (el navegador no toca este paso).
//    4. Se comprueban las declaraciones del token y, sobre todo,
//       que el correo sea el autorizado.
//
//  Por qué no verifico la firma del id_token con las llaves de Google:
//  el token llega por una conexión TLS directa a oauth2.googleapis.com,
//  no a través del navegador. Google documenta que en este flujo la
//  verificación de firma es opcional. Aun así se comprueban `aud`,
//  `iss`, `exp` y `email_verified`, que es lo que evita que un token
//  emitido para otra aplicación sirva aquí.
//
//  SIN LA LISTA DE CORREOS AUTORIZADOS ESTO NO ARRANCA: si no,
//  cualquier persona con una cuenta de Google entraría a tu panel.
// ════════════════════════════════════════════════════════════

const AUTORIZAR = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';

export function configurarGoogle(env = process.env) {
  const id = env.GOOGLE_CLIENT_ID;
  const secreto = env.GOOGLE_CLIENT_SECRET;
  const correos = String(env.GOOGLE_CORREOS_AUTORIZADOS || '')
    .split(',').map((c) => c.trim().toLowerCase()).filter(Boolean);

  const faltan = [];
  if (!id) faltan.push('GOOGLE_CLIENT_ID');
  if (!secreto) faltan.push('GOOGLE_CLIENT_SECRET');
  if (!correos.length) faltan.push('GOOGLE_CORREOS_AUTORIZADOS');

  return {
    activo: faltan.length === 0,
    faltan,
    id, secreto, correos,
  };
}

export function urlDeEntrada(cfg, redirectUri, state) {
  const p = new URLSearchParams({
    client_id: cfg.id,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  });
  return AUTORIZAR + '?' + p.toString();
}

/** Decodifica el payload de un JWT. NO valida la firma — ver la nota de arriba. */
function cargaUtil(jwt) {
  const partes = String(jwt).split('.');
  if (partes.length !== 3) throw new Error('id_token con formato inesperado.');
  const b64 = partes[1].replace(/-/g, '+').replace(/_/g, '/');
  return JSON.parse(Buffer.from(b64, 'base64').toString('utf8'));
}

/**
 * Cambia el código por el id_token y comprueba las declaraciones.
 * Devuelve { ok, correo, nombre, error }.
 */
export async function canjearCodigo(cfg, codigo, redirectUri) {
  let respuesta;
  try {
    respuesta = await fetch(TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: codigo,
        client_id: cfg.id,
        client_secret: cfg.secreto,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
  } catch (e) {
    return { ok: false, error: 'No se pudo hablar con Google: ' + e.message };
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    return { ok: false, error: 'Google rechazó el intercambio: '
      + (datos.error_description || datos.error || respuesta.status) };
  }
  if (!datos.id_token) return { ok: false, error: 'Google no devolvió id_token.' };

  let c;
  try { c = cargaUtil(datos.id_token); }
  catch (e) { return { ok: false, error: e.message }; }

  // ─ Declaraciones que sí importan
  if (c.aud !== cfg.id) {
    return { ok: false, error: 'El token fue emitido para otra aplicación.' };
  }
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(c.iss)) {
    return { ok: false, error: 'Emisor inesperado: ' + c.iss };
  }
  if (typeof c.exp === 'number' && c.exp * 1000 <= Date.now()) {
    return { ok: false, error: 'El token ya venció.' };
  }
  if (c.email_verified === false) {
    return { ok: false, error: 'Ese correo de Google no está verificado.' };
  }

  const correo = String(c.email || '').toLowerCase();
  if (!correo) return { ok: false, error: 'Google no devolvió el correo.' };

  // ─ La comprobación que evita que entre cualquiera
  if (!cfg.correos.includes(correo)) {
    return { ok: false, error: 'La cuenta ' + correo + ' no está autorizada en este panel.' };
  }

  return { ok: true, correo, nombre: c.name || correo };
}
