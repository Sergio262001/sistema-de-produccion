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
import { randomUUID } from 'node:crypto';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { validar } from './validar.js';
import { crearProyecto, listarBases } from './crear-proyecto.js';
import { MODELOS, MODELO_POR_DEFECTO, estimarCosto, auditar } from './auditor-ia.js';
import { PASOS, FAMILIAS, respuestasAFicha, validarFicha } from './lib/brief.js';
import { extraerPorPatrones, extraerConIA } from './lib/extraer.js';
import { crearAcceso, leerCookie } from './lib/acceso.js';
import { configurarGoogle, urlDeEntrada, canjearCodigo } from './lib/google.js';
import { CATALOGO, componer, fichaDeProyecto } from './lib/prompts.js';
import { estadoAgente, correrAgente, MODELOS_AGENTE, MODELO_AGENTE,
         PRESUPUESTO_POR_DEFECTO, PRESUPUESTO_MAXIMO } from './lib/agente.js';
import { abrirHistorial } from './lib/historial.js';

const AQUI = fileURLToPath(new URL('.', import.meta.url));
const RAIZ = resolve(AQUI, '..');
const BARRA = String.fromCharCode(92);

// Node 20.6+ lee .env sin dependencias. El archivo es opcional.
try { process.loadEnvFile(join(AQUI, '.env')); } catch { /* no hay .env, normal */ }

const PUERTO = process.env.PUERTO || 4321;
const ORIGEN = 'http://localhost:' + PUERTO;
const RETORNO_GOOGLE = ORIGEN + '/api/acceso/google/retorno';

const SISTEMA = join(RAIZ, 'Sistema-de-Produccion', 'Sistema-de-Produccion');
const CLIENTES = join(RAIZ, 'Proyectos-Clientes');
const acceso = crearAcceso(AQUI);
const google = configurarGoogle();
const historial = abrirHistorial(AQUI);

// Estados de OAuth pendientes: viven en memoria y caducan a los 10 minutos.
const estadosPendientes = new Map();
const limpiarEstados = () => {
  const ahora = Date.now();
  for (const [k, t] of estadosPendientes) if (ahora - t > 600_000) estadosPendientes.delete(k);
};

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

