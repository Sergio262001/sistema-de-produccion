# 10 · Backend Pro — `backend-pro`

**Qué incluye:** cobro real con Wompi (firma de integridad), total
recalculado en el servidor y confirmación automática del pago por webhook.
**Qué NO incluye:** Mercado Pago, Stripe, devoluciones automáticas,
facturación electrónica.

> **No se vende solo.** Se monta encima de una base que ya toma pedidos.
> Llena también el formato de esa base (2, 5 o 1 con carrito).

---

## A. ¿De verdad lo necesita? 🔴

Marca lo que el cliente quiere:

```
[ ] Que le paguen con tarjeta/PSE en la web, de verdad (no sandbox)
[ ] Que el pedido se confirme solo cuando el pago entra
[ ] Que nadie pueda alterar el precio antes de pagar
[ ] Ninguna de las anteriores → NO lo necesita. Cobra por WhatsApp
    y ahórrale el costo.
```

Si marcó alguna de las tres primeras, esto es obligatorio, no un extra.
Cobrar en línea sin esto es sandbox: parece que funciona y no entra plata.

## B. La cuenta de Wompi 🔴 — la crea el cliente

```
¿Ya tiene cuenta en comercio.wompi.co?  [ ] sí  [ ] no, hay que abrirla
NIT / RUT con el que la abrió        : ______________
Cuenta bancaria vinculada            : [ ] confirmada por el cliente
Estado de verificación de Wompi      : [ ] aprobada  [ ] en trámite
Ambiente con el que arrancamos       : [ ] sandbox  [ ] producción
```

**Esta es la parte que más demora y no depende de ti.** Wompi verifica al
comercio (documentos, cámara de comercio, cuenta bancaria) y eso toma
días. Pídelo el primer día del proyecto o vas a quedar esperando con todo
lo demás terminado.

**Las tres llaves** (Desarrolladores → Llaves API y → Eventos):

```
WOMPI_PUBLIC_KEY       = pub_..._xxx    🌐 pública, puedes pasármela
WOMPI_INTEGRITY_SECRET = ..._integrity_xxx   🔒 SECRETA
WOMPI_EVENTS_SECRET    = ..._events_xxx      🔒 SECRETA
```

⚠️ Las dos secretas **no me las mandes por chat**. Van con
`supabase secrets set`, que corres tú en tu computador. Con ellas se puede
cobrar y devolver dinero a nombre del cliente.

⚠️ El secreto de integridad y el de eventos **son distintos**. Se
confunden todo el tiempo y el síntoma es un webhook que rechaza todo con
"firma inválida".

## C. Infraestructura 🔴

```
Proyecto de Supabase (ref)  : ____________
Base principal que toma pedidos: [ ] ecommerce-completo
                                 [ ] carrito-reutilizable
                                 [ ] menu-con-panel-admin + carrito
¿Corrió ya el supabase.schema.sql de esa base?  [ ] sí  [ ] no
Dominio final del sitio (para CORS): ______________
```

**Firebase no sirve para esta extensión.** Las Edge Functions son de
Supabase. Con Firebase el equivalente son Cloud Functions, que hay que
escribir aparte. Si el proyecto ya arrancó en Firebase, avísame antes.

## D. Reglas del negocio 🟡

```
¿Se despacha solo con pago confirmado?  [ ] sí (recomendado)  [ ] no
Si un pago se rechaza, ¿se devuelve el stock?
  [ ] no, el dueño lo ajusta a mano (así está construido)
  [ ] sí, automático → decisión con riesgo, ver README
¿Alguien debe recibir aviso de cada pedido nuevo?
  [ ] no  [ ] correo a: ____________  [ ] WhatsApp: ____________
```

Lo de las notificaciones: hoy **no está construido**. Es una función más
sobre esta misma base. Si el cliente lo pide, cotízalo — no lo asumas
porque "ya hay backend".

## E. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md) para lo común.
Propias de aquí: las tres de Wompi (bloque B) + `SITIO_URL`.

Todas van como **secretos de Supabase**, no en el `.env` del frontend.

---

## 🔴 Sin esto no arranco

1. Cuenta de Wompi del cliente, verificada (o al menos en sandbox)
2. Las tres llaves, con las secretas ya cargadas por ti
3. Proyecto de Supabase con el esquema de pedidos corrido
4. Dominio final del sitio

## ✅ Antes de pasar a producción

- [ ] Probado en sandbox con tarjetas de prueba
- [ ] Evento de prueba enviado desde el panel de Wompi y firma validada
- [ ] Pago aprobado → pedido en `confirmado`
- [ ] Pago rechazado → pedido NO se confirma
- [ ] Probado cerrando la pestaña justo después de pagar

## ⚠️ Dilo antes de firmar

- **No está probado contra Wompi real todavía.** El código sigue la
  documentación oficial, pero la primera vez hay que probarlo en sandbox.
  Cuenta ese tiempo en la cotización.
- **La verificación de Wompi la hace el cliente y toma días.** Si el
  proyecto se atrasa por eso, que quede claro desde el principio de quién
  depende.
- **Esto necesita mantenimiento.** Las pasarelas cambian su API y el
  webhook hay que revisarlo. Va en el plan de soporte mensual, no de
  regalo.
- **Mercado Pago y Stripe no están.** Si el cliente los pide, es otro
  desarrollo con su propio flujo y su propio formato de webhook.
