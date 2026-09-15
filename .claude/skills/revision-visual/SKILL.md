---
name: revision-visual
description: Cómo mirar una página renderizada y criticarla — toma la captura con Chrome sin instalar nada y da hallazgos accionables. Úsala siempre que toques un HTML de este sistema, antes de decir que algo está listo, y cuando el dueño diga que algo se ve mal.
---

# Revisión visual

**Que un HTML compile no dice nada sobre si funciona, y que el contraste pase
no dice nada sobre si se ve bien.**

Este sistema tiene 281 pruebas. Comprueban que el HTML compila, que los `id`
que pide el script existen, que el catálogo del cliente llegó y que no quedó
andamiaje de demo. **Ninguna lo ve.** Los cinco bugs que llegaron a una
entrega los encontró el dueño abriendo la página.

---

## Cómo tomar la captura

Chrome ya está instalado en la máquina. No hace falta Playwright ni Puppeteer.

```bash
node herramientas/capturar.js <ruta.html|URL>       una captura
node herramientas/capturar.js <ruta.html> --dirs    una por dirección de arte
node herramientas/capturar.js <ruta> --movil        375 px, como un teléfono
node herramientas/capturar.js --bases               las 5 bases por dirección
node herramientas/capturar.js --referencias         el tablero de referencias
```

Las capturas caen en `capturas/` (ignorada por git). **Después de capturar,
ábrela con la herramienta de lectura de archivos.** Una captura que no se mira
no sirve de nada.

Si una página remota sale en blanco, súbele `--espera 20000`: se estaba
capturando a medio pintar.

Si la página es larga y la captura se corta, súbele `--alto 2600`: la
ventana por defecto es de 1400 px y lo de abajo no sale.

---

## La captura también es código: mide antes de acusar

**Dos veces** en este sistema estuve a punto de reportar un defecto que no
existía, y en las dos el que mentía era la herramienta, no la página.

| Lo que parecía | Lo que era |
|---|---|
| En el móvil las imágenes salían cortadas | Chrome no baja de ~500 px de ventana, así que `--window-size=375` daba 500. Arreglado con `--movil`, que mete la página en un iframe del ancho real |
| La franja "no llegaba" al borde derecho: quedaba una tira blanca de 16 px | El documento medía 1264 px y el lienzo de la captura 1280: la tira es el hueco de la barra de scroll. La franja iba de 0 a 1264, exacta |

Reportar un defecto que no existe cuesta la credibilidad de todos los que sí
existen. Así que **antes de escribir un hallazgo de geometría, mídelo en el
navegador**: copia la página a una carpeta temporal, inyecta antes de
`</body>` un script que escriba las medidas encima de la página, y captura
esa copia.

```html
<script>
addEventListener("load", () => {
  const r = document.getElementById("franja").getBoundingClientRect();
  const d = document.createElement("div");
  d.style.cssText = "position:fixed;top:0;left:0;z-index:99999;"
                  + "background:#000;color:#0f0;font:16px monospace;padding:8px";
  d.textContent = "doc:" + document.documentElement.clientWidth
    + " franja:" + Math.round(r.left) + "→" + Math.round(r.right)
    + " scrollW:" + document.documentElement.scrollWidth;
  document.body.appendChild(d);
});
</script>
```

`scrollWidth` mayor que `clientWidth` = hay scroll horizontal de verdad.
Iguales = la página está bien y lo raro es la captura.

**Nunca en el archivo real**: la sonda va en una copia temporal.

---

## Qué mirar, en este orden

El orden importa: los defectos de arriba tapan los de abajo.

### 1 · ¿Hay algo? ¿Está completo?

Página en blanco, una sección que no se pintó, el pie flotando en medio de la
nada. Es el fallo que más veces llegó a una entrega en este sistema, y siempre
por la misma causa: `getElementById` de un id que no existe devuelve `null`, la
línea lanza, y **todo el JavaScript posterior deja de ejecutarse**.

### 2 · ¿Es del cliente o del ejemplo?

El nombre, el catálogo, el WhatsApp, los horarios, la dirección, el Instagram.
Un entregable de "Tacos Mauricio" que dice "Café Raíz" ya se entregó una vez.
Busca también el dominio del ejemplo y el correo de demo.

### 3 · Geometría: lo que ninguna prueba ve

Aquí vive la mayoría de lo que se siente "meh". Todos estos son defectos
reales que se encontraron **mirando**, con las pruebas en verde:

| Qué buscar | El caso real |
|---|---|
| **Huecos en la rejilla** | Tres productos en una rejilla de cinco columnas con `auto-fill`: dos columnas vacías a la derecha |
| **Estados vacíos que dominan** | `aspect-ratio:3/4` sin foto = un vacío de 427 px de alto con un emoji de 44 px flotando en el centro |
| **El alto lo manda el hueco, no el texto** | En la carta, ~130 px entre platos porque el recuadro vacío era más alto que el contenido. Parece desarmada, no aireada |
| **Tarjetas hermanas desalineadas** | La tarjeta agotada no tiene línea de stock, así que su precio queda a media altura |
| **Océanos horizontales** | El precio a 700 px del nombre del plato, sin nada que los conecte |
| **Una sección con cinco palabras** ocupando el mismo alto que una de cinco frases | Un bloque de horarios con su propio separador y su propio rótulo |
| **El acento que no destaca** | Cuando el suelo, la tinta y el acento son del mismo matiz |

### 4 · Jerarquía

¿Lo primero que ve el ojo es lo más importante? Si el titular y la primera
tarjeta pesan igual, no hay jerarquía.

### 5 · El texto

¿Suena a plantilla genérica o a **este** negocio? ¿Hay un `Lorem`, un
"Próximamente", un placeholder que se colara?

### 6 · Móvil

`--movil` captura a 375 px. Lo que se rompe ahí: rejillas que desbordan, tablas
sin `overflow-x`, titulares que se cortan, botones que no alcanzan a caber.

---

## Cómo se escribe un hallazgo

Accionable o no sirve. Malo y bueno del mismo defecto:

```
mal   "La jerarquía visual podría mejorarse y el espaciado se siente
       inconsistente en algunas secciones."

bien  "En boutique el recuadro sin foto mide 320×427 px y el emoji flota en
       el centro: el producto parece no existir. Acotar `.sinfoto` a
       `aspect-ratio:3/2; max-height:190px` — la foto real conserva su 3/4."
```

Un hallazgo trae: **dónde**, **qué se ve**, **qué cambiar** y **a qué valor**.
Máximo seis por página, ordenados por importancia. Sin introducción ni cierre.

---

## Lo que NO se reporta

- Nada que el validador gratis ya cubra: contraste WCAG, `alt` faltante, XSS
  por `innerHTML`, tokens CSS muertos, foco por teclado, RLS de Supabase.
  Córrelo antes: `node herramientas/validar.js <ruta>`. Cuesta $0.
- Defectos que no puedas confirmar. Un color que "parece raro" en una captura
  comprimida puede ser el antialias del renderizado. **Verifica en el CSS
  antes de afirmarlo** — reportar un bug que no existe cuesta credibilidad.

---

## La regla final

**El dueño encuentra los bugs de verdad.** Cuando diga que algo se ve mal,
empieza por creerle y reproducirlo, no por explicar por qué debería funcionar.

Y un entregable está listo cuando pasa el validador **y** él lo abrió y le
gustó. Las dos cosas. Tu trabajo termina en "aquí está la captura, míralo".
