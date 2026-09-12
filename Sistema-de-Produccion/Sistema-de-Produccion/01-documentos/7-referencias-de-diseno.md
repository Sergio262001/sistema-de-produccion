# Referencias de diseño · por categoría

Insumo para el skill `direccion-de-arte`. Dijiste que **ninguna** de las tres
direcciones actuales es la tuya, así que esto no confirma lo que hay: lo
reemplaza.

> **Cómo se usa esto.** No como una lista de páginas bonitas para admirar. De
> cada una se extrae **el mecanismo**: qué decisión tomaron y a qué valor. Lo
> que va al skill son los mecanismos, no las capturas.

---

## 0 · Por qué lo que hay se siente "meh" — con nombre propio

Los tokens de la base estrella (`menu-con-panel-admin`, dirección `boutique`):

```
--bg:     #F3ECE0   crema cálido
--display:'Fraunces', serif
--accent: #C2703D   terracota
```

Crema cálido + una serif de display + acento terracota es, hoy, **la firma
más reconocible del diseño generado por IA.** No es una dirección de arte:
es el valor por defecto en el que cae cualquier modelo al que le pidas "algo
elegante y artesanal".

Y `taller` es la segunda de esa lista: IBM Plex sobre casi-blanco, todo a
8 px de radio.

Por eso ninguna de las tres te representa. **Tu instinto estaba bien y tenía
una causa concreta.** Las otras señales de la misma familia, para no repetirlas:

- Negro casi puro con un solo acento verde ácido o vermellón.
- Degradado morado-a-azul en el hero, sobre blanco.
- Inter o Space Grotesk como tipografía "segura". *(Las nuestras: `landing-modular` y `marketplace` usan Space Grotesk + Inter.)*
- Emoji como icono de sección. *(Estaba en `landing-modular` hasta hoy.)*
- Todo centrado. Todo con `border-radius` mediano. Tarjetas con barra de acento.

---

## 1 · Colorimetría (transversal, aplica a todas las categorías)

### El espacio de color: OKLCH

**Qué resuelve.** En HSL, un amarillo al 50 % de luminosidad se ve
dramáticamente más brillante que un azul al mismo 50 %. En OKLCH, 50 % de
luminosidad **se ve** como un tono medio en cualquier matiz. Es perceptualmente
uniforme: un cambio numérico igual produce un cambio percibido igual.

**Por qué importa para un sistema como el nuestro.** Toda la promesa de las
bases es "cambias `--brand` en la ficha y el sitio se retematiza". Con hex/HSL
eso es una lotería: un cliente pone un amarillo y el texto blanco sobre su
botón deja de leerse. Con OKLCH, la escala de un cliente se genera moviendo
**solo la luminosidad** y el contraste se mantiene.

**Estado real:** soportado en todos los navegadores modernos, y Tailwind v4 lo
usa internamente para su paleta por defecto.

**Contraste.** APCA (el algoritmo de WCAG 3) está alineado con OKLCH porque
ambos se diseñaron alrededor de la uniformidad perceptual: llegar a Lc 75 para
texto de cuerpo pasa de ser seis iteraciones a un solo ajuste. Nuestro
`lib/colores.js` hoy calcula WCAG 2.1 — sigue siendo el requisito legal, pero
APCA es mejor para decidir.

**Decisión de ingeniería:** autorar en OKLCH y **entregar hex calculado**. Los
clientes en Colombia abren desde teléfonos viejos; el hex no discute con nadie.
El generador puede hacer la conversión.

### El método de paleta que usan casi todas las referencias

**Un solo acento hace todo el trabajo.** La paleta es casi enteramente negro,
blanco y gris, y **un** color carga con todo: el degradado de Stripe, el morado
de Linear, el blanco-sobre-negro de Vercel con toques de azul muy escasos. Un
color usado con avaricia pega más fuerte que cinco usados en todas partes.

**Los neutros se eligen, no se heredan.** Un gris medio puro se lee como "no lo
pensé". Un gris con un sesgo leve de matiz hacia el acento se lee como
"elegido".

---

## 2 · Tienda online (`ecommerce-completo`, `carrito-reutilizable`)

La regla de la categoría: **la foto vende, la página se quita del medio.**

