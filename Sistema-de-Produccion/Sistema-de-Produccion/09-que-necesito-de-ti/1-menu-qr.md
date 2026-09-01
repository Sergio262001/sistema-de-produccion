# 1 · Menú digital QR — `menu-con-panel-admin`

**Qué incluye:** menú por categorías que abre desde un QR en la mesa,
panel con login para cambiar precios y marcar agotados.
**Qué NO incluye:** pedidos a cocina, mesas, propinas, integración con
POS. Es una carta, no un sistema de restaurante.

---

## A. Identidad 🔴

```
Nombre del negocio   : ______________________
Tipo                 : [ ] restaurante [ ] café [ ] bar [ ] otro: ______
Ciudad               : ______________________
WhatsApp             : 57________
Instagram            : ______________________
¿Cuántas sedes?      : ______  (más de una = Pro)
```

## B. La carta 🔴

**Categorías** en el orden en que quieren que se vean (entradas, fuertes,
bebidas, postres…):

| id | Nombre visible | Descripción corta |
|---|---|---|
| `entradas` | Entradas | Para empezar |
| | | |

**Platos:**

| id | categoría | nombre | descripción | precio | emoji | disponible |
|---|---|---|---|---|---|---|
| `e1` | `entradas` | Patacón con hogao | Plátano verde, hogao de la casa | 18000 | 🥔 | sí |

- Precio entero, sin puntos ni `$`: `18000`.
- La descripción vende el plato — 5 a 12 palabras. "Delicioso" no dice
  nada; "cerdo desmechado 8 horas" sí.
- `disponible: no` lo deja visible pero marcado como agotado. Para
  quitarlo del todo, no lo mandes.

**Foto de cada plato** 🟢 — opcional pero es lo que más sube el ticket
promedio. Nombra `e1.jpg`, `p1.jpg`. Si no hay, el emoji funciona bien.

## C. Datos del local 🟡

```
Dirección    : ______________________
Horarios     : ______________________
Domicilios   : [ ] no  [ ] sí, por WhatsApp  [ ] sí, por app: ______
Reservas     : [ ] no  [ ] por WhatsApp  [ ] por teléfono: ______
Wi-Fi (clave para mostrar en el menú): ______  🟢
```

## D. El QR 🟡

```
¿Cuántos QR necesitas?  ______ (uno por mesa, o uno para toda la carta)
¿Impresos?  [ ] los imprime el cliente  [ ] los diseñas tú (cotízalo aparte)
Dirección final del menú: ______________________
```

El QR se genera con la URL definitiva. Si imprimes 40 acrílicos y después
cambias el dominio, se botan los 40 — fija el dominio **antes** de mandar
a imprimir.

## E. Panel de administración 🔴

```
Quién entra:
  correo: ____________   rol: [ ] admin  [ ] staff (solo agotados)
¿El staff puede cambiar precios?  [ ] sí  [ ] no
```

Recomendado: el mesero/administrador solo marca agotados; los precios
los toca el dueño. Es el error que más se corrige tarde.

## F. Marca 🟡

```
Color principal : #______
Color secundario: #______
Logo            : archivo SVG o PNG fondo transparente: ______
Banner          : foto ancha del local (mín. 1600px): ______
Tono: [ ] cercano  [ ] formal  [ ] tradicional  [ ] moderno
```

**Sin logo la cabecera sale con la inicial del local dentro de un cuadro
de color.** No bloquea la entrega, pero se nota que es una plantilla. Sin
banner no se pone ninguna imagen: antes que una foto de banco, nada.

## G. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md).
Usa: `DB_MOTOR`, `SUPABASE_*` (o `FIREBASE_*`), `GA4_ID`, y
`WOMPI_PUBLIC_KEY` solo si van a cobrar en línea (raro en un menú).

---

## 🔴 Sin esto no arranco

1. Categorías y platos con precio
2. Motor de base de datos
3. Correo de quien administra el menú

## ⚠️ Dilo antes de firmar

- **Un menú no toma pedidos.** Si el cliente quiere que la gente pida
  desde la mesa, eso es el carrito (formato 2) montado encima — otro
  alcance y otro precio.
- **El QR apunta a un dominio.** Sin dominio propio queda apuntando a una
  URL de Vercel; funciona, pero se ve improvisado impreso en la mesa.
- Si el negocio cambia la carta a diario, enséñale a usar el panel en la
  entrega. Un menú desactualizado es peor que no tener menú digital.
