-- ════════════════════════════════════════════════════════════
--  Base: menu-con-panel-admin · Esquema Supabase (PostgreSQL)
--  Ejecuta este script en: Supabase → SQL Editor → New query
--  Crea tablas, datos de ejemplo y reglas de seguridad (RLS).
-- ════════════════════════════════════════════════════════════

-- ── 1. TABLAS ───────────────────────────────────────────────
create table if not exists categorias (
  id          text primary key,
  nombre      text not null,
  descripcion text,
  orden       int  default 0
);

create table if not exists items (
  id           text primary key,
  categoria_id text not null references categorias(id) on delete cascade,
  nombre       text not null,
  descripcion  text,
  precio       int  not null default 0,
  emoji        text,
  disponible   boolean default true,
  badge        text,
  orden        int default 0
);

create index if not exists items_categoria_idx on items(categoria_id);

-- ── 2. DATOS DE EJEMPLO (seed) ──────────────────────────────
insert into categorias (id, nombre, descripcion, orden) values
  ('cafe',    'Café',    'Tostado propio, grano de origen', 0),
  ('brunch',  'Brunch',  'Hasta las 2 de la tarde',         1),
  ('postres', 'Postres', 'Hechos en casa',                  2)
on conflict (id) do nothing;

insert into items (id, categoria_id, nombre, descripcion, precio, emoji, disponible, badge, orden) values
  ('c1','cafe','Espresso','Doble shot, intenso',4500,'☕',true,null,0),
  ('c2','cafe','Latte de la casa','Leche texturizada, arte latte',8500,'🥛',true,'top',1),
  ('c3','cafe','Cold brew','Extracción en frío 18h',9000,'🧊',true,null,2),
  ('b1','brunch','Huevos benedictinos','Pan de masa madre, holandesa',18500,'🍳',true,'top',0),
  ('b2','brunch','Avo toast','Aguacate, tomate, sésamo',15000,'🥑',true,null,1),
  ('p1','postres','Cheesecake','Frutos del bosque',11000,'🍰',true,null,0),
  ('p2','postres','Brownie','Chocolate 70%, nuez',9500,'🍫',true,null,1)
on conflict (id) do nothing;

-- ── 3. SEGURIDAD (RLS) ──────────────────────────────────────
-- Lectura: pública (cualquiera ve el menú).
-- Escritura: solo usuarios autenticados (el dueño en el panel).
alter table categorias enable row level security;
alter table items      enable row level security;

-- Lectura pública
create policy "lectura publica categorias"
  on categorias for select using (true);
create policy "lectura publica items"
  on items for select using (true);

-- Escritura solo autenticados
create policy "escritura admin categorias"
  on categorias for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "escritura admin items"
  on items for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
--  PEDIDOS (opcional — solo si el menú TOMA PEDIDOS)
--
--  Un menú digital normal solo muestra la carta: la gente pide
--  al mesero. Corre esta sección únicamente si el proyecto suma
--  el carrito (02-bases/carrito-reutilizable) para pedir desde la
--  mesa o a domicilio. Si no, sáltala: tablas vacías confunden.
-- ════════════════════════════════════════════════════════════

create table if not exists pedidos (
  id                uuid primary key default gen_random_uuid(),
  codigo            text unique not null,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz,
  estado            text not null default 'nuevo'
    check (estado in ('nuevo','confirmado','preparando','enviado','entregado','cancelado')),
  canal             text not null default 'whatsapp',
  mesa              text,                        -- propio de restaurante
  cliente_nombre    text not null,
  cliente_contacto  text not null,
  cliente_direccion text,
  cliente_nota      text,
  moneda            text not null default '$',
  subtotal          int  not null default 0,
  envio             int  not null default 0,
  impuesto          int  not null default 0,
  total             int  not null default 0,
  pago_proveedor    text,
  pago_referencia   text,
  pago_estado       text not null default 'pendiente'
    check (pago_estado in ('pendiente','aprobado','rechazado','reembolsado'))
);

