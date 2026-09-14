# Imágenes generadas con Gemini

**CONSTRUIDO el 2026-09-14.** Este documento era el plan; abajo queda como
la explicación de por qué está hecho así.

## Lo que quedó

| Archivo | Qué hace |
|---|---|
| `herramientas/lib/imagenes.js` | Los 5 tipos, el prompt desde la ficha, la generación |
| `herramientas/generar-imagenes.js` | El CLI, con `--estimar` y confirmación |
| `lib/reglas.js` → `provisional` | **La barrera**: error si algo provisional llega al entregable |
| `pruebas/imagenes.test.js` | 20 pruebas, la mitad sobre la barrera |

```bash
npm install @google/genai
node generar-imagenes.js --ficha <ruta> --que todo --estimar
```

**Verificado contra la documentación el 2026-09-14:** el SDK es
`@google/genai`, la llamada es `ai.interactions.create({ model, input,
response_format })`, la imagen llega en `output_image.data` en base64, y los
modelos son `gemini-3.1-flash-lite-image` (el más barato, por defecto),
`gemini-3.1-flash-image` y `gemini-3-pro-image`. **Si algún día deja de
funcionar, eso es lo primero que hay que volver a comprobar.**

El juego completo de una landing (9 imágenes) cuesta **$0.099 USD**.

**Falta probarlo con una clave real.** Todo lo demás está cubierto por
pruebas; la llamada en sí no, porque cuesta dinero y necesita credencial.

---

## Por qué está hecho así

---

## Para qué SÍ, y para qué NO

Esta es la decisión que ya está tomada. No se reabre sin que el dueño lo diga.

| Uso | ¿Va? | Por qué |
|---|---|---|
| **Marcadores de vista previa** | **Sí** | Mucho mejores que los SVG dibujados a mano. Dejan enseñarle al cliente cómo va a quedar de verdad. Van marcados y en `vista-previa/`, que nunca se publica |
| **Texturas y fondos abstractos** | **Sí** | Concreto, papel, retículas, degradados. No representan nada real, así que no mienten sobre nada. Suben mucho el acabado |
| **Fotos de obra del sitio publicado** | **NO** | Es la línea. Ver abajo |

### Por qué no las fotos del entregable

INCOARQI es una constructora real. Una foto generada de un edificio **que no
construyeron**, puesta en su galería de proyectos, es portafolio falso. Si
un cliente llega preguntando por ese proyecto, no existe — y el que queda
expuesto es el cliente, no el estudio.

Y es la regla madre del sistema: *nunca inventes datos del cliente*. **Una
foto de obra es un dato.**

Lo que sí resuelve el problema y es gratis: el cliente **tiene** fotos. Es
una constructora; cada obra pasó por un celular. Seis fotos horizontales con
luz de día alcanzan.

---

## Qué construir

### `herramientas/lib/imagenes.js`

- **Opcional de verdad.** Si no hay `GEMINI_API_KEY`, no existe: ni un
  `import`, ni una petición. El modo gratis del sistema no se toca.
- **Su propia clave**, en `herramientas/.env` (y en `.env.example`).
  No se mezcla con `ANTHROPIC_API_KEY`.
- **Estima el costo antes y pide confirmación**, igual que `auditor-ia.js`.
  Nada que gaste dinero arranca solo — es regla del sistema.
- Guarda en `Proyectos-Clientes/<cliente>/vista-previa/` con nombre
  predecible, y **escribe un `.txt` al lado con el prompt usado**: sin eso,
  dentro de un mes nadie sabe cómo se generó esa imagen.

### `herramientas/generar-imagenes.js` (CLI)

```
node generar-imagenes.js --ficha <ruta> --que portada|galeria|texturas
node generar-imagenes.js --ficha <ruta> --estimar
```

Arma el prompt desde la ficha: `marca.primario`, `marca.tono`,
`pagina.hero.titular` y el rubro del cliente. El prompt no se escribe a mano
cada vez — sale del contexto, que es la tesis del sistema entero.

### Marca de agua obligatoria

Toda imagen generada lleva **"IMAGEN PROVISIONAL"** encima, como los SVG de
hoy. No es opcional: es lo que impide que una se cuele a la entrega por
accidente.

### La compuerta

`validar.js` gana una regla: **si un archivo de `vista-previa/` está
referenciado desde el `index.html` del entregable, es ERROR.** Hoy eso solo
lo evita que yo me acuerde. Con la regla, no se puede publicar una vista
previa aunque se quiera.

---

## Verificar antes de escribir código

**El SDK y el modelo hay que confirmarlos con la documentación de Google, no
de memoria.** El nombre del modelo de imagen y la forma de la llamada cambian
seguido, y escribirlo de memoria es cómo se rompen estas integraciones.

`@google/genai` es el SDK actual de JavaScript, pero **confírmalo**.

Ojo con la regla de cero dependencias: el modo gratis sigue sin ninguna.
Esta es una dependencia **opcional**, como `@anthropic-ai/claude-agent-sdk`.

---

## Lo que NO hay que hacer

- **No generar plantillas con otro modelo.** Ese trabajo ya lo hace el
  sistema, y lo que faltaba no era otro modelo: era que el criterio quedara
  escrito. Ya está en `.claude/skills/direccion-de-arte/SKILL.md`. Un modelo
  sin ese criterio devuelve exactamente lo que el dueño rechazó tres veces:
  crema + serif + terracota.
- **No mezclar proveedores en el mismo archivo.** Claude para criterio y
  texto; Gemini solo para imágenes. Cada uno con su clave y su módulo.
- **No hacerlo automático.** Igual que el agente y el auditor: se lanza a
  mano, dice cuánto cuesta y espera confirmación.
