# Base técnica: CRM Simple

Seguimiento de clientes y leads con historial de interacciones, protegido
con login real. No es un CRM de ventas complejo (sin pipelines, sin
automatizaciones) — es lo mínimo para no perder de vista quién es quién y
qué se habló con cada uno.

## Qué resuelve
Lista de clientes con su estado (`lead`/`cliente`/`inactivo`) → al
seleccionar uno, su historial de interacciones → agregar una nota nueva
queda fechada automáticamente → cambiar el estado es un clic.

## Cómo usarla en un proyecto nuevo
1. **Copia** esta carpeta.
2. **Llena** `contexto.ejemplo.yml` y renómbralo `contexto.<cliente>.yml`.
3. **Configura** las claves: copia `.env.example` a `.env` y rellénalo.
4. Listo: el mismo CRM se tematiza, conecta y protege según el contexto.

## Estructura
```
crm-simple/
├─ demo.html                 ← versión de un solo archivo (lista + detalle + login)
├─ contexto.ejemplo.yml      ← ficha de contexto del proyecto
├─ .env.example              ← plantilla de claves (sin secretos)
└─ src/
   ├─ data/
   │  ├─ adapter.js          ← selector de motor (interfaz única)
   │  ├─ local.adapter.js    ← clientes en memoria (sin backend)
   │  ├─ supabase.adapter.js ← conecta con Supabase
   │  └─ firebase.adapter.js ← conecta con Firestore
   └─ styles/
      └─ tokens.css
```

## Interfaz de datos (distinta de load/save)
Esta base no usa `save()` de todo el catálogo de una vez — usa dos
operaciones puntuales: `agregarNota(clienteId, nota)` y
`actualizarEstado(clienteId, estado)`. Es la forma correcta para datos que
se acumulan (un historial no se "reescribe completo" cada vez, se agrega).

## Por qué es Pro casi siempre
Nombre, contacto e historial de un cliente son datos personales — no son
públicos como un menú. La ficha trae `acceso: rls_por_rol` por defecto:
solo el rol `admin` lee y escribe, nunca lectura pública. Si tu proyecto
necesita más de un rol viendo el CRM (ej. vendedor vs. admin), revisa la
base `auth` para sumar roles adicionales.

## Si necesitas algo más complejo
Esta base no tiene pipelines de venta, automatizaciones ni recordatorios.
Si el cliente pide eso, es alcance adicional — no lo simules agregando
campos sueltos a `clientes`; decide si conviene construir una base nueva o
recomendar una herramienta de CRM ya hecha (HubSpot, Pipedrive) en vez de
reinventar una.

## Demo rápida
Abre `demo.html`. Usa `admin@casatela.co` / `admin123`. Selecciona un
cliente, cambia su estado y agrega una nota — verás cómo el historial crece
sin perder las notas anteriores.
