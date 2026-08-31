# BASE 10 · Backend Pro — cobros reales y confirmación automática

Extensión de la **línea Pro**. No se vende sola: se suma a una base que
ya toma pedidos (`ecommerce-completo`, `carrito-reutilizable` o
`menu-con-panel-admin` con carrito).

Es la pieza que convierte "la web toma pedidos" en "la web cobra".

---

## Por qué existe

Sin backend, tres cosas quedan a medias — y las tres son de dinero:

| Sin esto | Con esto |
|---|---|
| Wompi solo funciona en **sandbox** | Cobra de verdad (firma de integridad) |
| El total lo calcula el navegador | El total se **recalcula en el servidor** |
| El pago se confirma si el comprador vuelve a la página | Lo confirma **Wompi directamente**, siempre |

El segundo punto es el que más se subestima. Hoy, en Starter, alguien con
la consola del navegador abierta puede cambiar un precio antes de enviar
el pedido. Con cobro por WhatsApp da igual (una persona revisa antes de
despachar), pero si el cobro es automático, es una puerta abierta.

## Qué trae

```
supabase/functions/
├─ crear-pago/index.ts      recalcula el total contra la base y firma
└─ wompi-webhook/index.ts   recibe la confirmación de Wompi y cierra el pedido
```

**No hay `demo.html`.** Un backend no tiene qué mostrar: se prueba con los
logs de Supabase y con las tarjetas de prueba de Wompi. Es la única base
del sistema sin demo, y es a propósito.

## Requisitos

- Una base con pedidos ya funcionando (su `supabase.schema.sql` corrido).
- Cuenta de Wompi **del cliente** (con su NIT y su cuenta bancaria).
- Supabase CLI instalado (`npm i -g supabase`).

## Despliegue

```bash
supabase login
supabase link --project-ref <ref-del-proyecto>

# Secretos — NUNCA en el código ni en el .env del frontend
supabase secrets set WOMPI_PUBLIC_KEY=pub_prod_xxx
supabase secrets set WOMPI_INTEGRITY_SECRET=prod_integrity_xxx
supabase secrets set WOMPI_EVENTS_SECRET=prod_events_xxx
supabase secrets set SITIO_URL=https://tienda-del-cliente.com

supabase functions deploy crear-pago
supabase functions deploy wompi-webhook --no-verify-jwt
```

`--no-verify-jwt` solo en el webhook: quien llama ahí es Wompi, que no
tiene sesión de usuario. Su autenticidad se verifica con la firma del
evento, no con un JWT. **No se lo pongas a `crear-pago`.**

Después, en comercio.wompi.co → Desarrolladores → Eventos, registra:

```
https://<ref>.supabase.co/functions/v1/wompi-webhook
```

## Cómo lo usa el frontend

```js
// Antes de abrir el widget de Wompi:
const r = await fetch(`${SUPABASE_URL}/functions/v1/crear-pago`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ codigo: pedido.id }),   // SOLO el código
});
const { monto_en_centavos, firma_integridad, referencia, llave_publica } = await r.json();
// …y esos valores se le pasan al widget.
```

Fíjate que **no se manda el monto**. Si lo mandaras, todo el ejercicio
sería decorativo.

## Antes de cobrarle a un cliente real

- [ ] Probado en sandbox con las tarjetas de prueba de Wompi
- [ ] Evento de prueba enviado desde el panel y firma validada en los logs
- [ ] Un pago aprobado deja el pedido en `confirmado` + `pago_estado: aprobado`
- [ ] Un pago rechazado NO confirma el pedido
- [ ] Probado cerrando la pestaña justo después de pagar (el webhook debe
      cerrarlo igual — es el caso que justifica todo esto)

## Lo que sigue sin estar

Sé honesto en la propuesta:

- **Mercado Pago y Stripe** no están. La estructura sirve, pero cada uno
  tiene su propio flujo de creación de preferencia/sesión y su formato de
  webhook. Es otro desarrollo.
- **Devoluciones** no se procesan desde aquí (se hacen en el panel de
  Wompi; el webhook sí registra el `reembolsado`).
- **Facturación electrónica DIAN** no tiene nada que ver con esto y es un
  proveedor aparte. Si el cliente la nombra, no asientas con la cabeza.
- **No está probado contra Wompi real** — no hay cuenta todavía. El
  algoritmo de firma viene de su documentación. Pruébalo en sandbox antes
  de cobrarlo.

## Cómo cotizarlo

Es la diferencia entre un proyecto Starter y uno Pro, y el cliente lo
entiende cuando se lo dices así: *"sin esto, tu web toma pedidos pero tú
cobras a mano; con esto, tu web cobra sola y te avisa"*.

Súmale el mantenimiento: una pasarela cambia de API y el webhook hay que
revisarlo. Eso va en el plan de soporte, no de regalo.
