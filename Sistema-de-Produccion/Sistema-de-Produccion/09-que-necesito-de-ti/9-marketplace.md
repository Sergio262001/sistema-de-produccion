# 9 · Marketplace — `marketplace`

**Qué incluye:** catálogo de varios vendedores en una sola tienda, con el
desglose de cuánto le queda a cada vendedor y cuánto es comisión.
**Qué NO incluye:** ⚠️ **el reparto automático del dinero.**

> **El desglose es informativo.** Cuando alguien compra, el pago entra a
> UNA sola cuenta (la del dueño del marketplace) y él tiene que
> transferirle a cada vendedor a mano. Que a cada uno le llegue su parte
> automáticamente exige Marketplace/Connect de la pasarela + backend +
> que cada vendedor abra su propia cuenta y pase verificación. Eso es un
> proyecto grande, no una base.

---

## A. El modelo de negocio 🔴

```
Nombre del marketplace : ______________________
Qué se vende ahí       : ______________________
¿Cuántos vendedores al arrancar? : ______
Comisión del marketplace: ______ %   (número único, igual para todos)
¿Quién cobra?
  [ ] el marketplace cobra todo y transfiere a los vendedores
  [ ] cada vendedor cobra lo suyo por WhatsApp (más simple, sí funciona)
```

**La segunda opción es la que sale hoy sin backend.** El marketplace es la
vitrina, cada vendedor cierra su venta. Menos control, cero fricción
técnica, y la comisión se cobra por fuera. Para arrancar y validar si el
marketplace tiene demanda, es la opción correcta.

## B. Vendedores 🔴

| id | Nombre | Contacto | ¿Activo? |
|---|---|---|---|
| `v1` | Taller Arcilla | arcilla@ejemplo.com | sí |

```
¿Los vendedores entran a administrar sus productos?
  [ ] no, el dueño carga todo (así está construido)
  [ ] sí, cada uno con su cuenta → desarrollo extra, cotizar
```

⚠️ **Tal como está, cualquier usuario con cuenta puede editar los
productos de cualquier vendedor.** Sirve mientras el dueño administre
todo. En el momento en que cada vendedor tenga su cuenta, hay que ligar
vendedores con usuarios y cambiar las políticas RLS — está explicado en
`02-bases/marketplace/supabase.schema.sql`. **Decídelo antes de
construir**, porque cambia el modelo de datos.

## C. Productos 🔴

| id | vendedor | nombre | descripción | precio | stock | emoji |
|---|---|---|---|---|---|---|
| `p1` | `v1` | Taza artesanal | Gres esmaltado, 300 ml | 42000 | 10 | 🍵 |

- Precio entero sin puntos.
- Cada producto pertenece a **un** vendedor.
- El stock lo mantiene quien administre. Si son 8 vendedores y el dueño
  lleva todo el inventario a mano, se va a desactualizar — piénsalo.

## D. Comisión 🔴

```
Porcentaje: ______ %
¿Se le muestra al comprador?  [ ] no (recomendado)  [ ] sí
¿Cada cuánto se le paga al vendedor?: ______________________
```

El comprador no necesita ver la comisión: le importa el precio final. El
desglose es para el vendedor y para el dueño.

Hoy la comisión es **un solo porcentaje global** para todos. Si algún
vendedor negocia una distinta, hay que agregar la columna y leerla en el
checkout — está anotado en el esquema SQL.

## E. Cómo se cobra 🔴

```
[ ] WhatsApp — el pedido llega al chat, se coordina el pago
[ ] Pasarela única del marketplace (el dueño reparte después, a mano)
WHATSAPP_NUM: 57________
```

## F. Marca 🟡

```
Color principal : #______
Color secundario: #______
Titular de la portada: ______________________
```

## G. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md).
Usa: `DB_MOTOR`, `SUPABASE_*` (o `FIREBASE_*`), `WHATSAPP_NUM`.

⚠️ **Proyecto de Supabase propio, no compartido.** Esta base usa una tabla
`productos` con las mismas columnas que `ecommerce-completo` pero
distintas por dentro. Las dos en el mismo proyecto se pisan.

---

## 🔴 Sin esto no arranco

1. Quién cobra: el marketplace o cada vendedor
2. Lista de vendedores y sus productos
3. Porcentaje de comisión
4. Si los vendedores administran solos (define el modelo de datos)

## ⚠️ Dilo antes de firmar — es el servicio con más riesgo de malentendido

- **El dinero no se reparte solo.** Es la primera frase de la propuesta.
- **Un marketplace vacío no vende.** El problema real de este negocio no es
  técnico: es conseguir vendedores y compradores al mismo tiempo. Si el
  cliente no tiene ya los vendedores comprometidos, va a echarle la culpa
  a la plataforma. Pregúntale cuántos tiene confirmados **antes** de
  cotizar.
- **La operación crece rápido:** devoluciones, calidad, quién responde si
  un vendedor no despacha. Nada de eso es código, y todo eso va a llegar
  como "arréglame la página". Deja el alcance escrito.
