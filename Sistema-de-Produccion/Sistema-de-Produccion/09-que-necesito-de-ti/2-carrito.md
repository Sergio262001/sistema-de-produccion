# 2 · Carrito y pedidos — `carrito-reutilizable`

**Qué incluye:** motor de carrito (agregar, cantidades, totales) + checkout
que manda el pedido a WhatsApp o a una pasarela.
**Qué NO incluye:** panel de administración, inventario, historial de
pedidos. Es el motor de compra, no una tienda completa.

> **¿Este o el 5?** Este se monta encima de un catálogo que ya existe
> (un menú, una landing, un catálogo que actualizas tú). Si el cliente
> necesita administrar productos y stock él mismo, usa el formato 5.

---

## A. Identidad 🔴

```
Nombre del negocio : ______________________
Qué vende          : ______________________
WhatsApp de pedidos: 57________
¿Sobre qué se monta el carrito?
  [ ] menú digital  [ ] landing  [ ] catálogo suelto  [ ] otro: ______
```

## B. Productos 🔴

Mismo formato del catálogo del formato 5 (id, nombre, descripción,
precio entero, emoji). Si el carrito va sobre una base que ya tiene
catálogo, dime cuál y no repitas la lista.

## C. Cómo se cobra 🔴 — la decisión central

```
[ ] WhatsApp        → arma el pedido y abre el chat. Sale hoy.
[ ] Wompi           → cobra con tarjeta/PSE. Sandbox ya; producción
                      necesita backend (firma de integridad).
[ ] Mercado Pago    → NO funciona sin backend. Ni para probar.
[ ] Stripe          → NO funciona sin backend. Ni para probar.
```

**Si el cliente insiste en cobrar en línea de verdad**, el proyecto deja
de ser una base sola: hay que sumar un servidor (una Edge Function de
Supabase alcanza) y cotizarlo aparte. No lo absorbas "de una" — es la
parte que más soporte genera después.

**Texto del pedido por WhatsApp** 🟡 — así llega el mensaje:

```
Hola! Quiero pedir:
· 2× Camiseta básica — $90.000
· 1× Gorra — $38.000
Total: $128.000
```

```
¿Quieres cambiar algo de ese texto? ______________________
¿Pides datos antes de mandar? [ ] nombre [ ] dirección [ ] hora de entrega
```

## D. Reglas de venta 🟡

```
Pedido mínimo        : $______  (o "no hay")
Costo de envío       : [ ] fijo $______  [ ] gratis desde $______
                       [ ] se cotiza aparte  [ ] no hay envío
¿Se aceptan notas del cliente por producto? ("sin cebolla")  [ ] sí [ ] no
¿Cupones de descuento?  [ ] no  [ ] sí → esto es desarrollo extra, cotizar
```

## E. Marca 🟡

```
Color principal : #______
Color secundario: #______
```

## F. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md).
Usa: `PAGOS_PROVEEDOR`, `WHATSAPP_NUM`, y según el proveedor
`WOMPI_PUBLIC_KEY` / `WOMPI_INTEGRITY_SECRET` 🔒 /
`MERCADOPAGO_*` 🔒 / `STRIPE_*` 🔒.

Recuerda: **la cuenta de la pasarela la abre el cliente**, con su NIT y su
cuenta bancaria. Tú solo integras la llave pública.

---

## 🔴 Sin esto no arranco

1. Lista de productos con precio (o de qué base los toma)
2. Cómo se cobra (WhatsApp o cuál pasarela)
3. Número de WhatsApp, si es esa la vía

## D-bis. Historial de pedidos 🟡

```
[ ] Sí, guardar los pedidos (recomendado) → corre el supabase.schema.sql
[ ] No, solo mandar a WhatsApp
```

Guardarlos es lo que permite responder *"¿cuánto vendí este mes?"* y lo
que alimenta el panel de indicadores (formato 6). Cuesta correr un script;
no guardarlos cuesta un cliente molesto en el mes 2. Si eliges no
guardarlos, que sea una decisión, no un olvido.

## ⚠️ Dilo antes de firmar

- **Se guarda el pedido confirmado, no el carrito a medias.** Recuperar
  carritos abandonados es otra cosa y otro alcance.
- **El total lo calcula el navegador.** Con cobro por WhatsApp está bien
  (alguien revisa el pedido antes de despachar). Si se cobra en línea, el
  total tiene que recalcularse en el servidor — eso es `backend-pro`
  (formato 10), y va en la línea Pro.
- **Nadie avisa que entró un pedido.** Queda en el panel y alguien tiene
  que abrirlo. Si el cliente espera una notificación, eso es `backend-pro`.
- El carrito vive en el navegador: si el visitante entra desde otro
  dispositivo, su carrito no lo sigue. Es lo normal en este tipo de
  proyecto, pero mejor que no sea una sorpresa.
