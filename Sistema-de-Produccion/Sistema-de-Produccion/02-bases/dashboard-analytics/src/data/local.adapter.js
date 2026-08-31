// Adaptador LOCAL — datos de ejemplo en memoria, para desarrollo y demos.
const hoy = new Date();
const dias = (n) => new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() - n).toISOString().slice(0, 10);

const SEED = {
  leads: [
    { id: 'l1', fecha: dias(0), fuente: 'landing' },
    { id: 'l2', fecha: dias(0), fuente: 'whatsapp' },
    { id: 'l3', fecha: dias(1), fuente: 'landing' },
    { id: 'l4', fecha: dias(2), fuente: 'landing' },
    { id: 'l5', fecha: dias(3), fuente: 'whatsapp' },
    { id: 'l6', fecha: dias(5), fuente: 'landing' },
    { id: 'l7', fecha: dias(6), fuente: 'landing' },
  ],
  productos: [
    { id: 'r1', categoria: 'Ropa', nombre: 'Camiseta básica', precio: 45000, stock: 12 },
    { id: 'r2', categoria: 'Ropa', nombre: 'Pantalón jogger', precio: 89000, stock: 5 },
    { id: 'r3', categoria: 'Ropa', nombre: 'Chaqueta liviana', precio: 135000, stock: 0 },
    { id: 'a1', categoria: 'Accesorios', nombre: 'Gorra bordada', precio: 38000, stock: 20 },
    { id: 'a2', categoria: 'Accesorios', nombre: 'Bolso de lona', precio: 62000, stock: 8 },
  ],
  // Pedidos reales de la tabla `pedidos` (ecommerce-completo /
  // carrito-reutilizable). Antes esta sección no existía y por eso
  // el dashboard no podía mostrar ventas.
  pedidos: [
    { id: 'PED-7K3F9', fecha: dias(0), estado: 'entregado',  total: 128000,
      items: [{ nombre: 'Camiseta básica', qty: 2, precio: 45000 }, { nombre: 'Gorra bordada', qty: 1, precio: 38000 }] },
    { id: 'PED-M2X4B', fecha: dias(0), estado: 'preparando', total: 89000,
      items: [{ nombre: 'Pantalón jogger', qty: 1, precio: 89000 }] },
    { id: 'PED-Q8H5T', fecha: dias(1), estado: 'enviado',    total: 107000,
      items: [{ nombre: 'Bolso de lona', qty: 1, precio: 62000 }, { nombre: 'Camiseta básica', qty: 1, precio: 45000 }] },
    { id: 'PED-R4N7C', fecha: dias(2), estado: 'nuevo',      total: 45000,
      items: [{ nombre: 'Camiseta básica', qty: 1, precio: 45000 }] },
    { id: 'PED-Z9V3K', fecha: dias(3), estado: 'cancelado',  total: 135000,
      items: [{ nombre: 'Chaqueta liviana', qty: 1, precio: 135000 }] },
    { id: 'PED-B6D2W', fecha: dias(5), estado: 'entregado',  total: 76000,
      items: [{ nombre: 'Gorra bordada', qty: 2, precio: 38000 }] },
  ],
};

export const localAdapter = {
  async load() {
    return SEED;
  },
};
