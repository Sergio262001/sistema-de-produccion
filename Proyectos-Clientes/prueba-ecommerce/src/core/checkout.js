// ════════════════════════════════════════════════════════════
//  CHECKOUT — decide a dónde va el pedido según ctx.apis.pagos
//  whatsapp     -> arma el resumen y redirige a wa.me (sin pasarela)
//  wompi        -> abre el Widget oficial de Wompi (wompi.adapter.js),
//                  funciona en sandbox solo con la public key; producción
//                  necesita la firma de integridad de tu backend (ver ese archivo)
//  mercadopago | stripe -> requieren crear una preferencia/sesión desde tu
//                  backend (no se puede hacer de forma segura solo en el
//                  frontend); este checkout entrega los datos listos para
//                  que tu backend la cree con las claves del .env
// ════════════════════════════════════════════════════════════

import { abrirWompi } from './wompi.adapter.js';

export function resumenTexto(state, ctx) {
  const lineas = state.items
    .map(i => `• ${i.qty}× ${i.nombre} — ${money(i.precio * i.qty, state.config.moneda)}`)
    .join('\n');
  return [`Hola ${ctx.cliente}, quiero hacer un pedido 🙌`, '', lineas, '', `Total: ${money(state.total, state.config.moneda)}`].join('\n');
}

export function checkout(state, ctx) {
  const metodo = ctx.apis?.pagos || 'whatsapp';

  if (metodo === 'whatsapp') {
    const num = ctx.apis?.whatsapp_num || '';
    return { tipo: 'redirect', url: `https://wa.me/${num}?text=${encodeURIComponent(resumenTexto(state, ctx))}` };
  }

  if (metodo === 'wompi') {
    // El llamador (UI) usa esto para invocar abrirWompi(state, ctx, opts, onResult).
    // opts.publicKey sale de WOMPI_PUBLIC_KEY en el .env del proyecto.
    return { tipo: 'widget', proveedor: 'wompi', abrir: abrirWompi };
  }

  // mercadopago | stripe: la creación de la preferencia/sesión vive en tu
  // backend (no es seguro hacerlo solo en el frontend con la clave privada).
  return { tipo: 'pago', proveedor: metodo, monto: state.total, nota: 'Crear preferencia/sesión en tu backend con las claves del .env, luego redirigir al cliente a la URL que devuelva el proveedor.' };
}

function money(n, moneda = '$') {
  return moneda + (n || 0).toLocaleString('es-CO');
}
