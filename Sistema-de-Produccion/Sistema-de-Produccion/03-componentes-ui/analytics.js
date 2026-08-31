// ════════════════════════════════════════════════════════════
//  CONECTOR GA4 — carga gtag.js y expone helpers de eventos.
//  Requiere: un Measurement ID real (formato "G-XXXXXXX"), que
//  sale de GA4_ID en el .env del proyecto. Sin esto no hace nada
//  (no falla, pero tampoco mide) — pide el ID antes de "dar por
//  conectada" la analítica en un entregable.
//
//  Copia este archivo a src/ de tu base y llama a initGA4() una
//  sola vez, al iniciar la página (ver ejemplo de uso abajo).
// ════════════════════════════════════════════════════════════

let inicializado = false;

/**
 * Inyecta gtag.js y arranca la medición. Llama una sola vez.
 * @param {string} measurementId - ej. "G-ABC1234567" (GA4_ID del .env)
 */
export function initGA4(measurementId) {
  if (!measurementId || inicializado) return;
  inicializado = true;

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', measurementId);
}

/** Evento genérico. ej. trackEvent('agregar_carrito', { item: 'Latte' }) */
export function trackEvent(nombre, params = {}) {
  if (!window.gtag) return;
  window.gtag('event', nombre, params);
}

/** Lead capturado (formulario de landing, solicitud de cita, etc.) */
export function trackLead(params = {}) {
  trackEvent('generate_lead', params);
}

/** Compra/pedido completado (carrito, checkout) */
export function trackPurchase({ value, currency = 'COP', items = [] }) {
  trackEvent('purchase', {
    value,
    currency,
    items: items.map(i => ({ item_name: i.nombre, price: i.precio, quantity: i.qty })),
  });
}
