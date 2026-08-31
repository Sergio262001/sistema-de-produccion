// ════════════════════════════════════════════════════════════
//  Adaptador SUPABASE
//  Requiere: SUPABASE_URL y SUPABASE_ANON_KEY en el .env
//  Esquema sugerido (SQL):
//    leads(id uuid pk default gen_random_uuid(), nombre text,
//          contacto text, mensaje text, creado_en timestamptz default now())
//  Activa RLS: inserción pública, lectura solo rol "admin".
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.SUPABASE_URL;
const key = import.meta.env?.SUPABASE_ANON_KEY;

const client = (url && key) ? createClient(url, key) : null;

export const supabaseAdapter = {
  async load() {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
    const { data: leads } = await client
      .from('leads').select('*').order('creado_en', { ascending: false });
    return { leads };
  },

  async save(lead) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const { error } = await client.from('leads').insert({
      nombre: lead.nombre, contacto: lead.contacto, mensaje: lead.mensaje,
    });
    if (error) throw error;
    return { ok: true, motor: 'supabase' };
  },
};
