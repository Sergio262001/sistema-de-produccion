# Brief de cliente

Cuestionario que le envías a un cliente nuevo **antes** de armar la ficha de
contexto. Las respuestas se convierten directamente en los campos de
`04-fichas-de-contexto/` — cada pregunta de aquí mapea a un campo de la
ficha (lo indico entre paréntesis) para que llenarla después sea copiar y
pegar, no interpretar.

---

## Cómo usarlo
1. Copia las preguntas de abajo en un formulario (Google Forms, Typeform) o
   en un documento que le compartas al cliente.
2. Con las respuestas, llenas la ficha de contexto (`04-fichas-de-contexto/<rubro>.yml`
   como plantilla) — cada pregunta dice a qué campo va.
3. Si una respuesta queda vacía o ambigua, **pregunta antes de asumir** — no
   completes la ficha con un valor inventado "porque es lo típico".

---

## 1. Identidad del negocio
- ¿Cómo se llama tu negocio? *(→ `cliente`, `proyecto`)*
- ¿A qué te dedicas, en una frase? *(→ `marca.subtitulo` o `contenido.hero.subtitulo`)*
- ¿Tienes dominio propio o hay que comprarlo? *(→ `entrega.dominio`)*
- ¿Una sede o varias? *(si varias, probablemente `linea: pro`)*

## 2. Qué necesitas
- ¿Qué quieres que la web haga? (elige una o varias)
  - [ ] Mostrar mi carta/menú y que la gente la vea (→ base `menu-con-panel-admin`)
  - [ ] Que la gente me escriba o pida una cita (→ base `landing-modular`)
  - [ ] Vender productos en línea (→ base `carrito-reutilizable`)
  - [ ] Que mi equipo entre a un panel a editar algo (→ base `auth`)
- ¿Quieres editar tú mismo los precios/contenido, o prefieres pedírmelo a mí
  cada vez? *(si "tú mismo" → necesita panel admin)*

## 3. Marca
- ¿Tienes logo, colores y tipografía definidos? Si sí, adjúntalos.
  *(→ `marca.primario`, `marca.secundario`, `marca.display`, `marca.body`)*
- Si no tienes marca definida todavía, ¿qué 2-3 palabras describen el tono
  que quieres? (ej. "cercano y artesanal", "profesional y serio")
  *(→ `marca.tono`)*

## 4. Contenido real (no relleno)
- Si es menú: ¿categorías y productos reales, con precios? (puede ser una
  foto de la carta física, no hace falta que lo digiten ellos)
- Si es landing: ¿qué 3-5 servicios quieres mostrar, con una frase cada uno?
  *(→ `contenido.servicios`)*
- ¿Tienes fotos propias o usamos imágenes genéricas mientras consiguen
  fotos? *(anota la respuesta — no asumas "sí tiene fotos")*

## 5. Cómo reciben contactos/pedidos hoy
- ¿Usan WhatsApp para vender o atender? ¿Cuál es el número?
  *(→ `apis.whatsapp_num`)*
- Si van a cobrar en línea: ¿ya tienen cuenta en alguna pasarela (Wompi,
  Mercado Pago, Stripe)? Si no, ¿están dispuestos a crear una?
  *(→ `apis.pagos` — si no tienen cuenta, el checkout queda en `whatsapp`
  mientras la tramitan, nunca se simula un cobro real)*
  **La cuenta de pagos la crea el cliente, no tú** — el dinero de sus
  ventas debe llegar a su cuenta bancaria con su propio NIT/RUT. Tú solo
  necesitas que te pasen la `public_key` una vez la tengan.

## 6. Datos y privacidad
- ¿El negocio va a guardar datos personales de clientes/pacientes (nombre,
  teléfono, historial)? *(si sí → revisar línea `pro` y RLS estricto, como
  en `clinica.yml`)*
- ¿Ya tienen cuenta de Supabase o Firebase, o hay que crear una nueva?
  *(→ `base_de_datos.motor` — si no tienen, arranca en `local` hasta que
  decidan, y se documenta como pendiente, no como "ya conectado")*

## 7. Medición
- ¿Quieren saber cuántas personas visitan la página? *(→ `apis.analitica: ga4`)*
- ¿Ya tienen cuenta de Google Analytics? Si no, ¿la creamos juntos?

## 8. Soporte después de la entrega
- ¿Esperan que tú actualices contenido seguido, o ellos van a editarlo solos
  con el panel? *(→ define si vale la pena el panel admin o basta con algo
  más simple)*
- ¿Quieren un plan de soporte mensual, o solo la entrega puntual?
  *(→ `entrega.soporte`)*
