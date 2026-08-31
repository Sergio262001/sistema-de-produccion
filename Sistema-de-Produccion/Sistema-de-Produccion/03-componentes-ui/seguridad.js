// ════════════════════════════════════════════════════════════
//  SEGURIDAD — utilidades obligatorias para todas las bases
//
//  Kit de referencia: se COPIA a cada base, no se importa desde
//  aquí en runtime (igual que el resto de 03-componentes-ui).
//
//  ── La regla que hay que entender ──
//  Cualquier texto que haya escrito una persona que no seas tú
//  (un comprador, un visitante que deja un lead, un suscriptor)
//  es CÓDIGO HOSTIL hasta que se demuestre lo contrario. Si ese
//  texto entra a la página con innerHTML sin pasar por escapeHtml,
//  el navegador lo ejecuta.
//
//  Por qué importa más de lo que parece: el atacante escribe su
//  "nombre" en un formulario público, y el que abre esa pantalla
//  después es el DUEÑO, con su sesión de administrador iniciada.
//  El código se ejecuta con los permisos del dueño, no con los del
//  atacante. Se llama XSS almacenado y es la forma más común de
//  robar un panel de administración.
// ════════════════════════════════════════════════════════════

// ── 1. ESCAPAR ANTES DE PINTAR ──────────────────────────────
/**
 * Convierte texto en algo seguro para meter dentro de innerHTML.
 * Úsalo SIEMPRE que interpoles un dato que no escribiste tú.
 *
 *   ❌ el.innerHTML = `<b>${cliente.nombre}</b>`
 *   ✅ el.innerHTML = `<b>${escapeHtml(cliente.nombre)}</b>`
 */
export function escapeHtml(valor) {
  if (valor === null || valor === undefined) return '';
  return String(valor)
    .replace(/&/g, '&amp;')    // este va primero, siempre
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Igual que escapeHtml pero para usar como etiqueta de plantilla.
 * Escapa TODO lo interpolado, así no se puede olvidar uno.
 *
 *   el.innerHTML = seguro`<b>${nombre}</b> · ${contacto}`;
 */
export function seguro(strings, ...valores) {
  return strings.reduce((acc, str, i) =>
    acc + str + (i < valores.length ? escapeHtml(valores[i]) : ''), '');
}

/**
 * La alternativa a prueba de olvidos: si el dato va SOLO como
 * texto (sin HTML alrededor), usa textContent y no hay nada que
 * escapar. Cuando puedas elegir, elige esto.
 */
export function ponerTexto(elemento, valor) {
  elemento.textContent = valor ?? '';
}

// ── 2. VALIDAR ENTRADAS ─────────────────────────────────────
//  Validar en el navegador es para que la persona vea el error
//  rápido — NO es seguridad. Cualquiera salta esto con la consola
//  abierta. La validación que de verdad protege es la de la base
//  de datos (los CHECK del supabase.schema.sql) y la del servidor.
//  Ambas, no una.

export function esEmailValido(valor) {
  const v = String(valor || '').trim();
  // Deliberadamente simple. Las expresiones "perfectas" para email
  // rechazan direcciones reales y no aportan seguridad: quien
  // valida de verdad es el correo de confirmación.
  return v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
}

export function esTelefonoValido(valor) {
  // Se quitan espacios, paréntesis, guiones y el "+" del indicativo
  // antes de contar dígitos: la gente escribe +57 (300) 123-4567.
  const soloDigitos = String(valor || '').replace(/[\s()+-]/g, '');
  return /^\d{7,15}$/.test(soloDigitos);   // rango internacional
}

/** En Colombia la gente deja indistintamente correo o celular. */
export function esContactoValido(valor) {
  return esEmailValido(valor) || esTelefonoValido(valor);
}

/**
 * Recorta y limpia un texto libre antes de guardarlo.
 * El límite no es cosmético: sin él, alguien pega 5 MB en el
 * campo "nota" y llena la base de datos del cliente.
 */
export function limpiarTexto(valor, maximo = 500) {
  return String(valor ?? '')
    // Caracteres de control (menos tab y salto de línea, que son
    // legítimos en una nota). Sirven para esconder texto o romper
    // exportaciones a CSV.
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim()
    .slice(0, maximo);
}

export const LIMITES = {
  nombre:    80,
  contacto: 120,
  direccion: 200,
  nota:      500,
  mensaje:  1000,
};

/**
 * Valida los datos de contacto de un formulario público.
 * Devuelve { ok, errores: {campo: mensaje}, datos } con los datos
 * ya limpios y recortados.
 */
export function validarContacto(entrada = {}) {
  const errores = {};
  const datos = {
    nombre:    limpiarTexto(entrada.nombre,    LIMITES.nombre),
    contacto:  limpiarTexto(entrada.contacto,  LIMITES.contacto),
    direccion: limpiarTexto(entrada.direccion, LIMITES.direccion),
    nota:      limpiarTexto(entrada.nota,      LIMITES.nota),
  };

  if (datos.nombre.length < 2)           errores.nombre   = 'Escribe tu nombre';
  if (!esContactoValido(datos.contacto)) errores.contacto = 'Escribe un correo o teléfono válido';

  return { ok: Object.keys(errores).length === 0, errores, datos };
}

// ── 3. ENLACES EXTERNOS ─────────────────────────────────────
/**
 * Solo deja pasar http/https. Bloquea `javascript:` y `data:`,
 * que son la forma de convertir un enlace en código ejecutable.
 * Úsalo si alguna vez pintas una URL que no escribiste tú
 * (el sitio web de un vendedor, por ejemplo).
 */
export function urlSegura(valor) {
  try {
    const u = new URL(String(valor), window.location.origin);
    return ['http:', 'https:'].includes(u.protocol) ? u.href : '#';
  } catch {
    return '#';
  }
}

// ── 4. FRENO ANTI-ENVÍOS REPETIDOS ──────────────────────────
/**
 * Evita que un formulario se mande 40 veces por doble clic o por
 * un bot torpe. Es comodidad y limpieza de datos, NO seguridad:
 * un bot serio ignora el navegador. El freno de verdad va en la
 * base de datos (ver los límites del supabase.schema.sql).
 */
export function crearFreno(msMinimo = 3000) {
  let ultimo = 0;
  return function permitir() {
    const ahora = Date.now();
    if (ahora - ultimo < msMinimo) return false;
    ultimo = ahora;
    return true;
  };
}

// ════════════════════════════════════════════════════════════
//  LO QUE ESTE ARCHIVO NO PUEDE HACER
//
//  · No protege la base de datos. Eso son las políticas RLS.
//  · No detiene bots. Un bot no ejecuta tu JavaScript: manda el
//    POST directo. Para eso está el límite en la base y, si hace
//    falta, un captcha validado en el servidor.
//  · No reemplaza validar en el servidor. Todo lo de aquí se
//    salta con la consola del navegador abierta. Es la primera
//    barrera, no la única.
// ════════════════════════════════════════════════════════════
