// ════════════════════════════════════════════════════════════
//  CONECTOR WOMPI — Widget de Checkout oficial (sin backend para
//  el flujo básico de prueba). Requiere: WOMPI_PUBLIC_KEY en el .env.
//
//  Para producción, Wompi exige una firma de integridad
//  (signature.integrity) calculada en tu backend con la
//  "llave de integridad" del comercio — esa llave NUNCA va en el
//  frontend. Sin ella, el widget funciona en sandbox/pruebas pero
//  Wompi puede rechazar el pago en producción.
//
//  Backend (ejemplo en Node, adáptalo a tu stack):
//    const crypto = require('crypto');
//    function firmarIntegridad(referencia, montoEnCentavos, moneda, secreto) {
//      const cadena = `${referencia}${montoEnCentavos}${moneda}${secreto}`;
//      return crypto.createHash('sha256').update(cadena).digest('hex');
//    }
//  Expón eso como un endpoint (ej. POST /api/wompi-firma) que el
//  frontend llama antes de abrir el widget, y nunca expongas el
//  secreto de integridad en el cliente.
// ════════════════════════════════════════════════════════════

const WIDGET_SRC = 'https://checkout.wompi.co/widget.js';
let widgetReady = null;

function cargarWidget() {
  if (window.WidgetCheckout) return Promise.resolve();
  if (widgetReady) return widgetReady;
  widgetReady = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = WIDGET_SRC;
    script.onload = resolve;
    script.onerror = () => reject(new Error('No se pudo cargar el widget de Wompi'));
    document.head.appendChild(script);
  });
  return widgetReady;
}

/**
 * Abre el widget de pago de Wompi.
 * @param {object} state    - estado del carrito (cart.get())
 * @param {object} ctx      - contexto del proyecto (CONTEXT)
 * @param {object} opts
 * @param {string} opts.publicKey       - WOMPI_PUBLIC_KEY (.env)
 * @param {string} [opts.integritySignature] - firma calculada en tu backend (producción)
 * @param {string} [opts.redirectUrl]   - a dónde vuelve el cliente tras pagar
 * @param {(result:{transaction:object})=>void} onResult - callback con el resultado
 */
export async function abrirWompi(state, ctx, opts, onResult) {
  await cargarWidget();
  const referencia = `${ctx.cliente || 'pedido'}-${Date.now()}`;
  const amountInCents = Math.round(state.total * 100);

  const config = {
    currency: 'COP',
    amountInCents,
    reference: referencia,
    publicKey: opts.publicKey,
    redirectUrl: opts.redirectUrl || window.location.href,
  };
  if (opts.integritySignature) {
    config.signature = { integrity: opts.integritySignature };
  }

  const checkout = new window.WidgetCheckout(config);
  checkout.open((result) => onResult(result));
}
