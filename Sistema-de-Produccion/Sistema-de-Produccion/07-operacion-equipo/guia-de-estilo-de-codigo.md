# Guía de estilo de código

Para que cualquiera (tú en 6 meses, o alguien que se sume al equipo) pueda
retomar una base o un proyecto de cliente sin tener que adivinar
convenciones. No es una lista de gustos — cada regla existe porque ya se usó
así en `02-bases/` y romperla rompe la reutilización entre bases.

## Reglas de código
1. **Vanilla HTML/CSS/JS.** No framework (React, Vue, etc.) salvo que se
   acuerde explícitamente para un proyecto puntual — las bases de este
   sistema están pensadas para abrir con doble clic, sin build step.
2. **Comentarios y nombres en español**, igual que el resto del sistema.
   Nombres de variables/funciones descriptivos (`renderAdmin`, no `ra`).
3. **`demo.html` es un solo archivo, sin imports ES.** Todo el JS de la
   demo va inline en un `<script>` al final del `<body>`, replicando (no
   importando) la lógica de `src/`. Si la demo y `src/` se desincronizan,
   corrige los dos.
4. **`src/` sí usa módulos ES** (`import`/`export`) — es la versión
   reutilizable, pensada para un proyecto real con bundler o `<script type="module">`.
5. **Capa de datos con adaptador**: todo adaptador de datos expone
   `load()`/`save()`; todo adaptador de auth expone
   `login()`/`logout()`/`current()` (o `subscribe()`). Nunca cambies esa
   forma — otras partes del sistema asumen que existe.
6. **CSS sin colores/fuentes fijos.** Todo sale de las variables del
   contrato de tokens (`--brand`, `--bg`, `--ink`, etc. — ver
   `03-componentes-ui/tokens.css`). Si necesitas un color nuevo, agrégalo
   como variable, no lo escribas literal en una regla.
7. **Sin estilos inline (`style="..."`) en HTML.** Si necesitas un ajuste
   puntual, créale una clase utilitaria corta (ej. `.mt-14`) en el
   `<style>` del archivo, no lo pongas inline.
8. **Todo `<button>` lleva `type="button"` o `type="submit"` explícito.**
   Sin esto, dentro de un `<form>` puede enviar el formulario por accidente.
9. **Accesibilidad mínima no es opcional**: `aria-label` en botones sin
   texto visible, `alt` en imágenes con significado, foco visible
   (`:focus-visible`), contraste AA.

## Reglas de estructura
1. **Cada base es autocontenida** (ver `CLAUDE.md`) — nunca importes desde
   otra carpeta de `02-bases/` ni desde `03-componentes-ui/`. Copia el
   código que necesites.
2. **Cada base trae**: `demo.html`, `README.md`, `contexto.ejemplo.yml`,
   `.env.example`, `.gitignore`, y `src/`. Si falta alguno, no está completa.
3. **El número de carpeta indica orden de creación**, no importancia —
   `02-bases/` es lo más importante del sistema aunque no sea la carpeta `01`.
4. **Dentro de `src/`, `data/` y `core/` significan cosas distintas — no son
   intercambiables:**
   - **`data/`** — adaptadores que leen/escriben una colección persistente
     (catálogo, leads, clientes). Siempre expone `load()`/`save()` (o las
     variantes documentadas de esa base). Bases con `data/`: `menu-con-panel-admin`,
     `landing-modular`, `crm-simple`, `dashboard-analytics`, `suscripciones`,
     y las que combinan ambas (`ecommerce-completo`, `marketplace`).
   - **`core/`** — motor reutilizable sin persistencia propia (el carrito
     vive en memoria, el login solo gestiona sesión). Bases con `core/`:
     `auth`, `carrito-reutilizable`, y las que lo copian
     (`ecommerce-completo`, `marketplace`).
   - Si una base necesita ambos (vende algo Y tiene catálogo), trae las dos
     carpetas — no fuerces todo dentro de una sola.

## Antes de hacer un Pull Request / entregar un cambio
- Corre `05-prompts-maestros/prompt-de-revision.md` sobre tu propio cambio
  antes de pedir que alguien más lo revise.
- Si tocaste una base, verifica que `demo.html` y `src/` sigan diciendo lo
  mismo (ver regla 3 de arriba).
- Si agregaste un componente de UI reutilizable, considera si pertenece a
  `03-componentes-ui/` para que la próxima base también lo tenga.
