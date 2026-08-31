// ════════════════════════════════════════════════════════════
//  Adaptador SUPABASE
//  Requiere: SUPABASE_URL y SUPABASE_ANON_KEY en el .env
//  Esquema sugerido (SQL, ver supabase.schema.sql):
//    categorias(id text pk, nombre text, descripcion text, orden int)
//    productos(id text pk, categoria_id text fk, nombre text,
//              descripcion text, precio int, emoji text,
//              stock int, badge text, orden int)
//  Activa RLS: lectura pública, escritura solo rol "admin".
//  El stock es la fuente de verdad de disponibilidad — no hay un
//  campo "disponible" aparte, se deriva de stock > 0.
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.SUPABASE_URL;
const key = import.meta.env?.SUPABASE_ANON_KEY;

const client = (url && key) ? createClient(url, key) : null;

export const supabaseAdapter = {
  async load() {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
    const { data: cats } = await client
      .from('categorias').select('*').order('orden');
    const { data: productos } = await client
      .from('productos').select('*').order('orden');

    return {
      categorias: cats.map(c => ({
        id: c.id, nombre: c.nombre, desc: c.descripcion,
        productos: productos
          .filter(p => p.categoria_id === c.id)
          .map(p => ({
            id: p.id, nombre: p.nombre, desc: p.descripcion,
            precio: p.precio, emoji: p.emoji, stock: p.stock, badge: p.badge,
          })),
      })),
    };
  },

  async save(data) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const productos = data.categorias.flatMap((c, ci) =>
      c.productos.map((p, pi) => ({
        id: p.id, categoria_id: c.id, nombre: p.nombre,
        descripcion: p.desc, precio: p.precio, emoji: p.emoji,
        stock: p.stock, badge: p.badge, orden: pi,
      }))
    );
    const { error } = await client.from('productos').upsert(productos);
    if (error) throw error;
    return { ok: true, motor: 'supabase' };
  },
};
