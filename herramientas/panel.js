#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  PANEL — la interfaz de operación del estudio.
//  Servidor local mínimo, sin dependencias (http de Node).
//
//  Todo lo que hace está en dos modos que TÚ eliges por operación:
//    GRATIS  → reglas deterministas, 0 tokens, $0
//    CON IA  → llamada a la API, siempre con costo estimado antes
//
//  Uso:  node panel.js        → abre en http://localhost:4321
// ════════════════════════════════════════════════════════════

import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validar } from './validar.js';
import { crearProyecto, listarBases } from './crear-proyecto.js';
import { MODELOS, MODELO_POR_DEFECTO, estimarCosto, auditar } from './auditor-ia.js';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = resolve(AQUI, '..');
const PUERTO = process.env.PUERTO || 4321;

const SISTEMA = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion');
const CLIENTES = join(RAIZ, 'Proyectos-Clientes');

// ── Datos para el panel ───────────────────────────────────────
function listarProyectos() {
  if (!existsSync(CLIENTES)) return [];
  return readdirSync(CLIENTES)
    .filter((n) => {
      try { return statSync(join(CLIENTES, n)).isDirectory(); } catch { return false; }
    })
    .map((n) => {
      const dir = join(CLIENTES, n);
      let estado = 'sin ficha', base = '—';
      const ficha = join(dir, 'contexto.yml');
      if (existsSync(ficha)) {
        const t = readFileSync(ficha, 'utf8');
        estado = (t.match(/estado:\s*(.+)/) || [])[1]?.trim() || 'sin estado';
        base = (t.match(/base:\s*(.+)/) || [])[1]?.trim()
            || (t.match(/^\s*-\s*(.+)$/m) || [])[1]?.trim() || '—';
      }
      return { slug: n, estado, base };
    });
}

function recolectarHtml(dir, acc = []) {
  const IGNORAR = new Set(['node_modules', '.git', 'dist', 'build', 'versiones', 'comparacion']);
  let e; try { e = readdirSync(dir); } catch { return acc; }
  for (const n of e) {
    if (IGNORAR.has(n)) continue;
    const r = join(dir, n);
    let st; try { st = statSync(r); } catch { continue; }
    if (st.isDirectory()) recolectarHtml(r, acc);
    else if (extname(n) === '.html') acc.push(r);
  }
  return acc;
}

function objetivosDisponibles() {
  const out = [{ id: 'todo', etiqueta: 'Todo el sistema', ruta: '.' }];
  const bases = join(SISTEMA, '02-bases');
  if (existsSync(bases)) {
    out.push({ id: 'bases', etiqueta: 'Las 9 bases técnicas', ruta: 'Sistema-de-Produccion/Sistema-de-Produccion/02-bases' });
    for (const b of listarBases()) {
      out.push({ id: 'base:' + b, etiqueta: '   base · ' + b, ruta: 'Sistema-de-Produccion/Sistema-de-Produccion/02-bases/' + b });
    }
  }
  const pagina = join(SISTEMA, '08-pagina-del-estudio');
  if (existsSync(pagina)) {
    out.push({ id: 'estudio', etiqueta: 'Página del estudio', ruta: 'Sistema-de-Produccion/Sistema-de-Produccion/08-pagina-del-estudio' });
  }
  for (const p of listarProyectos()) {
    out.push({ id: 'cliente:' + p.slug, etiqueta: '   cliente · ' + p.slug, ruta: 'Proyectos-Clientes/' + p.slug });
  }
  return out;
}

// ── Utilidades HTTP ───────────────────────────────────────────
const json = (res, codigo, datos) => {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
  });
  res.end(cuerpo);
};

async function leerCuerpo(req) {
  const trozos = [];
  for await (const t of req) trozos.push(t);
  if (!trozos.length) return {};
  try { return JSON.parse(Buffer.concat(trozos).toString('utf8')); } catch { return {}; }
}

/** Impide que una ruta del cliente escape de la raíz del proyecto */
function rutaSegura(rel) {
  const abs = resolve(RAIZ, rel || '.');
  if (!abs.startsWith(RAIZ)) throw new Error('Ruta fuera del proyecto');
  return abs;
}

// ── Servidor ──────────────────────────────────────────────────
const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');

  try {
    // ─ Página
    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      const html = readFileSync(join(AQUI, 'panel.html'), 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(html);
    }

    // ─ Estado inicial
    if (req.method === 'GET' && url.pathname === '/api/estado') {
      return json(res, 200, {
        objetivos: objetivosDisponibles(),
        bases: listarBases(),
        proyectos: listarProyectos(),
        modelos: Object.entries(MODELOS).map(([k, v]) => ({
          clave: k, etiqueta: v.etiqueta, entrada: v.entrada, salida: v.salida,
        })),
        modeloPorDefecto: MODELO_POR_DEFECTO,
        tieneClave: Boolean(process.env.ANTHROPIC_API_KEY),
      });
    }

    // ─ MODO GRATIS · validar
    if (req.method === 'POST' && url.pathname === '/api/validar') {
      const { ruta } = await leerCuerpo(req);
      const r = validar(rutaSegura(ruta));
      return json(res, 200, { modo: 'gratis', costo: 0, ...r });
    }

    // ─ MODO GRATIS · crear proyecto
    if (req.method === 'POST' && url.pathname === '/api/crear') {
      const datos = await leerCuerpo(req);
      const r = crearProyecto({
        cliente: datos.cliente,
        base: datos.base,
        linea: datos.linea,
        marca: {
          primario: datos.primario || undefined,
          inicial: datos.inicial || undefined,
        },
      });
      return json(res, r.ok ? 200 : 400, { modo: 'gratis', costo: 0, ...r });
    }

    // ─ MODO IA · estimar (no gasta nada)
    if (req.method === 'POST' && url.pathname === '/api/estimar') {
      const { ruta, modelo } = await leerCuerpo(req);
      const abs = rutaSegura(ruta);
      const rutas = statSync(abs).isDirectory() ? recolectarHtml(abs) : [abs];
      const archivos = rutas.map((r) => ({
        ruta: r.slice(RAIZ.length + 1).split(String.fromCharCode(92)).join('/'),
        texto: readFileSync(r, 'utf8'),
      }));
      return json(res, 200, estimarCosto(archivos, modelo || MODELO_POR_DEFECTO));
    }

    // ─ MODO IA · auditar (gasta de verdad)
    if (req.method === 'POST' && url.pathname === '/api/auditar') {
      const { ruta, modelo } = await leerCuerpo(req);
      const abs = rutaSegura(ruta);
      const rutas = statSync(abs).isDirectory() ? recolectarHtml(abs) : [abs];
      const archivos = rutas.map((r) => ({
        ruta: r.slice(RAIZ.length + 1).split(String.fromCharCode(92)).join('/'),
        texto: readFileSync(r, 'utf8'),
      }));
      try {
        const r = await auditar(archivos, modelo || MODELO_POR_DEFECTO);
        return json(res, 200, { modo: 'ia', ...r });
      } catch (e) {
        return json(res, 400, { error: e.message });
      }
    }

    json(res, 404, { error: 'No encontrado' });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

servidor.listen(PUERTO, () => {
  console.log('');
  console.log('  \x1b[1mPanel del estudio\x1b[0m');
  console.log('  \x1b[32m→\x1b[0m http://localhost:' + PUERTO);
  console.log('');
  console.log('  \x1b[90mModo gratis listo. El modo IA pide ANTHROPIC_API_KEY.\x1b[0m');
  console.log('  \x1b[90mCtrl+C para detener.\x1b[0m');
  console.log('');
});
