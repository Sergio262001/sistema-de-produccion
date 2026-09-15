---
name: entregable-cliente
description: Las reglas que no se negocian al construir el entregable de un cliente real — nunca inventar datos, qué hacer con lo que falta, escapar todo lo que escribe otra persona, por qué la identidad del ejemplo no se hereda, y por qué la frase del panel es una puerta y no una cerradura. Úsala antes de generar o editar cualquier cosa en Proyectos-Clientes/.
---

# El entregable de un cliente

Estas reglas no salieron de la teoría. Cada una costó un bug que llegó a una
entrega real.

---

## 1 · Nunca inventes datos del cliente

Es la regla madre del sistema. Si falta algo, hay tres salidas legítimas y
ninguna es rellenar:

| Situación | Qué se hace |
|---|---|
| Falta un campo obligatorio | **Se pregunta.** El proyecto no se construye |
| Falta un campo opcional de identidad | `POR DEFINIR` en la ficha, y no se escribe en el HTML |
| El cliente marcó "no aplica" | **Se omite.** No se simula, no se rellena con el ejemplo |
| Falta el contenido de un bloque | El bloque **no se pinta** |

Un dato inventado se nota en la entrega, y destruye la confianza más rápido de
lo que la construye una página bonita.

## 2 · Un bloque sin contenido NO se pinta

Ni con texto de ejemplo, ni con un "Próximamente", ni con una foto de banco de
imágenes. Un hueco honesto se ve mejor que un relleno inventado, y además le
dice al dueño qué le falta pedirle al cliente.

*(Con un matiz que costó una captura descubrir: un hueco **enorme** no es
honesto, es un defecto. Ver `direccion-de-arte` → estados vacíos.)*

## 3 · La identidad del ejemplo no se hereda, ni una palabra

El titular, la historia del negocio, los horarios, la dirección, el Instagram,
el subtítulo, el dominio, el WhatsApp y el logo del ejemplo **son de otro
negocio**. Heredarlos es peor que dejarlos vacíos: el cliente vería su nombre
encima de la historia de un café que no es suyo, con la dirección de otro local.

En el código: `IDENTIDAD` en `crear-proyecto.js` los marca `POR DEFINIR`, y
`ponerBloquePagina()` reemplaza el objeto `pagina` **completo** en vez de
parchear campo a campo.

**El caso real:** se entregó una página que decía "Café Raíz" siendo de "tacos
mauricio". La causa no era el HTML — era que `applyTheme()` lee el `CONTEXT`
del script y **lo sobreescribe todo al arrancar**. Cambiar el `<title>` y el
logo no sirve de nada si el `CONTEXT` no cambia.

## 4 · Todo lo que escribe otra persona pasa por `esc()`

Antes de tocar `innerHTML`. Sin excepción. Un nombre como
`<img src=x onerror=...>` escrito por un comprador anónimo se ejecuta en la
sesión del admin.

Ya pasó dos veces en este sistema: un XSS almacenado en el panel de pedidos, y
`renderHero`/`renderServicios` de la landing interpolando el brief del cliente
sin escapar.

Y toda URL que vaya a un `src` o un `href` pasa por `urlSegura()`: solo
`http(s)://`, `/` o `./`. Un `javascript:` en un `src` se ejecuta.

## 5 · Los secretos solo en `.env`

Nunca en la ficha, nunca en el código, y el `.env` va en `.gitignore`. Si ves
una clave dentro de un archivo versionado, es un error grave, no un detalle.

## 6 · Los adaptadores de `src/` se copian tal cual

No se reescriben. Son la capa que permite cambiar de motor de base de datos con
una línea del `.env`.

## 7 · De quién es cada credencial

- **Supabase y GA4** → cuenta del estudio. Es infraestructura técnica.
- **La pasarela de pago** (Wompi / Mercado Pago / Stripe) → la crea **el
  cliente**, con su NIT y su cuenta bancaria. El dinero de sus ventas le llega
  a él, no al estudio. El estudio solo integra la `public_key`.