| Referencia | El mecanismo replicable |
|---|---|
| **Apple** | Negro, blanco y gris, nada más. Tipografía y color **subordinados** a la imagen de producto. El sitio no compite con lo que vende |
| **Allbirds** | Paleta natural apagada — verdes, grises, cremas — que conecta visualmente con la misión ecológica. **La paleta como argumento de venta**, no como decoración |
| **AS Colour** | Neutros blancos y grises, tipografía refinada, navegación desplegable. Minimalismo que no es pobreza: el refinamiento está en el detalle del tipo |
| **Oroton** | Neutros suaves, navegación minimalista pero intuitiva, página de producto rica con foto limpia y zoom al detalle |

**Lo que esto dice de nuestra base.** El defecto que encontré en la primera
captura —los recuadros de foto vacíos dominando la página— es exactamente el
fallo de esta categoría: si la foto vende y no hay foto, **no puede quedar un
rectángulo gris gigante donde iba.** El respaldo tiene que ser discreto, no un
hueco.

---

## 3 · Menú digital (`menu-con-panel-admin`)

La categoría se partió en **dos mundos** y no hay que mezclarlos. La tipografía
es la que dice el precio antes de que se lea el número.

### Mundo A · Restraint editorial (alta cocina, especialidad)

| Referencia | El mecanismo |
|---|---|
| **Noma** (Copenhague) | Layout editorial limpio, fotografía a sangre completa, tipografía refinada que refleja el minimalismo escandinavo |
| **Atomix** (NYC, dos estrellas) | Tonos apagados y espacio en blanco generoso para transmitir lo íntimo y reservado. Paleta contenida **para que la foto de comida sea lo único que brilla** |

### Mundo B · Fast-casual con carácter propio

| Referencia | El mecanismo |
|---|---|
| **Sweetgreen · Chipotle · Nando's** | Sistemas de **tipografía e ilustración a medida** para diferenciarse de los defaults de la categoría. Color vivo, CTA orientada a la acción |
| **Disco Cheetah** | Retro, colores vibrantes, animación juguetona. Tipografía gruesa y gráfica funky que refleja la energía del local |

### La regla de tipografía de la categoría

- Sans delgada → **moderno y limpio**
- Slab gruesa → **abundante y con confianza** (fonda, parrilla, corrientazo)
- Script fluida → **artesanal y hecho a mano**

**Lo que esto dice de nuestra base.** Nuestros tres mundos deberían ser estos
dos más uno técnico, no "mercado/boutique/taller" con crema y Fraunces. Y
`mercado` (Archivo 800, bordes duros, sombra dura) es el único de los tres que
sí tiene una tesis propia — es el que hay que conservar.

---

## 4 · Landing y página de servicios (`landing-modular`, la tuya)

Aquí hay que tener cuidado, porque **esta categoría ya se homogenizó.**

### Los cuatro principios de Linear, Stripe y Vercel

1. **Contraste agresivo.** Negro sobre blanco o blanco sobre negro. Nada turbio
   en medio. Al entrar, el ojo sabe exactamente adónde ir.
2. **Espacio en blanco estratégico.** Regla operativa: *toma el espaciado que
   te parece suficiente, y duplícalo.*
3. **Base monocromática con un acento.** Ver el método de paleta arriba.
4. **Tipografía tensa.** Nada redondeado, amable ni acogedor: todo geométrico,
   apretado, ligeramente frío. Comunica "producto de infraestructura hecho por
   gente que se toma en serio el oficio".

Y lo más importante: **no son cuatro decisiones separadas, se refuerzan.** El
contraste alto necesita el espacio para no sentirse agresivo; el monocromo
necesita el tipo tenso para no sentirse aburrido.

### La advertencia

Ese look se volvió **tan influyente que ya es el default**: Stripe, Tailwind,
Linear y decenas de startups lo comparten. Copiar la piel te deja otra página
más del montón. **Lo que se replica es el método, no la piel.**

### Restraint premiada, como contrapeso

**By-Kin** (estudio del Reino Unido) se llevó cuatro premios incluidos Site of
the Day y el Developer Award de Awwwards. Lo describen como *"una clase magistral
de contención: tipografía editorial con confianza, scroll suave con peso, y
transiciones"*. Es la prueba de que contención ≠ aburrido.

### Tipografía premiada 2026 — para mirar, no para copiar

Typography Honors de Awwwards a lo largo de 2026: **MONOLOG**, **sakazuki**,
**Just Phil**, **Planetoño**, **日暮里ゼミナール (nippori seminar)**.

