// ════════════════════════════════════════════════════════════
//  LA CLAVE DEL PANEL.
//
//  Las bases traen un usuario de demostración con la contraseña `admin123`
//  escrita en el código Y impresa en la pantalla de login. Para una demo de
//  la fábrica está bien: es una demo, no protege nada de nadie.
//
//  Lo que NO puede pasar es que esa misma contraseña viaje a todos los
//  entregables. Significaría que cada proyecto que vende el estudio sale con
//  la misma clave, publicada en su propia pantalla de entrada. Un cliente
//  que abra la página de otro cliente entra a su panel.
//
//  Aquí vive lo mínimo compartido: la lista de las claves de demo (para que
//  el validador pueda cazarlas) y el generador de una clave por proyecto.
//
//  ⚠ ESTO NO ES AUTENTICACIÓN. Una clave en JavaScript de navegador la lee
//  cualquiera con F12, por aleatoria que sea. Es una PUERTA, no una
//  cerradura: sirve para que el panel no esté abierto de par en par
//  mientras se revisa el proyecto. Lo que de verdad protege los datos es
//  Supabase Auth + RLS, y por eso el README de cada proyecto generado
//  explica cómo encenderlo. Ver `07-operacion-equipo/guia-de-seguridad.md`.
// ════════════════════════════════════════════════════════════

import { randomInt } from 'node:crypto';

/** Las contraseñas de demostración que traen las bases. Ninguna puede
 *  aparecer fuera de `02-bases/`: ahí es donde son legítimas. */
export const CLAVES_DEMO = ['admin123', 'demo123', '123456', 'password'];

/** Palabras cortas, sin tildes ni ñ, fáciles de dictar por teléfono y de
 *  teclear en un móvil. Sin palabras que se confundan al oído. */
const PALABRAS = [
  'ancla', 'bosque', 'cable', 'duna', 'espiga', 'fresa', 'grieta', 'hilo',
  'isla', 'jarra', 'ladrillo', 'muelle', 'nido', 'olivo', 'puerto', 'quilla',
  'remo', 'sierra', 'torre', 'urna', 'valle', 'yunque', 'zarza', 'ambar',
  'brisa', 'cedro', 'dique', 'estufa', 'faro', 'gaviota', 'horno', 'imprenta',
];

/**
 * Una frase de acceso por proyecto: tres palabras y dos dígitos.
 *
 * Se eligió frase y no cadena aleatoria porque quien la usa es el dueño del
 * negocio, y la va a recibir por WhatsApp y a teclearla en un teléfono.
 * `torre-espiga-muelle-47` se dicta; `xK9#mQ2vLp` se copia mal y termina
 * escrita en un papel pegado al monitor.
 *
 * Entropía: 32³ palabras × 100 = ~3,3 millones de combinaciones. Suficiente
 * para una puerta, insuficiente para una cerradura — y no pretende ser una.
 */
export function generarClave() {
  const p = () => PALABRAS[randomInt(PALABRAS.length)];
  let a = p(), b = p(), c = p();
  // Tres palabras distintas: "torre-torre-torre-12" parece un error.
  while (b === a) b = p();
  while (c === a || c === b) c = p();
  return `${a}-${b}-${c}-${String(randomInt(10, 100))}`;
}

/** ¿Este texto es una de las claves de demostración de las bases? */
export function esClaveDemo(valor) {
  return CLAVES_DEMO.includes(String(valor ?? '').trim().toLowerCase());
}