Confundir esto no es un bug técnico: es un problema legal y de confianza.

## 8 · El panel: puerta, no cerradura

Las bases traen `admin123` escrita en el código y anunciada en su propia
pantalla de login. Hasta el 2026-09-15 viajaba así al entregable: **todos los
proyectos del estudio tenían la misma contraseña, publicada en la puerta.** Un
cliente que abriera la página de otro entraba a su panel.

Ahora `crear-proyecto.js` pone una **frase única por proyecto**
(`torre-espiga-muelle-47`) en `.env` (`PANEL_CLAVE`) y en `ACCESO.md`, los dos
fuera de git, y quita el cartel que la anunciaba. La regla `clave-demo` del
validador marca como **error** cualquier contraseña de demostración fuera de
`02-bases/`.

Lo que **no** se le puede decir al cliente: que su panel está protegido. Una
clave en el JavaScript del navegador la lee cualquiera con F12, por rara que
sea. Un panel que se va a cobrar necesita **Supabase Auth + RLS** — los tres
pasos están en el `ACCESO.md` de cada proyecto. Vender la puerta como
cerradura es como se pierde un cliente.

---

## Lo que el sistema ya hace por ti — úsalo, no lo reimplementes

```bash
node herramientas/validar.js <ruta>      # control de calidad, $0, corre SIEMPRE primero
node herramientas/crear-proyecto.js --ficha <ruta/contexto.yml>
node herramientas/capturar.js <ruta>     # míralo antes de decir que está listo
cd herramientas && npm test
```

El proyecto del cliente se crea en `Proyectos-Clientes/<slug>/`. **Nunca dentro
de `Sistema-de-Produccion/`** — esa es la fábrica, no la entrega.

**Un proyecto de verdad se genera con `--ficha`.** Sin ficha, el contenido
sale del `contexto.ejemplo.yml` de la base —un negocio inventado— y el
generador lo marca con `ES-UNA-PRUEBA.md`: el validador salta esa carpeta y el
panel la etiqueta `PRUEBA ·`. Para probar el generador sin ensuciar nada,
`--destino` a una carpeta temporal. Así se acumularon nueve carpetas de prueba
junto a los entregables.

**Y un cliente nuevo hay que agregarlo a git a mano.** El `.gitignore` de la
raíz es una lista blanca para `Proyectos-Clientes/`: lo que no esté nombrado
ahí, no se sube.

Al editar un entregable o un `demo.html`, un hook corre el validador solo y te
devuelve los errores. Si te los devuelve, arréglalos antes de seguir.

---

## Las trampas de herramientas

**No inyectes código con `bash node -e` ni con heredocs.** Las barras invertidas
de las expresiones regulares se pierden por el camino. Rompió este sistema
**tres veces en una sola sesión**, y una de ellas se entregó como página en
blanco. Usa las herramientas de edición de archivos.

**Corre `npm test` y el validador antes de cada commit.** Y cuando arregles un
bug, escribe la prueba o la regla que lo habría cazado: así nacieron
`id-fantasma`, `sintaxis` y las pruebas del formulario.

**Una prueba nunca tiene la API key en la mano.** `panel.js`, `auditor-ia.js`
y `agente.js` cargan `herramientas/.env` al importarse, así que borrar
`ANTHROPIC_API_KEY` **antes** del `import` no sirve: el módulo la vuelve a
poner. Pasó el 2026-09-15: `/api/auditar` encontró la clave y llamó a la API
de verdad — 19 segundos y dinero gastado por correr `npm test`. Se borra
**después** del import, y la prueba afirma que no está. Aplica a cualquier
cosa que gaste: Gemini (`GEMINI_API_KEY`) igual.

**Windows reescribe los finales de línea.** Git saca los archivos con CRLF.
Un script que busque un bloque de varias líneas escrito con `\n` no lo
encuentra y **falla en silencio**. Normaliza a LF al leer y repón el estilo
del archivo al escribir — como hace `llevar-inmersivo.js`.
