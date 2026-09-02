#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  GENERADOR DE PROYECTOS — modo GRATIS.
//  Convierte (ficha de contexto + base técnica) en una carpeta
//  de cliente lista, en Proyectos-Clientes/<slug>/.
//
//  Cero IA, cero red, cero costo: es copia de archivos y
//  sustitución de tokens. Lo que antes tomaba ~2 horas a mano.
//
//  Uso:
//    node crear-proyecto.js --cliente "Café Raíz" --base menu-con-panel-admin
//    node crear-proyecto.js --ficha ruta/a/contexto.yml
//    node crear-proyecto.js --listar-bases
// ════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, readdirSync, mkdirSync, existsSync, statSync, cpSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { leerYaml, escribirYaml } from './lib/yaml.js';
import { ponerContenido } from './lib/contenido.js';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = resolve(AQUI, '..');
const BASES = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion', '02-bases');
const INSUMOS = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion', '09-que-necesito-de-ti');
const DESTINO_RAIZ = join(RAIZ, 'Proyectos-Clientes');

const C = { verde: '\x1b[32m', gris: '\x1b[90m', neg: '\x1b[1m', rojo: '\x1b[31m', off: '\x1b[0m' };

// ── Utilidades ────────────────────────────────────────────────

export function aSlug(texto) {
  return String(texto)
    .normalize('NFD').replace(/[̀-ͯ]/g, '')   // quita tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function listarBases() {
  if (!existsSync(BASES)) return [];
  return readdirSync(BASES)
    .filter((n) => statSync(join(BASES, n)).isDirectory())
    .filter((n) => existsSync(join(BASES, n, 'README.md')));
}

/** Lee los args estilo --clave valor */
function leerArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    if (!argv[i].startsWith('--')) continue;
    const clave = argv[i].slice(2);
    const sig = argv[i + 1];
    out[clave] = (!sig || sig.startsWith('--')) ? true : (i++, sig);
  }
  return out;
}

// ── Adaptación del entregable ─────────────────────────────────

/**
 * El demo.html del repo trae la "sysbar" (la barra negra de sistema con
 * el conmutador de adaptador) que es andamiaje de la fábrica, no del
 * entregable. Esto la quita y aplica los tokens de marca del cliente.
 */
/**
 * Reemplaza los valores del objeto CONTEXT que vive dentro del <script>.
 * Solo toca los campos que la ficha realmente define — lo que no venga se
 * queda como estaba, para no dejar el entregable a medias.
 *
 * Trabaja campo por campo y no sustituyendo el objeto entero: cada base
 * tiene su propio CONTEXT con claves distintas, y reescribirlo completo
 * borraría las que esa base necesita.
 */
/**
 * Reemplaza el objeto `pagina:{...}` del CONTEXT por el del cliente.
 *
 * Se buscan las llaves emparejadas en vez de usar una expresión regular
 * porque el objeto tiene objetos y listas dentro, y un `[\s\S]*?\}` cortaría
 * en la primera llave que encuentre, dejando basura suelta en el script.
 *
 * Si el cliente no respondió nada, se escribe `pagina:{}`: la base pinta los
 * bloques solo cuando traen contenido, así que quedan sin mostrarse.
 */
