// ════════════════════════════════════════════════════════════
//  EXTRAER RESPUESTAS DE UN DOCUMENTO
//
//  El cliente casi nunca llena un formulario. Manda un WhatsApp, un
//  correo o un Word. Esto convierte ese texto en respuestas del
//  asistente, para no volver a teclearlas.
//
//  Dos modos, como todo el panel:
//    GRATIS → patrones sobre el texto. Encuentra lo estructurado
//             (teléfonos, colores, dominios, palabras clave).
//    IA     → Claude lee texto libre y devuelve la ficha. Aquí SÍ
//             se gana lo que cuesta: un párrafo desordenado no se
//             puede parsear con reglas.
//
//  Regla firme en ambos: lo que no está en el documento se queda
//  vacío. Nunca se inventa un valor "porque es lo típico".
// ════════════════════════════════════════════════════════════

// ── Modo gratis: patrones ─────────────────────────────────────

const PALABRAS_BASE = [
  { base: 'ecommerce-completo',    objetivo: 'vender',   claves: ['tienda en linea', 'tienda online', 'vender por internet', 'ecommerce', 'e-commerce', 'inventario', 'stock'] },
  { base: 'menu-con-panel-admin',  objetivo: 'menu',     claves: ['menu', 'menú', 'carta', 'restaurante', 'cafeteria', 'cafetería', 'domicilios'] },
  { base: 'landing-modular',       objetivo: 'contacto', claves: ['landing', 'pagina de contacto', 'agendar', 'cita', 'formulario', 'clinica', 'clínica'] },
  { base: 'carrito-reutilizable',  objetivo: 'carrito',  claves: ['carrito', 'catalogo', 'catálogo'] },
  { base: 'crm-simple',            objetivo: 'clientes', claves: ['crm', 'historial de clientes', 'seguimiento de clientes'] },
  { base: 'marketplace',           objetivo: 'multi',    claves: ['marketplace', 'varios vendedores', 'multivendedor', 'comision', 'comisión'] },
  { base: 'suscripciones',         objetivo: 'planes',   claves: ['suscripcion', 'suscripción', 'membresia', 'membresía', 'plan mensual'] },
];

const normalizar = (t) => String(t).toLowerCase()
  .normalize('NFD').replace(/[̀-ͯ]/g, '');

/**
 * El brief.html emite un bloque JSON entre marcas. Si viene, se lee tal cual:
 * es exacto, no hay nada que adivinar y no cuesta nada. Los patrones quedan
 * para el caso de siempre — el WhatsApp suelto.
 */
export function leerBloqueBrief(texto) {
  const m = String(texto || '')
    .match(/---\s*BRIEF-ESTUDIO\s+v1\s*---\s*([\s\S]*?)\s*---\s*FIN BRIEF\s*---/i);
  if (!m) return null;
  try { return JSON.parse(m[1]); } catch { return null; }
}

