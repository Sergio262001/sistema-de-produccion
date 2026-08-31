// ════════════════════════════════════════════════════════════
//  MOTOR DE CARRITO — estado en memoria, reactivo por suscripción
//  No depende de UI ni de motor de base de datos: cualquier base
//  (menú, ecommerce, marketplace) puede importarlo y dibujarlo distinto.
// ════════════════════════════════════════════════════════════

export function createCart(opts = {}) {
  const config = {
    moneda:     opts.moneda     || '$',
    envio:      opts.envio      || 0,
    impuesto:   opts.impuesto   || 0,
    maxPorItem: opts.maxPorItem || 99,
  };
  let items = [];
  const listeners = new Set();

  function compute() {
    const count = items.reduce((n, i) => n + i.qty, 0);
    const subtotal = items.reduce((n, i) => n + i.precio * i.qty, 0);
    const impuesto = Math.round(subtotal * (config.impuesto / 100));
    const envio = items.length ? config.envio : 0;
    return { items: [...items], count, subtotal, impuesto, envio, total: subtotal + impuesto + envio, config };
  }

  function emit() {
    const s = compute();
    listeners.forEach(fn => fn(s));
  }

  function add(p, qty = 1) {
    const e = items.find(i => i.id === p.id);
    if (e) e.qty = Math.min(e.qty + qty, config.maxPorItem);
    else items.push({ ...p, qty: Math.min(qty, config.maxPorItem) });
    emit();
  }

  function setQty(id, qty) {
    const it = items.find(i => i.id === id);
    if (!it) return;
    it.qty = Math.max(0, Math.min(qty, config.maxPorItem));
    if (it.qty === 0) remove(id);
    else emit();
  }

  function increment(id) { const it = items.find(i => i.id === id); if (it) setQty(id, it.qty + 1); }
  function decrement(id) { const it = items.find(i => i.id === id); if (it) setQty(id, it.qty - 1); }
  function remove(id) { items = items.filter(i => i.id !== id); emit(); }
  function clear() { items = []; emit(); }
  function subscribe(fn) { listeners.add(fn); fn(compute()); return () => listeners.delete(fn); }

  return { add, remove, setQty, increment, decrement, clear, subscribe, get: compute };
}

export function money(n, moneda = '$') {
  return moneda + (n || 0).toLocaleString('es-CO');
}
