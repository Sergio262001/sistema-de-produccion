# Prompt de contenido

Úsalo cuando el cliente no entregó copy final (textos de hero, descripciones
de servicios/productos, mensajes del formulario) y necesitas algo razonable
para avanzar, **siempre marcado como temporal** hasta que el cliente lo
revise. No sustituye el contenido real — lo adelanta.

---

## INSTRUCCIONES (copiar desde aquí)

Vas a generar copy (textos) para un proyecto de cliente, en el tono que diga
su ficha de contexto (`marca.tono`). No estás inventando información sobre
el negocio — estás redactando con la información que el cliente sí dio,
de forma más clara o atractiva.

### 1. Antes de escribir nada
- Lee `marca.tono` en la ficha (ej. "cercano, artesanal" o "claro,
  profesional, tranquilizador") — cada frase que generes debe sonar
  coherente con eso, no genérica.
- Lee qué datos reales del negocio ya existen en la ficha (`cliente`,
  `contenido.servicios`, `marca.subtitulo`) — el copy nuevo no puede
  contradecirlos ni inventar servicios/productos que no estén ahí.
- Si la ficha no tiene ni el tono ni ningún dato del negocio más allá del
  nombre, **detente y pide al cliente al menos 2-3 frases sobre qué hace**
  — no se puede generar copy creíble de la nada.

### 2. Qué puedes generar
- **Hero** (`contenido.hero.titulo` + `.subtitulo`): una promesa concreta
  del negocio, no una frase motivacional genérica ("Calidad y compromiso"
  no dice nada — "Pizza al horno de leña, lista en 15 minutos" sí).
- **Descripciones de servicio** (`contenido.servicios[].desc`): una frase
  por servicio, específica al servicio, no intercambiable entre ellos.
- **Mensajes de formulario** (placeholder, confirmación de envío, error):
  cortos, en el tono del negocio, nunca técnicos ("Ocurrió un error" está
  bien; "Error 500: fetch failed" no).
- **Resumen de WhatsApp/checkout**: ya tiene una plantilla en
  `carrito-reutilizable/src/core/checkout.js` (`resumenTexto`) — si la
  ficha pide otro tono ahí, ajusta solo el texto, no la estructura del mensaje.

### 3. Cómo entregarlo
- Marca explícitamente cada texto generado como **borrador, pendiente de
  aprobación del cliente** — en un comentario, en el README del proyecto, o
  donde sea visible para quien revise antes de la entrega final.
- Si generas varias opciones para una misma frase (ej. 3 versiones del
  título del hero), dilo — no entregues 3 sin explicar que son alternativas
  a elegir, no que las 3 van juntas.

### 4. Qué NO hacer
- No inventes cifras, certificaciones, premios o años de experiencia del
  negocio — eso es información factual, no copy, y si está mal puede ser
  publicidad engañosa.
- No completes campos de contenido con texto genérico y lo entregues como
  si fuera definitivo — siempre se marca como borrador (ver punto 3).
- No cambies el tono a uno que "suena mejor" si contradice lo que dice
  `marca.tono` en la ficha — el tono lo define el cliente, no tu preferencia.
