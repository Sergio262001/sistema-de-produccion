---
name: base-tecnica
description: Cómo está construida una base técnica del sistema de producción — el CONTEXT, applyTheme, los bloques de página, los adaptadores, qué nunca se toca, los marcadores de andamiaje de demo y los marcadores INMERSIVO que no se editan a mano. Úsala antes de editar cualquier demo.html de 02-bases/ o de entender por qué un entregable salió con datos del ejemplo.
---

# Cómo funciona una base

Flujo del sistema: `CONTEXTO (ficha YAML) → BASE TÉCNICA → PRODUCTO FINAL`.

Hay 10 bases en `Sistema-de-Produccion/Sistema-de-Produccion/02-bases/`.
**La fábrica es de solo lectura** cuando trabajas en un entregable: si algo hay
que arreglar ahí, se dice, no se toca a mitad de una entrega.

---

## La anatomía de un `demo.html`

Un solo archivo autocontenido que abre con doble clic (sin imports ES, porque
por `file://` no funcionan). La versión modular vive en `src/`.

```
<style>          tokens + direcciones de arte + componentes
<div class="sysbar">   andamiaje de demo — se BORRA al generar el proyecto
<div class="app">      la página del cliente
<script>
  const CONTEXT = {...}    ← la ficha, incrustada
  let DATA = {...}         ← la semilla del catálogo
  esc() urlSegura() medio()
  applyTheme()             ← lee CONTEXT y pinta TODO
  pintarPagina()           ← los bloques: hero, sobre, horarios, pie
```

### `CONTEXT` es la única fuente de verdad

```js
const CONTEXT = {
  cliente: "...",
  marca: { primario, secundario, inicial, direccion, logo, banner },
  pagina: { hero:{titular,bajada}, sobre:{texto}, horarios:[], ubicacion:{}, redes:{} },
  base_de_datos: { motor: "supabase" | "firebase" | "local" },
  apis: { pagos, whatsapp_num, mensajeria, analitica },
  auth: { motor, rol_requerido },
  moneda: "$",
};
```

**`applyTheme()` lo lee y sobreescribe el HTML al arrancar.** Esta es la causa
del bug que más costó: cambiar el `<title>`, el logo y los tokens CSS no sirve
de nada si el `CONTEXT` no cambia — a los 50 ms la página vuelve a decir lo
que dice el objeto.

Por eso `crear-proyecto.js` parchea el `CONTEXT` campo por campo
(`ponerEnContexto`) y no solo el marcado.

### `DATA` es la semilla del catálogo

Tiene que llamarse **`let DATA`** y tener forma `{ categorias: [...] }`, porque
eso es lo que `ponerContenido()` sabe reemplazar con el catálogo real del
cliente.

**El caso real:** `carrito-reutilizable` llamaba a su semilla
`const PRODUCTOS` (un array plano). El generador buscaba `let DATA`, no lo
encontraba, y **devolvía el HTML intacto sin avisar**: toda tienda entregada con
esa base salía con el menú del café de ejemplo.

`marketplace` está excluido a propósito (`puedeSembrar()`): su `DATA` lleva
`vendedores` y cada producto pertenece a uno. Sembrarlo los borraría y
`renderCatalogo` se caería.

---

## Lo que nunca se rompe

**Los `id` que el script pide tienen que existir en el marcado.**
`getElementById` de un id inexistente devuelve `null`, la línea lanza
`TypeError`, y **todo el JavaScript posterior deja de ejecutarse**: la página
muestra el encabezado y nada más.

Pasó al borrar la sysbar, que contenía `sysClient` y `sysAdapter`. Por eso el
generador **conserva los id como elementos ocultos** en vez de borrarlos, y hay
una regla del validador (`id-fantasma`) que lo vigila.

Las funciones que tocan el DOM aguantan que el elemento no exista:

```js
function pintarLogo(el, m, cliente){
  if(!el) return;          // ← sin esto, un id borrado tumba el script entero
```

**Cada `<script>` tiene que compilar.** Hay una regla (`sintaxis`) que lo
comprueba con `new Function`, porque tres veces una regex perdió sus barras
invertidas al inyectar código y el archivo dejó de compilar.

---

## Andamiaje de demo: `@demo-only`

La sysbar (el conmutador de vistas, de direcciones de arte y de logo) es para
enseñarle la base a un cliente. **No va al entregable.**

