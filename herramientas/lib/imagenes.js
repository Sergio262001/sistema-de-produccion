// ════════════════════════════════════════════════════════════
//  IMÁGENES GENERADAS — marcadores de vista previa y texturas.
//
//  PARA QUÉ SÍ Y PARA QUÉ NO. Léelo antes de tocar esto:
//
//  ✅ Marcadores de vista previa. Dejan enseñarle al cliente cómo va a
//     quedar su página antes de que mande material. Viven en
//     `vista-previa/`, que NUNCA se publica.
//  ✅ Texturas y fondos abstractos. No representan nada real, así que no
//     mienten sobre nada.
//
//  ❌ LAS FOTOS DE OBRA DEL SITIO PUBLICADO. Una foto generada de un
//     edificio que el cliente no construyó es portafolio falso. Si alguien
//     llega preguntando por ese proyecto, no existe — y el que queda
//     expuesto es el cliente, no el estudio.
//
//     Es la regla madre del sistema: nunca inventes datos del cliente.
//     Una foto de obra es un dato del cliente.
//
//  LA GARANTÍA NO ES QUE YO ME ACUERDE: `lib/reglas.js` tiene una regla
//  que convierte en ERROR publicar un archivo de `vista-previa/`. Aunque
//  alguien quiera, el validador no lo deja pasar.
//
//  Dependencia OPCIONAL. Sin `GOOGLE_GENAI_API_KEY` este módulo no existe:
//  ni un import, ni una petición. El modo gratis del sistema no se toca.
// ════════════════════════════════════════════════════════════

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

/**
 * Los modelos de imagen, del más barato al más capaz.
 * Verificado contra ai.google.dev el 2026-09-14 — si esto deja de
 * funcionar, lo primero que hay que comprobar es si cambiaron los nombres.
 */
export const MODELOS_IMAGEN = {
  rapido: { id: 'gemini-3.1-flash-lite-image',
            etiqueta: 'Flash Lite · el más barato', usd: 0.011 },
  medio:  { id: 'gemini-3.1-flash-image',
            etiqueta: 'Flash · equilibrado, 4K', usd: 0.039 },
  pro:    { id: 'gemini-3-pro-image',
            etiqueta: 'Pro · el más capaz', usd: 0.134 },
};
export const MODELO_IMAGEN = 'rapido';

/** Techo por tanda. Una tanda de 12 imágenes en Pro se va a $1.60. */
export const TOPE_POR_TANDA = 12;

/**
 * Los tipos de imagen que el sistema sabe pedir.
 *
 * `render` es deliberado en todos los que representan obra: se pide una
 * VISUALIZACIÓN, no una fotografía. Una imagen que se ve como render dice
 * la verdad —"esto es una propuesta"— y una que se ve como foto documental
 * miente. La diferencia está en el prompt, y es intencional.
 */
export const TIPOS = {
  portada: {
    nombre: 'Portada del hero',
    proporcion: '16:9',
    // eslint-disable-next-line max-len
    plantilla: (c) => `Architectural visualization render, wide cinematic composition. ${c.sujeto}. `
      + `Deep ${c.colorNombre} tonality dominating the scene, warm golden accent light. `
      + `Clean modern geometry, glass and concrete, late afternoon light, subtle atmospheric haze. `
      + `Empty of people. Left third of the frame kept visually calm and uncluttered for overlaid text. `
      + `Rendered look, not documentary photography. No text, no logos, no watermarks.`,
  },
  franja: {
    nombre: 'Franja a sangre',
    proporcion: '21:9',
    plantilla: (c) => `Architectural visualization render, ultra-wide banner composition. ${c.sujeto}. `
      + `Deep navy and slate tonality, one warm golden light source. Calm, horizontal, unhurried. `
      + `Empty of people. Rendered look, not documentary photography. No text, no logos.`,
  },
  sobre: {
    nombre: 'Sección partida',
    proporcion: '3:4',
    plantilla: (c) => `Architectural visualization render, vertical composition. ${c.sujeto}. `
      + `Technical drawings, scale model or structural detail in the foreground. `
      + `Deep navy tonality with warm accent light. Rendered look, not documentary photography. `
      + `No recognizable faces, no text, no logos.`,
  },
  galeria: {
    nombre: 'Proyecto de galería',
    proporcion: '4:3',
    plantilla: (c) => `Architectural visualization render of ${c.sujeto}. `
      + `Deep navy and concrete tonality, warm golden accent. Clean geometry, daylight. `
      + `Empty of people. Rendered look, not documentary photography. No text, no logos.`,
  },
  textura: {
    nombre: 'Textura de fondo',
    proporcion: '16:9',
    // La textura es el único tipo que no representa NADA: es abstracta a
    // propósito, y por eso es el único uso sin reparos para un entregable.
    plantilla: (c) => `Abstract seamless texture, extreme close-up. `
      + `Fine concrete, brushed paper or technical grid in deep ${c.colorNombre}. `
      + `Very low contrast, subtle, no focal point — meant to sit behind text. `
      + `Not a photograph of any object or place. No text, no logos.`,
  },
};

