-- ════════════════════════════════════════════════════════════
--  Base: auth · Esquema Supabase (PostgreSQL)
--  Ejecuta este script en: Supabase → SQL Editor → New query
--
--  Supabase Auth ya crea y administra la tabla auth.users — este
--  script NO la toca. Lo único que agrega es `perfiles`, para poder
--  cambiar el rol de alguien desde un panel sin tener que editar
--  su user_metadata a mano.
--
--  ¿Cuándo lo necesitas?
--   · Solo login y un rol fijo al registrarse → NO corras esto.
--     El adaptador ya lee user_metadata.rol y con eso basta.
--   · Quieres ascender a alguien a "admin" después, o listar
--     usuarios en un panel → corre esto y lee el rol de aquí.
-- ════════════════════════════════════════════════════════════

-- ── 1. TABLA ────────────────────────────────────────────────
create table if not exists perfiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nombre     text,
  rol        text not null default 'cliente'
    check (rol in ('cliente','staff','admin')),
  creado_en  timestamptz not null default now()
);

-- ── 2. ALTA AUTOMÁTICA ──────────────────────────────────────
--  Cada usuario nuevo de Supabase Auth obtiene su fila aquí sola.
--  Sin esto, quedarían usuarios sin perfil y el panel los vería
--  como si no existieran.
create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into perfiles (id, nombre, rol)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nombre', ''),
    coalesce(new.raw_user_meta_data->>'rol', 'cliente')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ── 3. FUNCIONES DE ROL — el cimiento de todo lo demás ──────
--  PROBLEMA QUE RESUELVEN: escribir `auth.role() = 'authenticated'`
--  en una política significa "cualquier usuario con cuenta". En un
--  proyecto con área de clientes, eso es TODO EL MUNDO: cualquiera
--  se registra y ya puede escribir donde no debe.
--
--  Estas dos funciones son la forma correcta. Cópialas a cada base
--  del proyecto que necesite distinguir roles, y usa `es_admin()`
--  en vez de `auth.role() = 'authenticated'`.
--
--  `stable` permite que Postgres cachee el resultado dentro de la
--  misma consulta, en vez de resolverlo fila por fila.
create or replace function es_admin()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from perfiles
    where id = auth.uid() and rol = 'admin'
  );
$$;

create or replace function es_staff()
returns boolean
language sql
stable
security definer set search_path = public
as $$
  select exists (
    select 1 from perfiles
    where id = auth.uid() and rol in ('admin', 'staff')
  );
$$;

grant execute on function es_admin, es_staff to anon, authenticated;

-- ── 4. SEGURIDAD (RLS) ──────────────────────────────────────
alter table perfiles enable row level security;

--  Cada quien ve su propio perfil.
create policy "lectura propia perfil"
  on perfiles for select
  using (auth.uid() = id);

--  Un admin ve todos.
create policy "lectura admin perfiles"
  on perfiles for select
  using (es_admin());

--  Solo un admin cambia roles. OJO: si nadie tiene rol 'admin'
--  todavía, ninguna de estas políticas deja crear el primero —
--  el primer admin se marca a mano desde el panel de Supabase:
--    update perfiles set rol = 'admin' where id = '<uuid del usuario>';
create policy "escritura admin perfiles"
  on perfiles for update
  using (es_admin())
  with check (es_admin());

-- ════════════════════════════════════════════════════════════
--  NOTA 1 · Nadie puede cambiarse el rol a sí mismo: no hay
--  política que permita a un usuario editar su propia fila. Es
--  intencional — si la agregas, cualquier cliente se vuelve admin
--  desde la consola del navegador con la anon key.
--
--  NOTA 2 · Confirmación de correo: por defecto Supabase exige
--  verificar el email antes del primer login. Si en la demo el
--  registro "funciona pero no deja entrar", es eso —
--  Authentication → Providers → Email → Confirm email.
--
--  NOTA 3 · Esta tabla es la que deben mirar las políticas de las
--  demás bases cuando "authenticated" no alcance (ver la nota de
--  crm-simple/supabase.schema.sql).
-- ════════════════════════════════════════════════════════════
