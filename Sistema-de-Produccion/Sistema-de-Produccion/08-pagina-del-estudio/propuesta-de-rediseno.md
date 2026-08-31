# Rediseño de la página del estudio — auditoría y dirección de arte

Fecha: 2026-07-29. Aplicado en `index.html` (la versión anterior quedó en
`versiones/index-v1.html`).

---

## 1. Auditoría de la versión anterior

### El diagnóstico de fondo

La página no estaba mal construida. Estaba **genérica**.

Space Grotesk + Inter, emojis como iconos, todo centrado en una columna de
880 px, tarjetas con `border-radius:14px`. Esa combinación exacta es el
resultado por defecto de cualquier plantilla o generador de los últimos
años. Por eso se sentía plana aunque los textos fueran correctos: el ojo ya
la vio mil veces y deja de mirar.

Para un estudio de diseño esto pesa doble. La página propia **es** el
portafolio: si se ve como una plantilla, el mensaje que llega es que el
trabajo también lo será.

### Problemas concretos

| # | Problema | Evidencia |
|---|---|---|
| 1 | Cero microinteracciones | Ni un solo `:hover` en 94 líneas. Ni en el CTA. Un botón que no responde se lee como roto. |
| 2 | Sin jerarquía | Las secciones usaban `padding: 46px / 46px / 50px`. Todo pesa igual, nada destaca. |
| 3 | Ritmo plano | Todo centrado, una columna, cuatro tarjetas idénticas. Sin tensión visual. |
| 4 | Color desperdiciado | `--accent:#E8A02C` declarado y **nunca usado**. La paleta real era un azul y grises. |
| 5 | Sin foco visible | La regla #9 del sistema lo exige. `indice.html` sí lo tenía; la página pública no. |
| 6 | Enlaces sin señal | `a{color:inherit}` elimina la pista visual de que algo es un enlace. |
| 7 | Sin metadatos | Ni `<meta description>` ni Open Graph. Compartir el enlace por WhatsApp no mostraba nada — en un negocio que vive de WhatsApp, es venta perdida. |
| 8 | Sin modo oscuro | En 2026 es expectativa, no diferencial. |
| 9 | Sin prueba | 9 demos reales en el repo y ni un enlace a ellas. |

El problema 9 era el más caro de todos, y el más fácil de arreglar.

---

## 2. Benchmark

Lo que hacen los estudios pequeños que convierten bien:

- **El hero es una tesis, no un eslogan.** Muestran su forma de trabajar
  en vez de describirla con adjetivos.
- **Retículas asimétricas con rail de metadatos** — la estructura de una
  hoja de especificación, no la columna centrada.
- **Tipografía expresiva**: una display con carácter contra una body
  neutra. No dos grotescas parecidas, que es lo que había.
- **Movimiento con propósito**: revelado al hacer scroll, respuesta al
  hover. Nada de confeti.
- **Oscuro refinado**: nunca negro puro; neutros con sesgo de tono.

**Sobre glassmorphism:** es de 2021 y hoy se lee viejo. Descartado.

### Nota técnica sobre el encargo original

El pedido mencionaba Tailwind CSS, Framer Motion y AOS. El `CLAUDE.md` del
sistema prohíbe frameworks pesados y exige páginas autocontenidas, y hoy
no hacen falta:

| Se pidió | Se usó | Costo |
|---|---|---|
| AOS | `IntersectionObserver` | 12 líneas |
| Framer Motion | `transition` + `cubic-bezier` de CSS | 0 |
| Tailwind | Custom properties + `gap` | 0 |

Cero dependencias, cero paso de build, un solo archivo que abre con doble
clic. Coherente con el resto del sistema.

---

## 3. Dirección de arte: "Ficha técnica"

### La idea

La tesis del estudio es *"una base, muchos negocios"*. Entonces la página
**se reconfigura a sí misma**: el conmutador del hero cambia entre las
fichas reales de restaurante, tienda y clínica, y con ellas cambian los
tokens de marca, el YAML visible y la vista previa del producto.