/** ¿Está el SDK instalado y hay clave? */
export async function estadoImagenes() {
  const faltan = [];
  let sdk = false;
  try { await import('@google/genai'); sdk = true; }
  catch { faltan.push('el paquete @google/genai (npm install @google/genai)'); }
  if (!claveDe(process.env)) {
    faltan.push('la variable GOOGLE_GENAI_API_KEY (consíguela en aistudio.google.com)');
  }
  return { listo: sdk && faltan.length === 0, faltan };
}

/**
 * La clave. Se aceptan los dos nombres que la gente usa en la práctica:
 * el oficial del SDK y el que todo el mundo escribe de memoria.
 */
export function claveDe(env = process.env) {
  return env.GOOGLE_GENAI_API_KEY || env.GEMINI_API_KEY || '';
}

/** Nombre del color, para que el prompt no lleve un hex crudo. */
function nombreDeColor(hex) {
  const h = String(hex || '').replace('#', '');
  if (h.length < 6) return 'deep';
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16),
        b = parseInt(h.slice(4, 6), 16);
  if (b > r && b > g) return 'navy blue';
  if (g > r && g > b) return 'forest green';
  if (r > g && r > b) return 'deep red';
  return 'charcoal';
}

/**
 * Arma el prompt DESDE LA FICHA, no a mano.
 *
 * Es la tesis del sistema entero: el contexto del cliente configura el
 * producto. Escribir el prompt a mano cada vez sería volver a hacer a mano
 * lo que la fábrica ya sabe hacer.
 */
export function promptDesdeFicha(ficha = {}, tipo = 'portada', sujeto = '') {
  const t = TIPOS[tipo];
  if (!t) throw new Error('Tipo de imagen desconocido: ' + tipo);

  const marca = ficha.marca || {};
  const pagina = ficha.pagina || {};
  // El sujeto sale de lo que el cliente ya dijo de sí mismo. Si no hay
  // nada, se queda genérico — NO se inventa un tipo de obra que no hace.
  const propio = String(sujeto || '').trim()
    || String(pagina.hero?.titular || '').trim()
    || String(marca.subtitulo || '').trim()
    || 'a modern building under construction';

  return {
    texto: t.plantilla({ sujeto: propio, colorNombre: nombreDeColor(marca.primario) }),
    proporcion: t.proporcion,
    tipo,
  };
}

/** Lo que costaría una tanda, antes de gastar un peso. */
export function estimarCosto(cuantas, modeloClave = MODELO_IMAGEN) {
  const m = MODELOS_IMAGEN[modeloClave] || MODELOS_IMAGEN[MODELO_IMAGEN];
  const n = Math.max(0, Math.min(Number(cuantas) || 0, TOPE_POR_TANDA));
  return { modelo: m, cuantas: n, usd: Math.round(n * m.usd * 10000) / 10000 };
}

/**
 * Genera UNA imagen y la guarda.
 *
 * Escribe también un `.txt` al lado con el prompt exacto. Sin eso, dentro
 * de un mes nadie sabe cómo se generó esa imagen ni cómo repetirla.
 *
 * El nombre lleva `-provisional` a propósito: es la señal visible de que
 * eso no se publica, además de la regla del validador.
 */
