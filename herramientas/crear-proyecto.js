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
import { CLAVES_DEMO, generarClave } from './lib/clave.js';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = resolve(AQUI, '..');
const BASES = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion', '02-bases');
const INSUMOS = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion', '09-que-necesito-de-ti');
const DESTINO_RAIZ = join(RAIZ, 'Proyectos-Clientes');

/** El archivo que distingue una prueba del generador de una entrega real. */
export const MARCA_PRUEBA = 'ES-UNA-PRUEBA.md';

/** ¿La carpeta de un proyecto es una prueba del generador? */
export function esPrueba(dir) {
  return existsSync(join(dir, MARCA_PRUEBA));
}

/** Campos que solo puede haber contestado un cliente real.
 *  Un proyecto generado desde el `contexto.ejemplo.yml` de una base no trae
 *  ninguno: son justo los que `limpiarIdentidad()` borra por ser identidad
 *  de otro negocio, más los bloques de página que escribe una persona. */
const SEÑAS_DE_CLIENTE = ['pagina', 'apis', 'entrega', 'base_de_datos'];

export function tieneFichaDeCliente(ficha) {
  if (!ficha || typeof ficha !== 'object') return false;
  return SEÑAS_DE_CLIENTE.some((k) => {
    const v = ficha[k];
    return v && typeof v === 'object' && Object.keys(v).length > 0;
  });
}

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
  // `POR DEFINIR` es una nota interna para el estudio, NO un valor. Sin este
  // filtro llega al HTML y el cliente ve "Dónde estamos: POR DEFINIR" — que
  // es justo lo que la marca pretendía evitar. Lo cazó el primer cliente
  // real, cuya ficha tiene la dirección pendiente.
  const texto = (v) => {
    const s = String(v ?? '').trim();
    return /^por definir$/i.test(s) ? '' : s;
  };
  // La TEXTURA del bloque cuando no hay foto. Solo tres valores conocidos:
  // uno inventado dejaria el bloque sin nada, que es el hueco que se evita.
  const TEXTURAS = ['plano', 'concreto', 'trama'];
  const tex = (v) => (TEXTURAS.includes(texto(v)) ? texto(v) : '');

  // LA PLANTILLA: la estructura de la página, no su piel. Un valor
  // desconocido cae en "ficha", que es la que funciona sin una sola foto.
  const PLANTILLAS = ['torre', 'revista', 'ficha'];
  if (PLANTILLAS.includes(texto(p.plantilla))) limpio.plantilla = texto(p.plantilla);

  if (texto(p.hero?.titular) || texto(p.hero?.bajada)) {
    limpio.hero = {};
    if (texto(p.hero.titular)) limpio.hero.titular = texto(p.hero.titular);
    if (texto(p.hero.bajada)) limpio.hero.bajada = texto(p.hero.bajada);
    // El eyebrow y el texto del botón son del ejemplo si no vienen: se
    // arman con datos del propio cliente o se omiten.
    if (texto(p.hero.eyebrow)) limpio.hero.eyebrow = texto(p.hero.eyebrow);
    limpio.hero.cta = texto(p.hero.cta) || 'Escríbenos';
    // Portada oscura: solo "oscuro" la enciende; cualquier otra cosa es clara.
    if (/^oscuro$/i.test(texto(p.hero.fondo))) limpio.hero.fondo = 'oscuro';
    const foto = texto(p.hero.foto);
    if (/^(https?:\/\/|\/|\.\/)/i.test(foto)) limpio.hero.foto = foto;
    if (tex(p.hero.textura)) limpio.hero.textura = tex(p.hero.textura);
  }
  // Las listas de pares título/texto: servicios, diferencial y proceso.
  // Se limpian igual, así que se recorren igual.
  for (const clave of ['servicios', 'diferencial', 'proceso']) {
    const lista = (Array.isArray(p[clave]) ? p[clave] : [])
      .map((s) => ({ titulo: texto(s?.titulo), desc: texto(s?.desc),
                     texto: texto(s?.texto), icono: texto(s?.icono) }))
      .filter((s) => s.titulo)
      .map((s) => {
        // `servicios` usa `desc`; `diferencial` y `proceso` usan `texto`.
        const out = { titulo: s.titulo };
        if (clave === 'servicios') { if (s.desc || s.texto) out.desc = s.desc || s.texto; }
        else if (s.texto || s.desc) out.texto = s.texto || s.desc;
        // El icono es el nombre de un símbolo del sprite. La base descarta
        // los que no existen, así que aquí solo se filtra la forma.
        if (/^[a-z]{2,20}$/.test(s.icono)) out.icono = s.icono;
        return out;
      });
    if (lista.length) {
      limpio[clave] = lista;
      if (texto(p[clave + '_titulo'])) limpio[clave + '_titulo'] = texto(p[clave + '_titulo']);
    }
  }

  // La galería: acepta texto suelto o { src, pie }. La URL la filtra la base
  // con urlSegura(), pero aquí se descarta lo que claramente no es una.
  const galeria = (Array.isArray(p.galeria) ? p.galeria : [])
    .map((f) => (typeof f === 'string' ? { src: texto(f), pie: '' }
                                       : { src: texto(f?.src), pie: texto(f?.pie) }))
    .filter((f) => /^(https?:\/\/|\/|\.\/)/i.test(f.src));
  if (galeria.length) {
    limpio.galeria = galeria;
    if (texto(p.galeria_titulo)) limpio.galeria_titulo = texto(p.galeria_titulo);
  }

  if (texto(p.leads_titulo)) limpio.leads_titulo = texto(p.leads_titulo);

  // Los sectores aceptan texto suelto o { nombre, icono }. Mezclar los dos
  // formatos en la misma lista está bien.
  const sectores = (Array.isArray(p.sectores) ? p.sectores : [])
    .map((s) => {
      if (typeof s === 'string') return texto(s);
      const nombre = texto(s?.nombre);
      if (!nombre) return '';
      const ic = texto(s?.icono);
      return /^[a-z]{2,20}$/.test(ic) ? { nombre, icono: ic } : nombre;
    })
    .filter(Boolean);
  if (sectores.length) {
    limpio.sectores = sectores;
    if (texto(p.sectores_titulo)) limpio.sectores_titulo = texto(p.sectores_titulo);
  }

  // Qué secciones van sobre el color de marca. Solo nombres conocidos: una
  // sección inventada dejaría un bloque oscuro vacío.
  const SECCIONES = ['servicios', 'diferencial', 'proceso', 'galeria', 'sectores', 'pie'];
  const oscuras = (Array.isArray(p.secciones_oscuras) ? p.secciones_oscuras : [])
    .map(texto).filter((s) => SECCIONES.includes(s));
  if (oscuras.length) limpio.secciones_oscuras = oscuras;
  if (texto(p.sobre?.texto)) {
    limpio.sobre = { titulo: texto(p.sobre.titulo) || 'Sobre nosotros',
                     texto: texto(p.sobre.texto) };
    // La foto de esta sección ocupa media pantalla: el espacio es
    // estructura del diseño, no un adorno al lado del párrafo.
    const f = texto(p.sobre.foto);
    if (/^(https?:\/\/|\/|\.\/)/i.test(f)) limpio.sobre.foto = f;
    if (tex(p.sobre.textura)) limpio.sobre.textura = tex(p.sobre.textura);
  }

  // LA FRANJA INMERSIVA: una banda de imagen a sangre con una frase.
  if (texto(p.franja?.frase)) {
    limpio.franja = { frase: texto(p.franja.frase) };
    if (texto(p.franja.firma)) limpio.franja.firma = texto(p.franja.firma);
    const f = texto(p.franja.foto);
    if (/^(https?:\/\/|\/|\.\/)/i.test(f)) limpio.franja.foto = f;
    if (tex(p.franja.textura)) limpio.franja.textura = tex(p.franja.textura);
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

/**
 * Los meta de SEO y de vista previa al compartir (Open Graph).
 *
 * VAN EN EL HTML ESTÁTICO, no inyectados por JS. Los rastreadores de
 * WhatsApp, Facebook y LinkedIn leen el `<head>` **sin ejecutar
 * JavaScript**: si estos valores se pintaran desde el CONTEXT al arrancar,
 * el enlace compartido saldría con el texto del ejemplo. Es una de las
 * cosas que se vendieron en la primera cotización real, así que tiene que
 * funcionar de verdad, no parecer que funciona.
 */
export function ponerMeta(html, cliente, ficha = {}) {
  let out = html;
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  const hero = ficha.pagina?.hero || {};
  const limpio = (v) => {
    const s = String(v ?? '').trim();
    return /^por definir$/i.test(s) ? '' : s;
  };

  // La descripción: la bajada del hero, o el subtítulo de marca. Nunca la
  // del ejemplo, y nunca inventada.
  const descripcion = limpio(hero.bajada)
    || limpio(ficha.pagina?.sobre?.texto).slice(0, 180)
    || limpio(ficha.marca?.subtitulo);

  const dominio = limpio(ficha.entrega?.dominio);
  // "por comprar" es una respuesta, no un dominio: no se convierte en URL.
  const url = dominio && !/^por comprar$/i.test(dominio) && !dominio.includes(' ')
    ? 'https://' + dominio.replace(/^https?:\/\//i, '') : '';

  const imagen = limpio(ficha.marca?.banner) || limpio(ficha.marca?.logo);

  const meta = (clave, valor, atributo = 'property') => {
    // Si no hay valor se deja el atributo VACÍO, no el del ejemplo: una
    // vista previa con la descripción de otro negocio es peor que sin ella.
    const re = new RegExp('(<meta\\s+' + atributo + '="' + clave
      + '"\\s+content=")[^"]*(")', 'i');
    if (re.test(out)) out = out.replace(re, '$1' + esc(valor) + '$2');
  };

  if (cliente) {
    meta('og:title', cliente);
    out = out.replace(/(<meta\s+name="description"\s+content=")[^"]*(")/i,
      '$1' + esc(descripcion) + '$2');
  }
  meta('og:description', descripcion);
  meta('og:image', imagen);
  meta('og:url', url);

  return out;
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

  /**
   * Campos donde heredar el valor del ejemplo es PELIGROSO, no cosmético.
   *
   * Para el subtítulo o el tono, dejar el del ejemplo es un defecto de estilo.
   * Para un teléfono o un dominio es otra cosa: el botón de WhatsApp del
   * cliente escribiría a un negocio que no es el suyo.
   *
   * Lo encontró el primer cliente real. Su ficha tiene el WhatsApp como
   * `POR DEFINIR` (el brochure traía un número de relleno), y `campo()`
   * se saltaba el reemplazo — dejando en su landing el número del café del
   * ejemplo. Aquí se BORRA en vez de heredarse; las bases ya no pintan el
   * enlace cuando el número viene vacío.
   */
  const BORRAR_SI_FALTA = new Set(['whatsapp_num', 'dominio', 'correo']);

  const campo = (clave, valor) => {
    const falta = valor === undefined || valor === null || valor === ''
      || valor === 'POR DEFINIR';
    if (falta && !BORRAR_SI_FALTA.has(clave)) return;
    bloque = bloque.replace(
      new RegExp('(\\b' + clave + '\\s*:\\s*)"[^"]*"'),
      '$1' + cita(falta ? '' : valor)
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

export function adaptarEntregable(html, marca, proyecto, fichaCompleta = {}, clave = '') {
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

  // 3b-bis · Los meta de SEO y de compartir. Aparte del CONTEXT a propósito:
  // estos los lee un rastreador que NO ejecuta JavaScript.
  out = ponerMeta(out, proyecto, fichaCompleta);

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

  // 3e · EL ACCESO AL PANEL.
  //
  // Las bases traen un usuario de prueba (admin@caferaiz.co / admin123) que
  // además se IMPRIME en la pantalla de login. Copiarlo tal cual al
  // entregable tiene dos problemas, y el segundo es grave:
  //
  //   1. Pone el negocio de OTRO delante del cliente.
  //   2. TODOS los proyectos del estudio salen con la misma contraseña,
  //      publicada en su propia pantalla de entrada. Un cliente que abra la
  //      página de otro cliente entra a su panel. Eso no se puede cobrar.
  //
  // Aquí se cambian las dos cosas: el correo al dominio del proyecto y la
  // contraseña a una frase única. Y se quita el cartel que las anunciaba.
  const slug = aSlug(proyecto);
  if (slug) {
    out = out.replace(/\badmin@[a-z0-9.-]+\b/gi, 'admin@' + slug + '.local');
  }
  if (clave) {
    for (const demo of CLAVES_DEMO) {
      out = out.split("password:'" + demo + "'").join("password:'" + clave + "'");
      out = out.split("password: '" + demo + "'").join("password: '" + clave + "'");
    }
    // El cartel "Demo: correo / contraseña" de la caja de login. En una demo
    // de la fábrica es útil; en un entregable es publicar la llave.
    out = out.replace(
      /(<div class="sub">)([\s\S]*?)<br>\s*Demo:[\s\S]*?(<\/div>)/gi,
      '$1$2<br><span class="aviso-acceso">Acceso local: sirve para revisar, '
      + '<b>no protege los datos</b>. Lo que los protege es Supabase Auth + '
      + 'RLS — ver el README.$3');
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
/**
 * ACCESO.md — la frase del panel y, sobre todo, lo que falta para que el
 * panel esté de verdad protegido.
 *
 * Existe porque la alternativa era peor de las dos formas posibles: o la
 * contraseña de demo `admin123` viajaba a todos los entregables (misma clave
 * en todos los clientes, impresa en su propia pantalla de login), o el panel
 * quedaba sin acceso y el proyecto no se podía ni enseñar.
 *
 * Este archivo NO se sube: está en el .gitignore del proyecto.
 */
export function accesoMd(cliente, clave, ficha = {}) {
  const slug = aSlug(cliente);
  const motor = ficha?.auth?.motor || ficha?.base_de_datos?.motor || 'local';
  return [
    '# Acceso al panel — ' + cliente,
    '',
    '**Este archivo no se sube a git.** Está en el `.gitignore` del proyecto,',
    'junto al `.env`.',
    '',
    '## La frase de este proyecto',
    '',
    '```',
    'correo:  admin@' + slug + '.local',
    'frase:   ' + clave,
    '```',
    '',
    'Es única de ' + cliente + '. Antes, todos los proyectos del estudio salían',
    'con `admin123` escrita en el código **y impresa en la pantalla de login**:',
    'cualquiera que abriera la página de un cliente entraba al panel de',
    'cualquier otro.',
    '',
    '## Lo que esto NO es',
    '',
    'No es autenticación. Una clave que vive en el JavaScript de la página la',
    'lee cualquiera con F12, por rara que sea la frase. Es una **puerta**:',
    'sirve para que el panel no esté abierto de par en par mientras se revisa',
    'el proyecto.',
    '',
    '**Lo que protege los datos de verdad es la base, no la pantalla.**',
    '',
    '## Cómo se convierte en una cerradura: Supabase Auth',
    '',
    motor === 'supabase'
      ? 'Este proyecto ya está en Supabase. Faltan los dos últimos pasos:'
      : 'Son tres pasos, y el código para los tres ya está escrito:',
    '',
    '1. **Crear el usuario.** En Supabase → Authentication → Users → *Add*',
    '   user. Con el correo real del dueño del negocio, no el `.local` de',
    '   arriba.',
    '2. **Correr `supabase.schema.sql`** (está en esta carpeta) en el SQL',
    '   Editor. Trae la tabla `perfiles` y las políticas RLS. **El primer',
    '   admin se marca a mano:** `update perfiles set rol = \'admin\' where',
    '   email = \'...\';` — si no, nadie tiene permisos de escritura.',
    '3. **Cambiar el motor.** En `.env`: `AUTH_MOTOR=supabase`, más',
    '   `SUPABASE_URL` y `SUPABASE_ANON_KEY`. No hay que tocar código: el',
    '   adaptador ya está.',
    '',
    'Después de eso, la frase de arriba deja de servir y deja de importar.',
    '',
    '## Antes de publicar',
    '',
    'Corre `npm run validar`. La regla `clave-demo` sale en rojo si alguna',
    'contraseña de demostración volvió al entregable por una copia y pega.',
    '',
    'La prueba de dos minutos está en',
    '`07-operacion-equipo/guia-de-seguridad.md`: pide una tabla privada en',
    'una ventana de incógnito. Si devuelve datos, el RLS está mal y la',
    'pantalla de login no te está salvando de nada.',
    '',
  ].join('\n');
}

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

  // 3b · LA CLAVE DEL PANEL, una por proyecto.
  //
  // Se genera aunque la base no tenga panel: cuesta nada, y así no hay que
  // adivinar aquí qué bases lo traen. Si no hay ninguna contraseña de demo
  // en el HTML, la sustitución no encuentra nada y no pasa nada.
  //
  // Nunca se escribe en contexto.yml: la ficha se sube a git.
  const clave = generarClave();

  // 4 · entregable adaptado
  const rutaDemo = join(dirBase, 'demo.html');
  if (existsSync(rutaDemo)) {
    // `ficha` es la que se escribe en contexto.yml y NO lleva el catálogo:
    // sería un bloque enorme dentro de la ficha, y su sitio es el entregable.
    // Por eso se adjunta aquí, solo para generar el HTML.
    const paraHtml = { ...ficha, _catalogo: fichaEntrada._catalogo };
    const html = adaptarEntregable(readFileSync(rutaDemo, 'utf8'), ficha.marca || {},
                                   cliente, paraHtml, clave);
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
  writeFileSync(join(dirSalida, '.env'),
    envDelProyecto(ficha, ejemploEnv) + '\n'
    + '# Frase de acceso al panel, única de este proyecto. NO es un secreto\n'
    + '# fuerte (una clave en JavaScript de navegador la lee cualquiera con\n'
    + '# F12): es la PUERTA mientras se revisa. La cerradura es Supabase\n'
    + '# Auth + RLS — ver ACCESO.md.\n'
    + 'PANEL_CLAVE=' + clave + '\n', 'utf8');
  creados.push('.env');

  // ACCESO.md — lo que hay que decirle al cliente, y lo que falta para que
  // esto deje de ser una puerta y sea una cerradura. Va junto al .env en el
  // .gitignore del proyecto: la frase no se sube.
  writeFileSync(join(dirSalida, 'ACCESO.md'), accesoMd(cliente, clave, ficha), 'utf8');
  creados.push('ACCESO.md');

  // 5b · Lo que hace que ARRANQUE: servidor de desarrollo y dependencias
  writeFileSync(join(dirSalida, 'package.json'), packageJson(slug, ficha), 'utf8');
  writeFileSync(join(dirSalida, 'vite.config.js'), viteConfig(), 'utf8');
  creados.push('package.json', 'vite.config.js');
  writeFileSync(join(dirSalida, '.gitignore'),
    '.env\n.env.*\n!.env.example\nACCESO.md\nnode_modules/\ndist/\n', 'utf8');
  creados.push('.gitignore');

  // 5c · MARCA DE PRUEBA.
  //
  // Sin ficha de cliente, esto salió del `contexto.ejemplo.yml` de la base:
  // es una prueba del generador, no un entregable. Se acumularon NUEVE
  // carpetas así en Proyectos-Clientes/, tres llegaron a git, y con el
  // tiempo ya nadie sabía cuál era un cliente de verdad.
  //
  // El archivo no es decoración: `esPrueba()` lo busca, y el panel y el
  // validador lo usan para no confundir una prueba con una entrega.
  if (!tieneFichaDeCliente(fichaEntrada)) {
    writeFileSync(join(dirSalida, MARCA_PRUEBA), [
      '# Esto es una PRUEBA del generador, no un entregable',
      '',
      'Se creó sin ficha de cliente, así que el contenido salió del',
      '`contexto.ejemplo.yml` de la base `' + base + '`: los textos, los',
      'productos y los datos son de un negocio de ejemplo, no de nadie real.',
      '',
      '**Bórrala sin pensarlo.** Se vuelve a generar en un segundo.',
      '',
      'Para que la próxima no caiga aquí:',
      '',
      '```bash',
      'node crear-proyecto.js --base ' + base + ' --cliente "..." \\',
      '  --destino "$TEMP/prueba"',
      '```',
      '',
      'Un proyecto de verdad se genera con `--ficha <ruta>` y la ficha del',
      'cliente. Además hay que agregarlo a mano a la lista blanca del',
      '`.gitignore` de la raíz, o no se sube.',
      '',
    ].join('\n'), 'utf8');
    creados.push(MARCA_PRUEBA);
  }

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
    '## El panel',
    '',
    'La frase de acceso está en **`ACCESO.md`** (y en el `.env`, como',
    '`PANEL_CLAVE`). Es única de este proyecto: antes todos los entregables',
    'salían con `admin123` escrita en el código **y anunciada en la propia',
    'pantalla de login**.',
    '',
    '**Sigue sin ser autenticación.** Una clave que vive en el JavaScript de',
    'la página la lee cualquiera con F12. Es una puerta para revisar el',
    'proyecto; la cerradura es Supabase Auth + RLS, y `ACCESO.md` tiene los',
    'tres pasos para encenderla. **Eso hay que hacerlo antes de publicar.**',
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

  return { ok: true, slug, destino: dirSalida, base, creados, clave };
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
      // LA FICHA COMPLETA, no cuatro campos.
      //
      // Esto leía solo cliente/base/linea/marca y tiraba el resto: los
      // bloques de página, las apis, la entrega. Con el primer cliente real
      // (INCOARQI) salió a la luz — se generó su landing y no tenía ni el
      // titular, ni los servicios, ni el proceso, ni los sectores.
      //
      // Es el mismo fallo que ya había pasado por el otro camino, cuando de
      // 19 respuestas del brief sobrevivían 5. Dos caminos, el mismo error.
      ficha: f,
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
  // La frase del panel se imprime UNA vez, aquí. No está en contexto.yml ni
  // en ningún archivo que se suba: si se pierde, se regenera el proyecto o
  // se cambia a mano en el .env.
  if (r.clave) {
    console.log('\n  ' + C.neg + 'Panel:' + C.off + '  admin@' + aSlug(args.cliente || '')
      + '.local  /  ' + C.verde + r.clave + C.off);
    console.log('  ' + C.gris + 'Está en ACCESO.md (fuera de git). No protege los '
      + 'datos: eso es Supabase Auth + RLS.' + C.off);
  }
  console.log('\n  ' + C.gris + 'Siguiente: llena el .env y corre el validador.' + C.off + '\n');
}
