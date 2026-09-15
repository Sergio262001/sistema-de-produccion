#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  LLEVAR "INMERSIVO" A LAS BASES DE VENTA.
//
//  La franja, la sección partida y las texturas vivían SOLO en
//  `landing-modular`. La línea principal del negocio es ecommerce, y las
//  bases de venta se habían quedado atrás: cero franjas, cero texturas,
//  cero heros a sangre. El entregable que más se vende era el más plano.
//
//  Esto copia la pieza desde `03-componentes-ui/inmersivo.{css,js}` —la
//  fuente de la verdad— al `demo.html` de cada base de venta, entre
//  marcadores. Correrlo otra vez REEMPLAZA lo que hay entre marcadores, así
//  que arreglar algo es: tocar el componente y volver a correr esto.
//
//  Por qué copiar y no importar: cada base tiene que ser autocontenida y su
//  `demo.html` abrir con doble clic, sin servidor ni imports ES. Es regla
//  del CLAUDE.md, no una preferencia.
//
//  Uso:
//    node llevar-inmersivo.js            → lo aplica
//    node llevar-inmersivo.js --revisar  → solo dice qué falta, no escribe
// ════════════════════════════════════════════════════════════

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = resolve(AQUI, '..');
const SISTEMA = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion');
const KIT = join(SISTEMA, '03-componentes-ui');
const BASES = join(SISTEMA, '02-bases');

const C = { verde: '\x1b[32m', gris: '\x1b[90m', neg: '\x1b[1m',
            rojo: '\x1b[31m', amar: '\x1b[33m', off: '\x1b[0m' };

/** Las bases de venta. `landing-modular` NO está: ahí nació la pieza y
 *  tiene su propia versión, más avanzada (plantillas, galería, sectores).
 *  Sobrescribirla sería una regresión. */
export const BASES_DE_VENTA = [
  'ecommerce-completo',
  'carrito-reutilizable',
  'marketplace',
  'menu-con-panel-admin',
];

export const MARCA_CSS_ABRE  = '/* ══ INMERSIVO · copiado de 03-componentes-ui/inmersivo.css ══ */';
export const MARCA_CSS_CIERRA = '/* ══ fin INMERSIVO ══ */';
export const MARCA_JS_ABRE   = '/* ══ INMERSIVO · copiado de 03-componentes-ui/inmersivo.js ══ */';
export const MARCA_JS_CIERRA = '/* ══ fin INMERSIVO ══ */';

/** Quita la cabecera de comentario del componente: en la base sobra, porque
 *  el bloque ya va anunciado por su marcador y con el enlace a la fuente. */
function sinCabecera(texto) {
  const fin = texto.indexOf('══ */');
  return fin === -1 ? texto : texto.slice(fin + 5).replace(/^\s*\n/, '');
}

/** Mete `bloque` entre marcadores. Si ya están, reemplaza lo de en medio;
 *  si no, lo inserta justo antes de `ancla`. */
export function injertar(html, abre, cierra, bloque, ancla) {
  const i = html.indexOf(abre);
  if (i !== -1) {
    const j = html.indexOf(cierra, i);
    if (j === -1) throw new Error('marcador de apertura sin cierre: ' + abre);
    return html.slice(0, i) + abre + '\n' + bloque + '\n' + cierra
         + html.slice(j + cierra.length);
  }
  const k = html.indexOf(ancla);
  if (k === -1) return null;                    // esta base no tiene dónde
  return html.slice(0, k) + abre + '\n' + bloque + '\n' + cierra + '\n\n'
       + html.slice(k);
}

/** La sección de la franja, si la base todavía no la tiene. Va DESPUÉS del
 *  catálogo y ANTES de los bloques de página: es un corte de ritmo entre
 *  "lo que vendo" y "quién soy", que es donde hace su trabajo. */
export function ponerSeccionFranja(html) {
  if (/id="franja"/.test(html)) return html;
  const ancla = html.match(/\n(\s*)<!--[^>]*BLOQUES DE P[ÁA]GINA/i)
             || html.match(/\n(\s*)<section class="bloques"/);
  if (!ancla) return null;
  const sangria = ancla[1] || '  ';
  const seccion = sangria + '<!-- FRANJA a sangre con una frase. Nace oculta:\n'
    + sangria + '     sin `pagina.franja.frase` en la ficha, no existe. -->\n'
    + sangria + '<section class="franja" id="franja" hidden></section>\n\n';
  return html.slice(0, ancla.index + 1) + seccion + html.slice(ancla.index + 1);
}

/** Compara sin pelearse con los finales de línea.
 *
 *  En Windows, git reescribe los archivos con CRLF al sacarlos del índice,
 *  y este script escribe LF. Sin normalizar, `--revisar` decía "le falta la
 *  pieza" a las cuatro bases que SÍ la tenían: un falso positivo que hace
 *  que se deje de confiar en la herramienta. */
const mismoTexto = (a, b) => a.replace(/\r\n/g, '\n') === b.replace(/\r\n/g, '\n');

/** Deja el archivo con el final de línea que ya tenía. */
function comoElOriginal(texto, original) {
  return original.includes('\r\n')
    ? texto.replace(/\r?\n/g, '\r\n')
    : texto.replace(/\r\n/g, '\n');
}

