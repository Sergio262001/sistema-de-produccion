// Adaptador LOCAL — sin backend. Útil para desarrollo y demos.
let data = {
  clientes: [
    { id: 'c1', nombre: 'Laura Gómez', contacto: '573001112222', estado: 'cliente',
      interacciones: [
        { fecha: '2026-05-02', nota: 'Compró 2 camisetas, le gustó la calidad.' },
        { fecha: '2026-06-10', nota: 'Preguntó por la nueva colección.' },
      ] },
    { id: 'c2', nombre: 'Andrés Pardo', contacto: '573003334444', estado: 'lead',
      interacciones: [
        { fecha: '2026-06-15', nota: 'Pidió catálogo por WhatsApp, no ha confirmado pedido.' },
      ] },
    { id: 'c3', nombre: 'Marcela Ríos', contacto: '573005556666', estado: 'inactivo',
      interacciones: [
        { fecha: '2025-11-20', nota: 'Última compra hace más de 6 meses.' },
      ] },
  ],
};

export const localAdapter = {
  async load() { return data; },
  async agregarNota(clienteId, nota) {
    const c = data.clientes.find(c => c.id === clienteId);
    if (c) c.interacciones.unshift({ fecha: new Date().toISOString().slice(0, 10), nota });
    return { ok: true, motor: 'local' };
  },
  async actualizarEstado(clienteId, estado) {
    const c = data.clientes.find(c => c.id === clienteId);
    if (c) c.estado = estado;
    return { ok: true, motor: 'local' };
  },
};