export function ponerBloquePagina(bloque, pagina) {
  const i = bloque.search(/\bpagina\s*:\s*\{/);
  if (i === -1) return bloque;                 // base sin bloques de página

  const abre = bloque.indexOf('{', i);
  let nivel = 0, fin = -1;
  for (let n = abre; n < bloque.length; n++) {
    if (bloque[n] === '{') nivel++;
    else if (bloque[n] === '}') {
      nivel--;
      if (nivel === 0) { fin = n; break; }
    }
  }
  if (fin === -1) return bloque;               // sin cierre: mejor no tocar

  const limpio = {};
  const p = pagina || {};
  const texto = (v) => String(v ?? '').trim();
  if (texto(p.hero?.titular) || texto(p.hero?.bajada)) {
    limpio.hero = {};
    if (texto(p.hero.titular)) limpio.hero.titular = texto(p.hero.titular);
    if (texto(p.hero.bajada)) limpio.hero.bajada = texto(p.hero.bajada);
    // El eyebrow y el texto del botón son del ejemplo si no vienen: se
    // arman con datos del propio cliente o se omiten.
    if (texto(p.hero.eyebrow)) limpio.hero.eyebrow = texto(p.hero.eyebrow);
    limpio.hero.cta = texto(p.hero.cta) || 'Escríbenos';
  }
  const servicios = (Array.isArray(p.servicios) ? p.servicios : [])
    .map((s) => ({ titulo: texto(s?.titulo), desc: texto(s?.desc) }))
    .filter((s) => s.titulo);
  if (servicios.length) {
    limpio.servicios = servicios;
    if (texto(p.servicios_titulo)) limpio.servicios_titulo = texto(p.servicios_titulo);
  }
  if (texto(p.sobre?.texto)) {
    limpio.sobre = { titulo: texto(p.sobre.titulo) || 'Sobre nosotros',
                     texto: texto(p.sobre.texto) };
  }
  const horarios = (Array.isArray(p.horarios) ? p.horarios : [])
    .map(texto).filter(Boolean);
  if (horarios.length) limpio.horarios = horarios;
  if (texto(p.ubicacion?.direccion)) {
    limpio.ubicacion = { direccion: texto(p.ubicacion.direccion) };
  }
  if (texto(p.redes?.instagram)) {
    limpio.redes = { instagram: texto(p.redes.instagram).replace(/^@/, '') };
  }

  return bloque.slice(0, i) + 'pagina:' + JSON.stringify(limpio)
       + bloque.slice(fin + 1);
}

export function ponerEnContexto(html, marca = {}, cliente = '', ficha = {}) {
  let out = html;
  const cita = (v) => JSON.stringify(String(v));

  // Solo dentro del bloque CONTEXT, para no tocar datos de ejemplo del menú.
  const i = out.indexOf('const CONTEXT');
  if (i === -1) return out;
  const fin = out.indexOf('\n};', i);
  if (fin === -1) return out;

  let bloque = out.slice(i, fin + 3);

  const campo = (clave, valor) => {
    if (valor === undefined || valor === null || valor === '' || valor === 'POR DEFINIR') return;
    bloque = bloque.replace(
      new RegExp('(\\b' + clave + '\\s*:\\s*)"[^"]*"'),
      '$1' + cita(valor)
    );
  };

  if (cliente) campo('cliente', cliente);
  campo('linea',      ficha.linea);
  campo('primario',   marca.primario);
  campo('secundario', marca.secundario);
  campo('acento',     marca.acento);
  campo('inicial',    marca.inicial);
  campo('subtitulo',  marca.subtitulo);

  // El logo y el banner del cliente. En las bases nacen vacíos ("") a
  // propósito: sin ellos se pinta la inicial y no se muestra banner, que es
  // lo correcto cuando el cliente todavía no ha mandado sus imágenes.
  campo('logo',   marca.logo);
  campo('banner', marca.banner);

  // La dirección de arte. Sin esto, el entregable de todo cliente sale con
  // la dirección del ejemplo, que es justo lo que hacía que dos negocios
  // distintos recibieran la misma página pintada de otro color.
  campo('direccion', marca.direccion);

  // LOS BLOQUES DE PÁGINA SON IDENTIDAD AJENA, ENTERA.
  //
  // El titular, la historia, los horarios, la dirección y el Instagram del
  // ejemplo describen a OTRO negocio. Heredarlos sería peor que dejarlos
  // vacíos: el cliente vería su nombre encima de la historia de un café que
  // no es suyo, con la dirección de otro local. Por eso no se parchea campo
  // a campo — se reemplaza el objeto completo, y si el cliente no respondió
  // nada, queda vacío y la página simplemente no pinta esos bloques.
  bloque = ponerBloquePagina(bloque, ficha.pagina);

  // Lo operativo: si esto se queda con los valores del ejemplo, el botón de
  // WhatsApp del cliente escribe al número de otro negocio.
  campo('motor',        ficha.base_de_datos?.motor);
  campo('whatsapp_num', ficha.apis?.whatsapp_num);
  campo('pagos',        ficha.apis?.pagos);
  campo('mensajeria',   ficha.apis?.mensajeria);

  return out.slice(0, i) + bloque + out.slice(fin + 3);
}

export function adaptarEntregable(html, marca, proyecto, fichaCompleta = {}) {
  let out = html;

  // 1 · Quitar la sysbar (andamiaje de demo, no va al cliente).
  //
  // OJO — esto rompió una entrega: el script de las bases hace
  // `document.getElementById('sysClient').textContent = ...`, y ese id vivía
  // DENTRO de la sysbar. Al borrarla, getElementById devuelve null, la línea
  // lanza TypeError y TODO el JavaScript posterior deja de ejecutarse: la
  // página muestra el encabezado (HTML fijo) y nada más.
  //
  // Por eso no basta con borrar: hay que conservar los id como elementos
  // ocultos, para que cualquier referencia siga resolviendo. Sirve para las
  // 9 bases sin conocer el marcado de ninguna.
  const bloque = out.match(/<div class="sysbar"[\s\S]*?<\/div>\s*<\/div>/i);
  let sustituto = '';
  if (bloque) {
    const ids = [...bloque[0].matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
    if (ids.length) {
      sustituto = '\n<!-- Elementos de la barra de sistema del demo. Se conservan\n'
        + '     ocultos porque el script los referencia; sin ellos el JS falla\n'
        + '     y la página se queda en blanco. -->\n'
        + '<div hidden>' + ids.map((i) => '<span id="' + i + '"></span>').join('') + '</div>\n';
    }
    out = out.replace(bloque[0], sustituto);
  }
  out = out.replace(/<!--\s*sysbar[\s\S]*?-->/gi, '');

  // 1b · Andamiaje de demo marcado a mano.
  //
  // Borrar la sysbar quita los botones, pero deja vivas las funciones que
  // esos botones llamaban: código muerto que viaja al cliente y encima
  // apunta a archivos de ejemplo. Lo que va entre @demo-only y @fin-demo
  // se borra entero.
  out = out.replace(/\/\*\s*@demo-only[\s\S]*?\/\*\s*@fin-demo\s*\*\//g, '');
  // reglas CSS huérfanas: .sysbar..., .toggle...
  out = out.replace(/^\s*\.(sysbar|toggle)\b[^\n]*\{[^}]*\}\s*$/gim, '');
  // líneas en blanco de más que deja el borrado
  out = out.replace(/\n{3,}/g, '\n\n');

  // 2 · Aplicar tokens de marca sobre el bloque :root
  const mapa = {
    '--brand': marca.primario,
    '--bg': marca.secundario,
    '--accent': marca.acento,
  };
  for (const [token, valor] of Object.entries(mapa)) {
    if (!valor) continue;
    out = out.replace(
      new RegExp('(' + token + '\\s*:\\s*)#[0-9a-fA-F]{3,8}'),
      '$1' + valor
    );
  }
  if (marca.display) {
    out = out.replace(/(--display\s*:\s*)'[^']*'/, "$1'" + marca.display + "'");
  }
  if (marca.body) {
    out = out.replace(/(--body\s*:\s*)'[^']*'/, "$1'" + marca.body + "'");
  }

  // 3 · Título e inicial del logo
  out = out.replace(/<title>[\s\S]*?<\/title>/i, '<title>' + proyecto + '</title>');

  // 3b · EL CONTEXT DEL SCRIPT.
  //
  // Sin esto el entregable se veía con el nombre y el menú del ejemplo de la
  // base: se generaba "tacos mauricio" y la página decía "Café Raíz". Los
  // reemplazos de arriba son cosméticos (título, logo, tokens CSS); pero
  // applyTheme() lee el objeto CONTEXT del script y lo sobreescribe todo al
  // arrancar. Si el CONTEXT no cambia, el cliente no cambia.
  out = ponerEnContexto(out, marca, proyecto, fichaCompleta);

  // 3c · EL CATÁLOGO REAL.
  // Si el cliente escribió sus categorías y productos, reemplazan a los del
  // ejemplo. Si no, se quedan los del ejemplo a propósito: un catálogo vacío
  // se ve roto, y unos datos que se ven claramente de ejemplo dicen la verdad
  // sobre lo que falta.
  if (fichaCompleta._catalogo && fichaCompleta._catalogo.length) {
    out = ponerContenido(out, fichaCompleta._catalogo, fichaCompleta.base);
  }
  if (marca.inicial) {
    out = out.replace(/(<div class="logo"[^>]*>)[^<]*(<\/div>)/i, '$1' + marca.inicial + '$2');
  }

  // 3d · El texto ESTÁTICO de los elementos de identidad.
  //
  // applyTheme() los sobreescribe al arrancar, así que en condiciones normales
  // da igual lo que digan. Pero si el script falla, lo que queda a la vista es
  // exactamente esto — y así fue como se entregó una página que decía el
  // nombre del negocio del ejemplo. Vale la pena que hasta el estado roto
  // muestre el cliente correcto.
  const escapar = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const estatico = { bizName: proyecto, biz: proyecto, logoBox: marca.inicial, logo: marca.inicial };
  for (const [id, valor] of Object.entries(estatico)) {
    if (!valor) continue;
    out = out.replace(
      new RegExp('(<([a-z0-9]+)[^>]*\\bid="' + id + '"[^>]*>)[^<]*(</\\2>)', 'i'),
      '$1' + escapar(valor) + '$3'
    );
  }
  if (marca.subtitulo && marca.subtitulo !== 'POR DEFINIR') {
    // El subtítulo lleva marcado dentro (un <span> para el separador), así que
    // aquí no sirve [^<]*: hay que consumir hasta el cierre de la etiqueta.
    out = out.replace(
      /(<([a-z0-9]+)[^>]*\bid="bizSub"[^>]*>)[\s\S]*?(<\/\2>)/i,
      '$1' + escapar(marca.subtitulo) + '$3'
    );
  }

  // 3e · El correo de demo del panel.
  //
  // Las bases traen un usuario de prueba (admin@caferaiz.co) que se IMPRIME
  // en la pantalla de login. Dejarlo así pone el negocio de otro delante del
  // cliente. Se cambia al dominio del proyecto.
  //
  // Ojo: esto NO arregla el fondo. Sigue siendo una contraseña escrita en el
  // código, visible para cualquiera. Solo sirve mientras el proyecto usa el
  // login local; antes de publicar hay que pasar a Supabase Auth.
  const slug = aSlug(proyecto);
  if (slug) {
    out = out.replace(/\badmin@[a-z0-9.-]+\b/gi, 'admin@' + slug + '.local');
  }

  return out;
}

/** Construye la ficha de contexto del cliente a partir del ejemplo de la base */
// Campos que son IDENTIDAD de otro negocio: heredarlos del ejemplo haría que
// un cliente nuevo saliera con el subtítulo, el dominio o el WhatsApp de otro.
// Se marcan como POR DEFINIR para que no puedan colarse hasta la entrega.
// `logo` y `banner` están aquí por la misma razón: heredar el logo del
// ejemplo pondría la marca de otro negocio en la cabecera del cliente.
const IDENTIDAD = ['subtitulo', 'tono', 'dominio', 'whatsapp_num', 'inicial',
                   'logo', 'banner'];

function limpiarIdentidad(obj = {}, provisto = {}) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (provisto[k] !== undefined) { out[k] = provisto[k]; continue; }
    out[k] = IDENTIDAD.includes(k) ? 'POR DEFINIR' : v;
  }
  for (const [k, v] of Object.entries(provisto)) if (out[k] === undefined) out[k] = v;
  return out;
}

