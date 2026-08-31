# Sistema de Producción · Estudio Digital

Todo el proyecto reunido. Esta carpeta es tu base de operaciones para arrancar
proyectos de clientes más rápido, con estructuras sólidas y reutilizables.

📖 **¿Primera vez aquí?** Lee [`COMO-LO-USARIA-UN-EXPERTO.md`](./COMO-LO-USARIA-UN-EXPERTO.md)
— el recorrido completo, con un cliente de ejemplo, de brief a entrega.

## Contenido

```
Sistema-de-Produccion/
├─ indice.html                        ← abre esto primero: navegación a todo
│
├─ 01-documentos/
│  ├─ 1-catalogo-de-servicios.html   ← qué ofreces (Starter / Pro) + bases + buenas prácticas
│  ├─ 2-plan-de-construccion.html    ← backlog, ficha de contexto v2 y plan por fases
│  └─ 3-automatizacion-y-nuevos-servicios.md ← diagnóstico UX/UI + ideas de servicios recurrentes (no construidos)
│
├─ 02-bases/                          ← 9 bases técnicas, todas con el mismo patrón:
│  │                                    demo.html + README.md + contexto.ejemplo.yml +
│  │                                    .env.example + .gitignore + src/ +
│  │                                    supabase.schema.sql (tablas + RLS listas para correr)
│  ├─ menu-con-panel-admin/          ← BASE 1 · menú QR + panel admin con login real
│  ├─ carrito-reutilizable/          ← BASE 2 · carrito + checkout (Wompi real, sandbox)
│  ├─ landing-modular/                ← BASE 3 · landing por secciones + leads
│  ├─ auth/                           ← BASE 4 · login/registro/roles
│  ├─ ecommerce-completo/             ← BASE 5 · catálogo + inventario + panel (Pro)
│  ├─ dashboard-analytics/            ← BASE 6 · KPIs de leads/inventario (no GA4, ver su README)
│  ├─ crm-simple/                     ← BASE 7 · clientes + historial de interacciones (Pro)
│  ├─ suscripciones/                  ← BASE 8 · planes + registro (cobro recurrente = backend aparte)
│  ├─ marketplace/                    ← BASE 9 · multi-vendedor + comisión (sin split automático)
│  └─ backend-pro/                    ← BASE 10 · extensión Pro: cobros reales con Wompi
│                                       (firma + webhook). Sin demo: es backend.
│
├─ 03-componentes-ui/                ← kit de referencia (E4), no es dependencia
│  ├─ demo.html                      ← catálogo visual de cada componente
│  ├─ tokens.css                     ← contrato de nombres de variables
│  ├─ components.css                 ← sysbar, botones, pills, cards, drawer, producto, checkout...
│  ├─ analytics.js                   ← conector GA4 real, solo falta el GA4_ID
│  ├─ kit-figma.md                   ← spec para reconstruir el kit en Figma (no es un .fig real)
│  └─ README.md                      ← cómo copiar un componente a una base
│
├─ 04-fichas-de-contexto/             ← fichas compuestas, llenas, por rubro
│  ├─ restaurante.yml                ← menu-con-panel-admin (+ auth si es pro)
│  ├─ tienda.yml                     ← landing-modular + carrito-reutilizable
│  ├─ clinica.yml                    ← landing-modular + auth (pro, datos sensibles)
│  ├─ validador-de-ficha.md          ← checklist de campos mínimos antes de construir
│  └─ README.md                      ← cómo elegir y adaptar una ficha
│
├─ 05-prompts-maestros/               ← el "manual de ensamblaje" de un proyecto
│  ├─ prompt-de-arranque.md          ← proceso completo: ficha + base → entrega
│  ├─ prompt-por-base.md             ← reglas específicas de cada base (incluye las 9)
│  ├─ prompt-de-revision.md          ← auditoría de calidad/accesibilidad/seguridad
│  ├─ prompt-de-contenido.md         ← genera copy en el tono, siempre como borrador
│  └─ README.md                      ← cómo combinar los 4 prompts
│
├─ 06-plantillas-de-negocio/          ← la parte comercial, antes y después de construir
│  ├─ brief-de-cliente.md            ← cuestionario que alimenta la ficha de contexto
│  ├─ lista-de-precios.md            ← plantilla con fórmula, sin cifras inventadas
│  ├─ plantilla-de-propuesta.md      ← alcance + entregables que el cliente confirma
│  ├─ contrato-base.md               ← esqueleto legal — revisar con abogado antes de usar
│  ├─ planes-de-soporte.md           ← 3 niveles de mantenimiento mensual
│  └─ README.md                      ← el flujo completo: brief → ficha → propuesta → prompt
│
├─ 07-operacion-equipo/               ← para cuando se sume alguien al equipo
│  ├─ estructura-de-repos.md         ← estándar de carpetas para cualquier cliente
│  ├─ guia-de-estilo-de-codigo.md    ← convenciones obligatorias del sistema
│  ├─ onboarding.md                  ← cómo sumar a 1-2 personas, paso a paso
│  └─ tablero-de-proyectos.md        ← plantilla de seguimiento, sin herramienta externa
│
├─ 08-pagina-del-estudio/             ← landing propia del estudio (entregable real)
│  ├─ index.html                    ← rediseñada: dirección "ficha técnica" + conmutador
│  │                                  de identidad en vivo. Placeholders por completar
│  ├─ propuesta-de-rediseno.md      ← auditoría UX/UI y por qué de cada decisión
│  ├─ versiones/index-v1.html       ← la versión anterior, por si acaso
│  └─ README.md                     ← qué reemplazar antes de publicar
│
└─ 09-que-necesito-de-ti/             ← QUÉ PEDIRLE AL CLIENTE antes de construir
   ├─ 0-credenciales-comunes.md     ← Supabase, GA4, pasarela, dominio (empieza por aquí)
   └─ 1..9-<servicio>.md            ← un formato por servicio: datos, formato exacto,
                                       qué bloquea el arranque y qué advertir en la propuesta
```