export async function generarImagen({ ficha, tipo, carpeta, nombre,
                                      sujeto = '', modelo = MODELO_IMAGEN }) {
  const estado = await estadoImagenes();
  if (!estado.listo) throw new Error('Falta ' + estado.faltan.join(' y ') + '.');

  const { GoogleGenAI } = await import('@google/genai');
  const ai = new GoogleGenAI({ apiKey: claveDe() });

  /**
   * Los errores de la API, en español y con qué hacer.
   *
   * El mensaje crudo de un 429 es un párrafo en inglés con dos enlaces y
   * no dice lo único que importa: que la generación de imágenes necesita
   * facturación habilitada, y que el problema no es el código.
   */
  const explicar = (e) => {
    const t = String(e?.message || e);
    if (/\b429\b|quota|rate.?limit/i.test(t)) {
      return new Error('Sin cuota para generar imágenes (429).\n'
        + '    La clave es válida y la llamada llegó bien: lo que falta es\n'
        + '    FACTURACIÓN habilitada en tu cuenta de Google.\n'
        + '    → aistudio.google.com → Get API key → Set up Billing\n'
        + '    El plan gratuito no incluye generación de imágenes.');
    }
    if (/\b40[13]\b|API key|unauthenticated|permission/i.test(t)) {
      return new Error('La clave no sirve para esto (' + t.slice(0, 80) + ').\n'
        + '    Revisa GOOGLE_GENAI_API_KEY en herramientas/.env');
    }
    if (/\b400\b/.test(t)) {
      return new Error('La API rechazó la petición: ' + t.slice(0, 160) + '\n'
        + '    Suele ser un formato que cambió. Revisa lib/imagenes.js.');
    }
    return e;
  };
  const m = MODELOS_IMAGEN[modelo] || MODELOS_IMAGEN[MODELO_IMAGEN];
  const p = promptDesdeFicha(ficha, tipo, sujeto);

  // JPEG, no PNG. La documentación muestra `image/png` en su ejemplo, pero
  // la API devuelve 400: "Supported values: 'image/jpeg'". Se descubrió
  // probando con una clave real — es justamente el tipo de detalle que no
  // se puede dar por bueno leyendo los docs.
  let interaccion;
  try {
    interaccion = await ai.interactions.create({
    model: m.id,
    input: p.texto,
    response_format: { type: 'image', mime_type: 'image/jpeg',
                         aspect_ratio: p.proporcion },
    });
  } catch (e) { throw explicar(e); }

  const datos = interaccion?.output_image?.data;
  if (!datos) {
    throw new Error('El modelo no devolvió una imagen. '
      + 'Puede haber rechazado el prompt: revisa el .txt y reformúlalo.');
  }


  mkdirSync(resolve(carpeta), { recursive: true });
  const base = (nombre || tipo) + '-provisional';
  const archivo = join(resolve(carpeta), base + '.jpg');
  writeFileSync(archivo, Buffer.from(datos, 'base64'));
  writeFileSync(join(resolve(carpeta), base + '.txt'),
    ['# Imagen PROVISIONAL generada — NO SE PUBLICA.',
     '# Se reemplaza por la foto real del cliente.',
     '',
     'modelo:     ' + m.id,
     'tipo:       ' + tipo + ' (' + TIPOS[tipo].nombre + ')',
     'proporción: ' + p.proporcion,
     'fecha:      ' + new Date().toISOString().slice(0, 10),
     '',
     'prompt:',
     p.texto,
     ''].join('\n'), 'utf8');

  return { ok: true, archivo, prompt: p.texto, modelo: m.id };
}

/** ¿Esta ruta apunta a material provisional? La usa el validador. */
export function esProvisional(ruta) {
  const s = String(ruta || '').replace(/\\/g, '/');
  return /(^|\/)vista-previa\//i.test(s) || /-provisional\.(png|jpe?g|webp|svg)$/i.test(s);
}
