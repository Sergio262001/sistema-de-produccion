-- ════════════════════════════════════════════════════════════
--  Base: carrito-reutilizable · Esquema Supabase (PostgreSQL)
--
--  ESTA BASE NO TIENE CATÁLOGO PROPIO. Los productos los pone
--  quien la integre (ecommerce-completo, menu-con-panel-admin, o
--  una lista fija en el proyecto). Por eso `src/core/` tiene el
--  motor y no hay adaptador de catálogo.
--
--  Lo que SÍ tiene desde ahora es PEDIDOS. Correr este script es
--  OPCIONAL, pero es la diferencia entre:
--    · sin él → el pedido se va a WhatsApp y no queda rastro
--    · con él → hay historial, panel y ventas en el dashboard
--  Recomendación: córrelo siempre. Un cliente que no puede
--  responder "¿cuánto vendí este mes?" va a culpar a la web.
-- ════════════════════════════════════════════════════════════

-- ── 1. TABLAS ───────────────────────────────────────────────
create table if not exists pedidos (
  id                uuid primary key default gen_random_uuid(),
  codigo            text unique not null,
  creado_en         timestamptz not null default now(),
  actualizado_en    timestamptz,
  estado            text not null default 'nuevo'
    check (estado in ('nuevo','confirmado','preparando','enviado','entregado','cancelado')),
  canal             text not null default 'whatsapp',
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
  producto_id text not null,
  nombre      text not null,     -- congelado al momento de la compra
  precio      int  not null,     -- congelado al momento de la compra
  qty         int  not null check (qty > 0)
);

create index if not exists pedidos_items_pedido_idx on pedidos_items(pedido_id);

-- ── 2. CREAR PEDIDO ─────────────────────────────────────────
--  MISMA FIRMA que la de ecommerce-completo y menu-con-panel-admin,
--  a propósito: así `pedidos.supabase.adapter.js` es idéntico en las
--  tres bases y se copia sin tocar nada.
--
--  Diferencia: aquí NO se descuenta stock ni se valida el producto,
--  porque esta base no tiene tabla de catálogo. Si el proyecto sí
--  maneja inventario, no uses esta versión — usa la de
--  ecommerce-completo, que sí descuenta de forma atómica.
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
  v_pedido_id uuid;
  v_item      jsonb;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

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
      v_pedido_id,
      v_item->>'producto_id',
      v_item->>'nombre',
      (v_item->>'precio')::int,
      (v_item->>'qty')::int
    );
  end loop;

  return v_pedido_id;
end;
$$;

grant execute on function crear_pedido to anon, authenticated;

-- ── 3. SEGURIDAD (RLS) ──────────────────────────────────────
--  Los pedidos traen nombre, teléfono y dirección de personas.
--  Solo se crean por la función de arriba (por eso no hay política
--  de insert) y solo se leen con sesión iniciada.
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
--  NOTA 1 · El carrito en sí sigue viviendo en el navegador. Lo
--  que se guarda es el pedido CONFIRMADO, no el carrito a medias.
--  Recuperar carritos abandonados es otra cosa (y otro alcance).
--
--  NOTA 2 · El total llega calculado desde el navegador. Con cobro
--  por WhatsApp está bien: una persona revisa antes de despachar.
--  Si se cobra en línea, hay que recalcularlo en el servidor contra
--  precios reales — eso es `02-bases/backend-pro/`.
--
--  NOTA 3 · Si esta base se monta sobre ecommerce-completo, NO
--  corras este script: el de esa base ya crea las mismas tablas,
--  con la versión que además descuenta stock.
-- ════════════════════════════════════════════════════════════
