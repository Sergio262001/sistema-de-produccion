# 0 · Credenciales comunes

Esto aplica a **todos** los servicios. Llénalo una vez por proyecto.

> **Nunca me pases una clave por chat si es secreta.** Las marcadas
> 🔒 SECRETA van en el `.env` del proyecto, que tú escribes en tu
> computador y nunca se sube a Git. Yo dejo la variable esperándola.
> Las marcadas 🌐 PÚBLICA sí puedes pegármelas: viven en el navegador
> del visitante de todos modos.

---

## A. Base de datos 🔴 Bloqueante

**¿Quién la crea?** Tú, bajo tu cuenta (`sagilt26@gmail.com`).
Un proyecto de Supabase **por cliente** — nunca dos clientes en el mismo.

```
Motor (marca uno):  [ ] supabase   [ ] firebase   [ ] local (solo demo)

Si supabase:
  SUPABASE_URL       = https://__________.supabase.co     🌐 PÚBLICA
  SUPABASE_ANON_KEY  = eyJ...                             🌐 PÚBLICA
  ¿Ya corriste el supabase.schema.sql de la base?  [ ] sí  [ ] no

Si firebase:
  FIREBASE_API_KEY    = ______   🌐 PÚBLICA
  FIREBASE_PROJECT_ID = ______   🌐 PÚBLICA
  FIREBASE_APP_ID     = ______   🌐 PÚBLICA
```

**Dónde sacarlas (Supabase):** proyecto → Settings → API. Copia
*Project URL* y la llave **anon / public**.

⚠️ En esa misma pantalla hay una `service_role`. **Esa nunca** — salta
todas las reglas de seguridad y en el navegador equivale a dejar la base
abierta. Si alguna vez me la pegas por error, bórrala y rótala.

**Si eliges `local`:** el proyecto funciona pero los datos viven solo en
ese navegador. Sirve para demo o para aprobar diseño; no es entregable
final para nada que el cliente vaya a administrar.

---

## B. Analítica 🟡 Necesario para entregar

**¿Quién la crea?** Tú, bajo tu cuenta. Una propiedad de GA4 por cliente.

```
GA4_ID = G-__________     🌐 PÚBLICA
```

**Dónde:** analytics.google.com → Administrar → Flujos de datos → tu web
→ *ID de medición* (empieza por `G-`).

Sin esto el sitio funciona igual, pero entregas a ciegas: no vas a poder
mostrarle al cliente cuánta gente entró. Es la mitad del argumento para
venderle el soporte mensual, así que no lo dejes para después.

---

## C. Pasarela de pago 🟡 (solo servicios con cobro)

**¿Quién la crea? EL CLIENTE, no tú.** La cuenta va con su NIT/RUT y su
cuenta bancaria, porque el dinero de sus ventas tiene que llegarle a él.
Tú solo recibes la llave pública para integrarla.

```
Proveedor:  [ ] whatsapp (sin pasarela)  [ ] wompi  [ ] mercadopago  [ ] stripe

WHATSAPP_NUM        = 57__________        (con indicativo, sin + ni espacios)
WOMPI_PUBLIC_KEY    = pub_test_... / pub_prod_...   🌐 PÚBLICA
WOMPI_INTEGRITY_SECRET = __________                 🔒 SECRETA — al .env
```

**Dónde (Wompi):** comercio.wompi.co → Desarrolladores → Llaves API.
Empieza con las de **sandbox** (`pub_test_`): permiten probar el flujo
completo con tarjetas de prueba sin mover dinero real.

**Lo que tienes que decirle al cliente antes de cobrarle:**

- Con solo la llave pública, Wompi funciona en **sandbox**. Para producción
  se exige una firma de integridad calculada en un servidor — eso es un
  backend, no está incluido en el precio de una base y hay que cotizarlo.
- Mercado Pago y Stripe **no funcionan sin backend**, ni siquiera para
  probar: alguien tiene que crear la preferencia/sesión de pago del lado
  del servidor. Si el cliente los pide, ya no es un proyecto Starter.
- La opción **WhatsApp** no cobra en línea: arma el pedido y lo manda al
  chat, y el cliente cobra como ya lo hace. Para la mayoría de negocios
  pequeños es lo correcto y sale hoy mismo. No la presentes como
  "la versión barata" — preséntala como la que no depende de que el banco
  apruebe nada.

---

## D. Dominio y publicación 🟡

```
¿Ya tiene dominio?   [ ] sí: ____________   [ ] no, hay que comprarlo
¿A nombre de quién?  [ ] del cliente (recomendado)  [ ] tuyo
¿Dónde se publica?   [ ] Vercel  [ ] GitHub Pages  [ ] hosting del cliente: ______
¿Quién paga el hosting?  ______________
```

**Que el dominio quede a nombre del cliente**, aunque tú lo configures.
Si queda al tuyo, el día que se vayan a otro proveedor la transferencia
se vuelve un problema — y ese problema lo vas a tener tú, no ellos.

---

## E. Accesos que puede que necesites 🟢

```
[ ] Panel del dominio (para apuntar los DNS)
[ ] Cuenta de correo del negocio (para formularios)
[ ] Redes sociales (para poner los enlaces correctos)
[ ] Fotos originales — carpeta Drive: ____________
```

---

---

## F. Seguridad — decisiones que tienes que tomar 🔴

```
¿El proyecto tiene registro abierto (cualquiera crea cuenta)?
  [ ] no, solo el dueño y su equipo  → `authenticated` basta
  [ ] sí                             → OBLIGATORIO usar es_admin()/es_staff()
                                        y correr seguridad.schema.sql

¿Se guardan datos de personas (leads, clientes, pedidos)?
  [ ] no
  [ ] sí → el cliente necesita política de privacidad publicada
           (Ley 1581 de 2012) y casilla de autorización. Se la pides A ÉL,
           no la redactas tú.
  Política de privacidad del cliente: ______________ (URL o PENDIENTE)

¿Quién hace las copias de seguridad?
  [ ] plan de pago de Supabase (las incluye)
  [ ] alguien exporta a mano, cada: ______
  [ ] nadie todavía  ← díselo por escrito antes de entregar
```

**El plan gratuito de Supabase no tiene copias de seguridad.** Si el
cliente va a operar en serio con esa base, esto no es un detalle técnico:
es la diferencia entre un mal día y perder el negocio.

---

## Checklist final antes de decirme "arranca"

- [ ] Motor de base de datos decidido y creado
- [ ] `supabase.schema.sql` de la base corrido en el proyecto
- [ ] `02-bases/auth/seguridad.schema.sql` corrido (bitácora + límites)
- [ ] Claves públicas anotadas arriba
- [ ] Claves secretas puestas en el `.env` (no en este archivo)
- [ ] `.env` verificado dentro de `.gitignore`
- [ ] Bloque F contestado
- [ ] Formato del servicio específico lleno (archivos 1 a 10)

⚠️ **Nunca me pegues la `service_role` de Supabase.** Está en la misma
pantalla que la anon key y es fácil confundirlas. Esa llave salta todas
las reglas de seguridad; si me llega por error, bórrala y rótala.
