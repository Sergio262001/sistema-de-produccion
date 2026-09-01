// ════════════════════════════════════════════════════════════
//  Adaptador SUPABASE
//  Requiere: SUPABASE_URL y SUPABASE_ANON_KEY en el .env
//  Esquema sugerido (SQL):
//    categorias(id text pk, nombre text, descripcion text, orden int)
//    items(id text pk, categoria_id text fk, nombre text,
//          descripcion text, precio int, emoji text,
//          disponible bool, badge text, orden int)
//  Activa RLS: lectura pública, escritura solo rol "admin".
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.SUPABASE_URL;
const key = import.meta.env?.SUPABASE_ANON_KEY;

// Si faltan claves, no rompemos: avisamos y dejamos que el
// selector caiga al adaptador local.
const client = (url && key) ? createClient(url, key) : null;

export const supabaseAdapter = {
  async load() {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
    const { data: cats } = await client
      .from('categorias').select('*').order('orden');
    const { data: items } = await client
      .from('items').select('*').order('orden');

    // Agrupa items dentro de su categoría (presentación ≠ datos)
    return {
      categorias: cats.map(c => ({
        id: c.id, nombre: c.nombre, desc: c.descripcion,
        items: items
          .filter(i => i.categoria_id === c.id)
          .map(i => ({
            id: i.id, nombre: i.nombre, desc: i.descripcion,
            precio: i.precio, emoji: i.emoji,
            disp: i.disponible, badge: i.badge,
          })),
      })),
    };
  },

  async save(data) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    // upsert por simplicidad; en producción separa create/update/delete
    const items = data.categorias.flatMap((c, ci) =>
      c.items.map((i, ii) => ({
        id: i.id, categoria_id: c.id, nombre: i.nombre,
        descripcion: i.desc, precio: i.precio, emoji: i.emoji,
        disponible: i.disp, badge: i.badge, orden: ii,
      }))
    );
    const { error } = await client.from('items').upsert(items);
    if (error) throw error;
    return { ok: true, motor: 'supabase' };
  },
};
