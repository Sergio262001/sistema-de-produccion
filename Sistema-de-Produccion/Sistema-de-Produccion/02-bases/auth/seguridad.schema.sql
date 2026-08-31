-- ════════════════════════════════════════════════════════════
--  ENDURECIMIENTO — bitácora y límites anti-abuso
--
--  Complemento de supabase.schema.sql. Córrelo DESPUÉS de él y
--  después del esquema de las bases del proyecto (necesita que
--  existan las tablas que va a vigilar).
--
--  Vive en la base `auth` porque depende de `perfiles` / es_admin(),
--  pero sirve a todo el proyecto.
--
--  Las tres piezas:
--   1. Bitácora — quién cambió qué y cuándo (responde "yo no fui")
--   2. Freno anti-spam — cuántas veces puede escribir un anónimo
--   3. Límites de tamaño — que nadie llene la base con basura
-- ════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════
--  1. BITÁCORA DE CAMBIOS
--
--  Por qué importa: hoy, si un precio amanece cambiado, no hay
--  forma de saber quién lo tocó. Con dos empleados en el panel,
--  eso se vuelve una discusión sin pruebas. Con la bitácora es
--  una consulta.
--
--  También es la primera evidencia si una cuenta se ve comprometida:
--  qué alcanzó a tocar y cuándo.
-- ════════════════════════════════════════════════════════════

create table if not exists bitacora (
  id         bigserial primary key,
  ocurrio_en timestamptz not null default now(),
  usuario_id uuid,                       -- null = pasó sin sesión (ej. un pedido público)
  usuario    text,                       -- el correo, copiado: si borran la cuenta, el registro sobrevive
  tabla      text not null,
  operacion  text not null check (operacion in ('INSERT','UPDATE','DELETE')),
  registro   text,                       -- id del registro afectado
  antes      jsonb,
  despues    jsonb
);

create index if not exists bitacora_fecha_idx  on bitacora(ocurrio_en desc);
create index if not exists bitacora_tabla_idx  on bitacora(tabla, ocurrio_en desc);

create or replace function registrar_en_bitacora()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_usuario text;
  v_id      text;
