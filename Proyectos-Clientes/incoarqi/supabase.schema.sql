-- ════════════════════════════════════════════════════════════
--  Base: landing-modular · Esquema Supabase (PostgreSQL)
--  Ejecuta este script en: Supabase → SQL Editor → New query
--  Columnas 1:1 con src/data/supabase.adapter.js — si cambias
--  un nombre aquí, cámbialo también allá.
-- ════════════════════════════════════════════════════════════

-- ── 1. TABLAS ───────────────────────────────────────────────
create table if not exists leads (
  id        uuid primary key default gen_random_uuid(),
  nombre    text not null,
  contacto  text not null,          -- email o teléfono, como lo escriba el visitante
  mensaje   text,
  creado_en timestamptz not null default now()
);

create index if not exists leads_creado_en_idx on leads(creado_en desc);

-- ── 2. SEGURIDAD (RLS) ──────────────────────────────────────
--  Un lead es un dato personal: cualquiera puede DEJARLO (el
--  formulario es público), pero solo el dueño autenticado puede
--  LEERLO. Sin la política de select, la anon key expondría la
--  lista completa de contactos a cualquiera que abra la consola.
alter table leads enable row level security;

create policy "insercion publica leads"
  on leads for insert
  with check (true);

create policy "lectura admin leads"
  on leads for select
  using (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
--  NOTA 1 · Anti-spam: este esquema no filtra bots. Si la landing
--  empieza a recibir basura, lo mínimo es un honeypot en el
--  formulario; lo serio es un captcha validado en un Edge Function
--  (no se puede validar de verdad solo desde el navegador).
--
--  NOTA 2 · Si quieres saber de qué campaña vino cada lead, agrega
--  `fuente text` aquí y mándalo en el insert del adaptador. Se dejó
--  fuera a propósito: hoy el código no lo escribe, y una columna
--  que nadie llena solo confunde.
--
--  NOTA 3 · dashboard-analytics lee ESTA tabla (id, creado_en).
--  Si la renombras, ese dashboard deja de contar leads.
-- ════════════════════════════════════════════════════════════
