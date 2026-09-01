# Plan de mejoras — del andamiaje al entregable

Escrito el 2026-09-01, después de un día probando el sistema con briefs
reales. Todo lo que hay aquí sale de algo que falló al usarlo, no de una
lista de buenas ideas.

## El hallazgo del día

**Los cuatro bugs que importaron los encontró el dueño abriendo la página,
no yo leyendo el código.** El validador daba 0 errores en todos los casos:

| Bug | Qué decía el validador |
|---|---|
| Página en blanco por `id` faltante | 0 errores |
| Página en blanco por sintaxis rota | 0 errores |
| Entregable con el nombre de otro cliente | 0 errores |
| 14 de 19 respuestas del brief perdidas | 0 errores |

De ahí sale la regla que ordena este plan: **lo que no se abre y se mira, no
está verificado.** Y la pregunta que decide qué construir primero:
*¿esto acerca el entregable a algo que un cliente pueda usar tal cual?*

---

## El problema de fondo: el contenido

Todo lo que "se ve básico" tiene la misma causa. El sistema produce la
estructura correcta y la llena con **la panadería de otro**. Un menú de tacos
que muestra huevos benedictinos no se arregla con mejor tipografía.

Las tres cosas que pidió el dueño —editor de textos, opción "no aplica",
subir logo y banner— son tres caras de esto mismo. Van juntas, en la fase 1.

---

## FASE 1 · Que el contenido sea del cliente

### 1.1 Preguntas de contenido en el brief

Hoy el brief pregunta **qué servicio** y **cómo se ve**. No pregunta **qué
va adentro**, que es justo lo que hace que un entregable esté vivo o vacío.

Por servicio:

| Servicio | Lo que falta preguntar |
|---|---|
| Menú QR | Categorías (Desayunos, Postres…) y platos con precio |
| Tienda / Carrito | Categorías y productos con precio y stock |
| Landing | Qué secciones, y el texto del hero |
| CRM | Qué estados usa el negocio, si no le sirven los tres por defecto |

No hace falta que el cliente lo digite todo: una foto de la carta física
sirve, y de ahí sale el contenido. Pero **la pregunta tiene que existir**,
porque hoy ni siquiera se hace.

### 1.2 "No aplica" en todas las preguntas

Cada pregunta gana una opción **"No aplica / todavía no sé"**. Y una regla
que no se negocia:

> Lo que se marque como no-aplica **se omite del entregable**. No se
> simula, no se rellena con un ejemplo, no se inventa un valor razonable.

Si un menú no tiene postres, no se entrega con una categoría "Postres"
vacía ni con postres de mentira: **no se entrega esa sección**. Y el README
del proyecto lo lista como pendiente, para que se pueda pedir después.

Esto ya es la regla del sistema —*"si una respuesta queda vacía, pregunta
antes de asumir"*— pero hoy vive solo en el `brief-de-cliente.md`. Hay que
volverla ejecutable.

### 1.3 Logo y banner

Hoy el logo es **una letra en un cuadro**. Sirve para una demo; no para
entregar a un negocio que ya tiene logo.

- `marca.logo` — URL de la imagen. Si está, reemplaza la inicial.
- `marca.banner` — imagen de cabecera, opcional.
- La inicial se queda como respaldo, igual que el emoji con las fotos.
- Mismo filtro `urlSegura` que ya protege las fotos de producto.

### 1.4 Editor de contenido en el panel

El panel admin de las bases ya edita productos. Falta:

- Añadir, renombrar y **reordenar categorías** (hoy solo se editan ítems).
- Editar los textos de la página: título, subtítulo, mensaje del checkout.
- Subir imágenes en vez de pegar una URL a mano.

**Alcance honesto:** esto es un editor de contenido, no WordPress. No lleva
plantillas, plugins, revisiones ni usuarios múltiples. Es lo que hace falta
para que el cliente mantenga su propio contenido sin llamar al estudio —
que es el objetivo real detrás de la idea.

---

## FASE 2 · Que el trabajo no se pierda

Cosas que ya deberían estar y no están. Son aburridas y son las que evitan
un día malo.

### 2.1 Pruebas de `acceso.js`

**Es el login del panel y no tiene una sola prueba.** Hay 117 pruebas en el
sistema y ninguna toca el código de seguridad. Es la brecha más incómoda de
la lista.

### 2.2 Cerrar `prueba-ecommerce`

El pendiente original, el que estaba en el `CLAUDE.md` antes de todo esto:
el login usa `localAuth` y las políticas RLS exigen una sesión real de
Supabase Auth, así que guardar desde el panel falla. Sigue igual.

### 2.3 Partir `panel.html`

1.144 líneas en un archivo. Fue la decisión correcta para arrancar y dejó de
serlo hace rato.

---

## FASE 3 · Que las 9 bases estén al mismo nivel

Hoy las mejoras están repartidas de forma desigual, y eso es peor que no
tenerlas: no se sabe qué esperar de cada base.

| Mejora | Dónde está |
|---|---|
| Fotos de producto | 2 de 9 |
| Direcciones de arte | 1 de 9 |
| Bloque en `prompt-por-base.md` | 10 de 10 ✅ |
| Esquema SQL con RLS | 9 de 9 ✅ |

Prioridad: `carrito-reutilizable` y `marketplace` primero, por ser de venta.

---

## Lo que NO está en este plan, y por qué

- **Un WordPress de verdad.** Plantillas, plugins, revisiones, roles
  múltiples. Es un producto entero y no es el negocio del estudio.
- **Editor visual de arrastrar y soltar.** Suena bien y cuesta meses. El
  panel de campos resuelve el 90% del problema real.
- **Más direcciones de arte.** Tres bien hechas valen más que ocho a medias.
  Se agrega una cuarta cuando aparezca un cliente que no encaje en ninguna.
- **Multiusuario, servidor de base de datos, contenedores.** El estudio es
  una persona. Eso multiplicaría el trabajo sin devolver nada.

---

## El orden, y el porqué

1. **1.2 "No aplica"** — es pequeño y cambia el criterio de todo lo demás.
   Además es la regla que el sistema ya predica y no cumple.
2. **1.1 Preguntas de contenido** — sin esto, ninguna mejora de diseño se
   nota, porque el entregable sigue mostrando datos de otro negocio.
3. **1.3 Logo y banner** — el cambio visual más grande por menos trabajo.
4. **2.1 Pruebas de acceso** — media hora, y quita la brecha más incómoda.
5. **1.4 Editor de contenido** — el más grande de la fase 1; va después de
   que las preguntas existan, porque edita lo que ellas recogen.
6. **Fase 3** — cuando lo de arriba esté probado en un cliente real.

## Cómo se sabrá si funcionó

No por las pruebas en verde. Por esto:

> Generar un proyecto, abrirlo, y que se vea **el negocio del cliente** —
> su nombre, su logo, sus categorías, sus precios, sus fotos — sin editar
> un solo archivo a mano.

Hoy eso no pasa. Cuando pase, la fase 1 está cerrada.