create index if not exists pedidos_creado_idx on pedidos(creado_en desc);
create index if not exists pedidos_estado_idx on pedidos(estado);

create table if not exists pedidos_items (
  id          uuid primary key default gen_random_uuid(),
  pedido_id   uuid not null references pedidos(id) on delete cascade,
  producto_id text not null,     -- el id del plato en `items`
  nombre      text not null,     -- congelado al momento del pedido
  precio      int  not null,     -- congelado al momento del pedido
  qty         int  not null check (qty > 0)
);

create index if not exists pedidos_items_pedido_idx on pedidos_items(pedido_id);

--  MISMA FIRMA que en ecommerce-completo y carrito-reutilizable,
--  para que `pedidos.supabase.adapter.js` se copie sin cambios.
--  Diferencia: un restaurante no lleva stock por unidad — aquí se
--  valida DISPONIBILIDAD (`items.disponible`), no cantidad. Pedir
--  un plato agotado falla con un mensaje claro.
create or replace function crear_pedido(
  p_codigo            text,
  p_canal             text,
  p_cliente_nombre    text,
  p_cliente_contacto  text,
  p_cliente_direccion text,
  p_cliente_nota      text,
  p_moneda            text,
  p_subtotal          int,
  p_envio             int,
  p_impuesto          int,
  p_total             int,
  p_pago_proveedor    text,
  p_items             jsonb
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_pedido_id  uuid;
  v_item       jsonb;
  v_disponible boolean;
  v_nombre     text;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select disponible, nombre into v_disponible, v_nombre
      from items where id = v_item->>'producto_id';

    if not found then
      raise exception 'Ese plato ya no está en la carta';
    end if;
    if not v_disponible then
      raise exception 'Se acabó: %', v_nombre;
    end if;
  end loop;

  insert into pedidos (
    codigo, canal, cliente_nombre, cliente_contacto, cliente_direccion,
    cliente_nota, moneda, subtotal, envio, impuesto, total, pago_proveedor
  ) values (
    p_codigo, p_canal, p_cliente_nombre, p_cliente_contacto, p_cliente_direccion,
    p_cliente_nota, p_moneda, p_subtotal, p_envio, p_impuesto, p_total, p_pago_proveedor
  )
  returning id into v_pedido_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    insert into pedidos_items (pedido_id, producto_id, nombre, precio, qty)
    values (
      v_pedido_id, v_item->>'producto_id', v_item->>'nombre',
      (v_item->>'precio')::int, (v_item->>'qty')::int
    );
  end loop;

  return v_pedido_id;
end;
$$;

grant execute on function crear_pedido to anon, authenticated;

alter table pedidos       enable row level security;
alter table pedidos_items enable row level security;

create policy "lectura admin pedidos"
  on pedidos for select using (auth.role() = 'authenticated');
create policy "escritura admin pedidos"
  on pedidos for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "lectura admin pedidos_items"
  on pedidos_items for select using (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
--  NOTA 1 · para la línea PRO con varios roles (admin/editor),
--  cambia las políticas de escritura por una verificación de
--  rol en la tabla `perfiles` de la base `auth`.
--
--  NOTA 2 · La columna `mesa` está para que el mesero sepa a dónde
--  llevar el plato. El adaptador compartido no la escribe todavía
--  (la firma es común a las tres bases); si el cliente pide pedidos
--  por mesa, se agrega el campo en la UI y un parámetro más aquí.
--
--  NOTA 3 · Esto NO es una comanda de cocina. No imprime, no suena,
--  no se integra con el POS. Es un pedido guardado que alguien tiene
--  que estar mirando en el panel. Si el restaurante tiene volumen,
--  dilo claro: necesita un sistema de comandas, no un menú digital.
-- ════════════════════════════════════════════════════════════
