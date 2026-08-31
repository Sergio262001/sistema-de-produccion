// ════════════════════════════════════════════════════════════
//  EL CUESTIONARIO, COMO DATO.
//
//  Es 06-plantillas-de-negocio/brief-de-cliente.md convertido en
//  estructura: cada pregunta sabe a qué campo de la ficha va, así
//  que llenar la ficha deja de ser "copiar y pegar interpretando"
//  y pasa a ser automático.
//
//  La compuerta de salida es 04-fichas-de-contexto/validador-de-ficha.md:
//  si falta un campo obligatorio, no se construye. Se pregunta.
// ════════════════════════════════════════════════════════════

/**
 * campo: ruta con puntos dentro de la ficha (marca.primario → ficha.marca.primario)
 * tipo:  texto | larga | opcion | multiple | color | numero | si-no
 * clave: true = el validador de ficha lo exige antes de construir
 */
export const PASOS = [
  {
    id: 'identidad',
    titulo: 'Identidad del negocio',
    nota: 'Nombres reales, nunca "Cliente X". Un placeholder que llega a la entrega se nota.',
    preguntas: [
      { id: 'cliente', campo: 'cliente', tipo: 'texto', clave: true,
        pregunta: '¿Cómo se llama el negocio?',
        ayuda: 'Como lo escribe el cliente, con tildes y todo.' },
      { id: 'subtitulo', campo: 'marca.subtitulo', tipo: 'texto',
        pregunta: '¿A qué se dedica, en una frase?',
        ayuda: 'Va en el hero. Ej: "Cafetería de especialidad · Bogotá"' },
      { id: 'dominio', campo: 'entrega.dominio', tipo: 'texto', clave: true,
        pregunta: '¿Tiene dominio propio?',
        ayuda: 'Si hay que comprarlo, escribe "por comprar" — no lo inventes.' },
      { id: 'sedes', campo: '_sedes', tipo: 'opcion',
        pregunta: '¿Una sede o varias?',
        opciones: [
          { valor: 'una', etiqueta: 'Una sola sede' },
          { valor: 'varias', etiqueta: 'Varias sedes', implica: { linea: 'pro' } },
        ] },
    ],
  },
  {
    id: 'necesidad',
    titulo: 'Qué necesita',
    nota: 'Esto decide la base técnica. Es la pregunta que más define el proyecto.',
    preguntas: [
      { id: 'objetivo', campo: '_objetivo', tipo: 'opcion', clave: true,
        pregunta: '¿Qué quiere que la web haga?',
        opciones: [
          { valor: 'vender',  etiqueta: 'Vender productos en línea',       base: 'ecommerce-completo' },
          { valor: 'carrito', etiqueta: 'Catálogo con carrito, sin panel',  base: 'carrito-reutilizable' },
          { valor: 'contacto',etiqueta: 'Que le escriban o pidan cita',     base: 'landing-modular' },
          { valor: 'menu',    etiqueta: 'Mostrar su carta o menú',          base: 'menu-con-panel-admin' },
          { valor: 'clientes',etiqueta: 'Llevar clientes e historial',      base: 'crm-simple' },
          { valor: 'multi',   etiqueta: 'Varios vendedores con comisión',   base: 'marketplace' },
          { valor: 'planes',  etiqueta: 'Cobrar planes o suscripciones',    base: 'suscripciones' },
        ] },
      { id: 'autoedita', campo: '_autoedita', tipo: 'si-no',
        pregunta: '¿El cliente quiere editar precios y contenido él mismo?',
        ayuda: 'Si sí, necesita panel admin con login real.',
        implicaSi: { 'auth.motor': 'supabase', 'auth.rol_requerido': 'admin' } },
    ],
  },
  {
    id: 'marca',
    titulo: 'Marca',
    nota: 'Si no tiene marca definida, se diseña como parte del proyecto. Nunca inventes colores por tu cuenta.',
    preguntas: [
      { id: 'tienemarca', campo: '_tienemarca', tipo: 'si-no',
        pregunta: '¿Tiene logo y colores definidos?' },
      { id: 'primario', campo: 'marca.primario', tipo: 'color', clave: true,
        pregunta: 'Color primario',
        ayuda: 'Si no lo tiene, marca abajo que se diseñará la marca.' },
      { id: 'secundario', campo: 'marca.secundario', tipo: 'color', clave: true,
        pregunta: 'Color de fondo' },
      { id: 'inicial', campo: 'marca.inicial', tipo: 'texto',
        pregunta: 'Inicial para el logo', ayuda: 'Una o dos letras.' },
      { id: 'tono', campo: 'marca.tono', tipo: 'texto',
        pregunta: 'Dos o tres palabras que describan el tono',
        ayuda: 'Ej: "cercano y artesanal", "profesional y serio"' },
    ],
  },
  {
    id: 'contenido',
    titulo: 'Contenido real',
    nota: 'Contenido real, no relleno. Si no lo tiene todavía, se anota como pendiente — no se inventa.',
    preguntas: [
      { id: 'contenido_listo', campo: '_contenido', tipo: 'opcion',
        pregunta: '¿Tiene el contenido listo?',
        opciones: [
          { valor: 'si',      etiqueta: 'Sí, ya lo entregó' },
          { valor: 'parcial', etiqueta: 'Parte, falta el resto' },
          { valor: 'no',      etiqueta: 'No, hay que producirlo' },
        ] },
      { id: 'fotos', campo: '_fotos', tipo: 'si-no',
        pregunta: '¿Tiene fotos propias?',
        ayuda: 'Si no, se usan genéricas y se anota como pendiente.' },
    ],
  },
  {
    id: 'contacto',
    titulo: 'Cómo recibe pedidos hoy',
    preguntas: [
      { id: 'whatsapp', campo: 'apis.whatsapp_num', tipo: 'texto',
        pregunta: 'Número de WhatsApp',
        ayuda: 'Con indicativo, sin espacios. Ej: 573001234567' },
      { id: 'pagos', campo: 'apis.pagos', tipo: 'opcion', clave: true,
        pregunta: '¿Cómo va a cobrar?',
        ayuda: 'La cuenta de la pasarela la crea EL CLIENTE, con su NIT y su banco. Tú solo integras la public_key.',
        opciones: [
          { valor: 'whatsapp',    etiqueta: 'Por WhatsApp (sin cobro en línea)' },
          { valor: 'wompi',       etiqueta: 'Wompi — ya tiene cuenta' },
          { valor: 'mercadopago', etiqueta: 'Mercado Pago — ya tiene cuenta' },
          { valor: 'stripe',      etiqueta: 'Stripe — ya tiene cuenta' },
        ] },
    ],
  },
  {
    id: 'datos',
    titulo: 'Datos y privacidad',
    nota: 'Si guarda datos personales, la línea sube a pro y el RLS se vuelve estricto. No es negociable.',
    preguntas: [
      { id: 'sensibles', campo: '_sensibles', tipo: 'si-no',
        pregunta: '¿Va a guardar datos personales de clientes o pacientes?',
        ayuda: 'Nombre, teléfono, historial médico, dirección...',
        implicaSi: { linea: 'pro' } },
      { id: 'motor', campo: 'base_de_datos.motor', tipo: 'opcion', clave: true,
        pregunta: '¿Dónde viven los datos?',
        opciones: [
          { valor: 'supabase', etiqueta: 'Supabase' },
          { valor: 'firebase', etiqueta: 'Firebase' },
          { valor: 'local',    etiqueta: 'Local (temporal, se documenta como pendiente)' },
        ] },
    ],
  },
  {
    id: 'medicion',
    titulo: 'Medición',
    preguntas: [
      { id: 'analitica', campo: 'apis.analitica', tipo: 'opcion',
        pregunta: '¿Quiere saber cuánta gente visita la página?',
        opciones: [
          { valor: 'ga4',     etiqueta: 'Sí, Google Analytics 4' },
          { valor: 'ninguna', etiqueta: 'No por ahora' },
        ] },
    ],
  },
  {
    id: 'entrega',
    titulo: 'Entrega y soporte',
    preguntas: [
      { id: 'linea', campo: 'linea', tipo: 'opcion', clave: true,
        pregunta: 'Línea del proyecto',
        ayuda: 'Pro si hay panel, roles, multisede o datos sensibles.',
        opciones: [
          { valor: 'starter', etiqueta: 'Starter — pago único + soporte' },
          { valor: 'pro',     etiqueta: 'Pro — por fases + retainer' },
        ] },
      { id: 'soporte', campo: 'entrega.soporte', tipo: 'opcion',
        pregunta: '¿Soporte mensual?',
        opciones: [
          { valor: 'plan_mensual', etiqueta: 'Sí, plan mensual' },
          { valor: 'ninguno',      etiqueta: 'Solo la entrega' },
        ] },
    ],
  },
];

