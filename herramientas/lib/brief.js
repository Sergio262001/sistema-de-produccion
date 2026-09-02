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
      // El valor ES el identificador de la base: así el formulario del cliente
      // y el asistente del panel hablan el mismo idioma, sin traducción.
      // `familia` agrupa igual que 01-documentos/1-catalogo-de-servicios.html.
      { id: 'objetivo', campo: '_objetivo', tipo: 'opcion', clave: true,
        pregunta: '¿Qué servicio necesita?',
        opciones: [
          { valor: 'ecommerce-completo',   etiqueta: 'Tienda online',
            detalle: 'Catálogo con inventario, carrito y panel de administración.',
            familia: 'vender', linea: 'Pro',     base: 'ecommerce-completo' },
          { valor: 'carrito-reutilizable', etiqueta: 'Carrito y pedidos',
            detalle: 'Catálogo con carrito y checkout, sin panel.',
            familia: 'vender', linea: 'Starter', base: 'carrito-reutilizable' },
          { valor: 'marketplace',          etiqueta: 'Marketplace',
            detalle: 'Varios vendedores con desglose de comisión.',
            familia: 'vender', linea: 'Pro',     base: 'marketplace' },
          { valor: 'suscripciones',        etiqueta: 'Suscripciones',
            detalle: 'Planes o membresías con registro de suscriptores.',
            familia: 'vender', linea: 'Pro',     base: 'suscripciones' },

          { valor: 'landing-modular',      etiqueta: 'Landing page',
            detalle: 'Presentación por secciones con formulario de contacto.',
            familia: 'web', linea: 'Starter',    base: 'landing-modular' },

          { valor: 'menu-con-panel-admin', etiqueta: 'Menú digital QR',
            detalle: 'La carta en el celular, con panel para editarla.',
            familia: 'menu', linea: 'Starter',   base: 'menu-con-panel-admin' },

          { valor: 'crm-simple',           etiqueta: 'CRM simple',
            detalle: 'Clientes e historial de interacciones.',
            familia: 'panel', linea: 'Pro',      base: 'crm-simple' },
          { valor: 'auth',                 etiqueta: 'Login y roles',
            detalle: 'Acceso para el equipo con permisos por persona.',
            familia: 'panel', linea: 'Starter',  base: 'auth' },
          { valor: 'dashboard-analytics',  etiqueta: 'Panel de indicadores',
            detalle: 'Ventas, pedidos y contactos en un solo tablero.',
            familia: 'panel', linea: 'Pro',      base: 'dashboard-analytics' },
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
        pregunta: 'Inicial para el logo',
        ayuda: 'Una o dos letras. Es el respaldo si no hay archivo de logo.' },

      // El logo y el banner del cliente. Sin esto el entregable sale con una
      // letra dentro de un cuadro: sirve para una demo, no para un negocio
      // que ya tiene su marca hecha. Si vienen vacíos, la inicial sigue
      // funcionando — no se inventa una imagen.
      { id: 'logo', campo: 'marca.logo', tipo: 'url',
        pregunta: 'Dirección del logo',
        ayuda: 'URL de la imagen (https://...). PNG con fondo transparente '
             + 'o SVG. Si no la tienes a mano, déjalo vacío: se usa la inicial.' },
      { id: 'banner', campo: 'marca.banner', tipo: 'url',
        pregunta: 'Dirección del banner',
        ayuda: 'URL de una foto ancha para la cabecera. Si no hay, no se '
             + 'muestra ninguna: no se rellena con una imagen de archivo.' },
      { id: 'tono', campo: 'marca.tono', tipo: 'texto',
        pregunta: 'Dos o tres palabras que describan el tono',
        ayuda: 'Ej: "cercano y artesanal", "profesional y serio"' },

      // LA pregunta de diseño. Cambiar el color no cambia el diseño: dos
      // clientes con paletas distintas recibían el mismo sitio pintado de
      // otro color. La dirección cambia tipografía, escala, forma y ritmo.
      { id: 'direccion', campo: 'marca.direccion', tipo: 'opcion',
        pregunta: '¿Cómo se tiene que sentir la página?',
        ayuda: 'Esto no es el color: cambia la tipografía, el tamaño de los '
             + 'precios, la forma de las esquinas y cuánto aire hay entre las '
             + 'cosas. Es lo que hace que dos negocios no reciban lo mismo.',
        opciones: [
          { valor: 'mercado',
            etiqueta: 'Directo y de barrio — el precio bien visible, sin adornos' },
          { valor: 'boutique',
            etiqueta: 'Cuidado y con aire — para lo que se cobra caro' },
          { valor: 'taller',
            etiqueta: 'Claro y funcional — que se lea rápido, como una ficha' },
        ] },
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

      // La pregunta que faltaba, y la razón de que todo entregable se viera
      // "básico": sin esto el catálogo del cliente era el del ejemplo.
      // Solo aparece en las bases que tienen catálogo.
      { id: 'catalogo', campo: '_catalogo', tipo: 'larga',
        pregunta: 'Escribe tus categorías y tus productos',
        ayuda: 'Una categoría por línea. Debajo sus productos así: '
             + 'nombre | precio | descripción (la descripción es opcional). '
             + 'Si no lo tienes a mano, déjalo vacío: se entrega con datos de '
             + 'ejemplo y queda anotado como pendiente.',
        ejemplo: 'Tacos\nAl pastor | 12000 | Piña y cilantro\nCarnitas | 11500\n\n'
               + 'Bebidas\nAgua de horchata | 6000',
        soloBases: ['menu-con-panel-admin', 'ecommerce-completo',
                    'carrito-reutilizable', 'marketplace'] },
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
/**
 * Marca de "no aplica". Lo que el cliente marque así NO se entrega:
 * no se simula, no se rellena con el ejemplo, no se inventa un valor
 * razonable. Se omite, y queda escrito como pendiente.
 *
 * El sistema ya predicaba esto en brief-de-cliente.md ("si una respuesta
 * queda vacía, pregunta antes de asumir"), pero no era ejecutable: una
 * respuesta ausente y una respuesta "no aplica" se trataban igual, y
 * entonces el entregable salía con los datos del negocio del ejemplo.
 */
import { leerContenido, puedeSembrar } from './contenido.js';

export const NO_APLICA = '__no_aplica__';

/**
 * ¿Este valor es un "no aplica" EXPLÍCITO?
 *
 * La lista es corta a propósito. Se probó con "todavía no" dentro y se
 * tragaba una respuesta legítima: "todavía no" como dominio significa "no
 * tengo, hay que comprarlo" — eso es información, no ausencia de ella.
 * Ante la duda, se trata como respuesta: perder un dato del cliente es peor
 * que arrastrar uno ambiguo.
 */
export const esNoAplica = (v) =>
  v === NO_APLICA
  || (typeof v === 'string'
      && ['no aplica', 'no-aplica', 'n/a', 'n.a.'].includes(v.trim().toLowerCase()));

/**
 * Quita del objeto todo lo marcado como no aplica, y devuelve qué se quitó
 * para poder anotarlo como pendiente en el README del proyecto.
 */
export function separarNoAplica(respuestas = {}) {
  const limpias = {};
  const omitidos = [];
  for (const [k, v] of Object.entries(respuestas)) {
    if (esNoAplica(v)) omitidos.push(k);
    else limpias[k] = v;
  }
  return { limpias, omitidos };
}

/** Las cuatro familias del catálogo de servicios, con su acento. */
export const FAMILIAS = [
  { id: 'vender', nombre: 'Ecommerce & Ventas', nota: 'línea principal' },
  { id: 'web',    nombre: 'Web & Landing' },
  { id: 'menu',   nombre: 'Menús digitales' },
  { id: 'panel',  nombre: 'Paneles, Auth & Datos' },
];

/** Las 9 bases de 02-bases/. El formulario manda el identificador directo. */
export const BASES_CONOCIDAS = [
  'menu-con-panel-admin', 'carrito-reutilizable', 'landing-modular', 'auth',
  'ecommerce-completo', 'dashboard-analytics', 'crm-simple', 'suscripciones',
  'marketplace',
];

export function respuestasAFicha(respuestasCrudas) {
  // Lo marcado "no aplica" se saca ANTES de armar nada: así no hay forma de
  // que se cuele por un valor por defecto más abajo.
  const { limpias: respuestas, omitidos } = separarNoAplica(respuestasCrudas || {});

  const ficha = {};
  const avisos = [];

  if (omitidos.length) {
    avisos.push('El cliente marcó como "no aplica": ' + omitidos.join(', ')
      + '. Esos campos se omiten del entregable — no se rellenan con datos de ejemplo.');
  }

  // El brief.html ya eligió el servicio y manda su identificador. Si viene,
  // manda sobre la deducción por palabras clave.
  let base = BASES_CONOCIDAS.includes(respuestas.base) ? respuestas.base
           : BASES_CONOCIDAS.includes(respuestas.objetivo) ? respuestas.objetivo
           : null;

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

  // ── Normalizaciones ──
  // Van aquí y no en cada formulario porque por esta función pasan LOS DOS
  // caminos (el brief del cliente y el asistente del panel). Arreglarlo en
  // un solo formulario dejaría el otro mal.

  // WhatsApp sin indicativo: el enlace wa.me no abre sin él. 10 dígitos que
  // empiezan por 3 es un móvil colombiano; se le antepone 57.
  const wa = String(ficha.apis?.whatsapp_num || '').replace(/\D/g, '');
  if (wa) {
    if (/^3\d{9}$/.test(wa)) {
      ficha.apis.whatsapp_num = '57' + wa;
      avisos.push('Al WhatsApp le faltaba el indicativo: quedó como 57' + wa + '. Confírmalo con el cliente.');
    } else if (/^57\d{10}$/.test(wa)) {
      ficha.apis.whatsapp_num = wa;
    } else {
      ficha.apis.whatsapp_num = wa;
      avisos.push('El WhatsApp "' + wa + '" no parece un número colombiano válido. Verifícalo antes de entregar.');
    }
  }

  // "no" / "ninguno" como dominio es una respuesta, no un dominio. Se
  // convierte en algo que el resto del sistema entiende y que además dice
  // qué falta hacer.
  const dom = String(ficha.entrega?.dominio || '').trim().toLowerCase();
  if (['no', 'ninguno', 'nel', 'todavia no', 'todavía no', 'aun no', 'aún no'].includes(dom)) {
    ficha.entrega.dominio = 'por comprar';
    avisos.push('El cliente no tiene dominio: quedó como "por comprar". Es una compra suya, no del estudio.');
  }

  // Logo y banner: misma regla que urlSegura() en las bases, pero aquí el
  // objetivo es AVISAR, no solo filtrar. Una URL mala que llega al entregable
  // se ve como un logo roto, y eso es peor que la inicial.
  for (const [clave, nombre] of [['logo', 'logo'], ['banner', 'banner']]) {
    const url = String(ficha.marca?.[clave] || '').trim();
    if (!url) continue;
    if (!/^(https?:\/\/|\/|\.\/)/i.test(url)) {
      delete ficha.marca[clave];
      avisos.push('La dirección del ' + nombre + ' ("' + url + '") no es una URL: '
        + 'se descarta. Tiene que empezar por https:// — un enlace de Drive o '
        + 'un archivo del escritorio no sirven, hay que subir la imagen.');
      continue;
    }
    ficha.marca[clave] = url;
    if (/^http:\/\//i.test(url)) {
      avisos.push('El ' + nombre + ' está en http sin cifrar: el navegador puede '
        + 'bloquearlo dentro de un sitio https. Súbelo a https antes de entregar.');
    }
    if (/drive\.google\.com|dropbox\.com|\/file\/d\//i.test(url)) {
      avisos.push('La dirección del ' + nombre + ' parece un enlace para compartir, '
        + 'no la imagen en sí. Verifica que se vea al abrirla sola en el navegador.');
    }
  }
  // La dirección de arte. Solo tres valores; cualquier otra cosa la base la
  // ignora y cae en "taller", así que más vale decirlo aquí.
  const DIRECCIONES = ['mercado', 'boutique', 'taller'];
  const dir = ficha.marca?.direccion;
  if (dir && !DIRECCIONES.includes(dir)) {
    delete ficha.marca.direccion;
    avisos.push('La dirección de arte "' + dir + '" no existe. Las válidas son: '
      + DIRECCIONES.join(', ') + '. Se descarta.');
  } else if (!dir) {
    avisos.push('Sin dirección de arte elegida: el entregable sale con la del '
      + 'ejemplo de la base. Es una decisión de diseño, no un dato que falte — '
      + 'elígela tú si el cliente no supo responder.');
  }

  if (!ficha.marca?.logo) {
    avisos.push('Sin archivo de logo: se entrega con la inicial en un cuadro de '
      + 'color. Es un respaldo digno, pero pídeselo antes de publicar.');
  }

  // El catálogo llega como texto libre; se guarda ya parseado para que el
  // generador no tenga que volver a interpretarlo.
  if (respuestas.catalogo && String(respuestas.catalogo).trim()) {
    const { categorias, avisos: avisosContenido } = leerContenido(respuestas.catalogo);
    ficha._catalogo = categorias;
    avisos.push(...avisosContenido);
    if (categorias.length) {
      const n = categorias.reduce((t, c) => t + c.productos.length, 0);
      const resumen = categorias.length + ' categorías, ' + n + ' productos';
      if (base && !puedeSembrar(base)) {
        // Callarse esto sería entregar el catálogo del ejemplo sin avisar.
        avisos.push('El cliente entregó su catálogo (' + resumen + ') pero la base "'
          + base + '" no se puede sembrar automáticamente: cada producto pertenece '
          + 'a un vendedor y el brief no pregunta cuál. Queda guardado en la ficha; '
          + 'hay que cargarlo a mano asignando vendedor.');
      } else {
        avisos.push('Contenido real del cliente: ' + resumen
          + '. Reemplaza al catálogo de ejemplo.');
      }
    }
  } else {
    avisos.push('Sin catálogo del cliente: se entrega con los datos de ejemplo, '
      + 'que se ven claramente como tales. Pídeselo antes de publicar.');
  }

  ficha.proyecto ??= ficha.cliente;
  if (base) ficha.base = base;

  return { ficha, base, avisos, omitidos };
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
