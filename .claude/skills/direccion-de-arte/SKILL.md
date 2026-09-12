---
name: direccion-de-arte
description: Cómo se decide y se ejecuta la dirección de arte de un entregable del estudio — paleta, tipografía, escala, ritmo. Úsala antes de tocar un token CSS, de elegir una tipografía o de opinar sobre si algo "se ve bien". Incluye la lista de defaults que están prohibidos porque delatan diseño generado.
---

# Dirección de arte

Cambiar el color **no** cambia el diseño. Dos clientes con paletas distintas
recibían el mismo sitio pintado de otro color, y eso es lo que hace que un
entregable se sienta a plantilla aunque el contraste pase y el código esté bien.

Una dirección de arte cambia **tipografía, escala, forma, peso de línea y
ritmo**. Se elige en la ficha: `marca.direccion`.

---

## Lo que está PROHIBIDO, y por qué

Estos son los defaults en los que cae cualquier modelo al que le piden "algo
bonito". Si tu propuesta se parece a uno de estos, **no la entregues**: es la
firma reconocible del diseño generado, y el dueño de este estudio ya la
identificó en su propio sistema.

| Prohibido | Por qué |
|---|---|
| **Crema cálido + serif de display + acento terracota** | La firma número uno. Estuvo en la base estrella de este sistema (`#F3ECE0` + Fraunces + `#C2703D`) y fue exactamente lo que se sentía "meh" |
| Negro casi puro con un solo acento verde ácido o vermellón | Segunda firma |
| Degradado morado-a-azul en el hero, sobre blanco | Tercera |
| Inter o Space Grotesk como tipografía "segura" por defecto | No es una elección, es la ausencia de una |
| Emoji como icono de sección | No dice nada del negocio |
| Todo centrado | El texto alineado a la izquierda se lee mejor y deja que el titular ocupe el ancho que quiera |
| `border-radius` mediano en todo | Una forma repetida sin razón |
| Tarjetas con barra de acento al borde | Adorno sin información |
| Barras de números decorativas (01 / 02 / 03) | Solo van si el contenido **es** una secuencia real |

**Y la trampa de origen:** copiar el look de Linear/Stripe/Vercel. El método
es excelente; la piel ya es el default de la industria. Se replica el método.

---

## El método de paleta

### Un solo acento hace todo el trabajo

La paleta es casi enteramente neutra y **un** color carga con todo. Un color
usado con avaricia pega más fuerte que cinco usados en todas partes.

### Los neutros se eligen, no se heredan

**Este es el error que tuvo este sistema.** Cinco bases, dos rampas de neutros
copiadas: `#F5F7FB / #0F1626 / #454F66 / #E2E7F0` — los cuatro azules, igual
que el acento. El azul de marca nadaba en un mar de su propio matiz y no tenía
contra qué destacar. La página se veía plana **aunque el contraste pasara**.

La regla: un gris medio puro se lee como "no lo pensé"; un gris con un sesgo
**leve** hacia el acento se lee como "elegido". Leve, no al 100 %.

```
mal   --bg:#F5F7FB  --ink:#0F1626   con acento #2F54FF   (todo es azul)
bien  --bg:#FFFFFF  --ink:#0A0A0B   con acento #2F54FF   (el acento es lo único con color)
bien  --bg:#F6F6F4  --ink:#15161A   con acento #1B36C9   (suelo papel, tinta casi neutra)
```

### Color semántico ≠ acento

Bien / atención / crítico van por su cuenta y **no cuentan** como el acento de
marca. Y el estado nunca se codifica solo en color: también en forma — una
pastilla, un chip, una franja.

### OKLCH para razonar, hex para entregar

En HSL un amarillo al 50 % de luminosidad se ve mucho más brillante que un azul
al 50 %. En OKLCH, 50 % **se ve** medio en cualquier matiz. Eso es lo que hace
posible la promesa del sistema: el cliente cambia `--brand` y la escala se
recalcula sin romper el contraste.

Razona la rampa en OKLCH; **escribe hex en el entregable.** Los clientes abren
desde teléfonos viejos y el hex no discute con nadie.

---