// ── Utilidades sobre la estructura ────────────────────────────

export function todasLasPreguntas() {
  return PASOS.flatMap((p) => p.preguntas.map((q) => ({ ...q, paso: p.id })));
}

function ponerEnRuta(obj, ruta, valor) {
  const partes = ruta.split('.');
  let cur = obj;
  for (let i = 0; i < partes.length - 1; i++) {
    cur[partes[i]] ??= {};
    cur = cur[partes[i]];
  }
  cur[partes[partes.length - 1]] = valor;
}

/**
 * Convierte las respuestas del asistente en una ficha de contexto,
 * aplicando las implicaciones (varias sedes → pro, datos sensibles → pro…).
 * Devuelve { ficha, base, avisos }.
 */
export function respuestasAFicha(respuestas) {
  const ficha = {};
  const avisos = [];
  let base = null;

  for (const q of todasLasPreguntas()) {
    const valor = respuestas[q.id];
    if (valor === undefined || valor === '' || valor === null) continue;

    // opción que define la base técnica
    if (q.opciones) {
      const op = q.opciones.find((o) => o.valor === valor);
      if (op?.base) base = op.base;
      if (op?.implica) for (const [k, v] of Object.entries(op.implica)) ponerEnRuta(ficha, k, v);
    }
    // sí/no con consecuencias
    if (q.implicaSi && (valor === true || valor === 'si')) {
      for (const [k, v] of Object.entries(q.implicaSi)) ponerEnRuta(ficha, k, v);
    }
    // los campos que empiezan con _ son de decisión, no van a la ficha
    if (q.campo.startsWith('_')) continue;

    ponerEnRuta(ficha, q.campo, valor);
  }

  // Coherencias que el validador de ficha exige
  if (respuestas.sensibles === true || respuestas.sensibles === 'si') {
    ficha.linea = 'pro';
    avisos.push('Guarda datos personales: la línea se forzó a "pro" y el RLS debe ser estricto (ver clinica.yml).');
  }
  if (respuestas.sedes === 'varias' && ficha.linea !== 'pro') {
    ficha.linea = 'pro';
    avisos.push('Varias sedes: la línea se forzó a "pro".');
  }
  if (respuestas.tienemarca === false || respuestas.tienemarca === 'no') {
    avisos.push('No tiene marca definida: los colores son provisionales y el diseño de marca es parte del alcance.');
  }
  if (respuestas.contenido_listo && respuestas.contenido_listo !== 'si') {
    avisos.push('Contenido incompleto: se entrega con placeholders explícitos, nunca con relleno inventado.');
  }
  if (respuestas.fotos === false || respuestas.fotos === 'no') {
    avisos.push('Sin fotos propias: se usan genéricas y queda anotado como pendiente.');
  }
  if (ficha.apis?.pagos && ficha.apis.pagos !== 'whatsapp') {
    avisos.push('Pasarela de pago: la cuenta la crea el CLIENTE con su NIT y su banco. Tú solo recibes la public_key.');
  }
  if (ficha.base_de_datos?.motor === 'local') {
    avisos.push('Motor local: es punto de partida válido, pero debe quedar escrito que es temporal.');
  }

  ficha.proyecto ??= ficha.cliente;
  if (base) ficha.base = base;

  return { ficha, base, avisos };
}

/**
 * La compuerta: 04-fichas-de-contexto/validador-de-ficha.md, ejecutable.
 * Devuelve los campos obligatorios que faltan.
 */
export function validarFicha(respuestas) {
  const faltan = [];
  for (const q of todasLasPreguntas()) {
    if (!q.clave) continue;
    const v = respuestas[q.id];
    if (v === undefined || v === '' || v === null) {
      faltan.push({ id: q.id, paso: q.paso, pregunta: q.pregunta });
    }
  }

  // Placeholders disfrazados de respuesta
  const nombre = String(respuestas.cliente || '').trim().toLowerCase();
  if (/^(cliente|proyecto|negocio|test|prueba)\s*[x1-9]?$/.test(nombre)) {
    faltan.push({ id: 'cliente', paso: 'identidad',
      pregunta: 'El nombre parece un placeholder. Usa el nombre real del negocio.' });
  }

  return { listo: faltan.length === 0, faltan };
}
