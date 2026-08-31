// ════════════════════════════════════════════════════════════
//  CAPA DE DATOS — Selector de adaptador
//  Todos los adaptadores cumplen la MISMA interfaz:
//    load()        -> Promise<{ categorias: [...] }>
//    save(data)    -> Promise<{ ok, motor }>
//  Así el catálogo funciona igual con cualquier motor. Para cambiar
//  de base de datos, solo cambias DB_MOTOR en el .env.
// ════════════════════════════════════════════════════════════

import { localAdapter }    from './local.adapter.js';
import { supabaseAdapter } from './supabase.adapter.js';
import { firebaseAdapter } from './firebase.adapter.js';

const ADAPTERS = {
  local:    localAdapter,
  supabase: supabaseAdapter,
  firebase: firebaseAdapter,
};

export function getDB(motor = 'local') {
  return ADAPTERS[motor] || ADAPTERS.local;
}