export function construirFicha(ejemplo, datos) {
  // `datos.ficha` es lo que el cliente YA respondió (brief o asistente).
  // Lo que él contestó manda; lo que no, se marca POR DEFINIR en vez de
  // heredar la identidad del negocio del ejemplo.
  const dado = datos.ficha || {};

  const ficha = { ...ejemplo };
  ficha.proyecto = datos.proyecto;
  ficha.cliente = datos.cliente;
  ficha.base = datos.base;
  if (datos.linea) ficha.linea = datos.linea;

  ficha.marca = limpiarIdentidad(ejemplo.marca, { ...(dado.marca || {}), ...(datos.marca || {}) });
  if (ejemplo.apis || dado.apis) {
    ficha.apis = limpiarIdentidad(ejemplo.apis, dado.apis || {});
  }
  if (dado.base_de_datos) {
    ficha.base_de_datos = { ...(ejemplo.base_de_datos || {}), ...dado.base_de_datos };
  }
  if (dado.auth) ficha.auth = { ...(ejemplo.auth || {}), ...dado.auth };

  // Los bloques de página NO se heredan del ejemplo, ni una palabra: el
  // titular, la historia, los horarios y la dirección son de otro negocio.
  // O son los del cliente, o no hay.
  if (dado.pagina) ficha.pagina = dado.pagina;
  else delete ficha.pagina;

  ficha.entrega = {
    ...limpiarIdentidad(ejemplo.entrega, dado.entrega || {}),
    estado: 'en construccion',
    creado: new Date().toISOString().slice(0, 10),
  };
  return ficha;
}

