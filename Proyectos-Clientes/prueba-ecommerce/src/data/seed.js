// Datos de ejemplo — en el proyecto real vienen de Supabase/Firebase.
export const SEED = {
  categorias: [
    {
      id: 'ropa', nombre: 'Ropa', desc: 'Prendas de algodón orgánico',
      productos: [
        { id: 'r1', nombre: 'Camiseta básica', desc: 'Algodón 100%, corte regular', precio: 45000, emoji: '👕', stock: 12, badge: 'top' },
        { id: 'r2', nombre: 'Pantalón jogger', desc: 'Cómodo, bolsillos laterales', precio: 89000, emoji: '👖', stock: 5 },
        { id: 'r3', nombre: 'Chaqueta liviana', desc: 'Resistente al agua', precio: 135000, emoji: '🧥', stock: 0 },
      ],
    },
    {
      id: 'accesorios', nombre: 'Accesorios', desc: 'Para completar el look',
      productos: [
        { id: 'a1', nombre: 'Gorra bordada', desc: 'Ajustable, una talla', precio: 38000, emoji: '🧢', stock: 20 },
        { id: 'a2', nombre: 'Bolso de lona', desc: 'Resistente, varios bolsillos', precio: 62000, emoji: '👜', stock: 8, badge: 'top' },
      ],
    },
  ],
};
