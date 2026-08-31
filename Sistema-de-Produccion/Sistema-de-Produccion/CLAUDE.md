# CLAUDE.md — Sistema de Producción · Estudio Digital

Este archivo es el contexto permanente del proyecto. Léelo al iniciar cada
sesión antes de actuar.

## Qué es este proyecto
Un sistema de producción para un estudio de diseño web (UX/UI + desarrollo)
freelance, pensado para escalar a un equipo de 2–3 personas. La idea central:
**bases técnicas sólidas y reutilizables que se configuran con el contexto de
cada cliente** y se convierten en el producto final (menú, landing, ecommerce…).

Flujo: `CONTEXTO (ficha del cliente) → BASE TÉCNICA → PRODUCTO FINAL`.

## Sobre el dueño del proyecto
- Diseñador web/gráfico, UX/UI. Hace landing pages, menús digitales,
  marketplaces, ecommerce.
- Stack: Firebase, Supabase, Figma, Google Analytics, HTML/CSS y algo de JS.
- Trabaja en español (Colombia). Responde siempre en español.
- **Línea principal del negocio: ecommerce** (`02-bases/ecommerce-completo/`,
  `carrito-reutilizable/`, `marketplace/`) — catálogo, carrito, inventario,
  checkout. Es el producto que más vende y al que más se le da prioridad
  en ejemplos, demos y desarrollo nuevo.
- El menú digital con QR (`menu-con-panel-admin/`) es una base secundaria,
  útil para restaurantes/cafés cuando aparezca ese cliente — pero no es el
  producto estrella del estudio. No lo trates como el ejemplo por defecto.

## Estructura del repositorio
```
Sistema-de-Produccion/
├─ CLAUDE.md                  ← este archivo (contexto permanente)
├─ LEEME.md                   ← índice y estado del proyecto
├─ indice.html                ← navegación local a todos los documentos/demos
├─ 01-documentos/
│  ├─ 1-catalogo-de-servicios.html   catálogo Starter/Pro + bases + buenas prácticas
│  └─ 2-plan-de-construccion.html    backlog (10 frentes), ficha de contexto v2, fases
├─ 02-bases/
│  ├─ menu-con-panel-admin/   BASE 1: menú QR + panel admin + adaptadores DB
│  ├─ carrito-reutilizable/   BASE 2: motor de carrito + checkout multi-pasarela
│  ├─ landing-modular/        BASE 3: landing por secciones + formulario de leads
│  ├─ auth/                   BASE 4: login/registro/roles, Firebase/Supabase/local
│  ├─ ecommerce-completo/     BASE 5: catálogo + inventario + panel admin (Pro)
│  ├─ dashboard-analytics/    BASE 6: KPIs de leads/inventario (no tráfico GA4, ver su README)
│  ├─ crm-simple/             BASE 7: clientes + historial de interacciones (Pro)
│  ├─ suscripciones/          BASE 8: planes + registro (cobro recurrente real = backend aparte)
│  ├─ marketplace/            BASE 9: multi-vendedor + desglose de comisión (sin split automático)
│  └─ backend-pro/            BASE 10 (extensión Pro): Edge Functions de Supabase —
│                             firma de integridad Wompi + webhook de confirmación +
│                             total recalculado en servidor. Sin demo.html (es backend).
├─ 03-componentes-ui/         kit de referencia: tokens + sysbar/botones/cards/etc. +
│                             analytics.js (GA4) + kit-figma.md (spec, no .fig real)
├─ 04-fichas-de-contexto/     fichas compuestas, llenas, por rubro (restaurante,
│                             tienda, clínica) + validador-de-ficha.md
├─ 05-prompts-maestros/       prompt de arranque, por base, de revisión y de
│                             contenido — el "manual de ensamblaje" completo
├─ 06-plantillas-de-negocio/  brief, lista de precios, propuesta, contrato base
│                             (revisar con abogado) y planes de soporte
├─ 07-operacion-equipo/       estructura de repos, guía de estilo, onboarding
│                             y tablero de proyectos — para cuando crezca el equipo
├─ 08-pagina-del-estudio/     landing propia del estudio (index.html real, con
│                             placeholders explícitos por completar antes de publicar)
└─ 09-que-necesito-de-ti/     un formato de insumos por servicio: qué información y
                              credenciales hay que reunir antes de construir
```

