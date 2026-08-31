# Componentes UI compartidos

Librería de referencia (E4 del backlog): patrones de interfaz que se repiten
en las 4 bases (sysbar, botones, pills, cards, formularios, switch, drawer)
unificados bajo el mismo contrato de tokens.

## Por qué no es una dependencia en runtime
Cada base de `02-bases/` está pensada para **copiarse sola** dentro del
repositorio de un cliente — sin depender de carpetas hermanas que no van a
existir ahí. Por eso este kit no se importa desde las bases; es una
**referencia para copiar y pegar** el componente que necesites cuando
construyas una base nueva o ajustes una existente.

## Qué contiene
```
03-componentes-ui/
├─ demo.html       ← catálogo visual de todos los componentes (doble clic)
├─ tokens.css      ← contrato de nombres de variables (valores neutros)
├─ components.css  ← cada componente, independiente, listo para copiar
└─ analytics.js    ← conector GA4 real (gtag.js + eventos), agnóstico de cuenta
```

## El contrato de tokens
Las 4 bases ya usan exactamente estos nombres de variable (revisa cualquier
`src/styles/tokens.css`): `--brand`, `--bg`, `--accent`, `--surface`, `--ink`,
`--ink-soft`, `--line`, `--display`, `--body`, `--radius`, `--space` (y
`--danger` donde hay validación de formularios). Un componente de este kit
funciona en cualquier base sin tocar una línea, porque ninguno usa colores
fijos — todo sale de esas variables.

## Componentes incluidos
- **sysbar** — la barra superior de cada demo que indica base/contexto/motor.
- **btn** (`.btn-primary`, `.btn-ghost`, `.btn-danger`) — botones consistentes.
- **pill / badge** — etiquetas tipo "solo el dueño", "top", "agotado".
- **nav-pills** — navegación por categorías (usado en el menú).
- **card** — tarjeta de servicio/producto (usado en landing y carrito).
- **field** — inputs y mensajes de error/éxito (usado en auth y leads).
- **switch** — toggle de disponibilidad (usado en el panel admin del menú).
- **overlay + drawer** — modal lateral (usado en el carrito).
- **footer-simple** — pie de página minimalista.
- **product** — card de producto con precio y botón agregar (catálogo del
  carrito y de cualquier base que venda algo).
- **cart-line + qty** — fila de un item dentro del carrito, con cantidad.
- **checkout-summary** — subtotal/envío/total + botón de pago, listo para
  conectar con `cart.js`/`checkout.js` de `carrito-reutilizable`.

## Cómo usarlo al construir una base nueva
1. Abre `demo.html` para ver cómo se ve cada componente.
2. Copia el bloque de `components.css` que necesites dentro del `<style>`
   del `demo.html` de tu base nueva (o a su `src/styles/`).
3. Asegúrate de que tu base defina las mismas variables en su propio
   `tokens.css` — copia `tokens.css` de este kit como punto de partida y
   ajusta los valores a la marca por defecto de tu producto.
4. Si luego cambias el componente en una base porque el caso lo pedía,
   considera traer la mejora de vuelta aquí para que la próxima base
   también la tenga.

## Conectar GA4 (analítica) con `analytics.js`
Copia el archivo a `src/` de tu base y, una vez tengas un Measurement ID
real del cliente, son dos líneas:
```js
import { initGA4, trackLead, trackPurchase } from './analytics.js';
initGA4(import.meta.env?.GA4_ID);              // una vez, al iniciar la página
trackLead({ origen: 'formulario-landing' });   // al capturar un lead
trackPurchase({ value: state.total, items: state.items });  // al pagar
```
`GA4_ID` sale del `.env` del proyecto, igual que `SUPABASE_URL` en los
adaptadores de datos — nunca se escribe a mano en el código ni en la ficha.
Sin un ID real, `initGA4` no hace nada (no falla, pero tampoco mide) — no
está conectado por defecto en ninguna demo de este repo porque cargar
gtag.js sin una cuenta real no sirve para nada y solo agrega una petición de
red innecesaria.
