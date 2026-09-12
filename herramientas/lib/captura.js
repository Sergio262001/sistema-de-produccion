// ════════════════════════════════════════════════════════════
//  LOS OJOS DEL SISTEMA.
//
//  Hasta ahora el ciclo estaba ABIERTO: se construía una página y
//  nadie la miraba. 281 pruebas comprueban que el HTML compila, que
//  los `id` existen y que el catálogo llegó. Ninguna comprueba que se
//  VEA bien, porque ninguna lo ve.
//
//  La primera captura que se tomó encontró en diez segundos cuatro
//  defectos que ninguna prueba caza — todos de geometría renderizada.
//
//  CERO DEPENDENCIAS, a propósito: usa el Chrome (o Edge) que ya está
//  instalado en la máquina. Playwright y Puppeteer harían lo mismo
//  trayendo 300 MB y su propio Chromium.
// ════════════════════════════════════════════════════════════

import { existsSync, mkdirSync, statSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join, resolve, basename, extname, dirname } from 'node:path';
import { execFile } from 'node:child_process';
import { tmpdir } from 'node:os';

/** Dónde vive Chrome o Edge según el sistema. El primero que exista gana. */
const CANDIDATOS = {
  win32: [
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
    'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  ],
  darwin: [
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
  ],
  linux: [
    '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/microsoft-edge',
  ],
};

/**
 * Busca un navegador usable. Devuelve la ruta o null.
 * `CHROME_BIN` en el entorno manda sobre todo lo demás.
 */
export function encontrarNavegador() {
  if (process.env.CHROME_BIN && existsSync(process.env.CHROME_BIN)) {
    return process.env.CHROME_BIN;
  }
  for (const ruta of (CANDIDATOS[process.platform] || CANDIDATOS.linux)) {
    if (existsSync(ruta)) return ruta;
  }
  return null;
}

/** Una ruta de disco se vuelve file:// ; una URL se deja tal cual. */
export function aDireccion(entrada) {
  const s = String(entrada || '').trim();
  if (/^https?:\/\//i.test(s)) return s;
  // Windows usa barras invertidas y file:// las quiere normales.
  const abs = resolve(s).split('\\').join('/');
  return 'file:///' + abs.replace(/^\/+/, '');
}

/** Nombre de archivo seguro a partir de una URL o ruta. */
export function nombreDe(entrada, sufijo = '') {
  const s = String(entrada || '');
  let base;
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      base = u.hostname.replace(/^www\./, '') + (u.pathname === '/' ? '' : u.pathname);
    } catch { base = s; }
  } else {
    // El nombre del archivo solo no basta: todas las bases tienen demo.html.
    const carpeta = basename(dirname(resolve(s)));
    base = carpeta + '-' + basename(s, extname(s));
  }
  const limpio = base.toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return (limpio || 'captura') + (sufijo ? '-' + sufijo : '') + '.png';
}

/**
 * Toma una captura.
 *
 * @param {object} o
 *   entrada   ruta de disco o URL
 *   salida    archivo .png de destino
 *   ancho     ancho de la ventana (por defecto 1280)
 *   alto      alto de la ventana (por defecto 1400)
 *   espera    ms de tiempo virtual antes de disparar. Una página remota con
 *             tipografías y JS necesita bastante más que un demo local.
 * @returns {Promise<{ok:boolean, archivo?:string, bytes?:number, error?:string}>}
 */
export function capturar({ entrada, salida, ancho = 1280, alto = 1400, espera }) {
  const navegador = encontrarNavegador();
  if (!navegador) {
    return Promise.resolve({ ok: false, error:
      'No encontré Chrome ni Edge. Instala uno, o pon la ruta en CHROME_BIN.' });
  }

  const direccion = aDireccion(entrada);
  const remota = /^https?:/i.test(direccion);
  const presupuesto = espera ?? (remota ? 12000 : 4000);

  mkdirSync(dirname(resolve(salida)), { recursive: true });
  try { rmSync(salida, { force: true }); } catch { /* no existía */ }

  const args = [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-sandbox',
    '--disable-extensions',
    '--force-device-scale-factor=1',
    // Sin esto, una página con tipografías web o JS se captura a medio pintar.
    '--virtual-time-budget=' + presupuesto,
    '--window-size=' + ancho + ',' + alto,
    '--screenshot=' + resolve(salida),
    direccion,
  ];

  return new Promise((cumplir) => {
    // El timeout del proceso va por encima del presupuesto virtual: si Chrome
    // se cuelga esperando red, no queremos colgar el panel con él.
    execFile(navegador, args, { timeout: presupuesto + 15000 }, () => {
      // Chrome escribe avisos en stderr y devuelve códigos raros aun cuando
      // la captura salió bien. La única señal confiable es el archivo.
      if (!existsSync(resolve(salida))) {
        return cumplir({ ok: false, error:
          'Chrome no generó la imagen. Si la página es remota, súbele --espera.' });
      }
      const bytes = statSync(resolve(salida)).size;
      if (bytes < 1000) {
        return cumplir({ ok: false, error: 'La imagen salió vacía (' + bytes + ' bytes).' });
      }
      cumplir({ ok: true, archivo: resolve(salida), bytes });
    });
  });
}

/**
 * Captura la MISMA base una vez por dirección de arte.
 *
 * Es la comparación que de verdad sirve: tres mundos visuales sobre el mismo
 * HTML, lado a lado. La dirección se parchea igual que lo hace el generador
 * (sobre el CONTEXT del script), en una copia temporal — el demo original
 * nunca se toca.
 */
export const DIRECCIONES = ['mercado', 'boutique', 'taller'];

export async function capturarDirecciones({ entrada, carpeta, ancho = 1280, alto = 1600 }) {
  const original = readFileSync(resolve(entrada), 'utf8');
  if (!/\bdireccion\s*:\s*"/.test(original)) {
    return { ok: false, error: 'Esa base no tiene `direccion` en su CONTEXT.' };
  }

  const temporal = join(tmpdir(), 'captura-dir-' + Date.now());
  mkdirSync(temporal, { recursive: true });
  const hechas = [];

  try {
    for (const dir of DIRECCIONES) {
      // Los archivos vecinos (logo-demo.svg) se referencian con ./ , así que
      // la copia tiene que vivir AL LADO del original, no en otra carpeta.
      const copia = resolve(dirname(resolve(entrada)), '.captura-' + dir + '.html');
      writeFileSync(copia, original.replace(/(\bdireccion\s*:\s*)"[^"]*"/, '$1"' + dir + '"'), 'utf8');
      const salida = join(carpeta, nombreDe(entrada, dir));
      const r = await capturar({ entrada: copia, salida, ancho, alto });
      try { rmSync(copia, { force: true }); } catch { /* ya no está */ }
      hechas.push({ direccion: dir, ...r });
    }
  } finally {
    try { rmSync(temporal, { recursive: true, force: true }); } catch { /* da igual */ }
  }

  return { ok: hechas.some((h) => h.ok), hechas };
}