Cada base trae además `supabase.schema.sql` con sus tablas y sus políticas
RLS reales. Dos son declaraciones de "esta base no usa base de datos" y
explican por qué (`carrito-reutilizable`, `dashboard-analytics`).

## Dos líneas de negocio
- **Starter** (pequeños negocios): rápido, liviano, una sede, precio de entrada
  + soporte mensual. Pago único.
- **Pro** (empresas medianas): paneles, roles, multisucursal, inventario,
  analítica, UX research. Por fases + retainer.
Cada base se diseña con un núcleo Starter y una extensión Pro. El campo `linea`
de la ficha decide cuál se activa. **No mantener dos productos: uno que escala.**

## De quién es cada credencial (no asumir que todo es del dueño del estudio)
- **Supabase y GA4**: van bajo la cuenta del dueño del estudio
  (`sagilt26@gmail.com`). Un correo, múltiples proyectos/propiedades — uno
  por cliente. Es infraestructura técnica, no maneja dinero de terceros.
- **Pasarela de pago (Wompi/Mercado Pago/Stripe)**: la crea **el cliente**,
  con su propio NIT/RUT y su cuenta bancaria — el dinero de sus ventas debe
  llegarle a él, no al estudio. El estudio solo recibe e integra la
  `public_key` que el cliente comparta una vez tenga su cuenta.

## Buenas prácticas (obligatorias en todo lo que construyas)
1. **Separar datos de presentación**: el contenido vive en datos/DB, nunca
   incrustado en el HTML. Es la base de todo el sistema de contexto.
2. **Design tokens**: colores, tipografía y espacios como variables CSS en un
   solo lugar; salen de la ficha de contexto (`marca.*`).
3. **Componentes reutilizables**, no páginas sueltas.
4. **Capa de datos con adaptador**: misma interfaz (`load`/`save`) para Firebase,
   Supabase o local. Cambiar de motor = una línea en el `.env`.
5. **Seguridad desde el día uno**: reglas RLS / de acceso antes de subir datos.
6. **Performance**: imágenes optimizadas, lazy load, JS mínimo.
7. **SEO + analytics** conectados antes de entregar.
8. **Git** en cada proyecto. **Secretos solo en `.env`** (nunca en la ficha ni
   en el código; el `.env` va en `.gitignore`).
9. **Accesibilidad mínima**: contraste, foco visible por teclado, alt text.
10. **Documentar el contexto**: cada proyecto guarda su ficha (YAML).

## Convenciones de código
- Vanilla HTML/CSS/JS por defecto (es el stack del dueño). No meter frameworks
  pesados sin acordarlo.
- Las demos de cada base son **un solo archivo autocontenido** (`demo.html`) que
  abre con doble clic (sin imports ES por `file://`). La versión modular vive en
  `src/` para reutilizar.
- Comentarios y nombres en español.
- Cada base trae: `demo.html`, `README.md`, `contexto.ejemplo.yml`, y `src/`.
- Cada base es **autocontenida**: se copia sola a un proyecto de cliente sin
  depender de otras carpetas del repo. `03-componentes-ui/` es un catálogo de
  referencia para copiar y pegar, nunca un import en runtime.

## La ficha de contexto (pieza operativa)
Cada proyecto se define con un YAML que incluye: identidad, `linea`,
`base_de_datos.motor` (firebase | supabase | local), `apis` (pagos, mensajería,
mapas, analítica), `env` (solo nombres de claves), `marca` (tokens) y `entrega`.
Ver ejemplos en cada base (`contexto.ejemplo.yml`).

## Estado actual
- [x] Catálogo de servicios definido
- [x] Backlog (10 frentes) y plan por fases
- [x] Ficha de contexto v2 (con base de datos y APIs)
- [x] Fase 1 — Base "Menú con Panel Admin" + esquema Supabase real
- [x] Fase 2 — Base "Carrito Reutilizable" (checkout WhatsApp/Wompi/MercadoPago/Stripe)
- [x] Base "Landing Modular" (secciones por contexto + formulario de leads)
- [x] Base "Auth" (login/registro/roles — Firebase, Supabase o local)
- [x] Auth cableada al panel admin de "Menú con Panel Admin" (gate por rol)
- [x] Componentes UI compartidos (`03-componentes-ui/`): sysbar, botones, pills,
      cards, formularios, switch, drawer — kit de referencia, no dependencia
