# 09 · Qué necesito de ti

Un formato por servicio con **exactamente** la información que tengo que
recibir para armarlo sin adivinar nada.

## Para qué sirve esta carpeta (y en qué se diferencia de las otras)

| Carpeta | Qué es | Quién la llena |
|---|---|---|
| `06-plantillas-de-negocio/brief-de-cliente.md` | preguntas de **negocio** para vender | el cliente, antes de cotizar |
| **`09-que-necesito-de-ti/`** ← esta | insumos **técnicos** para construir | tú, después de cerrar |
| `04-fichas-de-contexto/` | el **resultado** en YAML | yo, con lo que me des aquí |

En orden: brief → cotizas → cierras → llenas el formato de esta carpeta →
me lo pasas → yo genero la ficha YAML y ensamblo el producto.

## Cómo se usa

1. Abre el formato del servicio que vendiste.
2. Cópialo a la carpeta del cliente
   (`Proyectos-Clientes/<cliente>/que-recibi.md`) y llénalo ahí.
3. Pásamelo entero, aunque queden huecos. **Los huecos son información**:
   me dicen qué asumir y qué queda pendiente. Un formato a medias sirve;
   uno inventado, no.

## Regla de oro sobre los datos que faltan

No te inventes datos para que yo "avance". Si el cliente todavía no manda
las fotos o los precios finales, marca `PENDIENTE` y sigue. Construyo con
datos de ejemplo claramente marcados y los cambias después en un solo
lugar — porque el contenido nunca está incrustado en el HTML. Lo que sí
frena todo es un dato **inventado** que se te olvide corregir y llegue al
cliente final.

## Los formatos

| # | Servicio | Base | Formato |
|---|---|---|---|
| 0 | *(común a todos)* | — | [credenciales comunes](./0-credenciales-comunes.md) |
| 1 | Menú digital QR | `menu-con-panel-admin` | [formato](./1-menu-qr.md) |
| 2 | Carrito / pedidos | `carrito-reutilizable` | [formato](./2-carrito.md) |
| 3 | Landing page | `landing-modular` | [formato](./3-landing.md) |
| 4 | Login y roles | `auth` | [formato](./4-auth.md) |
| 5 | Tienda online | `ecommerce-completo` | [formato](./5-ecommerce.md) |
| 6 | Panel de indicadores | `dashboard-analytics` | [formato](./6-dashboard.md) |
| 7 | CRM simple | `crm-simple` | [formato](./7-crm.md) |
| 8 | Suscripciones | `suscripciones` | [formato](./8-suscripciones.md) |
| 9 | Marketplace | `marketplace` | [formato](./9-marketplace.md) |
| 10 | Backend Pro (cobros reales) | `backend-pro` | [formato](./10-backend-pro.md) |

**Empieza siempre por el 0.** Las credenciales son iguales para todos los
servicios y son la parte que más demora, porque dependen de que el cliente
abra cuentas. Pídelas el primer día, no el último.

## Leyenda de los formatos

- 🔴 **Bloqueante** — sin esto no empiezo.
- 🟡 **Necesario para entregar** — puedo construir con ejemplo, pero no
  se publica sin el dato real.
- 🟢 **Opcional** — mejora el resultado; si no está, hay un default sensato.