export function aplicar(htmlEntrada) {
  // Se trabaja SIEMPRE en LF y `comoElOriginal()` repone el estilo del
  // archivo al escribir. Si no, las sustituciones de abajo —que buscan
  // bloques de varias líneas— no encuentran nada en un archivo con CRLF y
  // fallan en silencio: el CSS entra pero el hero se queda como estaba.
  const html = String(htmlEntrada).replace(/\r\n/g, '\n');
  const css = sinCabecera(readFileSync(join(KIT, 'inmersivo.css'), 'utf8'))
    .replace(/\r\n/g, '\n');
  const js  = sinCabecera(readFileSync(join(KIT, 'inmersivo.js'), 'utf8'))
    .replace(/\r\n/g, '\n');

  // El CSS entra al final de la hoja de estilos de la base.
  let out = injertar(html, MARCA_CSS_ABRE, MARCA_CSS_CIERRA, css, '</style>');
  if (out === null) return { ok: false, error: 'no encontré </style>' };

  // El JS, justo antes de que la base empiece a pintar la página.
  const anclaJs = out.includes('function pintarPagina(')
    ? 'function pintarPagina('
    : '</script>';
  out = injertar(out, MARCA_JS_ABRE, MARCA_JS_CIERRA, js, anclaJs);
  if (out === null) return { ok: false, error: 'no encontré dónde meter el JS' };

  const conSeccion = ponerSeccionFranja(out);
  if (conSeccion === null) {
    return { ok: false, error: 'no encontré dónde poner <section class="franja">' };
  }
  out = conSeccion;

  // EL HERO. Las cuatro bases de venta lo pintan con el mismo código (texto
  // plano sobre el fondo de la página). Se cambia por el hero a sangre, que
  // sigue funcionando igual sin foto: `heroInmersivo` decide.
  const heroViejo = `      hero.innerHTML = (t ? '<h2>'+esc(t)+'</h2>' : '')
                     + (b ? '<p>'+esc(b)+'</p>' : '');`;
  if (out.includes(heroViejo)) {
    out = out.replace(heroViejo,
      '      // El hero a sangre: con `pagina.hero.fondo: "oscuro"` la portada\n'
      + '      // ocupa el ancho completo con foto o textura detrás. Sin eso,\n'
      + '      // queda exactamente como antes.\n'
      + '      hero.innerHTML = heroInmersivo(hero, t, b);');
  }

  // EL BLOQUE "SOBRE EL NEGOCIO". Era un párrafo dentro de una caja. Pasa a
  // ser media sección de foto y media de texto — que es la regla: la imagen
  // es estructura, no un adorno al lado del párrafo.
  const sobreViejo = `      partes.push('<div class="bloque"><h2>'+esc(titulo)+'</h2>'
        + '<p>'+esc(texto)+'</p></div>');`;
  if (out.includes(sobreViejo)) {
    out = out.replace(sobreViejo,
      "      partes.push(bloquePartido(titulo, texto,\n"
      + "        p.sobre && p.sobre.foto, p.sobre && p.sobre.textura));");
  }

  // Y la llamada, al final de pintarPagina(). Sin esto el CSS está pero la
  // franja nunca se pinta: el error silencioso más fácil de cometer aquí.
  if (!/pintarFranja\(\);/.test(out)) {
    const i = out.indexOf('function pintarPagina(');
    if (i !== -1) {
      // El cierre de la función: la primera llave a nivel 0 desde su abre.
      const abre = out.indexOf('{', i);
      let nivel = 0, fin = -1;
      for (let n = abre; n < out.length; n++) {
        if (out[n] === '{') nivel++;
        else if (out[n] === '}') { nivel--; if (nivel === 0) { fin = n; break; } }
      }
      if (fin !== -1) {
        out = out.slice(0, fin)
          + '\n  // La franja se pinta sola desde la ficha. Sin frase, no existe.\n'
          + '  pintarFranja();\n' + out.slice(fin);
      }
    }
  }
  return { ok: true, html: out };
}

// ── CLI ───────────────────────────────────────────────────────
if (process.argv[1] && process.argv[1].endsWith('llevar-inmersivo.js')) {
  const soloRevisar = process.argv.includes('--revisar');
  console.log('\n' + C.neg + 'Inmersivo → bases de venta' + C.off
    + '  ' + C.gris + '(0 tokens, $0)' + C.off + '\n');

  let fallos = 0;
  for (const base of BASES_DE_VENTA) {
    const ruta = join(BASES, base, 'demo.html');
    if (!existsSync(ruta)) {
      console.log('  ' + C.amar + '—' + C.off + ' ' + base + C.gris + '  sin demo.html' + C.off);
      continue;
    }
    const antes = readFileSync(ruta, 'utf8');
    const r = aplicar(antes);
    if (!r.ok) {
      console.log('  ' + C.rojo + '✖' + C.off + ' ' + base + '  ' + r.error);
      fallos++;
      continue;
    }
    if (mismoTexto(r.html, antes)) {
      console.log('  ' + C.gris + '=' + C.off + ' ' + base + C.gris + '  ya estaba al día' + C.off);
      continue;
    }
    if (soloRevisar) {
      console.log('  ' + C.amar + '≠' + C.off + ' ' + base + C.gris + '  le falta la pieza' + C.off);
      fallos++;
      continue;
    }
    writeFileSync(ruta, comoElOriginal(r.html, antes), 'utf8');
    const d = r.html.length - antes.length;
    console.log('  ' + C.verde + '✔' + C.off + ' ' + base
      + C.gris + '  ' + (d >= 0 ? '+' : '') + d + ' caracteres' + C.off);
  }

  console.log('\n  ' + C.gris
    + (soloRevisar
       ? 'Revisión. Corre sin --revisar para aplicarlo.'
       : 'Siguiente: mira las demos (node capturar.js --bases) y corre el validador.')
    + C.off + '\n');
  process.exit(fallos ? 1 : 0);
}
