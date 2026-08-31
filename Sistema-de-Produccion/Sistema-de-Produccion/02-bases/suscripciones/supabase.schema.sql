-- ════════════════════════════════════════════════════════════
--  Base: suscripciones · Esquema Supabase (PostgreSQL)
--  Ejecuta este script en: Supabase → SQL Editor → New query
--  Columnas 1:1 con src/data/supabase.adapter.js.
--
--  QUÉ HACE Y QUÉ NO: estas tablas registran QUIÉN está suscrito
--  a QUÉ plan. NO cobran nada cada mes. El cobro recurrente real
--  necesita Stripe Billing o el "preapproval" de Mercado Pago,
--  más un backend que escuche sus webhooks y actualice `estado`
--  aquí cuando un pago falle o el cliente cancele. Sin ese
--  backend, alguien tiene que mover el estado a mano.
-- ════════════════════════════════════════════════════════════

-- ── 1. TABLAS ───────────────────────────────────────────────
create table if not exists planes (
  id          text primary key,
  nombre      text not null,
  precio      int  not null default 0,     -- en pesos, sin decimales
  ciclo       text not null default 'mensual'
    check (ciclo in ('mensual','anual')),
  beneficios  jsonb not null default '[]'::jsonb,
  destacado   boolean not null default false,
  orden       int default 0
);

create table if not exists suscripciones (
  id            uuid primary key default gen_random_uuid(),
  cliente_email text not null,
  plan_id       text not null references planes(id) on delete restrict,
  estado        text not null default 'activa'
    check (estado in ('activa','pausada','cancelada','morosa')),
  inicio        date not null default current_date,
  creado_en     timestamptz not null default now()
);

create index if not exists suscripciones_email_idx on suscripciones(cliente_email);
create index if not exists suscripciones_estado_idx on suscripciones(estado);

-- ── 2. DATOS DE EJEMPLO (seed) ──────────────────────────────
insert into planes (id, nombre, precio, ciclo, beneficios, destacado, orden) values
  ('basico',  'Básico',  49000,  'mensual',
   '["Acceso a la plataforma","Soporte por correo"]'::jsonb, false, 0),
  ('pro',     'Pro',     99000,  'mensual',
   '["Todo lo del Básico","Reportes mensuales","Soporte prioritario"]'::jsonb, true, 1),
  ('anual',   'Pro anual', 990000, 'anual',
   '["Todo lo del Pro","2 meses gratis"]'::jsonb, false, 2)
on conflict (id) do nothing;

-- ── 3. SEGURIDAD (RLS) ──────────────────────────────────────
--  Los PLANES son públicos (son la página de precios).
--  Las SUSCRIPCIONES no: son datos de personas.
alter table planes        enable row level security;
alter table suscripciones enable row level security;

create policy "lectura publica planes"
  on planes for select using (true);

create policy "escritura admin planes"
  on planes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

--  Suscribirse desde el formulario público sí se permite…
create policy "alta publica suscripcion"
  on suscripciones for insert
  with check (true);

--  …pero leer y cambiar estados, solo el admin.
create policy "lectura admin suscripciones"
  on suscripciones for select
  using (auth.role() = 'authenticated');

create policy "escritura admin suscripciones"
  on suscripciones for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
--  NOTA 1 · El `cancelar()` del adaptador hace un UPDATE, y arriba
--  el update es solo de admin. Si quieres que el propio suscriptor
--  se dé de baja desde la web, eso exige que esté logueado y una
--  política que compare su email con `auth.jwt()->>'email'`. Hoy
--  el flujo asumido es: el cliente pide la baja, el dueño la
--  registra desde el panel.
--
--  NOTA 2 · Con alta pública, cualquiera puede insertar filas
--  basura. Es aceptable mientras el alta no cobre nada, pero
--  revisa la lista antes de darle acceso a alguien a algo.
-- ════════════════════════════════════════════════════════════
