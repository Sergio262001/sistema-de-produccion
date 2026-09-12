---
name: entregable-cliente
description: Las reglas que no se negocian al construir el entregable de un cliente real — nunca inventar datos, qué hacer con lo que falta, escapar todo lo que escribe otra persona, y por qué la identidad del ejemplo no se hereda. Úsala antes de generar o editar cualquier cosa en Proyectos-Clientes/.
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

---

## Lo que el sistema ya hace por ti — úsalo, no lo reimplementes

```bash
node herramientas/validar.js <ruta>      # control de calidad, $0, corre SIEMPRE primero
node herramientas/crear-proyecto.js --cliente "X" --base <base>
node herramientas/capturar.js <ruta>     # míralo antes de decir que está listo
cd herramientas && npm test              # 281 pruebas
```

El proyecto del cliente se crea en `Proyectos-Clientes/<slug>/`. **Nunca dentro
de `Sistema-de-Produccion/`** — esa es la fábrica, no la entrega. Y para probar
el generador sin ensuciar nada, `--destino`.

---

## Las dos trampas de herramientas

**No inyectes código con `bash node -e` ni con heredocs.** Las barras invertidas
de las expresiones regulares se pierden por el camino. Rompió este sistema
**tres veces en una sola sesión**, y una de ellas se entregó como página en
blanco. Usa las herramientas de edición de archivos.

**Corre `npm test` y el validador antes de cada commit.** Y cuando arregles un
bug, escribe la prueba o la regla que lo habría cazado: así nacieron
`id-fantasma`, `sintaxis` y las pruebas del formulario.
