-- ════════════════════════════════════════════════════════════
--  Base: crm-simple · Esquema Supabase (PostgreSQL)
--  Ejecuta este script en: Supabase → SQL Editor → New query
--  Columnas 1:1 con src/data/supabase.adapter.js.
--
--  DATOS SENSIBLES: aquí viven nombres y contactos de los clientes
--  del cliente. A diferencia de un menú o un catálogo, NADA de esto
--  es público. Las políticas de abajo son cerradas por defecto.
-- ════════════════════════════════════════════════════════════

-- ── 1. TABLAS ───────────────────────────────────────────────
create table if not exists clientes (
  id       text primary key,
  nombre   text not null,
  contacto text,
  estado   text not null default 'nuevo'
    check (estado in ('nuevo','en-proceso','ganado','perdido'))
);

create table if not exists interacciones (
  id         uuid primary key default gen_random_uuid(),
  cliente_id text not null references clientes(id) on delete cascade,
  fecha      date not null default current_date,
  nota       text not null
);

create index if not exists interacciones_cliente_idx on interacciones(cliente_id, fecha desc);

-- ── 2. DATOS DE EJEMPLO (seed) ──────────────────────────────
--  Bórralos antes de entregar: son de prueba, no del cliente.
insert into clientes (id, nombre, contacto, estado) values
  ('c1','Ana Ramírez','ana@ejemplo.com','nuevo'),
  ('c2','Carlos Díaz','300 000 0000','en-proceso')
on conflict (id) do nothing;

insert into interacciones (cliente_id, nota) values
  ('c1','Pidió cotización por Instagram'),
  ('c2','Llamada de seguimiento, quedó de confirmar')
on conflict do nothing;

-- ── 3. SEGURIDAD (RLS) ──────────────────────────────────────
--  Cerrado completo: sin sesión iniciada no se lee ni se escribe.
--  No hay política pública en ninguna de las dos tablas — a
--  propósito.
alter table clientes      enable row level security;
alter table interacciones enable row level security;

create policy "acceso admin clientes"
  on clientes for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "acceso admin interacciones"
  on interacciones for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
--  NOTA 1 · "authenticated" = cualquier usuario logueado del
--  proyecto. Si el cliente va a tener empleados con cuenta que NO
--  deban ver el CRM, esto no alcanza: usa la tabla `perfiles` de
--  la base `auth` y cambia la condición por
--    exists (select 1 from perfiles p
--            where p.id = auth.uid() and p.rol = 'admin')
--
--  NOTA 2 · Antes de meter datos reales de personas, confirma con
--  el cliente que puede tratarlos (en Colombia, Ley 1581 de 2012:
--  necesita autorización del titular y política de privacidad
--  publicada). Es responsabilidad del cliente, pero adviértelo
--  por escrito — queda en el contrato.
-- ════════════════════════════════════════════════════════════
