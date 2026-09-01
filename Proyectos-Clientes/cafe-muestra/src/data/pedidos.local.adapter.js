// ════════════════════════════════════════════════════════════
//  Adaptador LOCAL de pedidos (localStorage)
//  Para demos y para aprobar el flujo con el cliente antes de
//  conectar Supabase.
//
//  ⚠ NO es entregable final: los pedidos viven solo en ESE
//  navegador. Si el dueño abre el panel desde su celular, no ve
//  nada. Dilo al mostrar la demo — es la confusión típica.
// ════════════════════════════════════════════════════════════

const CLAVE = 'pedidos';

function leer() {
  try { return JSON.parse(localStorage.getItem(CLAVE)) || []; }
  catch { return []; }
}

function escribir(pedidos) {
  localStorage.setItem(CLAVE, JSON.stringify(pedidos));
}

export const pedidosLocal = {
  async guardar(pedido) {
    const pedidos = leer();
    pedidos.unshift(pedido);
    escribir(pedidos);
    return { ok: true, motor: 'local', id: pedido.id };
  },

  async listar({ estado = null, limite = 200 } = {}) {
    let pedidos = leer();
    if (estado) pedidos = pedidos.filter(p => p.estado === estado);
    return { pedidos: pedidos.slice(0, limite) };
  },

  async cambiarEstado(id, estado) {
    const pedidos = leer();
    const p = pedidos.find(x => x.id === id);
    if (!p) throw new Error(`No existe el pedido ${id}`);
    p.estado = estado;
    p.actualizado_en = new Date().toISOString();
    escribir(pedidos);
    return { ok: true, motor: 'local' };
  },
};