// ── Que el proyecto CORRA, no solo que exista ─────────────────
//
// Un HTML suelto no puede leer un .env desde el navegador. Por eso
// Proyectos-Clientes/prueba-ecommerce usa Vite como servidor de desarrollo:
// es el patrón que ya probamos que funciona, y esto lo reproduce.

/** Dependencias reales según lo que pida la ficha */
export function dependenciasDe(ficha) {
  const deps = {};
  const motor = ficha?.base_de_datos?.motor;
  if (motor === 'supabase') deps['@supabase/supabase-js'] = '^2.45.0';
  if (motor === 'firebase') deps['firebase'] = '^12.15.0';
  return deps;
}

export function packageJson(slug, ficha) {
  return JSON.stringify({
    name: slug,
    private: true,
    type: 'module',
    scripts: {
      dev: 'vite',
      build: 'vite build',
      preview: 'vite preview',
      validar: 'node ../../herramientas/validar.js .',
    },
    dependencies: dependenciasDe(ficha),
    devDependencies: { vite: '^5.4.0' },
  }, null, 2) + '\n';
}

export function viteConfig() {
  return [
    "import { defineConfig } from 'vite';",
    '',
    '// Los adaptadores copiados de la base leen import.meta.env.SUPABASE_URL,',
    '// DB_MOTOR, etc. — sin el prefijo VITE_ que Vite usa por defecto. Se amplía',
    '// envPrefix para no tener que reescribir esos archivos: la regla del sistema',
    '// es copiarlos tal cual desde 02-bases/.',
    'export default defineConfig({',
    "  envPrefix: ['VITE_', 'SUPABASE_', 'FIREBASE_', 'DB_', 'AUTH_',",
    "              'WOMPI_', 'WHATSAPP_', 'GA4_'],",
    '});',
    '',
  ].join('\n');
}

