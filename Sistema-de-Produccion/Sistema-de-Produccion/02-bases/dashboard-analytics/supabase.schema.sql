-- ════════════════════════════════════════════════════════════
--  Base: dashboard-analytics · Esquema Supabase (PostgreSQL)
--
--  ESTA BASE NO CREA TABLAS PROPIAS. A propósito.
--  Lee lo que las otras bases ya escriben:
--    · leads      ← landing-modular/supabase.schema.sql
--    · productos  ← ecommerce-completo/supabase.schema.sql
--
--  Corre PRIMERO el esquema de las bases que el proyecto use.
--  Si el proyecto no tiene landing, la tarjeta de leads queda
--  vacía; si no tiene tienda, la de inventario queda vacía. No
--  rompe y no inventa datos.
--
--  Este archivo existe solo para dos cosas: (1) que no te
--  preguntes dónde está el SQL de esta base, y (2) las vistas
--  opcionales de abajo.
-- ════════════════════════════════════════════════════════════

-- ── VISTAS OPCIONALES (no requeridas) ───────────────────────
--  El dashboard hoy trae las filas y agrega en el navegador, que
--  es suficiente hasta unos pocos miles de registros. Si un
--  cliente acumula muchos leads y la carga se siente lenta, crea
--  estas vistas y cambia el adaptador para leerlas: mueven la
--  cuenta al servidor y bajan kilobytes en vez de miles de filas.

create or replace view leads_por_dia as
  select creado_en::date as fecha, count(*) as total
  from leads
  group by 1
  order by 1 desc;

create or replace view inventario_por_categoria as
  select categoria_id,
         count(*)                                as productos,
         sum(stock)                              as unidades,
         count(*) filter (where stock = 0)       as agotados,
         sum(precio * stock)                     as valor_inventario
  from productos
  group by 1
  order by 1;

-- ════════════════════════════════════════════════════════════
--  NOTA 1 · Una vista hereda el RLS de las tablas que consulta,
--  así que `leads_por_dia` sigue exigiendo sesión iniciada. Bien:
--  no abre un hueco.
--
--  NOTA 2 · `inventario_por_categoria` asume el `productos` de
--  ecommerce-completo (con `categoria_id`). El `productos` de
--  marketplace tiene `vendedor_id` y esta vista falla ahí. Son
--  proyectos distintos — no mezcles las dos bases en un mismo
--  Supabase.
--
--  NOTA 3 · Nada de esto es tráfico web. Visitas, sesiones y
--  origen viven en GA4, y traerlos aquí exige la GA4 Data API
--  desde un backend con cuenta de servicio. Este dashboard mide
--  TU base de datos, no tu audiencia — no lo vendas como
--  "analítica completa".
-- ════════════════════════════════════════════════════════════
