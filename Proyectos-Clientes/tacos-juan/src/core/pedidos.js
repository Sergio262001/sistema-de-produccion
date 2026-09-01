// ════════════════════════════════════════════════════════════
//  MOTOR DE PEDIDOS — convierte un carrito en un pedido guardable
//
//  Es `core/` y no `data/` a propósito: aquí no hay persistencia.
//  Este archivo arma el objeto, valida las transiciones de estado y
//  calcula totales. Guardarlo es trabajo de `data/pedidos.adapter.js`.
//
//  Por qué existe: sin esto el pedido vive solo en WhatsApp o en el
//  panel de la pasarela. Con esto hay historial, panel de pedidos y
//  ventas reales en el dashboard.
//
//  ⚠ El total se recalcula aquí desde los precios que trae el carrito.
//  En Starter (sin backend) eso significa que un usuario avanzado
//  podría manipular el precio desde la consola antes de enviar. Es
//  aceptable cuando el cobro se coordina por WhatsApp (una persona
//  revisa el pedido antes de despachar). Si se cobra en línea, el
//  total DEBE recalcularse contra la base de datos — eso es la
//  extensión Pro (ver 02-bases/backend-pro/).
// ════════════════════════════════════════════════════════════

// ── Estados y su flujo ──────────────────────────────────────
//  Un pedido no salta de cualquier estado a cualquier otro: el
//  panel solo ofrece los siguientes válidos. Evita el clásico
//  "entregado" en un pedido que nadie preparó.
export const ESTADOS = {
  nuevo:      { etiqueta: 'Nuevo',      color: 'azul',    siguientes: ['confirmado', 'cancelado'] },
  confirmado: { etiqueta: 'Confirmado', color: 'morado',  siguientes: ['preparando', 'cancelado'] },
  preparando: { etiqueta: 'Preparando', color: 'naranja', siguientes: ['enviado', 'cancelado'] },
  enviado:    { etiqueta: 'Enviado',    color: 'cian',    siguientes: ['entregado'] },
  entregado:  { etiqueta: 'Entregado',  color: 'verde',   siguientes: [] },
  cancelado:  { etiqueta: 'Cancelado',  color: 'rojo',    siguientes: [] },
};

export const ESTADO_INICIAL = 'nuevo';

export function siguientesEstados(estado) {
  return ESTADOS[estado]?.siguientes || [];
}

export function puedeTransicionar(de, a) {
  return siguientesEstados(de).includes(a);
}

export function esFinal(estado) {
  return siguientesEstados(estado).length === 0;
}

// ── Construcción del pedido ─────────────────────────────────
/**
 * Arma un pedido a partir del estado del carrito.
 * @param {object} cartState  lo que devuelve cart.get()
 * @param {object} cliente    { nombre, contacto, direccion?, nota? }
 * @param {object} ctx        CONTEXT del proyecto (para canal y moneda)
 */
export function crearPedido(cartState, cliente = {}, ctx = {}) {
  if (!cartState?.items?.length) {
    throw new Error('No se puede crear un pedido con el carrito vacío');
  }
  if (!cliente.nombre || !cliente.contacto) {
    throw new Error('El pedido necesita al menos nombre y contacto del cliente');
  }

  // Se congela el precio del momento de la compra. Si mañana sube,
  // el pedido viejo sigue mostrando lo que la persona pagó — un
  // historial que cambia solo no sirve para nada.
  const items = cartState.items.map(i => ({
    producto_id: i.id,
    nombre:      i.nombre,
    precio:      i.precio,
    qty:         i.qty,
    subtotal:    i.precio * i.qty,
  }));

  return {
    id:        generarId(),
    creado_en: new Date().toISOString(),
    estado:    ESTADO_INICIAL,
    canal:     ctx.apis?.pagos || 'whatsapp',
    cliente: {
      nombre:    cliente.nombre.trim(),
      contacto:  cliente.contacto.trim(),
      direccion: (cliente.direccion || '').trim(),
      nota:      (cliente.nota || '').trim(),
    },
    items,
    moneda:   cartState.config?.moneda || '$',
    subtotal: cartState.subtotal,
    envio:    cartState.envio,
    impuesto: cartState.impuesto,
    total:    cartState.total,
    pago: {
      proveedor:  ctx.apis?.pagos || 'whatsapp',
      referencia: null,   // la llena la pasarela o el webhook
      estado:     'pendiente',
    },
  };
}

