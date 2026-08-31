// ════════════════════════════════════════════════════════════
//  CAPA DE AUTENTICACIÓN — Selector de adaptador
//  Todos los adaptadores cumplen la MISMA interfaz:
//    register(email, password, meta) -> Promise<{ ok, user }>
//    login(email, password)          -> Promise<{ ok, user }>
//    logout()                        -> Promise<{ ok }>
//    subscribe(fn)                   -> unsubscribe; fn(user|null)
//    current()                       -> user|null (solo local/demo)
//  Así el login funciona igual con cualquier motor. Para cambiar
//  de proveedor, solo cambias AUTH_MOTOR en el .env.
// ════════════════════════════════════════════════════════════

import { localAuth }    from './local.adapter.js';
import { supabaseAuth } from './supabase.adapter.js';
import { firebaseAuth } from './firebase.adapter.js';

const ADAPTERS = {
  local:    localAuth,
  supabase: supabaseAuth,
  firebase: firebaseAuth,
};

// El motor sale del contexto / .env. Cae a 'local' si no existe.
export function getAuth(motor = 'local') {
  return ADAPTERS[motor] || ADAPTERS.local;
}