- [x] Fichas de contexto llenas por rubro (`04-fichas-de-contexto/`): restaurante,
      tienda, clínica — fichas compuestas que dicen qué bases combinar
- [x] Prompt de arranque + prompt por base (`05-prompts-maestros/`)
- [x] Componentes de venta: producto, línea de carrito, resumen de checkout
      (sumados a `03-componentes-ui/`)
- [x] Brief de cliente, lista de precios, plantilla de propuesta
      (`06-plantillas-de-negocio/`)
- [x] `indice.html` — navegación local a documentos, bases y demos (un
      ejemplo navegable por base). **No es despliegue público** — eso
      necesita que elijas hosting (Vercel/GitHub Pages) y crees el repo.
- [x] Estructura de repos estándar (`07-operacion-equipo/estructura-de-repos.md`)
- [x] Validador de ficha (`04-fichas-de-contexto/validador-de-ficha.md`)
- [x] Prompt de revisión + prompt de contenido (`05-prompts-maestros/`) —
      E3 y E6 del backlog quedan completas
- [x] Conector GA4 real (`03-componentes-ui/analytics.js`) — gtag.js +
      eventos (`trackLead`, `trackPurchase`), agnóstico de cuenta: solo
      necesita `GA4_ID` real en el `.env` de cada proyecto
- [x] Conector Wompi real (`carrito-reutilizable/src/core/wompi.adapter.js`) —
      Widget oficial, funciona en sandbox solo con `WOMPI_PUBLIC_KEY`; la
      firma de integridad para producción está documentada (requiere backend)
- [x] Base "Ecommerce Completo" (E2): catálogo + inventario (stock como única
      fuente de disponibilidad) + panel admin con login + carrito/checkout
      copiado de `carrito-reutilizable` + `supabase.schema.sql`
- [x] Base "Dashboard Analytics" (E2): lee leads/inventario de las otras
      bases — sin tráfico de GA4 (eso exige backend con GA4 Data API)
- [x] Base "CRM Simple" (E2): clientes + historial de interacciones
- [x] Base "Suscripciones" (E2): planes + registro — cobro recurrente
      automático queda documentado como pendiente de backend
- [x] Base "Marketplace" (E2): multi-vendedor + desglose de comisión —
      split de pago automático queda documentado como pendiente de backend
- [x] Kit Figma equivalente (`03-componentes-ui/kit-figma.md`) — spec de
      valores 1:1 con el código, no un archivo `.fig` real (no tengo acceso
      a la API de Figma)
- [x] Contrato base y planes de soporte (`06-plantillas-de-negocio/`) —
      el contrato trae aviso explícito de revisión legal antes de usarlo
- [x] Guía de estilo de código, onboarding y tablero de proyectos
      (`07-operacion-equipo/`)
- [x] Página del estudio (`08-pagina-del-estudio/index.html`) — sin
      testimonios ni cifras inventadas; con placeholders explícitos
      (nombre, WhatsApp, ciudad) por completar antes de publicar
- [x] **Rediseño de la página del estudio (2026-07-29)** — la versión
      anterior era correcta pero *genérica*: Space Grotesk + Inter, emojis
      como iconos, todo centrado, cards redondeadas, cero `:hover` en 94
      líneas y `--accent` declarado sin usarse. Nueva dirección de arte
      **"ficha técnica"**: rail de metadatos en mono + columna de
      contenido, neutros con sesgo verde pino, tres acentos con función
      (arcilla=acción, jade=sistema, latón=datos), display serif del
      sistema (sin CDN), dos temas, `:focus-visible`, skip-link, Open
      Graph y revelado al scroll con `IntersectionObserver` (sin
      librerías — el `CLAUDE.md` prohíbe frameworks pesados, así que se
      descartaron Tailwind/Framer Motion/AOS que pedía el encargo).
      La pieza central es el **conmutador del hero**: cambia entre las
      fichas de restaurante/tienda/clínica y reconfigura los tokens, el
      YAML y la vista previa — la tesis "una base, muchos negocios"
      ejecutada en vivo. Prueba social = enlaces a las demos reales, no
      testimonios inventados. Auditoría completa en
      `08-pagina-del-estudio/propuesta-de-rediseno.md`; versión anterior
      guardada en `08-pagina-del-estudio/versiones/index-v1.html`.
