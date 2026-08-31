# 5 · Tienda online — `ecommerce-completo`

> Línea principal del estudio. Si dudas entre este formato y el 2
> (carrito), la pregunta es: **¿el cliente va a administrar su
> catálogo él mismo?** Sí → este. No, se lo actualizas tú → el 2.

**Qué incluye:** catálogo por categorías, stock real, carrito, checkout,
**pedidos guardados con panel de estados** (nuevo → confirmado →
preparando → enviado → entregado) y panel de administración con login.
**Qué NO incluye:** facturación electrónica, guías de envío, split de
pagos. Nada de eso está — dilo en la propuesta antes de firmar.

---

## A. Identidad 🔴

```
Nombre de la tienda   : ______________________
Qué vende, en 1 frase : ______________________
Ciudad / país         : ______________________
WhatsApp de pedidos   : 57________  (con indicativo, sin + ni espacios)
Instagram / web actual: ______________________
Línea:  [ ] Starter (catálogo + carrito)   [ ] Pro (panel + inventario + roles)
```

## B. Catálogo 🔴 — este es el bloque que de verdad importa

**Categorías** (2 a 6; más de 8 y el cliente ya no encuentra nada):

| id | Nombre visible | Descripción corta |
|---|---|---|
| `ropa` | Ropa | Prendas de algodón |
| | | |

**Productos** — pásamelo así, o como Excel/CSV con estas columnas:

| id | categoría | nombre | descripción | precio | stock | emoji | badge |
|---|---|---|---|---|---|---|---|
| `r1` | `ropa` | Camiseta básica | Algodón 100% | 45000 | 12 | 👕 | top |

Reglas que evitan que haya que rehacer el catálogo:

- **Precio**: número entero en pesos, sin puntos ni `$` — `45000`, no
  `$45.000`. El formato lo pone el código.
- **Stock**: es la **única** fuente de disponibilidad. `0` = agotado y
  desaparece del catálogo. No mandes una columna "disponible" aparte:
  dos fuentes de verdad terminan contradiciéndose.
- **id**: corto, sin tildes ni espacios. Si no los pones, los genero yo —
  pero entonces no van a coincidir con los códigos internos del cliente.
- **badge**: opcional (`top`, `nuevo`, `-20%`). Máximo en 2 o 3 productos;
  si todo está destacado, nada lo está.
- **emoji**: sirve mientras no hay fotos. Un catálogo con emojis se ve
  intencional; uno con cuadros grises rotos, no.

**Fotos** 🟡

```
[ ] Hay fotos    → carpeta: ____________
[ ] No hay aún   → sale con emoji y las cambiamos después
Nombra cada archivo con el id del producto: r1.jpg, r2.jpg…
```

Cuadradas, mínimo 800×800, JPG. Yo las optimizo. Si vienen de 4 MB
directo del celular, el sitio carga lento y el cliente va a creer que
está mal hecho.

## C. Variantes 🟡 — léelo antes de prometer nada

```
¿Los productos tienen tallas / colores / sabores?   [ ] no   [ ] sí
```

**Si marcaste "sí", el catálogo de arriba no alcanza.** Cada talla es
stock propio: "quedan 3 camisetas" no significa nada si son 3 tallas L y
el cliente quiere S. Tienes dos caminos:

1. **Una fila por variante** (`Camiseta S`, `Camiseta M`…) — funciona hoy,
   sin desarrollo extra, pero el catálogo se ve repetido.
2. **Variantes de verdad** (un producto, un selector de talla, stock por
   talla) — es desarrollo adicional sobre la base. Cotízalo aparte.

Elige antes de construir. Cambiar de 1 a 2 después implica rehacer el
catálogo y el carrito.

## D. Envíos 🟡

```
[ ] No hay envío (recoge en tienda)
[ ] Envío con costo fijo: $______
[ ] Envío gratis desde: $______
[ ] Se cotiza por WhatsApp según ciudad
Ciudades donde entrega: ______________________
```

El costo de envío se calcula en el checkout, no lo negocias por chat
después de que el cliente ya pagó. Si es "depende", elige la última
opción y el checkout lo dice claro en vez de mentir con un total.

## E. Panel de administración 🔴 (si es Pro)

```
Quién entra al panel:
  correo: ____________   rol: [ ] admin (todo)  [ ] staff (solo stock)
  correo: ____________   rol: [ ] admin         [ ] staff
¿Puede el staff cambiar precios?   [ ] sí   [ ] no
```

**No me mandes las contraseñas.** El dueño las crea en el primer login.
Si tú las eliges, quedan escritas en algún chat para siempre.

## F. Marca 🟡

```
Color principal   : #______     (el de su logo)
Color secundario  : #______
Tipografía        : ____________  (o "usa la del sistema")
Logo              : archivo SVG o PNG fondo transparente: ______
Tono: [ ] cercano y relajado  [ ] formal  [ ] técnico  [ ] divertido
```

Si solo tienes el logo, mándalo y saco los colores. Si no hay nada,
salgo con los tokens por defecto y los cambias en un archivo.

## G. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md).
Esta base usa: `DB_MOTOR`, `SUPABASE_*` (o `FIREBASE_*`), `AUTH_MOTOR`,
`WHATSAPP_NUM`, `WOMPI_PUBLIC_KEY`, `GA4_ID`.

---

## 🔴 Sin esto no arranco

1. Categorías y productos con **precio y stock**
2. Motor de base de datos decidido (y creado, si es Supabase)
3. WhatsApp o pasarela — cómo se cobra
4. Quién entra al panel (si es Pro)

Lo demás (fotos, colores, envíos) lo relleno con ejemplos marcados y lo
cambiamos en una pasada.

## ⚠️ Dilo en la propuesta, no después

- **Sin backend, Wompi solo funciona en sandbox.** Para cobrar de verdad
  hace falta la firma de integridad en un servidor: es `backend-pro`
  (formato 10) y va en la línea Pro. Cotízalo aparte.
- **El comprador no puede consultar su pedido en la web.** El código
  (`PED-7K3F9`) le sirve para preguntar por WhatsApp, no para entrar a
  ver el estado. Una página de seguimiento es media hora más de trabajo.
- **Cancelar un pedido no devuelve el stock.** Es a propósito (una
  cancelación no siempre significa que la mercancía volvió a la bodega).
  El dueño lo ajusta en Inventario. Enséñaselo en la entrega.
- **Nadie avisa cuando entra un pedido.** Queda en el panel y alguien
  tiene que abrirlo. Las notificaciones son `backend-pro`.
- **El total lo calcula el navegador.** Con cobro por WhatsApp está bien;
  con cobro en línea hay que recalcularlo en el servidor (`backend-pro`).
