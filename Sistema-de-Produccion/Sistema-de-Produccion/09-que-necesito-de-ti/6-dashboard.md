# 6 · Panel de indicadores — `dashboard-analytics`

**Qué incluye:** tarjetas con los números que ya viven en la base de datos
del proyecto — leads recibidos, productos, stock, agotados, y **ventas,
ticket promedio y más vendidos** si el proyecto guarda pedidos.
**Qué NO incluye:** visitas, sesiones ni origen del tráfico.

> **Lee esto antes de venderlo.** Este panel mide **la base de datos del
> cliente**, no su audiencia. Si en la reunión dijiste "analítica", el
> cliente entendió Google Analytics dentro de su web — y eso no es lo que
> recibe. Aclararlo cuesta una frase ahora o un cliente molesto después.

---

## A. De dónde salen los números 🔴

Este panel no genera datos: los lee de otras bases. Marca las que tenga
el proyecto:

```
[ ] landing-modular       → cuenta leads por día
[ ] ecommerce-completo    → productos, stock, agotados, valor de inventario
                            + VENTAS, ticket promedio y más vendidos
[ ] carrito-reutilizable  → ventas (si corrió su esquema de pedidos)
[ ] menu-con-panel-admin  → platos y disponibilidad
[ ] crm-simple            → clientes por estado
[ ] ninguna de las anteriores → entonces este panel no tiene nada que mostrar
```

Si marcaste la última, **no vendas este servicio todavía**. Un panel vacío
se ve como un producto roto.

## B. Qué quiere ver el cliente 🔴

```
La pregunta que se hace cada lunes: ______________________
Los 3 números que de verdad le importan:
  1. ____________
  2. ____________
  3. ____________
```

Es el bloque más importante del formato. Un panel con 12 tarjetas no se
mira; uno con 3 números que contestan una pregunta real, sí. Si el cliente
no sabe qué preguntar, ese es el trabajo de consultoría — y se cobra.

## C. Períodos 🟡

```
Rango por defecto: [ ] últimos 7 días  [ ] 30 días  [ ] este mes
¿Comparar con el período anterior?  [ ] sí  [ ] no
```

## D. Quién lo ve 🔴

```
Correos con acceso: ____________
¿El staff lo ve?  [ ] sí  [ ] no
```

Este panel muestra datos agregados del negocio. Piensa si el equipo debe
ver el valor total del inventario o cuántos leads entran.

## E. ¿Y el tráfico web? 🟡

```
[ ] Con GA4 aparte basta (le enseñas a entrar a analytics.google.com)
[ ] El cliente quiere las visitas DENTRO de su panel → cotizar backend
GA4_PROPERTY_ID (si aplica): ____________
```

Traer las visitas al panel exige la **GA4 Data API** desde un servidor con
cuenta de servicio: Google no permite leer esos datos desde el navegador.
Es un desarrollo aparte, no un ajuste.

En el 90% de los casos la respuesta correcta es la primera: le das acceso
a la propiedad de GA4 y le enseñas los cuatro reportes que le sirven.

## F. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md).
Usa: `DB_MOTOR`, `SUPABASE_*` (o `FIREBASE_*`), `AUTH_MOTOR`,
`GA4_PROPERTY_ID` (solo si se hace la integración con backend).

**Importante:** el panel lee las **mismas tablas** de las otras bases, así
que va en el **mismo proyecto de Supabase** que ellas. Si está en otro
proyecto, no ve nada.

---

## 🔴 Sin esto no arranco

1. Qué bases del sistema ya están funcionando y con datos
2. Los 3 números que le importan al cliente
3. Acceso al mismo proyecto de Supabase de esas bases

## ⚠️ Dilo antes de firmar

- **Las ventas dependen de que el proyecto guarde pedidos.** Si no se
  corrió el esquema de pedidos, esa sección sale vacía. Verifícalo antes
  de mostrarle el panel al cliente.
- **Una venta es un pedido que avanzó**, no uno recién entrado. Un pedido
  en estado "nuevo" no suma a ingresos y uno cancelado nunca sumó. Explica
  esa regla en la entrega o el cliente va a creer que faltan ventas.
- **No muestra visitas.** Eso es GA4, y traerlo aquí necesita backend.
- Este panel se vende bien **con soporte mensual**: el valor no es la
  pantalla, es que alguien la mire y le diga al cliente qué hacer con esos
  números. Solo, es una pantalla que se deja de abrir en tres semanas.
