// ════════════════════════════════════════════════════════════
//  REGLAS DE CALIDAD — deterministas, sin IA, sin costo.
//  Cada regla recibe {ruta, texto, lineas} y devuelve hallazgos.
//  Severidad:  error = no entregar   ·   aviso = revisar
//
//  Las dos primeras existen porque son bugs REALES que tuvo
//  este sistema: el XSS del panel de pedidos y el --accent
//  declarado sin usar de la página del estudio v1.
// ════════════════════════════════════════════════════════════

import { evaluar } from './colores.js';

const hallazgo = (ruta, linea, severidad, regla, mensaje, pista) =>
  ({ ruta, linea, severidad, regla, mensaje, pista });

// ── 1 · XSS: innerHTML interpolando sin escapar ───────────────
export function reglaXss({ ruta, lineas }) {
  const out = [];
  lineas.forEach((l, i) => {
    if (!/innerHTML\s*(\+?=)/.test(l)) return;
    if (!/\$\{/.test(l)) return;                 // sin interpolación no hay riesgo
    if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;    // comentario o JSDoc, no es código
    // la etiqueta de plantilla `seguro` ya escapa todo lo interpolado
    if (/innerHTML\s*\+?=\s*seguro`/.test(l)) return;
    // ¿toda interpolación pasa por un escapador?
    const interpolaciones = l.match(/\$\{[^}]*\}/g) || [];
    const sucias = interpolaciones.filter(
      (x) => !/\b(esc|escapeHtml|seguro|encodeURI|Number|parseInt|parseFloat)\s*\(/.test(x)
             && !/^\$\{\s*[\d'"` ]/.test(x)
    );
    if (sucias.length) {
      out.push(hallazgo(ruta, i + 1, 'error', 'xss',
        `innerHTML interpola sin escapar: ${sucias[0].slice(0, 48)}`,
        'Envuelve el valor en esc(...) — ver 03-componentes-ui/seguridad.js'));
    }
  });
  return out;
}

// ── 2 · Tokens CSS declarados y nunca usados ──────────────────
export function reglaTokensMuertos({ ruta, texto }) {
  const out = [];

  // Un archivo que declara tokens pero no usa ninguno es un CONTRATO
  // (03-componentes-ui/tokens.css, src/styles/tokens.css): existe para que
  // otros archivos lo consuman. No tiene sentido exigirle que se use a sí mismo.
  if (!texto.includes('var(')) return out;

  const declarados = new Map();
  const re = /(--[\w-]+)\s*:/g;
  let m;
  while ((m = re.exec(texto))) {
    if (!declarados.has(m[1])) {
      declarados.set(m[1], texto.slice(0, m.index).split('\n').length);
    }
  }
  for (const [token, linea] of declarados) {
    // Cuenta usos reales de var(--token) sin regex, para no pelear con escapes
    let usos = 0, desde = 0;
    for (;;) {
      const i = texto.indexOf('var(', desde);
      if (i === -1) break;
      const cierre = texto.indexOf(')', i);
      const dentro = texto.slice(i + 4, cierre === -1 ? i + 4 : cierre).trim();
      if (dentro === token || dentro.startsWith(token + ',') || dentro.startsWith(token + ' ')) usos++;
      desde = i + 4;
    }
    if (usos === 0) {
      out.push(hallazgo(ruta, linea, 'aviso', 'token-muerto',
        `${token} se declara pero nunca se usa con var()`,
        'O se usa, o se borra. Un token muerto es diseño sin terminar.'));
    }
  }
  return out;
}

// ── 3 · Imágenes sin alt ──────────────────────────────────────
export function reglaAlt({ ruta, lineas }) {
  const out = [];
  lineas.forEach((l, i) => {
    const imgs = l.match(/<img\b[^>]*>/g) || [];
    for (const img of imgs) {
      if (!/\balt\s*=/.test(img)) {
        out.push(hallazgo(ruta, i + 1, 'aviso', 'alt-faltante',
          '<img> sin atributo alt',
          'alt="" si es decorativa; texto descriptivo si comunica algo.'));
      }
    }
  });
  return out;
}

// ── 4 · Contraste WCAG sobre los tokens declarados ────────────
export function reglaContraste({ ruta, texto }) {
  const out = [];
  const token = (n) => (texto.match(new RegExp('--' + n + '\\s*:\\s*(#[0-9a-fA-F]{3,6})')) || [])[1];

  const fondo    = token('bg') || token('surface');
  const parejas = [
    ['ink',      'texto principal'],
    ['ink-soft', 'texto secundario'],
  ];
  if (!fondo) return out;

  for (const [nombre, etiqueta] of parejas) {
    const color = token(nombre);
    if (!color) continue;
    const r = evaluar(color, fondo);
    if (r && !r.pasa) {
      const linea = texto.slice(0, texto.indexOf(`--${nombre}`)).split('\n').length;
      out.push(hallazgo(ruta, linea, 'error', 'contraste',
        `${etiqueta}: ${color} sobre ${fondo} = ${r.ratio}:1 (mínimo ${r.minimo})`,
        'Oscurece el texto o aclara el fondo hasta pasar 4.5:1.'));
    }
  }
  return out;
}

