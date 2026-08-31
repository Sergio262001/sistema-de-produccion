# 7 · CRM simple — `crm-simple`

**Qué incluye:** lista de clientes con estado (nuevo / en proceso / ganado
/ perdido) e historial de notas por cliente.
**Qué NO incluye:** correos automáticos, recordatorios, integración con
WhatsApp o con el correo. Es una libreta ordenada y compartida, no un
HubSpot.

> Vale la pena solo si el cliente hoy lleva su seguimiento en un cuaderno,
> en notas del celular o en la cabeza. Si ya usa un CRM y funciona, no se
> lo cambies.

---

## A. Contexto 🔴

```
Negocio                        : ______________________
¿Cómo hace seguimiento hoy?    : ______________________
¿Cuántos clientes/prospectos activos maneja al mes? : ______
¿Cuántas personas van a usarlo?: ______
```

Si son más de ~500 registros activos o más de 4 personas usándolo a la
vez, esta base se queda corta. Dilo antes, no después.

## B. Estados 🔴

El sistema trae 4: `nuevo`, `en-proceso`, `ganado`, `perdido`.

```
¿Sirven así?  [ ] sí  [ ] no, los suyos son:
  1. ____________  ¿qué significa?: ____________
  2. ____________  ¿qué significa?: ____________
```

Cada estado tiene que corresponder a **algo que pasa de verdad** en su
proceso de venta. Si no lo puede explicar en una frase, sobra. Cambiar los
estados después implica tocar el `check` del esquema SQL y los datos que
ya estén guardados — es más fácil acertar de entrada.

## C. Datos de cada cliente 🔴

```
[x] nombre       [x] contacto (correo o teléfono)      [x] estado
[ ] empresa      [ ] ciudad     [ ] de dónde llegó     [ ] valor estimado
[ ] otro: ____________
```

## D. Clientes actuales 🟡

```
[ ] Tiene lista para migrar → mándala en Excel/CSV con las columnas de arriba
[ ] Empieza de cero
```

Si hay lista, mándala como está. Yo la limpio y la subo; no la pases en
limpio tú a mano — se cometen errores y toma horas.

## E. Quién entra 🔴

```
Correos con acceso: ____________  rol: [ ] admin [ ] staff
¿El staff ve TODOS los clientes o solo los suyos?
  [ ] todos  [ ] solo los suyos → esto es desarrollo extra, cotizar
```

**"Solo los suyos" no está construido.** Requiere ligar cada cliente a un
usuario y cambiar las políticas RLS. Es una hora de trabajo, pero es
trabajo — no lo prometas de una.

## F. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md).
Usa: `DB_MOTOR`, `SUPABASE_*` (o `FIREBASE_*`), `AUTH_MOTOR`.

⚠️ **Aquí no hay opción `local` que valga.** Los datos son de personas
reales y tienen que estar en una base con reglas de acceso, no en el
navegador de alguien. Si el cliente no quiere abrir Supabase, no vendas
este servicio.

---

## 🔴 Sin esto no arranco

1. Los estados del proceso de venta
2. Qué datos lleva cada cliente
3. Quién entra y con qué rol
4. Proyecto de Supabase creado (aquí no hay atajo)

## ⚠️ Dilo antes de firmar

- **Datos personales = responsabilidad legal.** En Colombia (Ley 1581 de
  2012) el negocio necesita autorización de cada titular y una política de
  privacidad publicada. Es responsabilidad del cliente, pero adviértelo
  por escrito y déjalo en el contrato.
- **No manda recordatorios.** Si nadie abre el CRM, nadie hace seguimiento.
  Un CRM que no se abre es una hoja de cálculo cara.
- **No se conecta con WhatsApp.** Las notas se escriben a mano. Traer las
  conversaciones automáticamente exige la API de WhatsApp Business y un
  backend — otro alcance, otro precio.
- La utilidad real aparece a los dos meses de uso constante. Véndelo con
  acompañamiento el primer mes o se abandona.
