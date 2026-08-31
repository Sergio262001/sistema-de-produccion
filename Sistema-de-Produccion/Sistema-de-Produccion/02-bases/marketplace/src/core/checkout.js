// ════════════════════════════════════════════════════════════
//  CHECKOUT MULTI-VENDEDOR
//  Agrupa el carrito por vendedor y calcula cuánto se queda la
//  plataforma (comisión) y cuánto le corresponde a cada vendedor.
//  IMPORTANTE: esto calcula los montos, no los transfiere. Repartir
//  el dinero automáticamente entre vendedores (split payment) es
//  una función específica de cada pasarela (ej. Stripe Connect) y
//  requiere backend + esa pasarela en particular — Wompi no ofrece
//  split nativo. Sin eso, cobras todo a la plataforma y liquidas a
//  cada vendedor manualmente con este desglose.
// ════════════════════════════════════════════════════════════

export function money(n, moneda = '$') {
  return moneda + (n || 0).toLocaleString('es-CO');
}

/**
 * @param {object} state - cart.get()
 * @param {object[]} vendedores - lista de vendedores {id, nombre}
 * @param {number} comisionPorcentaje - % que se queda la plataforma (0-100)
 */
export function desglosePorVendedor(state, vendedores, comisionPorcentaje) {
  const porVendedor = {};
  state.items.forEach(item => {
    const vId = item.vendedorId;
    if (!porVendedor[vId]) porVendedor[vId] = { vendedorId: vId, items: [], subtotal: 0 };
    porVendedor[vId].items.push(item);
    porVendedor[vId].subtotal += item.precio * item.qty;
  });

  return Object.values(porVendedor).map(grupo => {
    const vendedor = vendedores.find(v => v.id === grupo.vendedorId);
    const comision = Math.round(grupo.subtotal * (comisionPorcentaje / 100));
    return {
      vendedor: vendedor || { id: grupo.vendedorId, nombre: 'Vendedor desconocido' },
      items: grupo.items,
      subtotal: grupo.subtotal,
      comisionPlataforma: comision,
      netoVendedor: grupo.subtotal - comision,
    };
  });
}

export function resumenTexto(state, ctx, vendedores, comisionPorcentaje) {
  const desglose = desglosePorVendedor(state, vendedores, comisionPorcentaje);
  const lineas = desglose.map(g =>
    `${g.vendedor.nombre}: ${money(g.subtotal)} (neto vendedor: ${money(g.netoVendedor)})`
  ).join('\n');
  return [`Hola, quiero hacer un pedido 🙌`, '', lineas, '', `Total: ${money(state.total)}`].join('\n');
}

export function checkout(state, ctx, vendedores, comisionPorcentaje) {
  const metodo = ctx.apis?.pagos || 'whatsapp';
  if (metodo === 'whatsapp') {
    const num = ctx.apis?.whatsapp_num || '';
    return { tipo: 'redirect', url: `https://wa.me/${num}?text=${encodeURIComponent(resumenTexto(state, ctx, vendedores, comisionPorcentaje))}` };
  }
  // Pasarela real: cobras todo a la plataforma y liquidas a cada
  // vendedor aparte con el desglose de desglosePorVendedor(). Split
  // automático real necesita una pasarela con esa función (no Wompi).
  return { tipo: 'pago', proveedor: metodo, monto: state.total, nota: 'Sin split automático — liquida a cada vendedor manualmente con el desglose.' };
}
