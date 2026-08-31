#!/usr/bin/env node
// ════════════════════════════════════════════════════════════
//  PANEL DEL ESTUDIO — servidor local, sin dependencias.
//
//  Dos modos que TÚ eliges por operación:
//    GRATIS  → reglas deterministas, 0 tokens, $0
//    CON IA  → llamada a la API, costo estimado y confirmado antes
//
//  Uso:  node panel.js   →  http://localhost:4321
// ════════════════════════════════════════════════════════════

import { createServer } from 'node:http';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validar } from './validar.js';
import { crearProyecto, listarBases } from './crear-proyecto.js';
import { MODELOS, MODELO_POR_DEFECTO, estimarCosto, auditar } from './auditor-ia.js';
import { PASOS, respuestasAFicha, validarFicha } from './lib/brief.js';
import { extraerPorPatrones, extraerConIA } from './lib/extraer.js';
import { crearAcceso, leerCookie } from './lib/acceso.js';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = resolve(AQUI, '..');
const PUERTO = process.env.PUERTO || 4321;
const BARRA = String.fromCharCode(92);

const SISTEMA = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion');
const CLIENTES = join(RAIZ, 'Proyectos-Clientes');
const acceso = crearAcceso(AQUI);

// ── Inventario ────────────────────────────────────────────────
function listarProyectos() {
  if (!existsSync(CLIENTES)) return [];
  return readdirSync(CLIENTES)
    .filter((n) => { try { return statSync(join(CLIENTES, n)).isDirectory(); } catch { return false; } })
    .map((n) => {
      const dir = join(CLIENTES, n);
      let estado = 'sin ficha', base = '—', creado = '';
      const ficha = join(dir, 'contexto.yml');
      if (existsSync(ficha)) {
        const t = readFileSync(ficha, 'utf8');
        estado = (t.match(/estado:\s*(.+)/) || [])[1]?.trim() || 'sin estado';
        creado = (t.match(/creado:\s*"?([\d-]+)/) || [])[1] || '';
        base = (t.match(/^base:\s*(.+)$/m) || [])[1]?.trim()
            || (t.match(/^\s*-\s*(.+)$/m) || [])[1]?.trim() || '—';
      }
      return { slug: n, estado, base, creado };
    })
    .sort((a, b) => (b.creado || '').localeCompare(a.creado || ''));
}

const IGNORAR = new Set(['node_modules', '.git', 'dist', 'build', 'versiones', 'comparacion']);
function recolectarHtml(dir, acc = []) {
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

function objetivos() {
  const out = [{ etiqueta: 'Todo el sistema', ruta: '.' }];
  if (existsSync(join(SISTEMA, '02-bases'))) {
    out.push({ etiqueta: 'Las 9 bases técnicas', ruta: 'Sistema-de-Produccion/Sistema-de-Produccion/02-bases' });
    for (const b of listarBases()) {
      out.push({ etiqueta: '   base · ' + b, ruta: 'Sistema-de-Produccion/Sistema-de-Produccion/02-bases/' + b });
    }
  }
  if (existsSync(join(SISTEMA, '08-pagina-del-estudio'))) {
    out.push({ etiqueta: 'Página del estudio', ruta: 'Sistema-de-Produccion/Sistema-de-Produccion/08-pagina-del-estudio' });
  }
  for (const p of listarProyectos()) {
    out.push({ etiqueta: '   cliente · ' + p.slug, ruta: 'Proyectos-Clientes/' + p.slug });
  }
  return out;
}

// ── HTTP ──────────────────────────────────────────────────────
const json = (res, codigo, datos, cabeceras = {}) => {
  const cuerpo = JSON.stringify(datos);
  res.writeHead(codigo, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(cuerpo),
    ...cabeceras,
  });
  res.end(cuerpo);
};

async function leerCuerpo(req) {
  const trozos = [];
  let total = 0;
  for await (const t of req) {
    total += t.length;
    if (total > 5_000_000) throw new Error('Documento demasiado grande (máx 5 MB).');
    trozos.push(t);
  }
  if (!trozos.length) return {};
  try { return JSON.parse(Buffer.concat(trozos).toString('utf8')); } catch { return {}; }
}

function rutaSegura(rel) {
  const abs = resolve(RAIZ, rel || '.');
  if (!abs.startsWith(RAIZ)) throw new Error('Ruta fuera del proyecto');
  return abs;
}

function archivosDe(ruta) {
  const abs = rutaSegura(ruta);
  const rutas = statSync(abs).isDirectory() ? recolectarHtml(abs) : [abs];
  return rutas.map((r) => ({
    ruta: r.slice(RAIZ.length + 1).split(BARRA).join('/'),
    texto: readFileSync(r, 'utf8'),
  }));
}

// ── Servidor ──────────────────────────────────────────────────
const servidor = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const ruta = url.pathname;

  try {
    // ─ Página (siempre se sirve; el gate real está en las APIs)
    if (req.method === 'GET' && (ruta === '/' || ruta === '/index.html')) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(readFileSync(join(AQUI, 'panel.html'), 'utf8'));
    }

    // ─ Acceso (públicas)
    if (ruta === '/api/acceso/estado') {
      return json(res, 200, {
        configurado: acceso.configurado(),
        autenticado: acceso.valido(leerCookie(req.headers.cookie, 'sesion')),
      });
    }
    if (req.method === 'POST' && ruta === '/api/acceso/configurar') {
      if (acceso.configurado()) return json(res, 400, { ok: false, error: 'Ya hay una frase configurada.' });
      const { frase } = await leerCuerpo(req);
      return json(res, 200, acceso.configurar(frase));
    }
    if (req.method === 'POST' && ruta === '/api/acceso/entrar') {
      const { frase } = await leerCuerpo(req);
      const r = acceso.entrar(frase);
      if (!r.ok) return json(res, 401, r);
      return json(res, 200, { ok: true }, {
        'Set-Cookie': 'sesion=' + encodeURIComponent(r.token)
          + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=43200',
      });
    }
    if (req.method === 'POST' && ruta === '/api/acceso/salir') {
      return json(res, 200, { ok: true }, { 'Set-Cookie': 'sesion=; HttpOnly; Path=/; Max-Age=0' });
    }

    // ─ De aquí en adelante, todo exige sesión
    if (ruta.startsWith('/api/')) {
      if (acceso.configurado() && !acceso.valido(leerCookie(req.headers.cookie, 'sesion'))) {
        return json(res, 401, { error: 'Sesión requerida' });
      }
    }

    // ─ Estado general
    if (ruta === '/api/estado') {
      return json(res, 200, {
        objetivos: objetivos(),
        bases: listarBases(),
        proyectos: listarProyectos(),
        modelos: Object.entries(MODELOS).map(([k, v]) => ({ clave: k, etiqueta: v.etiqueta })),
        modeloPorDefecto: MODELO_POR_DEFECTO,
        tieneClave: Boolean(process.env.ANTHROPIC_API_KEY),
      });
    }

    // ─ El cuestionario
    if (ruta === '/api/brief') return json(res, 200, { pasos: PASOS });

    // ─ Documento → respuestas
    if (req.method === 'POST' && ruta === '/api/extraer') {
      const { texto, modo, modelo } = await leerCuerpo(req);
      if (!texto || !texto.trim()) return json(res, 400, { error: 'Documento vacío' });
      try {
        const r = modo === 'ia'
          ? await extraerConIA(texto, modelo || MODELO_POR_DEFECTO)
          : extraerPorPatrones(texto);
        return json(res, 200, r);
      } catch (e) { return json(res, 400, { error: e.message }); }
    }

    // ─ Respuestas → ficha + compuerta
    if (req.method === 'POST' && ruta === '/api/ficha') {
      const { respuestas } = await leerCuerpo(req);
      const { ficha, base, avisos } = respuestasAFicha(respuestas || {});
      return json(res, 200, { ficha, base, avisos, validacion: validarFicha(respuestas || {}) });
    }

    // ─ Construir desde el asistente
    if (req.method === 'POST' && ruta === '/api/crear-desde-brief') {
      const { respuestas } = await leerCuerpo(req);
      const v = validarFicha(respuestas || {});
      if (!v.listo) return json(res, 400, { ok: false, error: 'Faltan campos obligatorios', validacion: v });

      const { ficha, base } = respuestasAFicha(respuestas);
      const r = crearProyecto({
        cliente: ficha.cliente,
        base: base || respuestas.base,
        linea: ficha.linea,
        marca: ficha.marca || {},
      });
      return json(res, r.ok ? 200 : 400, r);
    }

    // ─ Modo gratis
    if (req.method === 'POST' && ruta === '/api/validar') {
      const { ruta: r } = await leerCuerpo(req);
      return json(res, 200, { modo: 'gratis', costo: 0, ...validar(rutaSegura(r)) });
    }
    if (req.method === 'POST' && ruta === '/api/crear') {
      const d = await leerCuerpo(req);
      const r = crearProyecto({
        cliente: d.cliente, base: d.base, linea: d.linea,
        marca: { primario: d.primario || undefined, inicial: d.inicial || undefined },
      });
      return json(res, r.ok ? 200 : 400, { modo: 'gratis', costo: 0, ...r });
    }

    // ─ Modo IA
    if (req.method === 'POST' && ruta === '/api/estimar') {
      const { ruta: r, modelo } = await leerCuerpo(req);
      return json(res, 200, estimarCosto(archivosDe(r), modelo || MODELO_POR_DEFECTO));
    }
    if (req.method === 'POST' && ruta === '/api/auditar') {
      const { ruta: r, modelo } = await leerCuerpo(req);
      try {
        return json(res, 200, { modo: 'ia', ...await auditar(archivosDe(r), modelo || MODELO_POR_DEFECTO) });
      } catch (e) { return json(res, 400, { error: e.message }); }
    }

    json(res, 404, { error: 'No encontrado' });
  } catch (e) {
    json(res, 500, { error: e.message });
  }
});

servidor.listen(PUERTO, '127.0.0.1', () => {
  const g = '\x1b[90m', v = '\x1b[32m', n = '\x1b[1m', o = '\x1b[0m';
  console.log('');
  console.log('  ' + n + 'Panel del estudio' + o);
  console.log('  ' + v + '→' + o + ' http://localhost:' + PUERTO);
  console.log('');
  console.log('  ' + g + (acceso.configurado()
    ? 'Acceso configurado. Te pedirá la frase.'
    : 'Primera vez: define una frase de acceso al entrar.') + o);
  console.log('  ' + g + (process.env.ANTHROPIC_API_KEY
    ? 'API conectada. El modo con IA está disponible.'
    : 'Sin API key. El modo gratis funciona igual.') + o);
  console.log('  ' + g + 'Solo escucha en 127.0.0.1 · Ctrl+C para detener.' + o);
  console.log('');
});