/**
 * El .env con los valores que la ficha SÍ conoce ya puestos, y los secretos
 * marcados. Así `npm run dev` arranca sin editar nada, y lo que falta se ve.
 */
export function envDelProyecto(ficha, ejemplo = '') {
  const motor = ficha?.base_de_datos?.motor || 'local';
  const wa = ficha?.apis?.whatsapp_num;
  const lineas = [
    '# Claves reales de ' + (ficha.cliente || 'este proyecto') + '.',
    '# NUNCA se commitea: está en .gitignore.',
    '#',
    '# Lo que la ficha ya sabía viene puesto. Lo que dice FALTA lo tienes que',
    '# pedir tú — el proyecto arranca igual, pero esa parte no funcionará.',
    '',
    'DB_MOTOR=' + motor,
    'AUTH_MOTOR=' + (ficha?.auth?.motor || 'local'),
    '',
  ];

  if (motor === 'supabase') {
    lineas.push('# Supabase → Project Settings → API');
    lineas.push('SUPABASE_URL=FALTA');
    lineas.push('SUPABASE_ANON_KEY=FALTA', '');
  } else if (motor === 'firebase') {
    lineas.push('# Firebase → Configuración del proyecto → Tus apps');
    lineas.push('FIREBASE_API_KEY=FALTA');
    lineas.push('FIREBASE_PROJECT_ID=FALTA', '');
  }

  if (wa && wa !== 'POR DEFINIR') lineas.push('WHATSAPP_NUM=' + wa, '');
  else if (ficha?.apis?.pagos === 'whatsapp' || wa) lineas.push('WHATSAPP_NUM=FALTA', '');

  const pasarela = ficha?.apis?.pagos;
  if (pasarela === 'wompi') {
    lineas.push('# La cuenta de Wompi la abre EL CLIENTE, con su NIT y su banco.');
    lineas.push('# Tú solo integras la llave pública que te comparta.');
    lineas.push('WOMPI_PUBLIC_KEY=FALTA', '');
  }
  if (ficha?.apis?.analitica === 'ga4') {
    lineas.push('# Google Analytics → Administrar → Flujos de datos');
    lineas.push('GA4_ID=FALTA', '');
  }

  if (ejemplo.trim()) {
    lineas.push('# ── Resto de variables que la base declara ──');
    lineas.push(ejemplo.split(/\r?\n/).map((l) => (l.trim() ? '# ' + l : l)).join('\n'));
  }
  return lineas.join('\n');
}