- [x] `indice.html` con mejoras de usabilidad: buscador en vivo, bloque
      "por dónde empiezo hoy", skip-link y foco visible por teclado
- [x] `01-documentos/3-automatizacion-y-nuevos-servicios.md` — diagnóstico
      UX/UI del sistema + ideas de servicios recurrentes/automatizados
      (seguimiento de leads, carrito abandonado, reportes automáticos,
      recordatorios) — son ideas evaluadas, ninguna construida aún
- [x] `supabase.schema.sql` en **las 9 bases** (antes solo en 2) — tablas,
      seed y políticas RLS 1:1 con lo que lee cada adaptador. Incluye el
      caso de `auth` (tabla `perfiles` + trigger de alta y la advertencia
      de que el primer admin se marca a mano) y los dos archivos que
      declaran explícitamente que esa base no persiste nada
      (`carrito-reutilizable`, `dashboard-analytics`)
- [x] `09-que-necesito-de-ti/` — un formato de insumos por servicio
      (9 + credenciales comunes): qué datos, en qué formato exacto, qué
      credencial la crea el cliente y cuál tú, qué bloquea el arranque y
      qué hay que advertir en la propuesta antes de firmar
- [x] **Módulo `pedidos`** (E2, cierra la deuda más vieja del sistema):
      `core/pedidos.js` + 3 adaptadores + tablas `pedidos`/`pedidos_items`
      con RLS en `ecommerce-completo`, `carrito-reutilizable` y
      `menu-con-panel-admin`. El pedido se guarda ANTES de salir a
      WhatsApp/pasarela. Códigos legibles (`PED-7K3F9`), estados con
      transiciones validadas, nombre y precio congelados por ítem.
      Panel de pedidos con métricas en la demo de `ecommerce-completo`.
- [x] **Función `crear_pedido` atómica** — valida stock, crea el pedido y
      lo descuenta en una sola transacción. Resuelve la sobreventa del
      último producto sin necesidad de backend. Tres versiones con la
      MISMA firma (con stock / con disponibilidad / sin catálogo) para
      que el adaptador sea idéntico en las tres bases.
- [x] `dashboard-analytics` muestra **ventas reales**: ingresos, ventas,
      ticket promedio, más vendidos y pedidos por atender. Regla explícita
      de qué cuenta como venta (confirmado/preparando/enviado/entregado).
- [x] **BASE 10 `backend-pro`** (extensión Pro vendible): Edge Functions
      `crear-pago` (recalcula el total contra la base y firma con el
      secreto de integridad — el monto nunca viene del navegador) y
      `wompi-webhook` (verifica el checksum del evento y confirma el
      pedido aunque el comprador cierre la pestaña). **No probado contra
      Wompi real** — sigue la documentación oficial; hay que validarlo en
      sandbox antes de cobrarle a un cliente.
- [x] **Pasada de seguridad completa (2026-07-29)**:
  - `03-componentes-ui/seguridad.js` — `escapeHtml`, `seguro` (etiqueta de
    plantilla), validadores de email/teléfono, `limpiarTexto` con límites,
    `urlSegura`. Copiado en línea a las 9 demos como `esc()`.
  - **Corregido un XSS almacenado real** que se introdujo con el panel de
    pedidos: el nombre/nota que escribe un comprador anónimo se pintaba
    con `innerHTML` en la pantalla del admin. Saneadas también las otras
    8 demos (CRM era el otro caso sensible).
  - `es_admin()` / `es_staff()` en `auth/supabase.schema.sql` — reemplazan
    el `auth.role() = 'authenticated'`, que significa "cualquiera con
    cuenta" y es un hueco en proyectos con registro abierto.
  - `auth/seguridad.schema.sql` — bitácora con trigger (quién cambió qué,
    no editable ni por el admin), freno anti-spam en `leads` y `check` de
    tamaño en `leads`/`pedidos`.
  - `07-operacion-equipo/guia-de-seguridad.md` — las 4 reglas, qué
    protege cada capa, checklist de entrega y la prueba de 2 minutos
    (pedir una tabla privada en incógnito: si devuelve datos, RLS mal).
  - **Sin cubrir, y está dicho:** captcha real, límite por IP, cabeceras
    CSP/HSTS (van en el hosting) y copias de seguridad (el plan gratuito
    de Supabase no las tiene).
