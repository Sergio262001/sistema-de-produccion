# Planes de soporte — niveles de mantenimiento

Plantilla para ofrecer soporte recurrente después de la entrega. Como en
`lista-de-precios.md`, **sin cifras inventadas** — define tú el precio según
tu costo por hora y cuánto tiempo te toma cada nivel.

## Los 3 niveles
### Mantenimiento Básico
- Cambios de contenido (texto, precios, productos) — sin desarrollo nuevo.
- Tiempo de respuesta: el que definas (ej. "en 3 días hábiles").
- No incluye: nuevas secciones, nuevas bases, cambios de diseño.
- Encaja con: cualquier proyecto Starter que ya está entregado y solo
  necesita actualizarse de tanto en tanto (ver `Menú Activo` del catálogo).

### Plan Crecimiento
- Todo lo de Mantenimiento Básico, más:
- Mejoras pequeñas continuas (un componente nuevo, un ajuste de UX) sin
  que cada una se cotice por separado — hasta un tope de horas/mes que
  definas.
- Tiempo de respuesta más corto que el plan básico.
- Encaja con: clientes que están creciendo y van a pedir cambios seguido,
  pero no constantemente grandes.

### Plan Marketing
- Todo lo de Plan Crecimiento, más:
- Piezas para redes (cuando construyas ese servicio) y reporte de
  analítica (requiere `apis.analitica: ga4` conectado de verdad — revisa
  `03-componentes-ui/analytics.js`).
- Encaja con: clientes que quieren que tú lleves la presencia digital, no
  solo el sitio.

## Cómo decidir cuál ofrecer
- Si el proyecto es `linea: starter` y el cliente no espera cambios
  frecuentes → no le ofrezcas soporte, o solo Mantenimiento Básico.
- Si el proyecto es `linea: pro` con paneles/inventario/auth → casi siempre
  conviene al menos Plan Crecimiento, porque esos proyectos generan más
  pedidos de ajuste con el tiempo.
- No vendas un plan más caro "porque sí" — si el cliente claramente no va
  a necesitar ese nivel de soporte, el Básico es la oferta honesta.

## Qué incluir en el contrato/propuesta
Sea cual sea el plan, deja explícito por escrito (en
`plantilla-de-propuesta.md` o en `contrato-base.md`):
- Qué cuenta como "cambio de contenido" vs "desarrollo nuevo" — la frontera
  más común de conflicto.
- El tope de horas/mes si lo hay, y qué pasa si se excede (¿se cotiza
  aparte, o se acumula al mes siguiente?).
- Cómo se cancela el plan y con cuánto preaviso.
