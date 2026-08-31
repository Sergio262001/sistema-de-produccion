# Checklist de mejoras — auditoría de código

Resultado de una revisión completa de las 9 bases (`02-bases/`) y el kit
(`03-componentes-ui/`) contra las reglas de
`guia-de-estilo-de-codigo.md`. Fecha: 2026-06-24.

## ✅ Corregido en esta auditoría
- [x] **Estilo inline en `menu-con-panel-admin/demo.html`** — un color fijo
  (`color:#56617E`) escrito directo en HTML en vez de una clase. Movido a
  `.sysbar .adapter .hint`.
- [x] **13 botones sin `type` explícito** en `auth`, `carrito-reutilizable`
  y `menu-con-panel-admin` (tabs, botones de cantidad, cerrar drawer,
  toggle de disponibilidad, eliminar). Todos ahora tienen `type="button"`.
- [x] **Carpeta vacía sobrante** (`suscripciones/src/core/`) — quedó de un
  `mkdir` que nunca se llenó porque esa base no necesitó un motor `core/`
  propio. Eliminada.
- [x] **Convención `data/` vs `core/` no estaba escrita en ningún lado** —
  era intencional (ver auditoría abajo) pero nadie más que yo lo sabía.
  Documentado ahora en `guia-de-estilo-de-codigo.md`, regla de estructura #4.

## 🔍 Verificado y descartado (falso positivo)
Una primera pasada automática marcó como "crítico" que `checkout.js` (en
`carrito-reutilizable` y `ecommerce-completo`) usa una función `money()`
sin importarla. Es un falso positivo: `money()` está definida en el mismo
archivo (function declaration, hoisted), no necesita import. Lo dejo
anotado aquí para que si alguien más audita el sistema no repita la
misma duda.

## ✅ Confirmado, sin cambios necesarios
- **`data/` vs `core/` en `src/`** no es una inconsistencia — es la
  distinción correcta entre "adaptador de una colección persistente" y
  "motor reutilizable sin persistencia propia". Ahora está documentada
  explícitamente (ver arriba) para que no se confunda con un descuido.
- Ningún adaptador de datos rompe la interfaz `load()`/`save()` (o sus
  variantes documentadas) entre `local`/`supabase`/`firebase` de la misma base.
- No se encontraron variables sin definir, referencias a IDs de DOM
  inexistentes, ni imports rotos dentro de `src/` de ninguna base.
- Ningún dato de negocio (precios, nombres de cliente) está hardcodeado
  fuera de `CONTEXT`/`DATA` — la separación datos/presentación se respeta
  en las 9 bases.

## 📋 Pendiente — no es bug, es alcance futuro
Estas no son correcciones, son extensiones que solo tienen sentido cuando
haya un proyecto real que las necesite (no las construyas preventivamente):
- Ningún `demo.html` valida el formato de email/teléfono en los
  formularios más allá de `type="email"` del navegador — suficiente para
  una demo, revisar si un cliente real necesita más.
- ~~`carrito-reutilizable` y `ecommerce-completo` no persisten el pedido
  completado~~ → **resuelto (2026-07-29)**: módulo `pedidos` en las dos
  bases (motor + 3 adaptadores + tablas + RLS + función `crear_pedido`
  atómica) y panel de estados en la demo. `dashboard-analytics` ya
  muestra ventas reales.
- Ningún adaptador maneja reintentos de red o estados de carga (`loading`)
  — aceptable para demos; un proyecto real con datos lentos podría
  necesitarlo.

## Cómo volver a correr esta auditoría
Pide una revisión con `05-prompts-maestros/prompt-de-revision.md` apuntada
a `02-bases/` completo, usando como checklist las 9 reglas de
`guia-de-estilo-de-codigo.md`. Repite esto cada vez que se agregue una base
nueva o pase tiempo desde la última pasada.