// ── Generación ────────────────────────────────────────────────

export function crearProyecto(opciones) {
  // `ficha` es lo que trae el asistente o el brief del cliente: TODO lo que
  // el cliente ya respondió. Antes solo se pasaban cliente/base/linea/marca,
  // así que el WhatsApp, el dominio, la pasarela y la analítica se perdían y
  // salían como POR DEFINIR aunque el cliente los hubiera contestado.
  const { cliente, base, linea, marca = {}, ficha: fichaEntrada = {}, destino } = opciones;

  if (!cliente) return { ok: false, error: 'Falta --cliente' };
  if (!base) return { ok: false, error: 'Falta --base' };

  const disponibles = listarBases();
  if (!disponibles.includes(base)) {
    return { ok: false, error: `Base desconocida "${base}". Disponibles: ${disponibles.join(', ')}` };
  }

  const slug = aSlug(cliente);
  const dirBase = join(BASES, base);
  const dirSalida = destino || join(DESTINO_RAIZ, slug);

  if (existsSync(dirSalida)) {
    return { ok: false, error: `Ya existe ${dirSalida} — bórralo o usa otro nombre de cliente.` };
  }

  const creados = [];
  mkdirSync(dirSalida, { recursive: true });

  // 1 · src/ tal cual (nunca se reescriben los adaptadores)
  if (existsSync(join(dirBase, 'src'))) {
    cpSync(join(dirBase, 'src'), join(dirSalida, 'src'), { recursive: true });
    creados.push('src/');
  }

  // 2 · esquema SQL
  if (existsSync(join(dirBase, 'supabase.schema.sql'))) {
    cpSync(join(dirBase, 'supabase.schema.sql'), join(dirSalida, 'supabase.schema.sql'));
    creados.push('supabase.schema.sql');
  }

  // 3 · ficha de contexto
  let ejemplo = {};
  const rutaEjemplo = join(dirBase, 'contexto.ejemplo.yml');
  if (existsSync(rutaEjemplo)) {
    try { ejemplo = leerYaml(readFileSync(rutaEjemplo, 'utf8')); } catch { ejemplo = {}; }
  }
  const ficha = construirFicha(ejemplo, {
    proyecto: cliente, cliente, base, linea, marca, ficha: fichaEntrada,
  });
  writeFileSync(join(dirSalida, 'contexto.yml'),
    '# Ficha de contexto — generada por herramientas/crear-proyecto.js\n' +
    '# Sin secretos: los valores reales van en .env\n\n' + escribirYaml(ficha), 'utf8');
  creados.push('contexto.yml');

  // 4 · entregable adaptado
  const rutaDemo = join(dirBase, 'demo.html');
  if (existsSync(rutaDemo)) {
    // `ficha` es la que se escribe en contexto.yml y NO lleva el catálogo:
    // sería un bloque enorme dentro de la ficha, y su sitio es el entregable.
    // Por eso se adjunta aquí, solo para generar el HTML.
    const paraHtml = { ...ficha, _catalogo: fichaEntrada._catalogo };
    const html = adaptarEntregable(readFileSync(rutaDemo, 'utf8'), ficha.marca || {}, cliente, paraHtml);
    writeFileSync(join(dirSalida, 'index.html'), html, 'utf8');
    creados.push('index.html');
  }

  // 5 · .env (plantilla, sin valores) + .gitignore
  let ejemploEnv = '';
  const rutaEnvEj = join(dirBase, '.env.example');
  if (existsSync(rutaEnvEj)) {
    ejemploEnv = readFileSync(rutaEnvEj, 'utf8');
    cpSync(rutaEnvEj, join(dirSalida, '.env.example'));
    creados.push('.env.example');
  }
  writeFileSync(join(dirSalida, '.env'), envDelProyecto(ficha, ejemploEnv), 'utf8');
  creados.push('.env');

  // 5b · Lo que hace que ARRANQUE: servidor de desarrollo y dependencias
  writeFileSync(join(dirSalida, 'package.json'), packageJson(slug, ficha), 'utf8');
  writeFileSync(join(dirSalida, 'vite.config.js'), viteConfig(), 'utf8');
  creados.push('package.json', 'vite.config.js');
  writeFileSync(join(dirSalida, '.gitignore'),
    '.env\n.env.*\n!.env.example\nnode_modules/\ndist/\n', 'utf8');
  creados.push('.gitignore');

  // 6 · README con lo que hay que pedirle al cliente
  const insumo = readdirSync(existsSync(INSUMOS) ? INSUMOS : dirBase)
    .find((n) => n.includes(base.split('-')[0]));
  const motor = ficha?.base_de_datos?.motor || 'local';
  const faltantes = (envDelProyecto(ficha, '').match(/^(\w+)=FALTA$/gm) || [])
    .map((l) => l.split('=')[0]);

  const readme = [
    '# ' + cliente,
    '',
    'Generado desde la base `' + base + '` el ' + new Date().toISOString().slice(0, 10) + '.',
    '',
    '## Correrlo ahora mismo',
    '',
    '```bash',
    'npm install',
    'npm run dev',
    '```',
    '',
    'Abre la URL que imprime Vite (normalmente http://localhost:5173).',
    'Arranca aunque el `.env` esté incompleto: los adaptadores caen a datos',
    'locales de ejemplo. Lo que falte simplemente no persistirá.',
    '',
    '> Vite hace falta porque un HTML suelto no puede leer un `.env` desde el',
    '> navegador. `vite.config.js` amplía `envPrefix` para que los adaptadores',
    '> copiados de la base funcionen sin reescribirlos.',
    '',
    '## Lo que falta para que funcione de verdad',
    '',
    faltantes.length
      ? faltantes.map((v) => '- [ ] `' + v + '` — está como `FALTA` en el `.env`').join('\n')
      : '- Nada: el `.env` quedó completo desde la ficha.',
    '',
    motor === 'supabase'
      ? '- [ ] Correr `supabase.schema.sql` en el SQL Editor del proyecto Supabase.\n'
        + '      Crea las tablas, los datos de ejemplo y las políticas RLS.'
      : motor === 'firebase'
      ? '- [ ] Crear la base en Firebase y publicar las reglas de seguridad.'
      : '- [ ] Motor `local`: los datos viven en el navegador. Es punto de\n'
        + '      partida válido, pero **no** es persistencia real. Decidir motor.',
    '',
    '## Antes de entregar',
    '',
    '```bash',
    'npm run validar',
    '```',
    '',
    'Sale con error si hay XSS, contraste insuficiente, RLS faltante o un',
    'secreto en el código. No entregues con errores en rojo.',
    '',
    '## Qué pedirle al cliente',
    '',
    insumo
      ? 'La lista completa está en `09-que-necesito-de-ti/' + insumo + '`.'
      : 'La lista completa está en `09-que-necesito-de-ti/` del sistema.',
    '',
    ficha?.apis?.pagos && ficha.apis.pagos !== 'whatsapp'
      ? '**La cuenta de ' + ficha.apis.pagos + ' la abre el cliente**, con su NIT y su\n'
        + 'cuenta bancaria: el dinero de sus ventas debe llegarle a él. Tú solo\n'
        + 'integras la llave pública que te comparta.\n'
      : '',
    '## Origen',
    '',
    'No se reescribió ningún adaptador: `src/` es copia literal de la base.',
    'Si arreglas un bug ahí, arréglalo también en',
    '`02-bases/' + base + '/src/`, o la próxima copia lo trae de vuelta.',
    '',
  ].join('\n');
  writeFileSync(join(dirSalida, 'README.md'), readme, 'utf8');
  creados.push('README.md');

  return { ok: true, slug, destino: dirSalida, base, creados };
}