Es el argumento de venta ejecutado en vivo, en un gesto. Y es imposible de
copiar de una plantilla, porque sale del producto propio.

### Paleta

Neutros con sesgo verde pino — elegidos, no heredados. Un gris neutro puro
se lee como descuido.

| Rol | Claro | Oscuro |
|---|---|---|
| Fondo | `#EFF2EF` | `#121815` |
| Superficie | `#FFFFFF` | `#19211D` |
| Hundido | `#E3E9E4` | `#0D120F` |
| Tinta | `#131A17` | `#EDF1ED` |
| Tinta suave | `#4E5C54` | `#A8B6AD` |
| Línea | `#CBD6CE` | `#2A3630` |
| **Acción** (arcilla) | `#E8552F` | `#FF7048` |
| **Sistema** (jade) | `#6FBF9B` | `#7FD0AB` |
| **Datos** (latón) | `#D9A441` | `#E3B75C` |

Tres acentos con trabajo distinto, no un azul solo. Identidades de cliente
para el conmutador: restaurante `#C2410C`, tienda `#1F6B4A`, clínica
`#2563A8`.

### Tipografía

Sin CDN — el sistema exige archivos autocontenidos y una fuente que no
carga deja la página en una tipografía de respaldo sin avisar.

| Rol | Familia |
|---|---|
| Display | `Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif` |
| Body | `system-ui, -apple-system, Segoe UI, Roboto, sans-serif` |
| Mono | `ui-monospace, Cascadia Mono, SF Mono, Menlo, Consolas` |

El contraste entre el serif grande y la mono pequeña en versalitas es lo
que da carácter. Escala fluida con `clamp()`, `text-wrap: balance` en
títulos.

### Composición

Rail de metadatos fijo de 184 px (mono, versalitas, `position:sticky`) más
columna de contenido ancha. Asimétrico desde el primer scroll. Por debajo
de 820 px colapsa a una columna.

---

## 4. Cambios por componente

| Componente | Antes | Ahora |
|---|---|---|
| **Navbar** | no existía | marca + punto que toma el color de la identidad activa + botón de tema |
| **Hero** | h1 centrado de 48 px + CTA | h1 hasta 5rem con palabra en acento; **conmutador YAML → producto** |
| **CTA** | plano, sin estado | `translateY(-2px)`, sombra en el color de marca, flecha que avanza al hover |
| **Servicios** | 4 cajas iguales con emoji | rejilla con separadores de 1px, código de base, chips de tecnología, hover de fondo |
| **Proceso** | 4 cajas iguales | filas con numeral serif de 2.1rem — numerado **porque sí es una secuencia real** |
| **Prueba** | no existía | 4 enlaces a las demos del repo. Credibilidad sin inventar testimonios |
| **Footer** | dos `<span>` | mono en versalitas, alineado al rail |
| **Global** | — | `:focus-visible`, `prefers-reduced-motion`, dos temas, revelado al scroll |

### Sobre la numeración

El sistema advierte que numerar (01 / 02 / 03) suele ser decorativo. Aquí
se conservó **solo en el proceso**, porque es una secuencia real donde el
orden es información que el lector necesita. En servicios no se numeró:
ahí el número indica qué base del sistema lo resuelve, que sí dice algo.

---

## 5. Estado y qué falta

**Hecho:** rediseño aplicado en `index.html`, con `<meta description>`,
Open Graph y Twitter Card.

**Falta, y depende de datos que solo tú tienes:**

- [ ] Reemplazar `[NOMBRE DEL ESTUDIO]`, `[TU NÚMERO DE WHATSAPP]`, `[TU CIUDAD]`
- [ ] Reemplazar `[TU DOMINIO]` en las etiquetas Open Graph
- [ ] Crear la imagen de Open Graph (1200×630) y guardarla como `og.jpg`
- [ ] Decidir hosting y publicar

**Sigue sin haber, a propósito:** testimonios y cifras. No se inventan. La
prueba social ahora son las demos reales, que es prueba de verdad.

---

## 6. Pasada de usabilidad (2026-07-29, misma tarde)

