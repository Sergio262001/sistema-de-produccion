// ════════════════════════════════════════════════════════════
//  CAPA DE DATOS · PEDIDOS — Selector de adaptador
//  Misma idea que adapter.js (catálogo), colección distinta.
//  Todos cumplen la MISMA interfaz:
//    guardar(pedido)            -> Promise<{ ok, motor, id }>
//    listar(filtros)            -> Promise<{ pedidos: [...] }>
//    cambiarEstado(id, estado)  -> Promise<{ ok, motor }>
//  Cambiar de motor = una línea en el .env (DB_MOTOR).
// ════════════════════════════════════════════════════════════

import { pedidosLocal }    from './pedidos.local.adapter.js';
import { pedidosSupabase } from './pedidos.supabase.adapter.js';
import { pedidosFirebase } from './pedidos.firebase.adapter.js';

const ADAPTERS = {
  local:    pedidosLocal,
  supabase: pedidosSupabase,
  firebase: pedidosFirebase,
};

export function getPedidos(motor = 'local') {
  return ADAPTERS[motor] || ADAPTERS.local;
}