Borrar el marcado no basta: deja vivas las funciones que esos botones
llamaban — código muerto que además apunta a archivos de ejemplo. Por eso:

```js
/* @demo-only
   ... la función del conmutador ... */
function verMarca(con){ ... }
/* @fin-demo */
```

`crear-proyecto.js` borra **todo** lo que quede entre los dos marcadores. Si
agregas andamiaje nuevo a una demo, envuélvelo así.

*(Y no repitas los literales `@demo-only` / `@fin-demo` dentro del comentario
explicativo: el borrado corta en la primera aparición.)*

---

## Piezas copiadas: los marcadores `INMERSIVO`

Las cuatro bases de venta (`ecommerce-completo`, `carrito-reutilizable`,
`marketplace`, `menu-con-panel-admin`) llevan un bloque de CSS y otro de JS
entre estos marcadores:

```
/* ══ INMERSIVO · copiado de 03-componentes-ui/inmersivo.css ══ */
...
/* ══ fin INMERSIVO ══ */
```

Es la franja, la sección partida, las texturas y la portada a sangre. **Lo de
en medio NO se edita en la base.** La fuente de la verdad es
`03-componentes-ui/inmersivo.css` y `inmersivo.js`, y se lleva a las bases con:

```bash
node herramientas/llevar-inmersivo.js            # aplica
node herramientas/llevar-inmersivo.js --revisar  # solo dice qué base está atrasada
```

Correrlo otra vez reemplaza lo que hay entre marcadores. Así que un arreglo
hecho a mano dentro de una base **se pierde en la próxima corrida**, sin
aviso. Por eso hay un hook (`.claude/hooks/proteger-inmersivo.mjs`) que
bloquea editar esa zona con Edit o Write: si te frena, el arreglo va en el
componente.

`landing-modular` no lleva marcadores: ahí nació la pieza y su versión es más
avanzada (plantillas, galería, sectores). Se edita directo.

Fuera de los marcadores, la herramienta toca tres cosas de cada base, y las
tres se pueden editar normal: la llamada `pintarFranja();` al final de
`pintarPagina()`, el hero (`heroInmersivo(hero, t, b)`) y el bloque "sobre"
(`bloquePartido(...)`).

---

## Los adaptadores de datos

Misma interfaz (`load` / `save`) para Firebase, Supabase o local. Cambiar de
motor = una línea en el `.env`. **Se copian tal cual al entregable, no se
reescriben.**

Cada base trae su `supabase.schema.sql` con tablas, seed y políticas **RLS
reales**. Dos declaran explícitamente que no persisten nada y explican por qué.

RLS antes de subir datos, siempre. La prueba de dos minutos: pedir una tabla
privada en incógnito — si devuelve datos, el RLS está mal.

---

## Las bases, por línea de negocio

**Ecommerce es la línea principal del estudio.** El menú QR es secundaria: útil
cuando aparezca ese cliente, pero **no es el ejemplo por defecto**.

| Base | Qué trae |
|---|---|
| `ecommerce-completo` · `menu-con-panel-admin` · `carrito-reutilizable` · `marketplace` | Fotos · logo/banner · direcciones · bloques · **franja, partida, texturas, portada a sangre** (vía `INMERSIVO`) · panel con frase por proyecto |
| `landing-modular` | Logo/banner · direcciones · secciones (sin catálogo: **servicios**) · lo inmersivo en versión propia · **plantillas** `torre`/`revista`/`ficha` (solo aquí) |
| `auth` · `crm-simple` · `dashboard-analytics` · `suscripciones` · `backend-pro` | todavía no |

El panel de las bases de venta **no es autenticación**: el generador pone una
frase única por proyecto (en `.env` y `ACCESO.md`), pero una clave en el
JavaScript del navegador la lee cualquiera con F12. La cerradura es Supabase
Auth + RLS. Ver `entregable-cliente`.

`backend-pro` son Edge Functions de Supabase (firma de integridad Wompi +
webhook). **Nunca se probó contra Wompi real** — validarlo en sandbox antes de
cobrarle a un cliente.

---

## Convenciones

- Vanilla HTML/CSS/JS. Nada de frameworks pesados sin acordarlo.
- Comentarios y nombres **en español**.
- Cada base es **autocontenida**: se copia sola a un proyecto sin depender de
  otras carpetas. `03-componentes-ui/` es catálogo para copiar y pegar, nunca
  un import en runtime.
- Si una pieza sirve a varias bases, se construye una vez y se reutiliza.