Tendencia transversal en lo premiado: **neutros cálidos tono champán con serif
sofisticada.** Ojo — es primo cercano del cliché crema+serif. La diferencia
está en la ejecución del tipo, no en la paleta.

---

## 5 · Marketplace y paneles (`marketplace`, `dashboard-analytics`, `crm-simple`)

Aquí el oficio cambia: un panel **se opera**, no se lee de arriba abajo. La
artesanía se mueve de la tipografía al **diseño de información**.

- El **resumen antes del detalle**. Lo que necesita atención se lee de un
  vistazo.
- El estado se codifica **en la forma además del número** — una pastilla, un
  chip, una franja de severidad. No solo en el color, porque el color solo
  falla para quien no lo distingue.
- El **color semántico** (bien / atención / crítico) es **independiente** del
  acento de marca, y no cuenta como el acento.
- Las minigráficas merecen el mismo cuidado que el tipo: relleno de área, grilla
  tenue, punto final enfatizado.
- Lo que es interactivo **tiene que verse** interactivo.

---

## 6 · Galerías para seguir mirando

| Galería | Para qué |
|---|---|
| [Awwwards · Typography winners](https://www.awwwards.com/websites/winner_category_typography/) | Lo mejor en tipografía, mes por mes |
| [Awwwards · Winning websites](https://www.awwwards.com/websites/) | Lo premiado en general |
| [Muzli · Ecommerce UI/UX](https://muz.li/inspiration/ecommerce-website/) | 60+ referencias de tienda |
| [SiteBuilderReport · Restaurantes](https://www.sitebuilderreport.com/inspiration/restaurant-websites) | 35+ sitios de restaurante |

---

## 6b · Lo que aprendí MIRANDO (no leyendo)

El tablero ya está capturado: `node herramientas/capturar.js --referencias`
trae 9 de 10 (Nando's bloquea headless). Y mirar las imágenes cambió el
diagnóstico. Dos hallazgos que ninguna descripción daba:

### Hallazgo 1 · Ninguna de mis tres direcciones hace lo que hace Atomix

Abrí `capturas/referencias/atomixnyc-com.png`. Un restaurante de dos estrellas
Michelin, y su portada es esto: **una fotografía a sangre completa que ocupa
toda la ventana**, el logo en línea fina, y tres palabras de navegación en
mayúsculas muy espaciadas flotando encima. Sin contenedor. Sin tarjeta. Sin
paleta visible — **la paleta la pone la foto.**

Mi dirección `boutique` hace algo distinto: página blanca, serif, aire y
márgenes. Es contención *de página*. Atomix es **la imagen como suelo**.

Eso es una dirección que el sistema **no tiene**, y probablemente es la que
falta para "replicar páginas increíbles". Candidata: `galeria` — la foto es el
fondo a sangre, el texto vive encima en mayúsculas espaciadas, y los tokens de
color se reducen a blanco/negro porque el color viene de la imagen.

**Requisito honesto:** exige fotos buenas. Sin foto del cliente, esta dirección
no se puede ofrecer — y eso hay que decírselo antes de venderla.

### Hallazgo 2 · El método de Stripe no es el degradado

Abrí `capturas/referencias/stripe-com.png` esperando el degradado famoso. Lo
que manda la página no es eso: es que **el titular es gigante y de dos colores**
— la primera frase en tinta casi negra, la continuación en un gris azulado más
claro, en la misma tipografía y el mismo tamaño. El degradado vive **detrás**,
recortado en diagonal, y no toca el texto.

O sea: la jerarquía la hace el **color del texto dentro de un mismo bloque**, no
el tamaño ni el peso. Eso es replicable en dos líneas de CSS y no lo estaba
usando en ninguna base.

---

## 7 · El tablero de referencias

El problema de una lista como esta es que son **palabras sobre diseño**. Yo no
vi esas páginas; leí descripciones.

Eso ya se puede arreglar. El Chrome que tienes instalado toma capturas sin
instalar nada, **y funciona con URL remotas** — lo probé con `stripe.com`
(416 KB, 5 segundos). Entonces:

```
node herramientas/capturar.js https://... --ancho 1440
```

Con eso se arma `01-documentos/referencias/` con las capturas de las páginas de
arriba, y la dirección de arte se deriva de **píxeles reales**, no de prosa de
listicle. Y tú abres la carpeta, miras, y señalas cuáles son tuyas.

Así "ninguna dirección me representa" se convierte en dos o tres direcciones
que sí.
