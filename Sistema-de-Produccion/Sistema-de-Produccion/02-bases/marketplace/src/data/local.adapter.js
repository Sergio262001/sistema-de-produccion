// Adaptador LOCAL — sin backend. Datos de ejemplo en memoria.
let data = {
  vendedores: [
    { id: 'v1', nombre: 'Taller Norte', contacto: '573001112222' },
    { id: 'v2', nombre: 'Estudio Sur', contacto: '573003334444' },
  ],
  productos: [
    { id: 'p1', vendedorId: 'v1', nombre: 'Maceta de barro', desc: 'Hecha a mano, 20cm', precio: 35000, emoji: '🪴', stock: 10 },
    { id: 'p2', vendedorId: 'v1', nombre: 'Cojín tejido', desc: 'Algodón, 40x40', precio: 58000, emoji: '🛋️', stock: 6 },
    { id: 'p3', vendedorId: 'v2', nombre: 'Lámpara de mesa', desc: 'Madera y lino', precio: 92000, emoji: '💡', stock: 4 },
    { id: 'p4', vendedorId: 'v2', nombre: 'Cuadro decorativo', desc: 'Impresión en lienzo', precio: 75000, emoji: '🖼️', stock: 0 },
  ],
};

export const localAdapter = {
  async load() { return data; },
  async save(next) { data = next; return { ok: true, motor: 'local' }; },
};
