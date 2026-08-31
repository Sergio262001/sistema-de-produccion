// ════════════════════════════════════════════════════════════
//  Adaptador SUPABASE
//  Requiere: SUPABASE_URL y SUPABASE_ANON_KEY en el .env
//  Esquema sugerido:
//    planes(id text pk, nombre text, precio int, ciclo text,
//           beneficios jsonb, destacado boolean)
//    suscripciones(id uuid pk default gen_random_uuid(), cliente_email text,
//                   plan_id text fk, estado text default 'activa',
//                   inicio date default current_date)
//
//  IMPORTANTE: esta tabla registra QUIÉN está suscrito a QUÉ plan, no
//  cobra automáticamente cada mes. El cobro recurrente real (renovar
//  y cobrar sin que el cliente vuelva a pagar a mano) necesita la API
//  de suscripciones de un proveedor (ej. Stripe Billing o Mercado
//  Pago "preapproval") con un backend que escuche sus webhooks y
//  actualice el "estado" aquí cuando un pago falla o se cancela. Sin
//  ese backend, esta base solo lleva el registro — no automatiza el
//  cobro mes a mes.
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.SUPABASE_URL;
const key = import.meta.env?.SUPABASE_ANON_KEY;
const client = (url && key) ? createClient(url, key) : null;

export const supabaseAdapter = {
  async load() {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
    const [{ data: planes }, { data: suscripciones }] = await Promise.all([
      client.from('planes').select('*'),
      client.from('suscripciones').select('*'),
    ]);
    return { planes: planes || [], suscripciones: suscripciones || [] };
  },

  async suscribir(clienteEmail, planId) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const { data, error } = await client.from('suscripciones')
      .insert({ cliente_email: clienteEmail, plan_id: planId, estado: 'activa' })
      .select().single();
    if (error) throw error;
    return { ok: true, motor: 'supabase', id: data.id };
  },

  async cancelar(suscripcionId) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const { error } = await client.from('suscripciones').update({ estado: 'cancelada' }).eq('id', suscripcionId);
    if (error) throw error;
    return { ok: true, motor: 'supabase' };
  },
};