## Las tres direcciones del sistema

Se eligen con `marca.direccion`. Cualquier otro valor cae en `taller`.

### `mercado` — denso, alto contraste, el precio manda

Fondas, corrientazos, panaderías, ferreterías, tiendas de barrio: negocios de
volumen donde lo aspiracional estorba y lo que se mira es cuánto cuesta.

```
--display/--body: 'Archivo' (o una sans de palo grueso)
--radius:3px  --borde:2px  --sombra:4px 4px 0 var(--ink)
--peso-titulo:800  --tracking:-.03em  --ritmo:.85
precio: en la display, peso 800, un grado más grande
```

Hero en mayúsculas. Bordes en `--ink`, no en `--line`. Sombra dura desplazada,
no difusa. Categorías en cajas cuadradas con borde de 2 px.

### `boutique` — aire, editorial, sin ruido

Ropa de diseñador, joyería, café de especialidad, restaurante de autor:
lo que se cobra caro necesita espacio en blanco y el precio en voz baja.

```
--display:'Fraunces'|Georgia serif   --body:'Karla'
--radius:0  --borde:0  --sombra:none
--peso-titulo:600  --tracking:-.005em  --ritmo:1.35–1.5
precio: en la body, peso 500, MÁS PEQUEÑO que en las otras
```

Sin bordes en las tarjetas. Foto en proporción retrato (3/4). Categorías como
subrayado, no como pastilla. Hero más estrecho (`44ch`) y más grande.

**Ojo:** esta es la que más fácil cae en el cliché. Si el suelo es crema y el
acento terracota, ya no es boutique: es el default. El aire y la escala son la
dirección, no la paleta sepia.

### `taller` — ficha técnica, funcional

Clínicas, servicios B2B, repuestos, insumos, menú del día: el dato manda y la
página se tiene que leer como un catálogo, no como una campaña.

```
--display/--body: una sans neutra de buen dibujo (IBM Plex Sans)
--radius:8px  --borde:1px
precio: en MONO
```

---

## Reglas de ejecución que no dependen de la dirección

**Tipografía.** Dos familias como mínimo, con papeles distintos. Texto corrido
cerca de 65 caracteres de ancho. Una escala de tamaños, y no salirse de ella.
`text-wrap: balance` en los titulares. Las etiquetas en mayúsculas llevan
`letter-spacing`.

**Espaciado.** El layout hace el espaciado: `flex`/`grid` con `gap`, no
márgenes por elemento que se colapsan o se duplican. Regla operativa para el
aire: *toma el espaciado que te parece suficiente y duplícalo.*

**Rejillas.** `auto-fit`, no `auto-fill`. Con `auto-fill`, tres productos en
una rejilla de cinco columnas dejan dos huecos vacíos y la página se ve rota.
Y `minmax(min(100%, 240px), 1fr)` para que en un teléfono no desborde.

**Números en columna.** `font-variant-numeric: tabular-nums` siempre que los
dígitos se alineen verticalmente (precios en una lista, un panel).

**Estados vacíos.** Un recuadro sin foto **no reclama** la proporción de una
foto real. En este sistema, un `aspect-ratio:3/4` sin imagen dejaba un vacío
de 427 px con un emoji flotando en el centro. Banda modesta, opacidad baja, y
se acaba. Un hueco honesto se ve mejor que un relleno inventado — pero un
hueco **enorme** no es honesto, es un defecto.

**Una tarjeta se alinea con sus hermanas.** Si una no tiene línea de stock, su
precio no puede quedar a media altura: la fila del precio va al fondo
(`margin-top:auto`).

---

## Antes de decir que está listo

1. ¿La paleta tiene **un** acento, o tiene cuatro colores compitiendo?
2. ¿Los neutros están elegidos, o son el acento diluido?
3. ¿Se reconoce alguno de los prohibidos de arriba?
4. ¿Las tres direcciones se ven **distintas** o es la misma con otra fuente?
5. ¿Hay foco visible por teclado? ¿`prefers-reduced-motion`?
6. ¿Lo miraste? Que compile no es que funcione, y que el contraste pase no es
   que se vea bien. Usa `revision-visual`.