// ── Utilidades de lectura (para el panel y el dashboard) ────
export function resumenPedido(pedido) {
  const unidades = pedido.items.reduce((n, i) => n + i.qty, 0);
  return `${unidades} ${unidades === 1 ? 'unidad' : 'unidades'} · ${pedido.items.length} ${pedido.items.length === 1 ? 'producto' : 'productos'}`;
}

/** Ventas reales = solo lo que llegó a su destino. Un pedido
 *  cancelado no es una venta, y uno "nuevo" todavía no lo es. */
export function esVenta(pedido) {
  return ['confirmado', 'preparando', 'enviado', 'entregado'].includes(pedido.estado);
}

export function metricas(pedidos = []) {
  const ventas = pedidos.filter(esVenta);
  const total = ventas.reduce((n, p) => n + p.total, 0);
  return {
    pedidos:        pedidos.length,
    ventas:         ventas.length,
    cancelados:     pedidos.filter(p => p.estado === 'cancelado').length,
    pendientes:     pedidos.filter(p => !esFinal(p.estado)).length,
    ingresos:       total,
    ticketPromedio: ventas.length ? Math.round(total / ventas.length) : 0,
  };
}

/** Productos más vendidos, de mayor a menor. */
export function masVendidos(pedidos = [], limite = 5) {
  const acc = new Map();
  pedidos.filter(esVenta).forEach(p => {
    p.items.forEach(i => {
      const prev = acc.get(i.producto_id) || { nombre: i.nombre, unidades: 0, ingresos: 0 };
      prev.unidades += i.qty;
      prev.ingresos += i.subtotal;
      acc.set(i.producto_id, prev);
    });
  });
  return [...acc.entries()]
    .map(([id, v]) => ({ producto_id: id, ...v }))
    .sort((a, b) => b.unidades - a.unidades)
    .slice(0, limite);
}

// ── Texto para WhatsApp (ahora con número de pedido) ────────
export function pedidoTexto(pedido, ctx = {}) {
  const lineas = pedido.items
    .map(i => `• ${i.qty}× ${i.nombre} — ${money(i.subtotal, pedido.moneda)}`)
    .join('\n');
  const extras = [];
  if (pedido.envio)          extras.push(`Envío: ${money(pedido.envio, pedido.moneda)}`);
  if (pedido.cliente.direccion) extras.push(`Dirección: ${pedido.cliente.direccion}`);
  if (pedido.cliente.nota)      extras.push(`Nota: ${pedido.cliente.nota}`);

  return [
    `Hola ${ctx.cliente || ''}, quiero hacer un pedido 🙌`.trim(),
    `Pedido #${pedido.id}`,
    '',
    lineas,
    '',
    ...extras,
    `Total: ${money(pedido.total, pedido.moneda)}`,
    '',
    `A nombre de: ${pedido.cliente.nombre} (${pedido.cliente.contacto})`,
  ].join('\n');
}

// ── Internas ────────────────────────────────────────────────
/** Id corto y legible para que el cliente lo pueda dictar por
 *  teléfono: PED-7K3F9. No es un uuid — la base pone el suyo. */
function generarId() {
  const abc = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // sin I, L, O, 0, 1
  let s = '';
  for (let i = 0; i < 5; i++) s += abc[Math.floor(Math.random() * abc.length)];
  return `PED-${s}`;
}

function money(n, moneda = '$') {
  return moneda + (n || 0).toLocaleString('es-CO');
}
