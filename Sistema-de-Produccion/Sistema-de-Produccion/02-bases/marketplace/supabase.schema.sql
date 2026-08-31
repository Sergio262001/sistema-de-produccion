-- ════════════════════════════════════════════════════════════
--  Base: marketplace · Esquema Supabase (PostgreSQL)
--  Ejecuta este script en: Supabase → SQL Editor → New query
--  Columnas 1:1 con src/data/supabase.adapter.js.
--
--  ⚠ CHOQUE DE NOMBRES: esta base usa una tabla `productos`, igual
--  que ecommerce-completo — pero con columnas distintas
--  (`vendedor_id` aquí, `categoria_id` allá). NO las pongas en el
--  mismo proyecto de Supabase. Un proyecto por cliente, siempre.
-- ════════════════════════════════════════════════════════════

-- ── 1. TABLAS ───────────────────────────────────────────────
create table if not exists vendedores (
  id       text primary key,
  nombre   text not null,
  contacto text,
  activo   boolean not null default true
);

create table if not exists productos (
  id          text primary key,
  vendedor_id text not null references vendedores(id) on delete cascade,
  nombre      text not null,
  descripcion text,
  precio      int  not null default 0,
  emoji       text,
  stock       int  not null default 0,
  orden       int  default 0
);

create index if not exists productos_vendedor_idx on productos(vendedor_id);

-- ── 2. DATOS DE EJEMPLO (seed) ──────────────────────────────
insert into vendedores (id, nombre, contacto) values
  ('v1','Taller Arcilla','arcilla@ejemplo.com'),
  ('v2','Tejidos del Sur','300 000 0000')
on conflict (id) do nothing;

insert into productos (id, vendedor_id, nombre, descripcion, precio, emoji, stock, orden) values
  ('p1','v1','Taza artesanal','Gres esmaltado, 300 ml', 42000,'🍵',10,0),
  ('p2','v1','Maceta pequeña','Con plato incluido',      35000,'🪴', 6,1),
  ('p3','v2','Ruana de lana','Tejida a mano',           180000,'🧣', 3,0)
on conflict (id) do nothing;

-- ── 3. SEGURIDAD (RLS) ──────────────────────────────────────
--  Catálogo público; edición solo autenticado.
alter table vendedores enable row level security;
alter table productos  enable row level security;

create policy "lectura publica vendedores"
  on vendedores for select using (true);
create policy "lectura publica productos"
  on productos for select using (true);

create policy "escritura admin vendedores"
  on vendedores for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "escritura admin productos"
  on productos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
--  NOTA 1 · Tal como está, CUALQUIER usuario autenticado puede
--  editar los productos de CUALQUIER vendedor. Sirve mientras el
--  dueño del marketplace administre todo. En el momento en que
--  cada vendedor tenga su propia cuenta, esto es un hueco: hay que
--  ligar `vendedores` con `auth.users` (agregar `user_id uuid
--  references auth.users(id)`) y cambiar la política de escritura
--  de productos por
--    exists (select 1 from vendedores v
--            where v.id = productos.vendedor_id and v.user_id = auth.uid())
--  No lo dejé hecho porque cambia el modelo de negocio: define
--  primero si los vendedores entran solos o los carga el dueño.
--
--  NOTA 2 · La comisión NO vive aquí: es un solo porcentaje global
--  que sale de `comision_porcentaje` en la ficha de contexto. Si
--  algún día cada vendedor negocia la suya, agrega
--  `comision_pct numeric` a `vendedores` y léelo en checkout.js.
--
--  NOTA 3 · El split automático del pago (que a cada vendedor le
--  llegue su parte solo) NO existe en esta base — el desglose es
--  informativo. Repartir de verdad exige Marketplace/Connect de la
--  pasarela y un backend. Dilo claro en la propuesta.
-- ════════════════════════════════════════════════════════════
