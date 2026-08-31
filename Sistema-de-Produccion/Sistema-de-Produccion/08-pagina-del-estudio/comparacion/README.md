# Comparación v1 / v2

Copias congeladas de las dos versiones de la página del estudio, separadas
para poder abrirlas una al lado de la otra. Creada el 2026-07-30.

```
comparacion/
├─ comparador.html          ← ábrelo con doble clic: las dos vistas juntas
├─ v1-anterior/index.html   ← copia de ../versiones/index-v1.html  (94 líneas)
└─ v2-actual/index.html     ← copia de ../index.html               (592 líneas)
```

Las copias son idénticas a los originales, byte por byte. Los originales no
se tocaron: `index.html` sigue siendo el entregable y `versiones/index-v1.html`
sigue siendo el respaldo. Esta carpeta es solo para mirar, no para editar —
si cambias algo, cámbialo en `../index.html`.

## comparador.html

Autocontenido, sin dependencias: lleva las dos páginas incrustadas y las
corre en marcos. Controles:

- **Ver** — lado a lado, solo v1, solo v2.
- **Ancho** — completo / 768 / 390 px, aplicado a las dos a la vez.
- **Tema** — claro / oscuro. Aquí se ve el hallazgo más directo: la v2 cambia
  y la v1 no, porque no tiene modo oscuro.
- **Scroll sincronizado** — por proporción, ya que la v2 es más larga.
- Pestaña **Qué cambió** — la auditoría de 9 puntos y el diff por componente,
  resumidos de [`../propuesta-de-rediseno.md`](../propuesta-de-rediseno.md).

## Lo único que no funciona en las copias

Los enlaces de la v2 a las demos apuntan a `../02-bases/…`, relativo a la
ubicación original. Desde `comparacion/v2-actual/` esa ruta ya no resuelve.
Para probar las demos, abre el `index.html` de la carpeta de arriba.

La v1 sí carga Space Grotesk e Inter desde Google Fonts al abrirla en local,
así que aquí la ves con su tipografía real — a diferencia de la versión
publicada como artefacto, donde esas peticiones externas están bloqueadas.
