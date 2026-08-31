# Base técnica: Auth

Login, registro y roles con la misma interfaz para Firebase, Supabase o un
adaptador local de desarrollo. Habilita paneles admin reales en cualquier
otra base (menú, carrito, landing) sin reescribir la lógica de sesión.

## Qué resuelve
Un usuario inicia sesión o se registra, la sesión queda activa y reactiva
(cualquier parte de la UI puede suscribirse al cambio), y el rol del usuario
decide si puede entrar a una sección protegida (ej. el panel admin del menú).

## Cómo usarla en un proyecto nuevo
1. **Copia** esta carpeta (o solo `src/core/` si la vas a embeber en otra base).
2. **Llena** `contexto.ejemplo.yml` y renómbralo `contexto.<cliente>.yml`.
   Define `auth.motor` y `auth.rol_requerido` para el panel que proteges.
3. **Configura** las claves: copia `.env.example` a `.env` y rellénalo.
4. Listo: cualquier otra base importa `getAuth(motor)` y usa
   `login/register/logout/subscribe` igual sin importar el proveedor.

## Estructura
```
auth/
├─ demo.html                  ← versión de un solo archivo (login + panel con rol)
├─ contexto.ejemplo.yml       ← ficha de contexto (motor, roles)
├─ .env.example               ← plantilla de claves (sin secretos)
└─ src/
   ├─ core/
   │  ├─ auth.js              ← selector de motor (interfaz única)
   │  ├─ local.adapter.js     ← usuarios en memoria (solo desarrollo)
   │  ├─ supabase.adapter.js  ← Supabase Auth (rol en user_metadata)
   │  └─ firebase.adapter.js  ← Firebase Auth + rol en Firestore "perfiles"
   └─ styles/
      └─ tokens.css
```

## El principio clave
**El resto de la app no sabe qué proveedor de auth hay detrás.** Todos los
adaptadores exponen `register`, `login`, `logout` y `subscribe(fn)` — quien
consuma la sesión (un panel admin, un botón de "Mi cuenta") se suscribe una
vez y se redibuja solo cuando el usuario cambia.

## Cómo proteger un panel existente
En la base que quieras proteger (ej. `menu-con-panel-admin`), antes de
mostrar el panel:
```js
auth.subscribe(user => {
  if (!user) return mostrarLogin();
  if (user.rol !== CONTEXT.auth.rol_requerido) return mostrarSinAcceso();
  mostrarPanel(user);
});
```
El `rol_requerido` viene de la ficha de contexto del proyecto, igual que el
resto de la configuración.

## Conectar a Supabase o Firebase real
- **Supabase**: el rol se guarda en `user_metadata.rol` al registrar. Si
  necesitas cambiarlo después desde un panel, usa una tabla `perfiles` con
  RLS en vez de depender solo de metadata.
- **Firebase**: Firebase Auth no guarda roles; se crea un doc en Firestore
  `perfiles/{uid}` al registrar, y se lee al iniciar sesión.

## Línea Starter vs Pro
- **Starter:** generalmente no necesita roles — si el proyecto solo tiene un
  dueño, basta con un login simple o ninguno.
- **Pro:** roles múltiples (admin, vendedor, cliente), multisucursal con
  acceso por sede, RLS por rol en cada tabla.

## Demo rápida
Abre `demo.html`. Usa `admin@demo.com` / `admin123` para entrar como admin,
o regístrate como cliente para ver el mensaje de acceso denegado al panel
protegido (el contexto de la demo exige rol `admin`).