export function extraerPorPatrones(texto) {
  const t = String(texto || '');

  // ─ Ruta exacta: el formulario del estudio
  const bloque = leerBloqueBrief(t);
  if (bloque) {
    const { servicio, generado, ...respuestas } = bloque;
    // `base` se queda dentro de las respuestas: es lo que respuestasAFicha
    // y crear-proyecto necesitan para saber qué base copiar.
    respuestas.base ??= servicio;
    return {
      respuestas,
      encontrado: Object.keys(respuestas),
      modo: 'gratis',
      costo: 0,
      fuente: 'formulario',
      base: respuestas.base,
    };
  }

  // ─ Ruta aproximada: texto libre
  const n = normalizar(t);
  const respuestas = {};
  const encontrado = [];

  // ─ Nombre del negocio. Varias formas de presentarse, en orden de confianza:
  //   "Negocio: X"  ·  "de parte de X"  ·  "somos X"  ·  "mi negocio se llama X"
  const formas = [
    /(?:negocio|cliente|empresa|proyecto)\s*[:=]\s*["']?([A-ZÁÉÍÓÚÑ][^\n,.;]{2,45})/,
    // "le escribo de parte de X" — el "parte de" es opcional y NO debe
    // quedarse dentro del nombre capturado.
    /(?:le\s+)?escribo\s+de\s+(?:parte\s+de\s+)?([A-ZÁÉÍÓÚÑ][^\n,.;]{2,45})/i,
    /de\s+parte\s+de\s+([A-ZÁÉÍÓÚÑ][^\n,.;]{2,45})/i,
    /(?:se llama|nos llamamos|somos)\s+["']?([A-ZÁÉÍÓÚÑ][^\n,.;]{2,45})/,
  ];
  for (const re of formas) {
    const m = t.match(re);
    if (m) {
      respuestas.cliente = m[1].trim().replace(/\s+(y|e)\s*$/i, '');
      encontrado.push('nombre del negocio');
      break;
    }
  }

  // ─ WhatsApp / teléfono colombiano
  const tel = t.match(/(?:\+?57)?\s*3\d{2}[\s.-]?\d{3}[\s.-]?\d{4}/);
  if (tel) {
    const limpio = tel[0].replace(/\D/g, '');
    respuestas.whatsapp = limpio.startsWith('57') ? limpio : '57' + limpio;
    encontrado.push('WhatsApp');
  }

  // ─ Colores en hexadecimal
  const colores = [...t.matchAll(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/g)].map((m) => m[0]);
  if (colores[0]) { respuestas.primario = colores[0]; encontrado.push('color primario'); }
  if (colores[1]) { respuestas.secundario = colores[1]; encontrado.push('color secundario'); }
  if (colores.length) respuestas.tienemarca = true;

  // ─ Dominio
  // com.co va ANTES que com: la alternancia toma la primera que encaja,
  // y si com gana, "laespiga.com.co" se corta en "laespiga.com".
  const dom = t.match(/\b([a-z0-9][a-z0-9-]{1,60}\.(?:com\.co|com|co|net|org|shop|store))\b/i);
  if (dom && !/gmail|hotmail|outlook|yahoo/i.test(dom[1])) {
    respuestas.dominio = dom[1].toLowerCase();
    encontrado.push('dominio');
  }

  // ─ Qué necesita → base técnica
  let mejor = null, mejorPuntos = 0;
  for (const cand of PALABRAS_BASE) {
    const puntos = cand.claves.filter((c) => n.includes(normalizar(c))).length;
    if (puntos > mejorPuntos) { mejor = cand; mejorPuntos = puntos; }
  }
  if (mejor) { respuestas.objetivo = mejor.objetivo; encontrado.push('qué necesita (' + mejor.base + ')'); }

  // ─ Pasarela de pago
  if (/wompi/i.test(t)) { respuestas.pagos = 'wompi'; encontrado.push('pasarela'); }
  else if (/mercado\s*pago/i.test(t)) { respuestas.pagos = 'mercadopago'; encontrado.push('pasarela'); }
  else if (/stripe/i.test(t)) { respuestas.pagos = 'stripe'; encontrado.push('pasarela'); }
  else if (/whatsapp/i.test(t)) { respuestas.pagos = 'whatsapp'; encontrado.push('pasarela'); }

  // ─ Motor de datos
  if (/supabase/i.test(t)) { respuestas.motor = 'supabase'; encontrado.push('motor de datos'); }
  else if (/firebase/i.test(t)) { respuestas.motor = 'firebase'; encontrado.push('motor de datos'); }

  // ─ Analítica
  if (/(google\s*analytics|ga4|analitica|analítica|metricas|métricas)/i.test(t)) {
    respuestas.analitica = 'ga4'; encontrado.push('analítica');
  }

  // ─ Señales de línea pro
  // Multisede: "varias sedes", "3 sedes", "dos sucursales"…
  // Se decide por el número que acompaña al lugar, no por un guardia global:
  // "una tienda en línea" NO es una sede física y no debe contar.
  const CANTIDAD = { una: 1, un: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
                     seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10 };
  const reSede = /\b(\d+|una?|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|varias|varios|multiples|múltiples)\s+(sedes?|sucursales?|puntos de venta)\b/gi;
  for (const m of t.matchAll(reSede)) {
    const bruto = m[1].toLowerCase();
    const n = /^\d+$/.test(bruto) ? parseInt(bruto, 10) : (CANTIDAD[bruto] ?? 99);
    if (n > 1) {
      respuestas.sedes = 'varias';
      encontrado.push('varias sedes → pro');
      break;
    }
  }
  if (/(datos personales|historia clinica|historia clínica|pacientes|habeas data)/i.test(t)) {
    respuestas.sensibles = true; encontrado.push('datos sensibles → pro');
  }

  // ─ Línea implícita. El validador-de-ficha.md es explícito: multisede o
  //   datos personales obligan a "pro". No es una preferencia, es la regla.
  if (respuestas.sedes === 'varias' || respuestas.sensibles === true) {
    respuestas.linea = 'pro';
    encontrado.push('línea pro (derivada)');
  }

  return { respuestas, encontrado, modo: 'gratis', costo: 0, fuente: 'texto libre' };
}

// ── Modo IA: texto libre ──────────────────────────────────────

const SYSTEM_EXTRACCION = `Extraes datos de un brief de cliente para un estudio de diseño web colombiano.

Devuelves SOLO un objeto JSON, sin markdown, sin explicación, con estas claves
(omite por completo las que el documento no responda — NUNCA inventes un valor):

cliente        string  nombre real del negocio
subtitulo      string  a qué se dedica, una frase
dominio        string  dominio propio, o "por comprar"
sedes          "una" | "varias"
objetivo       "vender" | "carrito" | "contacto" | "menu" | "clientes" | "multi" | "planes"
autoedita      boolean ¿quiere editar el contenido él mismo?
tienemarca     boolean
primario       string  color hex, ej "#1B36C9"
secundario     string  color hex
inicial        string  una o dos letras
tono           string  dos o tres palabras
contenido_listo "si" | "parcial" | "no"
fotos          boolean
whatsapp       string  solo dígitos con indicativo, ej "573001234567"
pagos          "whatsapp" | "wompi" | "mercadopago" | "stripe"
sensibles      boolean ¿guarda datos personales?
motor          "supabase" | "firebase" | "local"
analitica      "ga4" | "ninguna"
linea          "starter" | "pro"
soporte        "plan_mensual" | "ninguno"

Reglas:
- Si el documento no lo dice, la clave NO aparece. Un campo ausente es correcto;
  un campo inventado arruina la entrega.
- "varias sedes" o datos personales implican linea "pro".
- Si menciona vender en línea con inventario, objetivo es "vender".`;

export async function extraerConIA(texto, modeloClave = 'haiku') {
  // Si el documento ya trae el bloque del formulario, no hay nada que
  // interpretar: cobrar por esto sería tirar el dinero.
  if (leerBloqueBrief(texto)) return extraerPorPatrones(texto);

  const { MODELOS } = await import('../auditor-ia.js');
  const m = MODELOS[modeloClave] || MODELOS.haiku;

  let Anthropic;
  try {
    ({ default: Anthropic } = await import('@anthropic-ai/sdk'));
  } catch {
    throw new Error('Falta el SDK. Instala: cd herramientas && npm install @anthropic-ai/sdk');
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('Falta ANTHROPIC_API_KEY. Consíguela en console.anthropic.com');
  }

  const api = new Anthropic();
  const r = await api.messages.create({
    model: m.id,
    max_tokens: 1200,
    system: [{ type: 'text', text: SYSTEM_EXTRACCION, cache_control: { type: 'ephemeral' } }],
    messages: [{ role: 'user', content: 'Brief del cliente:\n\n' + texto }],
  });

  const crudo = r.content.filter((b) => b.type === 'text').map((b) => b.text).join('').trim();
  const limpio = crudo.replace(/^```(?:json)?/i, '').replace(/```$/, '').trim();

  let respuestas = {};
  try { respuestas = JSON.parse(limpio); }
  catch { throw new Error('El modelo no devolvió JSON válido. Prueba el modo gratis.'); }

  const u = r.usage;
  const costo = (u.input_tokens / 1e6) * m.entrada + (u.output_tokens / 1e6) * m.salida;

  return {
    respuestas,
    encontrado: Object.keys(respuestas),
    modo: 'ia',
    modelo: m.id,
    costo: Math.round(costo * 10000) / 10000,
  };
}