/** "Proyectos-Clientes/casa-tela/x" → "casa-tela"; cualquier otra cosa → null */
function slugDeRuta(rel) {
  const m = String(rel || '').match(/^Proyectos-Clientes\/([^/]+)/);
  return m ? m[1] : null;
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

    // ─ Formulario del cliente. Sin puerta a propósito: es la pieza que se
    //   comparte, y no lee ni escribe nada del sistema — todo pasa en el
    //   navegador de quien lo llena.
    if (req.method === 'GET' && ruta === '/brief.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(readFileSync(join(AQUI, 'brief.html'), 'utf8'));
    }

    // ─ Acceso (públicas)
    if (ruta === '/api/acceso/estado') {
      const cookie = leerCookie(req.headers.cookie, 'sesion');
      return json(res, 200, {
        configurado: acceso.tieneFrase(),
        autenticado: acceso.valido(cookie),
        via: acceso.viaDe(cookie),
        google: { activo: google.activo, faltan: google.faltan },
      });
    }
    if (req.method === 'POST' && ruta === '/api/acceso/configurar') {
      if (acceso.tieneFrase()) return json(res, 400, { ok: false, error: 'Ya hay una frase configurada.' });
      const { frase } = await leerCuerpo(req);
      return json(res, 200, acceso.configurar(frase));
    }

    // ─ Google: ida
    if (req.method === 'GET' && ruta === '/api/acceso/google') {
      if (!google.activo) {
        return json(res, 400, { error: 'Falta configurar: ' + google.faltan.join(', ') });
      }
      limpiarEstados();
      const nonce = randomUUID();
      estadosPendientes.set(nonce, Date.now());
      const state = nonce + '.' + acceso.firmarEstado(nonce);
      res.writeHead(302, { Location: urlDeEntrada(google, RETORNO_GOOGLE, state) });
      return res.end();
    }

    // ─ Google: vuelta
    if (req.method === 'GET' && ruta === '/api/acceso/google/retorno') {
      const paginaError = (msg) => {
        res.writeHead(400, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end('<!doctype html><meta charset="utf-8">'
          + '<body style="font-family:system-ui;background:#12160F;color:#EDF0E8;'
          + 'display:grid;place-items:center;height:100vh;margin:0;text-align:center">'
          + '<div><h1 style="font-size:18px">No se pudo entrar</h1>'
          + '<p style="color:#98A18C;font-size:13px;max-width:40ch">' + msg + '</p>'
          + '<a href="/" style="color:#C96F4A">Volver al panel</a></div></body>');
      };

      if (url.searchParams.get('error')) {
        return paginaError('Google respondió: ' + url.searchParams.get('error'));
      }

      const state = url.searchParams.get('state') || '';
      const [nonce, firma] = state.split('.');
      if (!nonce || !firma || !acceso.verificarEstado(nonce, firma) || !estadosPendientes.has(nonce)) {
        return paginaError('La petición no coincide con la que inició este panel. Vuelve a intentar desde el botón.');
      }
      estadosPendientes.delete(nonce);

      const codigo = url.searchParams.get('code');
      if (!codigo) return paginaError('Google no devolvió el código de autorización.');

      const r = await canjearCodigo(google, codigo, RETORNO_GOOGLE);
      if (!r.ok) return paginaError(r.error);

      const s = acceso.emitirSesion('google:' + r.correo);
      res.writeHead(302, {
        Location: '/',
        'Set-Cookie': 'sesion=' + encodeURIComponent(s.token)
          + '; HttpOnly; SameSite=Lax; Path=/; Max-Age=43200',
      });
      return res.end();
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

    // ─ De aquí en adelante, todo exige sesión.
    //   Hay puerta si existe CUALQUIER forma de entrar: frase o Google.
    if (ruta.startsWith('/api/')) {
      const hayPuerta = acceso.tieneFrase() || google.activo;
      if (hayPuerta && !acceso.valido(leerCookie(req.headers.cookie, 'sesion'))) {
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
    if (ruta === '/api/brief') return json(res, 200, { pasos: PASOS, familias: FAMILIAS });

    // ─ Prompts maestros
    if (ruta === '/api/prompts') {
      return json(res, 200, { catalogo: CATALOGO });
    }
    if (req.method === 'POST' && ruta === '/api/prompt') {
      const { id, slug, base } = await leerCuerpo(req);
      const ficha = slug ? fichaDeProyecto(CLIENTES, slug) : null;
      return json(res, 200, componer({
        dirPrompts: join(SISTEMA, '05-prompts-maestros'),
        id,
        ficha,
        base: base || ficha?.base,
        proyecto: slug ? 'Proyectos-Clientes/' + slug : null,
      }));
    }

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
      if (r.ok) historial.anotar({ tipo: 'proyecto', proyecto: r.slug,
        resumen: 'creado desde el asistente · ' + r.base,
        detalle: { base: r.base, archivos: r.creados.length } });
      return json(res, r.ok ? 200 : 400, r);
    }

    // ─ Historial
    if (ruta === '/api/historial') {
      const proyecto = url.searchParams.get('proyecto') || null;
      return json(res, 200, {
        disponible: historial.disponible(),
        motivo: historial.motivo,
        eventos: historial.recientes({ proyecto, limite: 50 }),
        tendencia: historial.tendencia(proyecto),
        resumen: historial.resumen(),
      });
    }

    // ─ Agente: estado
    if (ruta === '/api/agente/estado') {
      const e = await estadoAgente();
      return json(res, 200, {
        ...e,
        modelos: Object.entries(MODELOS_AGENTE).map(([k, v]) => ({ clave: k, etiqueta: v.etiqueta })),
        modeloPorDefecto: MODELO_AGENTE,
        presupuesto: PRESUPUESTO_POR_DEFECTO,
        presupuestoMaximo: PRESUPUESTO_MAXIMO,
      });
    }

    // ─ Agente: conversación en vivo (Server-Sent Events)
    if (req.method === 'POST' && ruta === '/api/agente') {
      const { mensaje, modelo, presupuesto, soloLectura } = await leerCuerpo(req);
      if (!mensaje || !String(mensaje).trim()) {
        return json(res, 400, { error: 'Falta el mensaje.' });
      }

      res.writeHead(200, {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      });
      const enviar = (ev) => res.write('data: ' + JSON.stringify(ev) + '\n\n');

      try {
        const { costo, turnos } = await correrAgente(
          { raiz: RAIZ, mensaje, modelo, presupuesto, soloLectura }, enviar);
        historial.anotar({
          tipo: 'agente', resumen: String(mensaje).slice(0, 160),
          costo, detalle: { modelo, turnos, soloLectura: Boolean(soloLectura) },
        });
      } catch (e) {
        enviar({ tipo: 'error', mensaje: e.message });
        historial.anotar({ tipo: 'error', resumen: 'agente: ' + e.message.slice(0, 160) });
      }
      return res.end();
    }

    // ─ Modo gratis
    if (req.method === 'POST' && ruta === '/api/validar') {
      const { ruta: r } = await leerCuerpo(req);
      const objetivo = rutaSegura(r);
      const resultado = validar(objetivo);
      const errores = resultado.hallazgos.filter((h) => h.severidad === 'error').length;
      const proyecto = slugDeRuta(r);
      historial.anotar({
        tipo: 'validacion', proyecto,
        resumen: (r || 'todo') + ' · ' + resultado.hallazgos.length + ' hallazgos',
        errores, avisos: resultado.hallazgos.length - errores,
      });
      return json(res, 200, {
        modo: 'gratis', costo: 0, ...resultado,
        tendencia: historial.tendencia(proyecto),
      });
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
        const a = await auditar(archivosDe(r), modelo || MODELO_POR_DEFECTO);
        historial.anotar({ tipo: 'auditoria',
          proyecto: slugDeRuta(r),
          resumen: (r || 'todo') + ' · ' + a.resultados.length + ' archivos',
          costo: a.costoReal, detalle: { modelo: a.modelo } });
        return json(res, 200, { modo: 'ia', ...a });
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
  console.log('  ' + g + (google.activo
    ? 'Entrar con Google: activo (' + google.correos.join(', ') + ')'
    : 'Entrar con Google: inactivo — falta ' + google.faltan.join(', ')) + o);
  console.log('  ' + g + (acceso.tieneFrase()
    ? 'Frase de respaldo: configurada.'
    : 'Frase de respaldo: sin definir (se define al entrar).') + o);
  console.log('  ' + g + (process.env.ANTHROPIC_API_KEY
    ? 'API conectada. El modo con IA está disponible.'
    : 'Sin API key. El modo gratis funciona igual.') + o);
  console.log('  ' + g + 'Solo escucha en 127.0.0.1 · Ctrl+C para detener.' + o);
  console.log('');
});
