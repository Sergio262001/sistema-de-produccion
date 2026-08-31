# 8 · Suscripciones — `suscripciones`

**Qué incluye:** página de planes con precios y beneficios + registro de
quién está suscrito a qué plan, con su estado.
**Qué NO incluye:** ⚠️ **el cobro automático cada mes.**

> **Lee esto dos veces antes de vender.** Un cliente que pide
> "suscripciones" casi siempre quiere que **le cobren solo cada mes**. Eso
> **no** es lo que hace esta base. Esta base lleva el registro; el cobro
> recurrente real necesita Stripe Billing o el preapproval de Mercado
> Pago, más un backend que escuche sus webhooks. Si vendes esto como
> "cobro automático", vas a tener que construir el backend gratis.

---

## A. Qué necesita en realidad 🔴

```
[ ] Solo mostrar los planes y que le escriban → esta base sobra;
    con una landing (formato 3) basta.
[ ] Mostrar planes + llevar el registro de suscriptores, cobrando él a
    mano cada mes → ESTA BASE, tal cual.
[ ] Cobro automático mensual sin que el suscriptor haga nada
    → esta base + BACKEND. Cotiza el backend aparte, no lo asumas.
```

## B. Los planes 🔴

| id | Nombre | Precio | Ciclo | ¿Destacado? |
|---|---|---|---|---|
| `basico` | Básico | 49000 | mensual | no |
| `pro` | Pro | 99000 | mensual | sí |

- Precio entero sin puntos: `49000`.
- Ciclo: `mensual` o `anual`.
- **Un solo plan destacado.** Si destacas dos, no guías la decisión.
- 3 planes funcionan mejor que 5: con demasiadas opciones la gente no
  elige ninguna.

**Beneficios de cada plan** — en orden, del más valioso al menos:

```
basico: ____________ / ____________ / ____________
pro   : ____________ / ____________ / ____________
```

Que el plan de arriba diga "todo lo del anterior, más…". Repetir la lista
completa hace que los planes se vean iguales.

## C. Qué pasa al suscribirse 🔴

```
[ ] Se guarda el registro y el dueño contacta a la persona
[ ] Se manda a WhatsApp para coordinar el pago
[ ] Va a un link de pago (Wompi / Mercado Pago) que el dueño ya tiene
¿Qué recibe el suscriptor después?: ______________________
```

## D. Manejo de estados 🟡

Estados: `activa`, `pausada`, `cancelada`, `morosa`.

```
¿Quién mueve los estados a mano?      : ____________
¿Cada cuánto los revisa?              : ____________
¿Qué pasa si alguien no paga?         : ____________
¿El suscriptor puede cancelar solo?
  [ ] no, escribe y el dueño lo registra (así está construido)
  [ ] sí, desde la web → desarrollo extra, cotizar
```

**Sin backend, alguien tiene que entrar a marcar quién pagó.** Si el
cliente no tiene a esa persona, el sistema se desactualiza en dos meses y
va a decir que no funciona. Pregúntalo explícitamente.

## E. Marca 🟡

```
Color principal : #______
Color secundario: #______
Titular de la página de planes: ______________________
```

## F. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md).
Usa: `DB_MOTOR`, `SUPABASE_*` (o `FIREBASE_*`), y **solo si se construye
el backend**: `STRIPE_SECRET_KEY` 🔒 o `MERCADOPAGO_ACCESS_TOKEN` 🔒.

⚠️ Esas dos son **secretas de verdad**: van en el servidor, nunca en el
navegador ni en este archivo. Con una de esas llaves alguien puede cobrar
y devolver dinero en nombre del cliente.

---

## 🔴 Sin esto no arranco

1. Cuál de las tres opciones del bloque A es (¿backend o no?)
2. Los planes con precio, ciclo y beneficios
3. Qué pasa cuando alguien se suscribe
4. Quién actualiza los estados a mano

## ⚠️ Dilo antes de firmar — por escrito

- **No hay cobro recurrente automático.** Es la frase que tiene que quedar
  en la propuesta, con esas palabras.
- **Cualquiera puede registrarse** en el formulario público, pague o no.
  Verifica la lista antes de darle acceso a alguien a algo.
- Si el cliente ya vende suscripciones y quiere migrar suscriptores
  activos, mándame la lista en CSV (correo, plan, fecha de inicio, estado).
