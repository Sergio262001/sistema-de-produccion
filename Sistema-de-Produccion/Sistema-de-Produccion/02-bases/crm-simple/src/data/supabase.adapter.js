// ════════════════════════════════════════════════════════════
//  Adaptador SUPABASE
//  Requiere: SUPABASE_URL y SUPABASE_ANON_KEY en el .env
//  Esquema sugerido:
//    clientes(id text pk, nombre text, contacto text, estado text)
//    interacciones(id uuid pk default gen_random_uuid(), cliente_id text fk,
//                  fecha date default current_date, nota text)
//  Activa RLS: lectura/escritura solo rol "admin" (datos de clientes
//  son sensibles — no son públicos como un menú).
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.SUPABASE_URL;
const key = import.meta.env?.SUPABASE_ANON_KEY;
const client = (url && key) ? createClient(url, key) : null;

export const supabaseAdapter = {
  async load() {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
    const [{ data: clientes }, { data: interacciones }] = await Promise.all([
      client.from('clientes').select('*'),
      client.from('interacciones').select('*').order('fecha', { ascending: false }),
    ]);
    return {
      clientes: (clientes || []).map(c => ({
        ...c,
        interacciones: (interacciones || []).filter(i => i.cliente_id === c.id),
      })),
    };
  },

  async agregarNota(clienteId, nota) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const { error } = await client.from('interacciones').insert({ cliente_id: clienteId, nota });
    if (error) throw error;
    return { ok: true, motor: 'supabase' };
  },

  async actualizarEstado(clienteId, estado) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const { error } = await client.from('clientes').update({ estado }).eq('id', clienteId);
    if (error) throw error;
    return { ok: true, motor: 'supabase' };
  },
};
