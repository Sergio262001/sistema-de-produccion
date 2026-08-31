// ════════════════════════════════════════════════════════════
//  CAPA DE DATOS — Selector de adaptador
//  Interfaz: load() -> { vendedores, productos }, save(data)
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