// ── 5 · Accesibilidad de teclado ──────────────────────────────
export function reglaTeclado({ ruta, texto }) {
  const out = [];
  const esPagina = /<body/i.test(texto);
  if (!esPagina) return out;

  if (!/:focus-visible/.test(texto)) {
    out.push(hallazgo(ruta, 1, 'aviso', 'foco',
      'No hay estilo :focus-visible en toda la página',
      'Sin foco visible, la página no se puede navegar por teclado.'));
  }
  if (/outline\s*:\s*(none|0)/.test(texto) && !/:focus-visible/.test(texto)) {
    out.push(hallazgo(ruta, 1, 'error', 'foco',
      'Se anula outline sin reponer :focus-visible',
      'Esto deja la página inusable por teclado.'));
  }
  const lang = texto.match(/<html[^>]*\blang\s*=/i);
  if (!lang) {
    out.push(hallazgo(ruta, 1, 'aviso', 'lang',
      '<html> sin atributo lang',
      'lang="es" — los lectores de pantalla lo necesitan.'));
  }
  return out;
}

// ── 6 · RLS en los esquemas de Supabase ───────────────────────
export function reglaRls({ ruta, texto, lineas }) {
  if (!ruta.endsWith('.sql')) return [];
  const out = [];

  // ¿el archivo declara explícitamente que no persiste nada?
  if (/no (usa|persiste|guarda)/i.test(texto.slice(0, 600))) return out;

  const tablas = [...texto.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?["`]?(\w+)/gi)]
    .map((m) => m[1]);
  const conRls = new Set(
    [...texto.matchAll(/alter\s+table\s+["`]?(\w+)["`]?\s+enable\s+row\s+level\s+security/gi)]
      .map((m) => m[1])
  );

  for (const t of tablas) {
    if (!conRls.has(t)) {
      const idx = lineas.findIndex((l) => new RegExp('create\\s+table.*\\b' + t + '\\b', 'i').test(l));
      out.push(hallazgo(ruta, idx + 1 || 1, 'error', 'rls',
        `Tabla "${t}" sin ENABLE ROW LEVEL SECURITY`,
        'Sin RLS, cualquiera con la anon key lee y escribe esa tabla.'));
    }
  }
  return out;
}

// ── 7 · Secretos donde no van ─────────────────────────────────
export function reglaSecretos({ ruta, lineas }) {
  const out = [];
  if (/\.env\.example$/.test(ruta)) return out;

  const patrones = [
    [/service_role/i,                    'clave service_role (omnipotente, nunca en el navegador)'],
    [/\bsb_secret_[A-Za-z0-9_-]{10,}/,   'clave secreta de Supabase'],
    [/\bsk_(live|test)_[A-Za-z0-9]{10,}/,'clave secreta de Stripe'],
    [/\bprv_(prod|test)_[A-Za-z0-9]{10,}/,'llave privada de Wompi'],
    [/eyJhbGciOi[A-Za-z0-9._-]{20,}/,    'JWT embebido'],
  ];

  lineas.forEach((l, i) => {
    if (/^\s*(\/\/|#|\*|--)/.test(l)) return;   // comentarios no cuentan
    for (const [re, desc] of patrones) {
      if (re.test(l)) {
        out.push(hallazgo(ruta, i + 1, 'error', 'secreto',
          `Posible ${desc} en el código`,
          'Muévelo al .env y asegúrate de que el .env esté en .gitignore.'));
      }
    }
  });
  return out;
}

// ── 8 · getElementById a un id que no existe ──────────────────
//
// Existe por un bug real y caro: al quitar la barra de sistema del demo, los
// id que vivían dentro desaparecieron, pero el script seguía pidiéndolos.
// `getElementById` devolvió null, la línea lanzó TypeError y TODO el
// JavaScript posterior dejó de correr. La página se entregó mostrando solo el
// encabezado. Nada en el HTML se veía roto: el daño era invisible al leerlo.
export function reglaIdFantasma({ ruta, texto, lineas }) {
  if (!/<body/i.test(texto)) return [];   // solo páginas completas
  const out = [];

  const declarados = new Set(
    [...texto.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1])
  );

  lineas.forEach((l, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(l)) return;            // comentarios no
    for (const m of l.matchAll(/getElementById\(\s*['"]([^'"]+)['"]\s*\)/g)) {
      const id = m[1];
      if (declarados.has(id)) continue;
      // Encadenar sobre null (.textContent, .classList…) tumba el script entero
      const encadena = new RegExp('getElementById\\(\\s*[\'"]' + id + '[\'"]\\s*\\)\\s*\\.').test(l);
      out.push(hallazgo(ruta, i + 1, encadena ? 'error' : 'aviso', 'id-fantasma',
        'getElementById("' + id + '") pero ese id no existe en la página',
        encadena
          ? 'Devuelve null y la línea lanza TypeError: todo el JavaScript de ahí en adelante deja de ejecutarse.'
          : 'Devuelve null. Comprueba antes de usarlo.'));
    }
  });
  return out;
}

// ── Registro ──────────────────────────────────────────────────
export const REGLAS = [
  { id: 'xss',          fn: reglaXss,          extensiones: ['.html', '.js'] },
  { id: 'token-muerto', fn: reglaTokensMuertos, extensiones: ['.html', '.css'] },
  { id: 'alt',          fn: reglaAlt,          extensiones: ['.html'] },
  { id: 'contraste',    fn: reglaContraste,    extensiones: ['.html', '.css'] },
  { id: 'teclado',      fn: reglaTeclado,      extensiones: ['.html'] },
  { id: 'rls',          fn: reglaRls,          extensiones: ['.sql'] },
  { id: 'secreto',      fn: reglaSecretos,     extensiones: ['.html', '.js', '.yml', '.sql'] },
  { id: 'id-fantasma',  fn: reglaIdFantasma,   extensiones: ['.html'] },
];
