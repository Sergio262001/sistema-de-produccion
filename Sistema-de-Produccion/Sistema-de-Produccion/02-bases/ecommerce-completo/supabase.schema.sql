-- ════════════════════════════════════════════════════════════
--  Base: ecommerce-completo · Esquema Supabase (PostgreSQL)
--  Ejecuta este script en: Supabase → SQL Editor → New query
--  Crea tablas, datos de ejemplo y reglas de seguridad (RLS).
--  El stock es la fuente de verdad de disponibilidad — no hay
--  columna "disponible": se deriva de stock > 0 en el frontend.
-- ════════════════════════════════════════════════════════════

-- ── 1. TABLAS ───────────────────────────────────────────────
create table if not exists categorias (
  id          text primary key,
  nombre      text not null,
  descripcion text,
  orden       int  default 0
);

create table if not exists productos (
  id           text primary key,
  categoria_id text not null references categorias(id) on delete cascade,
  nombre       text not null,
  descripcion  text,
  precio       int  not null default 0,
  emoji        text,
  stock        int  not null default 0,
  badge        text,
  orden        int  default 0
);

create index if not exists productos_categoria_idx on productos(categoria_id);

-- ── 2. DATOS DE EJEMPLO (seed) ──────────────────────────────
insert into categorias (id, nombre, descripcion, orden) values
  ('ropa',       'Ropa',       'Prendas de algodón orgánico', 0),
  ('accesorios', 'Accesorios', 'Para completar el look',      1)
on conflict (id) do nothing;

insert into productos (id, categoria_id, nombre, descripcion, precio, emoji, stock, badge, orden) values
  ('r1','ropa','Camiseta básica','Algodón 100%, corte regular',45000,'👕',12,'top',0),
  ('r2','ropa','Pantalón jogger','Cómodo, bolsillos laterales',89000,'👖',5,null,1),
  ('r3','ropa','Chaqueta liviana','Resistente al agua',135000,'🧥',0,null,2),
  ('a1','accesorios','Gorra bordada','Ajustable, una talla',38000,'🧢',20,null,0),
  ('a2','accesorios','Bolso de lona','Resistente, varios bolsillos',62000,'👜',8,'top',1)
on conflict (id) do nothing;

-- ── 3. SEGURIDAD (RLS) ──────────────────────────────────────
-- Lectura: pública (cualquiera ve el catálogo).
-- Escritura: solo usuarios autenticados (el dueño en el panel).
alter table categorias enable row level security;
alter table productos  enable row level security;

create policy "lectura publica categorias"
  on categorias for select using (true);
create policy "lectura publica productos"
  on productos for select using (true);

create policy "escritura admin categorias"
  on categorias for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');
create policy "escritura admin productos"
  on productos for all
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
--  4. PEDIDOS
--  Aquí es donde esto deja de ser un catálogo y pasa a ser una
--  tienda: el pedido queda guardado, hay historial, panel con
--  estados y ventas reales en el dashboard.
-- ════════════════════════════════════════════════════════════

create table if not exists pedidos (
  id                uuid primary key default gen_random_uuid(),
  codigo            text unique not null,          -- PED-7K3F9, el que dicta el cliente
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
  pago_referencia   text,                          -- la llena la pasarela / el webhook
  pago_estado       text not null default 'pendiente'
    check (pago_estado in ('pendiente','aprobado','rechazado','reembolsado'))
);

create index if not exists pedidos_creado_idx on pedidos(creado_en desc);
create index if not exists pedidos_estado_idx on pedidos(estado);

create table if not exists pedidos_items (
  id          uuid primary key default gen_random_uuid(),
  pedido_id   uuid not null references pedidos(id) on delete cascade,
  producto_id text not null,        -- SIN foreign key, a propósito (ver nota 2)
  nombre      text not null,        -- congelado: el nombre del día de la compra
  precio      int  not null,        -- congelado: el precio del día de la compra
  qty         int  not null check (qty > 0)
);

create index if not exists pedidos_items_pedido_idx on pedidos_items(pedido_id);

