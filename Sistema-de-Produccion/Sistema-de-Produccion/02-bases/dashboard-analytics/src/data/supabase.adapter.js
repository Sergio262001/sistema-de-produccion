// ════════════════════════════════════════════════════════════
//  Adaptador SUPABASE — lee las tablas que las OTRAS bases ya
//  generan, no inventa una tabla de "ventas" que no existe.
//  Requiere: SUPABASE_URL y SUPABASE_ANON_KEY en el .env
//
//  Tablas que reutiliza:
//    leads(id, fecha/creado_en, fuente)        ← de landing-modular
//    productos(id, categoria_id, nombre,
//              precio, stock)                  ← de ecommerce-completo
//    pedidos(id, creado_en, estado, total)     ← de ecommerce-completo /
//    pedidos_items(pedido_id, nombre, qty)        carrito-reutilizable
//
//  Si el proyecto no usa una de esas bases, esa sección del
//  dashboard simplemente queda vacía (no rompe, no inventa datos).
//
//  VENTAS: ya se pueden mostrar, porque los pedidos se guardan.
//  Cuenta como venta lo confirmado/preparando/enviado/entregado —
//  un pedido "nuevo" todavía no lo es y uno cancelado nunca lo fue.
//  Si el proyecto no corrió el esquema de pedidos, esa sección
//  queda vacía en vez de romper.
//
//  Métricas reales de visitas/sesiones (no leads ni stock) viven
//  en GA4, no en tu base de datos — para traerlas aquí se necesita
//  la GA4 Data API desde un backend con una cuenta de servicio.
//  Sin eso, este dashboard NO muestra tráfico — solo los datos que
//  ya viven en tu propia base de datos. No lo presentes como
//  "analítica completa" si esa pieza no está conectada.
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.SUPABASE_URL;
const key = import.meta.env?.SUPABASE_ANON_KEY;
const client = (url && key) ? createClient(url, key) : null;

export const supabaseAdapter = {
  async load() {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');

    const [leadsRes, productosRes, pedidosRes] = await Promise.all([
      client.from('leads').select('id, creado_en').order('creado_en', { ascending: false }).limit(500),
      client.from('productos').select('id, categoria_id, nombre, precio, stock'),
      client.from('pedidos')
        .select('id, creado_en, estado, total, pedidos_items(nombre, qty, precio)')
        .order('creado_en', { ascending: false })
        .limit(500),
    ]);

    return {
      leads: (leadsRes.data || []).map(l => ({ id: l.id, fecha: (l.creado_en || '').slice(0, 10) })),
      productos: (productosRes.data || []).map(p => ({
        id: p.id, categoria: p.categoria_id, nombre: p.nombre, precio: p.precio, stock: p.stock,
      })),
      pedidos: (pedidosRes.data || []).map(p => ({
        id: p.id,
        fecha: (p.creado_en || '').slice(0, 10),
        estado: p.estado,
        total: p.total,
        items: (p.pedidos_items || []).map(i => ({ nombre: i.nombre, qty: i.qty, precio: i.precio })),
      })),
    };
  },
};

// ── Métricas de venta (mismas reglas que core/pedidos.js) ────
export const ESTADOS_VENTA = ['confirmado', 'preparando', 'enviado', 'entregado'];

export function metricasVenta(pedidos = []) {
  const ventas = pedidos.filter(p => ESTADOS_VENTA.includes(p.estado));
  const ingresos = ventas.reduce((n, p) => n + (p.total || 0), 0);
  return {
    ingresos,
    ventas:         ventas.length,
    cancelados:     pedidos.filter(p => p.estado === 'cancelado').length,
    porAtender:     pedidos.filter(p => p.estado === 'nuevo').length,
    ticketPromedio: ventas.length ? Math.round(ingresos / ventas.length) : 0,
  };
}