## Cómo navegar
0. Abre `indice.html` con doble clic — enlaza a todo lo demás de esta lista,
   sin necesitar servidor.
1. Abre los dos HTML de `01-documentos/` en el navegador. Son tu catálogo y tu
   hoja de ruta visual.
2. Recorre `02-bases/` — cada carpeta tiene su `demo.html` para ver/probar
   esa base funcionando (catálogo, carrito, login, inventario, CRM, etc.).
3. Entra a `03-componentes-ui/` y abre `demo.html` para ver el catálogo de
   componentes compartidos (botones, cards, drawer...) listos para copiar.
4. Entra a `04-fichas-de-contexto/` para ver fichas reales por rubro
   (restaurante, tienda, clínica) y arrancar un cliente nuevo más rápido.
5. Cuando arranques un proyecto de cliente real, usa
   `05-prompts-maestros/prompt-de-arranque.md` — es el proceso paso a paso,
   con checklist de entrega, para que nada quede a medias ni se invente.
6. Antes de eso, manda `06-plantillas-de-negocio/brief-de-cliente.md` al
   cliente nuevo — sus respuestas llenan directamente la ficha de contexto.
7. **Apenas cierres la venta**, abre el formato del servicio en
   `09-que-necesito-de-ti/` y úsalo como lista de compras: es todo lo que
   hay que reunir para construir sin adivinar. Empieza por
   `0-credenciales-comunes.md` — es lo que más demora, porque depende de
   que el cliente abra cuentas.
8. Si el equipo crece, `07-operacion-equipo/onboarding.md` tiene el proceso.

## Estado del proyecto
- ✅ Catálogo de servicios, backlog y plan por fases
- ✅ **9 bases técnicas** construidas en `02-bases/`: menú con panel admin,
  carrito reutilizable, landing modular, auth, ecommerce completo, dashboard
  analytics, CRM simple, suscripciones y marketplace
- ✅ Componentes UI compartidos + conector GA4 real + kit Figma equivalente
  (`03-componentes-ui/`)
- ✅ Fichas de contexto por rubro + validador de ficha (`04-fichas-de-contexto/`)
- ✅ Los 4 prompts maestros completos (`05-prompts-maestros/`)
- ✅ Brief, lista de precios, propuesta, contrato base y planes de soporte
  (`06-plantillas-de-negocio/`)
- ✅ Estructura de repos, guía de estilo, onboarding y tablero de proyectos
  (`07-operacion-equipo/`)
- ✅ Página del estudio (`08-pagina-del-estudio/`) — **rediseñada**: nueva
  dirección de arte, dos temas, conmutador de identidad en vivo y enlaces
  a las demos como prueba real. Sigue sin testimonios ni cifras inventadas
- ✅ **Esquema SQL con RLS en las 9 bases** — antes solo 2 lo tenían; el
  resto lo llevaba como comentario en el adaptador
- ✅ **Pedidos guardados** en ecommerce, carrito y menú: código legible,
  estados con transiciones válidas, panel con métricas, y descuento de
  stock atómico (se acabó vender dos veces el último producto)
- ✅ **Ventas reales en el dashboard**: ingresos, ticket promedio y más
  vendidos — la deuda más vieja del sistema, cerrada
- ✅ **Pasada de seguridad**: `seguridad.js` (escapado + validación) en las
  9 demos, roles reales en RLS (`es_admin()`), bitácora de cambios, freno
  anti-spam y `07-operacion-equipo/guia-de-seguridad.md` con el checklist
  de entrega. Corrigió un XSS almacenado real en el panel de pedidos
- ✅ **Backend Pro** (`02-bases/backend-pro/`) — cobro real con Wompi:
  firma de integridad, total recalculado en el servidor y confirmación
  automática por webhook. Falta probarlo en sandbox con una cuenta real
- ✅ **Formatos de insumos por servicio** (`09-que-necesito-de-ti/`) — qué
  pedirle al cliente, en qué formato, y qué advertirle antes de firmar
- ✅ Conector Wompi real (Widget oficial, funciona en sandbox sin backend)
- ⏳ **Lo único que falta es credenciales reales tuyas**: un proyecto
  Supabase conectado, `GA4_ID`, `WOMPI_PUBLIC_KEY` — el código ya está
  completo y listo para recibirlas en el `.env` de cada proyecto.
- ⏳ Fuera de eso, solo quedan decisiones de negocio que no son tarea de
  código: piezas para redes (necesita marca/contenido real), y MenuOS/
  LandingKit/Starter Pack (productización de E10 — precio y empaquetado).

## Cómo seguimos trabajando
Para cada nuevo proyecto: llenas una ficha de contexto, eliges la base, y me la
pasas junto con `05-prompts-maestros/prompt-de-arranque.md`. Yo ensamblo el
producto configurado, fuera de este repo, siguiendo ese proceso. Cada base
nueva que construyamos se suma a `02-bases/`.