- [ ] **Backlog restante — bloqueado por decisiones de negocio, no por
      código que yo pueda escribir:**
  - Piezas para redes — necesita marca/contenido real del estudio para
    diseñar anuncios; no hay nada que generar sin eso.
  - MenuOS / LandingKit / Starter Pack (E10, productos propios) — son
    decisiones de productización (precio, empaquetado, soporte) que
    solo tú puedes tomar, no tareas de código pendientes.
- [ ] **Bloqueado por credenciales tuyas** (lo único que de verdad falta
      para que el sistema esté en uso real):
  - Un proyecto Supabase real conectado a cualquier base con `linea: pro`.
  - `GA4_ID` real (cuenta de Google Analytics) para `analytics.js`.
  - `WOMPI_PUBLIC_KEY` real (cuenta sandbox o real de Wompi) para el widget.
  - Si se necesita Mercado Pago/Stripe: backend + sus claves (no solo
    cuenta, sino el servidor que cree la preferencia/sesión).

## Próximos pasos sugeridos
1. Conectar la base de menú a un Supabase real usando `supabase.schema.sql`,
   y pasar `CONTEXT.auth.motor` a `supabase` para que el login deje de ser local.
   **Esto necesita una cuenta/proyecto real tuyo — no lo puedo crear yo.**
2. Cuando haya un cliente con `apis.analitica: ga4` o `apis.pagos: wompi`
   reales: solo hace falta poner `GA4_ID`/`WOMPI_PUBLIC_KEY` en el `.env` —
   el código ya está completo, no hay que escribir nada nuevo. Cuando me
   pases esas credenciales (dijiste que las traerás al final), las agrego
   como variables en el `.env` del proyecto que corresponda, no en el código.
3. Llenar los números reales en `06-plantillas-de-negocio/lista-de-precios.md`
   — quedó como plantilla con fórmula, sin cifras (solo tú las puedes fijar).
4. Completar los placeholders de `08-pagina-del-estudio/index.html`
   (nombre del estudio, WhatsApp, ciudad) antes de publicarla.
5. Si quieres las demos desplegadas públicamente (no solo `indice.html`
   local): crea el repo en GitHub y conecta Vercel — eso sí lo puedo armar
   yo una vez exista el repo remoto y me confirmes que quieres hacerlo
   (es una acción visible/pública, así que la confirmo antes de ejecutarla).
6. Tienes un proyecto Supabase real de prueba (sin cliente todavía) — falta
   crear su carpeta en `Proyectos-Clientes/` y correr el `supabase.schema.sql`
   de la base que elijas para ver el flujo de punta a punta funcionando.
7. Si decides construir alguna automatización de
   `01-documentos/3-automatizacion-y-nuevos-servicios.md`, hazlo solo cuando
   un cliente real la pida dos veces — no antes, para no repetir el patrón
   de MenuOS/LandingKit (base sin caso de uso real).

## Cómo trabajar conmigo en cada tarea
- Antes de construir, confirma a qué base y línea pertenece la tarea.
- Respeta la separación datos/presentación y los tokens desde contexto.
- Propón el plan antes de editar muchos archivos; mantén los cambios revisables.
- Si una pieza sirve a varias bases (ej. el carrito), constrúyela una vez y
  reutilízala.
- **Si la tarea es armar un proyecto de cliente nuevo** (no seguir
  desarrollando el sistema): usa `05-prompts-maestros/prompt-de-arranque.md`
  como proceso y `prompt-por-base.md` para el detalle de cada base. El
  proyecto del cliente se crea en
  `Escritorio/sistema-de-procuccion/Proyectos-Clientes/<cliente-slug>/`
  (carpeta hermana de este repo, ver su `README.md`) — **nunca dentro de
  este repo**, que es la fábrica, no el entregable.
