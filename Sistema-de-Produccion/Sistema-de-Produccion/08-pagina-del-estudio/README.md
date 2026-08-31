# Página del estudio

Landing propia. A diferencia de las demos, este **sí es un entregable
real** — por eso se llama `index.html`, no `demo.html` (ver
`07-operacion-equipo/estructura-de-repos.md`).

Rediseñada el 2026-07-29. La auditoría de la versión anterior y el porqué
de cada decisión están en [`propuesta-de-rediseno.md`](./propuesta-de-rediseno.md).

## Antes de publicarla, reemplaza estos placeholders

No hay datos inventados del estudio — busca y reemplaza:

| Placeholder | Dónde aparece | Formato |
|---|---|---|
| `[NOMBRE DEL ESTUDIO]` | title, OG, navbar, footer | texto |
| `[TU CIUDAD]` | title, rail del hero, footer | texto |
| `[TU NÚMERO DE WHATSAPP]` | botón de contacto | `573001234567` |
| `[TU DOMINIO]` | OG, canonical | `miestudio.co` |

Además, para que el enlace se vea bien al compartirlo por WhatsApp:
**crea una imagen `og.jpg` de 1200×630** y déjala junto a `index.html`.
Sin ella, las etiquetas Open Graph apuntan a un archivo que no existe.

## Cómo está construida

Dirección de arte **"ficha técnica"**: rail de metadatos en monoespaciada
a la izquierda, columna de contenido a la derecha. Nada centrado por
defecto.

- **Tipografía sin CDN** — display serif del sistema, body `system-ui`,
  mono para datos. Una fuente que no carga deja la página en un respaldo
  sin avisar; por eso no se enlaza ninguna.
- **Dos temas** — claro y oscuro, por `prefers-color-scheme` y con botón
  manual que lo sobrescribe.
- **Sin librerías** — el revelado al hacer scroll es `IntersectionObserver`
  (12 líneas) y las transiciones son CSS. Respeta `prefers-reduced-motion`.
- **Accesibilidad** — `:focus-visible` en todo, salto al contenido,
  `<main>` y `aria-pressed` en el conmutador.

### El conmutador del hero

Es la pieza central. Cambia entre las fichas de restaurante, tienda y
clínica, y con ellas los tokens de marca, el YAML visible y la vista
previa del producto. Demuestra la tesis del estudio — *una base, muchos
negocios* — en vez de describirla.

Si agregas un rubro, es un objeto más en `FICHAS` dentro del `<script>`.

## Qué NO tiene, a propósito

- **Sin testimonios ni cifras** ("+50 clientes", "5 años de experiencia").
  No se inventa prueba social. La prueba ahora son los enlaces a las demos
  reales del repo, que es prueba de verdad. Agrega testimonios cuando
  tengas reales.
- **Sin formulario de leads** — enlace directo a WhatsApp, que no necesita
  ninguna cuenta nueva. Si más adelante quieres capturar leads en
  Supabase, reutiliza `02-bases/landing-modular/src/data/` tal cual.
- **Sin desplegar** — vive en este repo como código. Publicarlo necesita
  que elijas hosting (Vercel/GitHub Pages) y lo conectes.

## Estructura

```
08-pagina-del-estudio/
├─ index.html                 ← el entregable
├─ propuesta-de-rediseno.md   ← auditoría + dirección de arte
├─ versiones/
│  └─ index-v1.html           ← la versión anterior, por si acaso
└─ README.md
```

No tiene `src/` porque no maneja datos propios. Si algún día le agregas un
formulario con base de datos real, ahí sí copia la capa de datos de
`landing-modular`.
