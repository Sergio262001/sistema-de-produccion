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
export function adaptarEntregable(html, marca, proyecto) {
  let out = html;

  // 1 · Quitar la sysbar: el marcado Y su CSS (andamiaje de demo, no va al cliente)
  out = out.replace(/<div class="sysbar"[\s\S]*?<\/div>\s*<\/div>/i, '');
  out = out.replace(/<!--\s*sysbar[\s\S]*?-->/gi, '');
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
  if (marca.inicial) {
    out = out.replace(/(<div class="logo"[^>]*>)[^<]*(<\/div>)/i, '$1' + marca.inicial + '$2');
  }

  return out;
}

/** Construye la ficha de contexto del cliente a partir del ejemplo de la base */
// Campos que son IDENTIDAD de otro negocio: heredarlos del ejemplo haría que
// un cliente nuevo saliera con el subtítulo, el dominio o el WhatsApp de otro.
// Se marcan como POR DEFINIR para que no puedan colarse hasta la entrega.
const IDENTIDAD = ['subtitulo', 'tono', 'dominio', 'whatsapp_num', 'inicial'];

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
  const ficha = { ...ejemplo };
  ficha.proyecto = datos.proyecto;
  ficha.cliente = datos.cliente;
  ficha.base = datos.base;
  if (datos.linea) ficha.linea = datos.linea;
  ficha.marca = limpiarIdentidad(ejemplo.marca, datos.marca);
  if (ficha.apis) ficha.apis = limpiarIdentidad(ficha.apis, {});
  ficha.entrega = {
    ...limpiarIdentidad(ejemplo.entrega, {}),
    estado: 'en construccion',
    creado: new Date().toISOString().slice(0, 10),
  };
  return ficha;
}

// ── Generación ────────────────────────────────────────────────

export function crearProyecto(opciones) {
  const { cliente, base, linea, marca = {}, destino } = opciones;

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
    proyecto: cliente, cliente, base, linea, marca,
  });
  writeFileSync(join(dirSalida, 'contexto.yml'),
    '# Ficha de contexto — generada por herramientas/crear-proyecto.js\n' +
    '# Sin secretos: los valores reales van en .env\n\n' + escribirYaml(ficha), 'utf8');
  creados.push('contexto.yml');

  // 4 · entregable adaptado
  const rutaDemo = join(dirBase, 'demo.html');
  if (existsSync(rutaDemo)) {
    const html = adaptarEntregable(readFileSync(rutaDemo, 'utf8'), ficha.marca || {}, cliente);
    writeFileSync(join(dirSalida, 'index.html'), html, 'utf8');
    creados.push('index.html');
  }

  // 5 · .env (plantilla, sin valores) + .gitignore
  const rutaEnvEj = join(dirBase, '.env.example');
  if (existsSync(rutaEnvEj)) {
    const ej = readFileSync(rutaEnvEj, 'utf8');
    cpSync(rutaEnvEj, join(dirSalida, '.env.example'));
    writeFileSync(join(dirSalida, '.env'),
      '# Claves REALES de ' + cliente + '. Nunca se commitea.\n' +
      '# Rellena cada valor cuando el cliente te lo entregue.\n\n' + ej, 'utf8');
    creados.push('.env', '.env.example');
  }
  writeFileSync(join(dirSalida, '.gitignore'),
    '.env\n.env.*\n!.env.example\nnode_modules/\ndist/\n', 'utf8');
  creados.push('.gitignore');

  // 6 · README con lo que hay que pedirle al cliente
  const insumo = readdirSync(existsSync(INSUMOS) ? INSUMOS : dirBase)
    .find((n) => n.includes(base.split('-')[0]));
  const readme = [
    '# ' + cliente,
    '',
    'Proyecto generado desde la base `' + base + '`.',
    'Fecha: ' + new Date().toISOString().slice(0, 10),
    '',
    '## Qué hacer ahora',
    '1. Corre `supabase.schema.sql` en el SQL Editor del proyecto Supabase del cliente.',
    '2. Llena los valores de `.env` con las credenciales reales.',
    '3. Ajusta los tokens de marca en `index.html` si la ficha cambió.',
    '4. Corre el validador antes de entregar:',
    '   ```',
    '   node ../../herramientas/validar.js .',
    '   ```',
    '',
    '## Qué pedirle al cliente',
    insumo
      ? 'Ver `09-que-necesito-de-ti/' + insumo + '` en el sistema de produccion.'
      : 'Ver la carpeta `09-que-necesito-de-ti/` del sistema de produccion.',
    '',
    '## Origen',
    'No se reescribió ningún adaptador: `src/` es copia literal de la base.',
    'Si arreglas un bug en `src/`, arréglalo también en la base.',
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
