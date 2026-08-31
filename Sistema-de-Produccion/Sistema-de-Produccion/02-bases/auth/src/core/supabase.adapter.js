// ════════════════════════════════════════════════════════════
//  Adaptador SUPABASE (Supabase Auth)
//  Requiere: SUPABASE_URL y SUPABASE_ANON_KEY en el .env
//  El rol se guarda en user_metadata.rol al registrar, o en una
//  tabla "perfiles(id uuid fk auth.users, rol text)" si necesitas
//  cambiarlo después desde un panel. Activa RLS por rol en esa tabla.
// ════════════════════════════════════════════════════════════

import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.SUPABASE_URL;
const key = import.meta.env?.SUPABASE_ANON_KEY;
const client = (url && key) ? createClient(url, key) : null;

function toUser(sbUser) {
  if (!sbUser) return null;
  return { email: sbUser.email, rol: sbUser.user_metadata?.rol || 'cliente', nombre: sbUser.user_metadata?.nombre || '' };
}

export const supabaseAuth = {
  async register(email, password, meta = {}) {
    if (!client) throw new Error('Faltan SUPABASE_URL / SUPABASE_ANON_KEY');
    const { data, error } = await client.auth.signUp({
      email, password, options: { data: { rol: meta.rol || 'cliente', nombre: meta.nombre || '' } },
    });
    if (error) throw error;
    return { ok: true, user: toUser(data.user) };
  },

  async login(email, password) {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return { ok: true, user: toUser(data.user) };
  },

  async logout() {
    if (!client) throw new Error('Faltan credenciales de Supabase');
    const { error } = await client.auth.signOut();
    if (error) throw error;
    return { ok: true };
  },

  subscribe(fn) {
    if (!client) { fn(null); return () => {}; }
    client.auth.getUser().then(({ data }) => fn(toUser(data.user)));
    const { data: sub } = client.auth.onAuthStateChange((_event, session) => fn(toUser(session?.user)));
    return () => sub.subscription.unsubscribe();
  },
};
