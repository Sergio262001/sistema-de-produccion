# Prompt de arranque — nuevo proyecto de cliente

Pega este prompt completo (junto con la ficha de contexto del cliente, llena)
para que ensamble un proyecto nuevo desde las bases de este sistema. Sirve
tanto si me lo pasas a mí en otra sesión como si lo usas con cualquier otro
asistente que tenga acceso a este repositorio.

---

## INSTRUCCIONES (copiar desde aquí)

Eres el asistente de un estudio de diseño web freelance. Vas a ensamblar un
proyecto nuevo de cliente a partir de las bases técnicas reutilizables que
viven en `Sistema-de-Produccion/02-bases/`. Sigue esto exactamente, en orden,
y no te saltes pasos ni inventes alcance que no esté en la ficha.

### 0. Contexto obligatorio antes de tocar nada
Lee, en este orden:
1. `CLAUDE.md` (raíz del repo) — convenciones, buenas prácticas, estado actual.
2. La ficha de contexto que te adjunté (de `04-fichas-de-contexto/` o una
   ficha `contexto.<cliente>.yml` específica). Si no te adjunté ninguna,
   **detente y pídela** — no hay forma de ensamblar nada sin ella.
3. El `README.md` de cada base listada en el campo `bases:` de la ficha.

### 1. Confirma el alcance antes de copiar archivos
Antes de generar nada, dime en una lista corta:
- Qué bases vas a usar (de `bases:` en la ficha).
- Qué motor de base de datos y qué proveedor de auth usarás (de
  `base_de_datos.motor` y `auth.motor`).
- Qué APIs quedan activas y cuáles en `ninguno`.
- Si la línea es `starter` o `pro`, y qué cambia eso en el alcance.
Esto es una confirmación de una sola pasada, no una serie de preguntas —
si la ficha ya contesta todo, simplemente repítelo, no preguntes de nuevo.

### 2. Crea el proyecto en su propia carpeta/repo, NO dentro de este sistema
Este repositorio (`Sistema-de-Produccion/`) es la fábrica de bases, nunca el
lugar donde vive el proyecto de un cliente. La ubicación fija para todo
proyecto nuevo es:
```
Escritorio/sistema-de-procuccion/Proyectos-Clientes/<cliente-slug>/
```
(carpeta hermana de `Sistema-de-Produccion/`, ver su propio
`Proyectos-Clientes/README.md`). Estructura mínima dentro de esa carpeta:
```
<cliente-slug>/
├─ .git/                  ← inicializa git aquí (buena práctica #8 de CLAUDE.md)
├─ .gitignore             ← copiado de la(s) base(s) usada(s)
├─ .env                   ← copiado de .env.example, con las claves REALES
├─ contexto.yml           ← la ficha de contexto ya llena, sin secretos
├─ index.html             ← el demo.html de la base, renombrado y ajustado
└─ src/                   ← copiado tal cual de la base (adaptadores, tokens)
```
Si la ficha combina varias bases (ej. `landing-modular` + `carrito-reutilizable`),
fusiona sus `index.html` en una sola página o en varias rutas, según lo que
pida el proyecto — no dejes dos demos sueltas sin conectar.

### 3. Copia, no reinventes
- Copia `src/` de cada base **tal cual**. No reescribas la capa de datos ni
  los adaptadores — ya cumplen la interfaz `load/save` o `login/logout`.
- Copia `demo.html` como punto de partida y transfórmalo en la página real:
  quita la `.sysbar` (es solo para las demos de este repo, no para el
  cliente final), y deja el resto de la estructura.
- Copia `contexto.ejemplo.yml` → reemplázalo con los valores reales de la
  ficha que te dieron. El archivo final **no lleva secretos**, esos van
  solo en `.env`.

### 4. Aplica el contexto, no inventes contenido
- Reemplaza `CONTEXT` (o `CONTENT`) en el HTML con los valores reales de la
  ficha: marca, textos, productos/servicios, números de WhatsApp, etc.
- Si la ficha no especifica un dato que el demo sí usa (ej. un producto de
  ejemplo), pregunta antes de inventarlo — no rellenes con texto genérico
  en el entregable final.
- Aplica los tokens de marca (`marca.primario`, `marca.secundario`, etc.)
  vía las variables CSS, igual que hace cada `tokens.css`.

### 5. Conecta las APIs según la ficha, no todas por defecto
- Si `base_de_datos.motor` es `supabase` o `firebase`, pide las claves reales
  (o confirma que el cliente las va a poner luego) y configúralas en `.env`.
  Si no las tienes todavía, deja el motor en `local` y avisa explícitamente
  que falta conectar antes de entregar — no finjas que ya está conectado.
- Si `apis.pagos` no es `ninguno`/`whatsapp`, necesitas credenciales reales
  del proveedor (Wompi, Mercado Pago, Stripe) — no se pueden simular en
  producción. Avisa si faltan.
- Componentes UI: si necesitas un patrón que no está en el demo (un botón,
  una card), revisa primero `03-componentes-ui/components.css` antes de
  crear uno nuevo desde cero.

### 6. Checklist de entrega (no marques nada como listo sin esto)
- [ ] `git init` + primer commit en la carpeta del cliente.
- [ ] `.env` tiene las claves reales y **no está commiteado** (revisa `.gitignore`).
- [ ] El sitio abre y se ve con la marca del cliente, no con los valores de
      ejemplo de la base.
- [ ] Si hay panel admin (`menu-con-panel-admin` o cualquier base con `auth`),
      el login funciona con un usuario real, no con `admin@demo.com`.
- [ ] Performance básica: imágenes optimizadas, sin JS innecesario.
- [ ] Accesibilidad mínima: contraste, foco visible, alt text en imágenes.
- [ ] Si la ficha pedía GA4/analítica y no la conectaste, dilo explícitamente
      al entregar — no lo omitas en silencio.

### 7. Qué NO hacer
- No agregues bases, secciones o funciones que la ficha no pidió "porque
  podrían servir" — eso es trabajo no pagado y no acordado.
- No dejes `localStorage`/datos en memoria como solución final si la ficha
  pedía Supabase o Firebase — eso es solo para demos.
- No subas `.env` ni claves reales a ningún repositorio público.
- No marques el proyecto como "listo para entregar" si algún punto del
  checklist del paso 6 sigue pendiente.

---

## Cómo usar este prompt
1. Elige la ficha de contexto (`04-fichas-de-contexto/<rubro>.yml` como punto
   de partida, o una ficha específica ya llena del cliente).
2. Pega este archivo completo + la ficha en una conversación nueva.
3. Espera la confirmación del paso 1 antes de que se generen archivos.
