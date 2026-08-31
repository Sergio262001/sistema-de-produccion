# Base técnica: Landing Modular

Landing por secciones (hero, servicios, formulario de leads, footer), rápida
de armar y fácil de adaptar a cualquier rubro solo cambiando la ficha de
contexto. Suele combinarse con `carrito-reutilizable` o `ecommerce-completo`
cuando el proyecto es de venta, no solo de presencia web.

## Qué resuelve
Una página de una sola vista que presenta el negocio, sus servicios y captura
leads en un formulario que se guarda en **Firebase, Supabase o local** sin
cambiar el código de la interfaz.

## Cómo usarla en un proyecto nuevo
1. **Copia** esta carpeta.
2. **Llena** `contexto.ejemplo.yml` con los datos del cliente y renómbralo
   `contexto.<cliente>.yml`. Ahí va el contenido de cada sección y el motor
   de base de datos para los leads.
3. **Configura** las claves: copia `.env.example` a `.env` y rellénalo.
4. **Elige el motor** en `DB_MOTOR` (firebase | supabase | local).
5. Listo: la misma landing se tematiza, llena de contenido y conecta según
   el contexto.

## Estructura
```
landing-modular/
├─ demo.html                 ← versión de un solo archivo (úsala para ver/probar)
├─ contexto.ejemplo.yml      ← ficha de contexto (contenido, marca, motor)
├─ .env.example              ← plantilla de claves (sin secretos)
└─ src/
   ├─ sections/
   │  ├─ hero.js             ← título, subtítulo y CTA
   │  ├─ servicios.js        ← grilla de tarjetas de servicio
   │  ├─ leads-form.js       ← formulario + guardado con el adaptador activo
   │  └─ footer.js           ← contacto y marca
   ├─ data/
   │  ├─ adapter.js          ← selector de motor (interfaz única)
   │  ├─ local.adapter.js    ← leads en memoria (sin backend)
   │  ├─ supabase.adapter.js ← guarda leads en Supabase
   │  └─ firebase.adapter.js ← guarda leads en Firestore
   └─ styles/
      └─ tokens.css          ← variables de diseño (vienen del contexto)
```

## El principio clave
**Cada sección es un componente, no una página suelta.** Agregar, quitar o
reordenar secciones es editar la lista en el contexto, no tocar el HTML. El
texto de cada sección (`content.hero`, `content.servicios`...) vive en la
ficha, nunca incrustado en la plantilla.

## Conectar a Supabase (base de datos real)
1. Crea una tabla `leads(id uuid pk default gen_random_uuid(), nombre text,
   contacto text, mensaje text, creado_en timestamptz default now())`.
2. Activa RLS: inserción pública, lectura solo para el rol admin.
3. Copia `SUPABASE_URL` y `SUPABASE_ANON_KEY` a tu `.env` y pon
   `DB_MOTOR=supabase`.

## Línea Starter vs Pro
- **Starter:** una landing, motor local o Supabase simple, leads por
  WhatsApp o formulario.
- **Pro:** múltiples landings/variantes A-B, notificación por correo
  (Resend) al recibir un lead, analítica avanzada con eventos por sección.

## Demo rápida
Abre `demo.html` en el navegador. Trae el motor **local** activo: llena el
formulario y revisa la consola/red — los leads quedan en memoria. Si
`apis.mensajeria` es `whatsapp`, además abre el chat con el resumen del lead.