// ── CLI ───────────────────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith('crear-proyecto.js')) {
  const args = leerArgs(process.argv.slice(2));

  if (args['listar-bases']) {
    console.log('\n' + C.neg + 'Bases disponibles' + C.off + '\n');
    for (const b of listarBases()) console.log('  · ' + b);
    console.log('');
    process.exit(0);
  }

  let opciones = {
    cliente: args.cliente,
    base: args.base,
    linea: args.linea,
    marca: {},
  };

  // --ficha gana sobre los flags sueltos
  if (args.ficha && typeof args.ficha === 'string') {
    const f = leerYaml(readFileSync(resolve(args.ficha), 'utf8'));
    opciones = {
      cliente: f.cliente || args.cliente,
      base: f.base || (Array.isArray(f.bases) ? f.bases[0] : undefined) || args.base,
      linea: f.linea,
      marca: f.marca || {},
    };
  }
  if (args.primario) opciones.marca.primario = args.primario;
  if (args.inicial) opciones.marca.inicial = args.inicial;
  if (args.logo) opciones.marca.logo = args.logo;
  if (args.banner) opciones.marca.banner = args.banner;
  if (args.direccion) opciones.marca.direccion = args.direccion;

  // `--destino` saca la generación de Proyectos-Clientes/. Existe para poder
  // probar el generador sin dejar carpetas de prueba dentro del repositorio:
  // una se coló en un commit por generarla en el sitio de verdad.
  if (args.destino) opciones.destino = resolve(args.destino);

  const r = crearProyecto(opciones);
  if (!r.ok) {
    console.error('\n' + C.rojo + '✖ ' + r.error + C.off + '\n');
    process.exit(1);
  }
  console.log('\n' + C.verde + '✔ Proyecto creado' + C.off + '  ' + C.gris + '(0 tokens, $0)' + C.off);
  console.log('  ' + C.neg + r.destino + C.off);
  console.log('  base: ' + r.base + '\n');
  for (const c of r.creados) console.log('    + ' + c);
  console.log('\n  ' + C.gris + 'Siguiente: llena el .env y corre el validador.' + C.off + '\n');
}
