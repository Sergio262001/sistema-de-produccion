// ════════════════════════════════════════════════════════════
//  Adaptador SUPABASE de pedidos
//  Requiere: SUPABASE_URL y SUPABASE_ANON_KEY en el .env
//  Tablas: pedidos + pedidos_items (ver supabase.schema.sql)
//
//  GUARDA CON RPC, NO CON INSERT. La función `crear_pedido` del
//  esquema inserta el pedido, sus ítems y descuenta el stock en UNA
//  transacción. Si dos personas compran el último producto al mismo
//  tiempo, una de las dos recibe un error claro en vez de que ambas
//  crean que compraron. Eso NO se puede lograr con insert + update
//  desde el navegador, por más rápido que se hagan.
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.SUPABASE_URL;
const key = import.meta.env?.SUPABASE_ANON_KEY;
const client = (url && key) ? createClient(url, key) : null;

/** Normaliza una fila de la base al mismo objeto que usa core/pedidos.js */
function aPedido(fila) {
  return {
    id:        fila.codigo,
    uuid:      fila.id,
    creado_en: fila.creado_en,
    estado:    fila.estado,
    canal:     fila.canal,
    cliente: {
      nombre:    fila.cliente_nombre,
      contacto:  fila.cliente_contacto,
      direccion: fila.cliente_direccion || '',
      nota:      fila.cliente_nota || '',
    },
    items: (fila.pedidos_items || []).map(i => ({
      producto_id: i.producto_id,
      nombre:      i.nombre,
      precio:      i.precio,
      qty:         i.qty,
      subtotal:    i.precio * i.qty,
    })),
    moneda:   fila.moneda || '$',
    subtotal: fila.subtotal,
    envio:    fila.envio,
    impuesto: fila.impuesto,
    total:    fila.total,
    pago: {
      proveedor:  fila.pago_proveedor,
      referencia: fila.pago_referencia,
      estado:     fila.pago_estado,
    },
  };
}

export const pedidosSupabase = {
  async guardar(pedido) {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');

    const { data, error } = await client.rpc('crear_pedido', {
      p_codigo:            pedido.id,
      p_canal:             pedido.canal,
      p_cliente_nombre:    pedido.cliente.nombre,
      p_cliente_contacto:  pedido.cliente.contacto,
      p_cliente_direccion: pedido.cliente.direccion || null,
      p_cliente_nota:      pedido.cliente.nota || null,
      p_moneda:            pedido.moneda,
      p_subtotal:          pedido.subtotal,
      p_envio:             pedido.envio,
      p_impuesto:          pedido.impuesto,
      p_total:             pedido.total,
      p_pago_proveedor:    pedido.pago.proveedor,
      p_items:             pedido.items.map(i => ({
        producto_id: i.producto_id, nombre: i.nombre, precio: i.precio, qty: i.qty,
      })),
    });

    if (error) {
      // La función lanza un error legible cuando no alcanza el stock.
      // Mostrárselo tal cual al comprador es mejor que un "algo salió mal".
      throw new Error(error.message || 'No se pudo registrar el pedido');
    }
    return { ok: true, motor: 'supabase', id: pedido.id, uuid: data };
  },

  async listar({ estado = null, limite = 200 } = {}) {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
    let q = client
      .from('pedidos')
      .select('*, pedidos_items(*)')
      .order('creado_en', { ascending: false })
      .limit(limite);
    if (estado) q = q.eq('estado', estado);

    const { data, error } = await q;
    if (error) throw error;
    return { pedidos: (data || []).map(aPedido) };
  },

  async cambiarEstado(codigo, estado) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const { error } = await client
      .from('pedidos')
      .update({ estado, actualizado_en: new Date().toISOString() })
      .eq('codigo', codigo);
    if (error) throw error;
    return { ok: true, motor: 'supabase' };
  },
};