-- ── 5. CREAR PEDIDO DE FORMA ATÓMICA ────────────────────────
--  Inserta el pedido, sus ítems y descuenta el stock en UNA sola
--  transacción. Si no alcanza el stock, no se guarda nada y el
--  comprador recibe un mensaje claro.
--
--  Esto es lo que hace imposible vender dos veces el último
--  producto. Desde el navegador, con insert + update por separado,
--  siempre hay una ventana entre "leí que había 1" y "guardé 0" en
--  la que otra persona compra el mismo. Aquí esa ventana no existe.
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
  v_stock     int;
  v_nombre    text;
begin
  if jsonb_array_length(p_items) = 0 then
    raise exception 'El pedido no tiene productos';
  end if;

  -- Se bloquean las filas de producto de una vez, en orden de id,
  -- para que dos pedidos simultáneos se procesen uno detrás del otro
  -- y no en cruz (eso último produce interbloqueos).
  for v_item in
    select * from jsonb_array_elements(p_items) order by value->>'producto_id'
  loop
    select stock, nombre into v_stock, v_nombre
      from productos
      where id = v_item->>'producto_id'
      for update;

    if not found then
      raise exception 'El producto ya no existe en el catálogo';
    end if;

    if v_stock < (v_item->>'qty')::int then
      raise exception 'Solo quedan % unidades de %', v_stock, v_nombre;
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
      v_pedido_id,
      v_item->>'producto_id',
      v_item->>'nombre',
      (v_item->>'precio')::int,
      (v_item->>'qty')::int
    );

    update productos
      set stock = stock - (v_item->>'qty')::int
      where id = v_item->>'producto_id';
  end loop;

  return v_pedido_id;
end;
$$;

--  `security definer` es intencional y necesario: el comprador es
--  anónimo (no tiene sesión) y la política de `productos` no le deja
--  escribir. Esta función corre con permisos del dueño para poder
--  descontar el stock — pero SOLO hace eso, valida todo antes, y no
--  recibe ningún parámetro que le permita tocar otra tabla.
grant execute on function crear_pedido to anon, authenticated;

-- ── 6. SEGURIDAD DE PEDIDOS (RLS) ───────────────────────────
--  Un pedido tiene nombre, teléfono y dirección de una persona.
--  NADIE puede leerlos sin sesión iniciada. Los pedidos se crean
--  únicamente a través de la función de arriba, no con insert
--  directo — por eso no hay política de insert.
alter table pedidos       enable row level security;
alter table pedidos_items enable row level security;

create policy "lectura admin pedidos"
  on pedidos for select
  using (auth.role() = 'authenticated');

create policy "escritura admin pedidos"
  on pedidos for update
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "lectura admin pedidos_items"
  on pedidos_items for select
  using (auth.role() = 'authenticated');

-- ════════════════════════════════════════════════════════════
--  NOTA 1 · El comprador NO puede consultar su propio pedido en la
--  web: no hay política pública de lectura, a propósito (con una,
--  cualquiera podría listar los datos de todos los clientes). Si el
--  cliente quiere una página de "seguimiento de mi pedido", se hace
--  con una función que reciba código + contacto y devuelva solo ese
--  pedido. Es media hora de trabajo — cotízala, no la asumas.
--
--  NOTA 2 · `pedidos_items.producto_id` NO tiene foreign key a
--  `productos`. Es deliberado: si el dueño borra un producto
--  descontinuado, el historial de ventas del año pasado tiene que
--  sobrevivir. Por eso también se congelan `nombre` y `precio` en
--  el ítem — un pedido viejo debe mostrar lo que la persona pagó,
--  no lo que cuesta hoy.
--
--  NOTA 3 · El total se calcula en el navegador y se guarda tal
--  cual. Con cobro por WhatsApp está bien (una persona revisa el
--  pedido antes de despachar). Si se cobra en línea, el total tiene
--  que recalcularse en el servidor contra los precios de la base
--  — eso es la extensión Pro (`02-bases/backend-pro/`).
--
--  NOTA 4 · Cancelar un pedido NO devuelve el stock. Es a propósito:
--  en la práctica una cancelación puede venir de una unidad rota, de
--  una devolución que no volvió a la bodega, o de un pedido que sí
--  se despachó. Devolverlo automáticamente descuadra el inventario
--  real. El dueño ajusta el stock desde el panel cuando corresponda.
-- ════════════════════════════════════════════════════════════
