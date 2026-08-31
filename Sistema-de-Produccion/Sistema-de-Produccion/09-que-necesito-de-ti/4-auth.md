# 4 · Login y roles — `auth`

**Qué incluye:** registro, inicio de sesión, cierre de sesión y roles que
deciden quién ve qué.
**Qué NO incluye:** recuperación de contraseña personalizada, login con
Google/Facebook, verificación por SMS. Todo eso existe en Supabase, pero
hay que activarlo y configurarlo — no viene puesto.

> Casi nunca se vende solo: es la puerta del panel de otra base. Llena
> este formato **además** del formato del servicio principal.

---

## A. Para qué es el login 🔴

```
[ ] Panel de administración (solo el dueño y su equipo)
[ ] Área de clientes (cada quien ve lo suyo)
[ ] Contenido cerrado (solo suscriptores)
```

La diferencia importa: un panel tiene 2-3 cuentas que creas tú; un área
de clientes tiene registro abierto y ahí sí hay que pensar en correos de
confirmación, contraseñas olvidadas y gente que se registra dos veces.

## B. Roles 🔴

```
Rol        ¿Qué puede hacer?                    ¿Quién lo tiene?
admin      todo                                 ____________
staff      ____________________________         ____________
cliente    ____________________________         ____________
```

Con dos roles alcanza en la mayoría de proyectos. Solo agrega un tercero
si hay una diferencia real de permisos que alguien pueda explicar en una
frase.

## C. Cuentas iniciales 🔴

```
Correo del dueño (primer admin): ____________
Otros correos del equipo       : ____________  rol: ______
```

**No me mandes contraseñas.** Cada quien crea la suya en el primer
ingreso. Si tú las eliges, quedan escritas en un chat para siempre y en
la práctica nadie las cambia.

**El primer admin se marca a mano** en Supabase después del registro —
está explicado en `02-bases/auth/supabase.schema.sql`. Es a propósito:
si el sistema dejara que alguien se auto-nombre admin, cualquiera podría.

## D. Registro 🟡

```
Registro:  [ ] abierto (cualquiera crea cuenta)
           [ ] cerrado (solo tú creas las cuentas)
¿Confirmación por correo?  [ ] sí (recomendado)  [ ] no
¿Qué se pide al registrarse?  [x] correo  [x] contraseña  [ ] nombre  [ ] teléfono
```

⚠️ Si dejas registro **abierto** y confirmación **apagada**, cualquier bot
llena la base de cuentas falsas. Si la dejas prendida, el usuario no puede
entrar hasta que abra su correo — y ese es el motivo #1 de "no me deja
entrar" en la primera semana. Decídelo a conciencia y avísale al cliente.

## E. Qué pasa después de entrar 🟡

```
El admin cae en   : ____________
El cliente cae en : ____________
Al cerrar sesión  : ____________
Si alguien sin permiso entra a una URL cerrada:
  [ ] lo manda al login  [ ] mensaje "no tienes acceso"
```

## F. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md).
Usa: `AUTH_MOTOR` (`supabase` | `firebase` | `local`), y según el motor
`SUPABASE_URL` + `SUPABASE_ANON_KEY` o `FIREBASE_*`.

⚠️ `AUTH_MOTOR=local` es **solo para demos**: valida contra una lista en el
navegador. No lo entregues como login real por más que "funcione" en la
demostración.

---

## 🔴 Sin esto no arranco

1. Para qué es el login
2. Qué roles hay y qué puede cada uno
3. Correo del primer admin
4. Motor de autenticación (con proyecto creado, si es Supabase)

## ⚠️ Dilo antes de firmar

- **Un login no es seguridad completa.** Lo que de verdad protege los datos
  son las reglas RLS de la base. Un panel bonito con RLS mal puesto deja
  los datos abiertos a cualquiera con la anon key. Cada
  `supabase.schema.sql` de este sistema ya trae sus políticas — córrelas.
- **Recuperar contraseña** funciona con el correo por defecto de Supabase,
  que llega genérico y a veces a spam. Personalizarlo (dominio propio,
  plantilla con la marca) es configuración aparte.
- **Login con Google** se activa en Supabase, pero requiere crear
  credenciales OAuth en Google Cloud. Es media hora de trabajo, no es
  automático: no lo prometas como "ya viene incluido".