begin
  select email into v_usuario from auth.users where id = auth.uid();
  v_id := coalesce(
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'id',
    (case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end)->>'codigo'
  );

  insert into bitacora (usuario_id, usuario, tabla, operacion, registro, antes, despues)
  values (
    auth.uid(),
    v_usuario,
    tg_table_name,
    tg_op,
    v_id,
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

--  Conecta la bitácora a las tablas que existan en ESTE proyecto.
--  Se hace en un bloque condicional para que el script corra igual
--  en un proyecto que solo tiene landing y en uno que tiene tienda.
do $$
declare
  t text;
begin
  foreach t in array array['productos','items','pedidos','planes','clientes','vendedores','perfiles']
  loop
    if exists (select 1 from information_schema.tables
               where table_schema = 'public' and table_name = t) then
      execute format('drop trigger if exists bitacora_%1$s on %1$I', t);
      execute format(
        'create trigger bitacora_%1$s after insert or update or delete on %1$I
         for each row execute function registrar_en_bitacora()', t);
    end if;
  end loop;
end $$;

--  Solo un admin lee la bitácora. NADIE la escribe ni la borra a
--  mano: sin política de insert/update/delete, ni siquiera un admin
--  puede alterarla desde la aplicación. Solo el trigger escribe
--  (puede, por ser `security definer`). Una bitácora que el
--  sospechoso puede editar no sirve de nada.
alter table bitacora enable row level security;

create policy "lectura admin bitacora"
  on bitacora for select
  using (es_admin());

-- ════════════════════════════════════════════════════════════
--  2. FRENO ANTI-SPAM PARA FORMULARIOS PÚBLICOS
--
--  El problema: `leads`, `pedidos` y `suscripciones` aceptan
--  escritura de gente sin sesión — tienen que hacerlo, es un
--  formulario público. Un bot puede meter 50.000 filas en una
--  noche. El freno del navegador no sirve: el bot no ejecuta tu
--  JavaScript, manda el POST directo.
--
--  Esto se aplica en la base, que es lo único que el bot no puede
--  saltarse.
-- ════════════════════════════════════════════════════════════

create or replace function limitar_inserciones(
  p_tabla    text,
  p_maximo   int  default 20,
  p_ventana  interval default '1 hour'
)
returns void
language plpgsql
as $$
declare
  v_conteo int;
begin
  execute format(
    'select count(*) from %I where creado_en > now() - $1', p_tabla
  ) into v_conteo using p_ventana;

  if v_conteo >= p_maximo then
    raise exception 'Demasiadas solicitudes. Intenta de nuevo más tarde.'
      using errcode = 'check_violation';
  end if;
end;
$$;

--  Aplicado a `leads`: máximo 20 por hora en TODO el sitio.
--  Es un límite global, no por persona: sin backend no se puede
--  ver la IP del visitante desde una política de Postgres. Un
--  negocio pequeño no recibe 20 leads por hora, así que corta el
--  spam sin estorbar. Si el cliente hace una campaña grande,
--  SÚBELO — si no, va a perder leads reales y nadie va a saber
--  por qué.
create or replace function frenar_leads()
returns trigger
language plpgsql
as $$
begin
  perform limitar_inserciones('leads', 20, '1 hour');
  return new;
end;
$$;

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='leads') then
    drop trigger if exists freno_leads on leads;
    create trigger freno_leads before insert on leads
      for each row execute function frenar_leads();
  end if;
end $$;

-- ════════════════════════════════════════════════════════════
--  3. LÍMITES DE TAMAÑO
--
--  Sin esto, alguien pega 5 MB de texto en el campo "mensaje" y lo
--  repite. No es un ataque sofisticado, es un formulario y un
--  portapapeles — y llena el plan gratuito de Supabase del cliente.
--
--  Los límites del navegador (seguridad.js) son para que la persona
--  vea el error; estos son los que de verdad protegen.
-- ════════════════════════════════════════════════════════════

do $$
begin
  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='leads') then
    alter table leads
      drop constraint if exists leads_tamanos,
      add  constraint leads_tamanos check (
        length(nombre)   between 2 and 80  and
        length(contacto) between 5 and 120 and
        (mensaje is null or length(mensaje) <= 1000)
      );
  end if;

  if exists (select 1 from information_schema.tables
             where table_schema='public' and table_name='pedidos') then
    alter table pedidos
      drop constraint if exists pedidos_tamanos,
      add  constraint pedidos_tamanos check (
        length(cliente_nombre)   between 2 and 80  and
        length(cliente_contacto) between 5 and 120 and
        (cliente_direccion is null or length(cliente_direccion) <= 200) and
        (cliente_nota      is null or length(cliente_nota)      <= 500) and
        -- Un total negativo o absurdo casi siempre significa que
        -- alguien manipuló el pedido desde la consola.
        total between 0 and 100000000
      );
  end if;
end $$;

-- ════════════════════════════════════════════════════════════
--  DESPUÉS DE CORRER ESTO, CAMBIA LAS POLÍTICAS DE LAS DEMÁS BASES
--
--  Los esquemas de las otras bases usan `auth.role() = 'authenticated'`,
--  que significa "cualquier usuario con cuenta". Si el proyecto tiene
--  área de clientes o registro abierto, eso es un hueco: reemplázalo
--  por es_admin() o es_staff(). Por ejemplo:
--
--    alter policy "escritura admin productos" on productos
--      using (es_staff()) with check (es_staff());
--
--    alter policy "acceso admin clientes" on clientes
--      using (es_admin()) with check (es_admin());
--
--  Regla para decidir: ¿un cliente registrado del negocio debería
--  poder hacer esto? Si la respuesta es no, no uses
--  `auth.role() = 'authenticated'`.
--
--  Si el proyecto NO tiene registro abierto (solo el dueño y su
--  equipo tienen cuenta), `authenticated` es suficiente y esto es
--  opcional. Pero apenas se abra el registro, vuélvelo obligatorio.
-- ════════════════════════════════════════════════════════════
