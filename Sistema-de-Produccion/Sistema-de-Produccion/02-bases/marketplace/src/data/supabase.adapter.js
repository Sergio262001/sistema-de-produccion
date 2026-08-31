// ════════════════════════════════════════════════════════════
//  Adaptador SUPABASE
//  Requiere: SUPABASE_URL y SUPABASE_ANON_KEY en el .env
//  Esquema sugerido:
//    vendedores(id text pk, nombre text, contacto text)
//    productos(id text pk, vendedor_id text fk, nombre text,
//              descripcion text, precio int, emoji text, stock int)
//  RLS: lectura pública del catálogo; escritura de productos solo
//  para el vendedor dueño o el admin (revisar política por rol).
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.SUPABASE_URL;
const key = import.meta.env?.SUPABASE_ANON_KEY;
const client = (url && key) ? createClient(url, key) : null;

export const supabaseAdapter = {
  async load() {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
    const [{ data: vendedores }, { data: productos }] = await Promise.all([
      client.from('vendedores').select('*'),
      client.from('productos').select('*'),
    ]);
    return {
      vendedores: vendedores || [],
      productos: (productos || []).map(p => ({
        id: p.id, vendedorId: p.vendedor_id, nombre: p.nombre,
        desc: p.descripcion, precio: p.precio, emoji: p.emoji, stock: p.stock,
      })),
    };
  },

  async save(data) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const productos = data.productos.map(p => ({
      id: p.id, vendedor_id: p.vendedorId, nombre: p.nombre,
      descripcion: p.desc, precio: p.precio, emoji: p.emoji, stock: p.stock,
    }));
    const { error } = await client.from('productos').upsert(productos);
    if (error) throw error;
    return { ok: true, motor: 'supabase' };
  },
};
