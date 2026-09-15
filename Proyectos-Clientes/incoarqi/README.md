# INCOARQI S.A.S. — landing corporativa

**El primer cliente real del sistema.** Cotización 001-2026 · 8 sep 2026 ·
$300.000 COP neto · entrega 5 a 7 días hábiles **desde la recepción del
material del cliente**.

Generado desde la base `landing-modular` el 2026-09-12.

## Empieza por aquí

| Archivo | Qué es |
|---|---|
| **[`QUE-NECESITO-DE-USTEDES.md`](./QUE-NECESITO-DE-USTEDES.md)** | **Listo para mandarle al cliente.** Qué falta, en qué formato y qué bloquea la entrega |
| [`contexto.yml`](./contexto.yml) | La ficha. El contenido está **transcrito del brochure**, sin una palabra inventada. Los `POR DEFINIR` dicen qué pedir |
| `index.html` | El entregable. Abre con doble clic — no necesita servidor |
| **[`vista-previa/elige-plantilla.html`](./vista-previa/elige-plantilla.html)** | Las **tres maquetas** de la misma página, lado a lado. Doble clic. Es lo que se le enseña al cliente para que elija |
| `contexto.vista-previa.yml` + `vista-previa/` | **NO SE PUBLICA.** Marcadores dibujados por el estudio para ver la página antes de que llegue el material. Se borran al recibirlo |

### Tres cosas bloquean publicar

1. **El logo** — hoy sale la inicial "I" en un cuadro.
2. **El WhatsApp real** — el del brochure (`300 123 4567`) es de relleno. El
   botón flotante está construido y **no se pinta** hasta que haya número.
3. **El dominio** — recomendado `incoarqi.com`.

### Dos decisiones pendientes

**La portada oscura.** La ficha está en `pagina.hero.fondo: "oscuro"`, que es
la recomendación del estudio: el brochure del cliente es azul marino con
fotografía grande. Si prefieren la clara, se cambia esa línea a `"claro"` y se
regenera.

**La maqueta.** `pagina.plantilla` está en `"ficha"` porque no hay material
todavía. Las otras dos (`"torre"`, `"revista"`) están construidas y
generadas en `vista-previa/` — **abre `vista-previa/elige-plantilla.html`**
para verlas las tres lado a lado. Con la foto de portada, `"torre"` es la que
se parece al brochure. Cambiarla es una línea y regenerar.

### Para ver cómo queda

```bash
node ../../herramientas/capturar.js ./index.html
node ../../herramientas/capturar.js ./index.html --movil
```

## Correrlo ahora mismo

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (normalmente http://localhost:5173).
Arranca aunque el `.env` esté incompleto: los adaptadores caen a datos
locales de ejemplo. Lo que falte simplemente no persistirá.

> Vite hace falta porque un HTML suelto no puede leer un `.env` desde el
> navegador. `vite.config.js` amplía `envPrefix` para que los adaptadores
> copiados de la base funcionen sin reescribirlos.

## Lo que falta para que funcione de verdad

- [ ] `WHATSAPP_NUM` — está como `FALTA` en el `.env`
- [ ] `GA4_ID` — está como `FALTA` en el `.env`

- [ ] Motor `local`: los datos viven en el navegador. Es punto de
      partida válido, pero **no** es persistencia real. Decidir motor.

## Antes de entregar

```bash
npm run validar
```

Sale con error si hay XSS, contraste insuficiente, RLS faltante o un
secreto en el código. No entregues con errores en rojo.

## Qué pedirle al cliente

La lista completa está en `09-que-necesito-de-ti/3-landing.md`.

**La cuenta de ninguna la abre el cliente**, con su NIT y su
cuenta bancaria: el dinero de sus ventas debe llegarle a él. Tú solo
integras la llave pública que te comparta.

## Origen

No se reescribió ningún adaptador: `src/` es copia literal de la base.
Si arreglas un bug ahí, arréglalo también en
`02-bases/landing-modular/src/`, o la próxima copia lo trae de vuelta.