Segunda revisión sobre la misma página, ya sin tocar la dirección de arte
— solo corrigiendo comportamiento y cerrando huecos de accesibilidad que
la primera pasada dejó.

### Bug corregido

- **Parpadeo de color al cargar.** `aplicar('restaurante')` se ejecuta al
  final del `<body>`, pero el HTML estático no tenía `data-marca` en
  `<html>`. Resultado: la página pintaba primero con el acento por
  defecto del estudio (`#E8552F`) y saltaba al de restaurante (`#C2410C`)
  una fracción de segundo después. Se corrigió poniendo
  `data-marca="restaurante"` directo en la etiqueta `<html>`, para que
  coincida con lo que el script va a fijar de todos modos.

### Usabilidad

- **El tema ahora se recuerda.** Antes, cada recarga volvía al tema del
  sistema operativo aunque el visitante hubiera elegido oscuro a mano.
  Se guarda en `localStorage` y un script孤 pequeño en el `<head>` lo
  restaura *antes* de pintar, para no repetir el mismo problema de
  parpadeo que se acaba de corregir arriba.
- **El botón de tema ahora dice lo que hace.** Decía "Tema" siempre —
  no distinguía estado. Ahora lee "☾ Modo oscuro" o "☀ Modo claro" según
  lo que se vería al presionarlo (regla del sistema: *un control dice
  exactamente qué pasa*).
- **El conmutador de identidad pasó de "grupo de botones" a
  `radiogroup`.** Semánticamente es lo correcto — es exactamente-uno-de-
  tres, no varios interruptores independientes — y de paso se ganó
  navegación con flechas (← → ↑ ↓, Home, End), que es el comportamiento
  esperado de un grupo de radios y no existía antes.
- **Los enlaces que abren pestaña nueva ahora lo dicen con la flecha.**
  `→` para moverse dentro de la misma página (el CTA a `#contacto`);
  `↗` para todo lo que abre en otra pestaña (WhatsApp, las 4 demos). Es
  información, no decoración — la regla de "la estructura debe codificar
  algo verdadero" aplicada a un detalle pequeño. Las tarjetas de demo
  también ganaron `target="_blank"`: antes navegaban lejos de la página
  de venta y el visitante perdía el hilo.
- **"Volver arriba" en el footer.** Es una página de una sola scroll con
  5 secciones; sin esto, llegar al final significaba scrollear todo de
  vuelta a mano.
- **Salto por ancla con aire.** `#servicios`, `#trabajo` y `#contacto`
  ahora tienen `scroll-margin-top`, así que el título no queda pegado al
  borde superior de la ventana al saltar. Se agregó también
  `scroll-behavior: smooth`, desactivado bajo `prefers-reduced-motion`.
- **Favicon propio.** La pestaña del navegador estaba en blanco. Un
  círculo en el color del estudio, SVG en línea — mismo símbolo que el
  punto de la barra superior, sin archivo aparte.
- **Dos estados de hover que faltaban:** el botón "Agregar al carrito" /
  "Pedir por WhatsApp" de la vista previa (`.pv-cta`) y la sombra +
  animación de flecha en las tarjetas de demo (`.wcard`), reusando el
  mismo lenguaje de movimiento que ya tenía el CTA principal — mismo
  idioma en todo el sitio, no efectos sueltos por componente.

### Único elemento visual nuevo: la barra de progreso

Una línea de 3px en la parte superior que se llena con el color de marca
según el avance del scroll. Se justifica por la misma metáfora que ya
tenía la página — la "ficha técnica", el instrumento con lectura — no es
un efecto añadido porque sí. Sin transición de ancho (un indicador de
posición debe responder al instante, no flotar); si el visitante prefiere
menos movimiento, no depende de ella para nada funcional.

Deliberadamente no se agregó nada más "vistoso" en esta pasada — la
apuesta visual de la página ya está gastada en el conmutador del hero, y
la nota de diseño es clara: sumar una segunda pieza llamativa competiría
con la primera en vez de reforzarla.
