# Cómo lo usaría un experto

Esto responde una pregunta concreta: si un freelancer o estudio con
experiencia heredara este sistema hoy, ¿cómo lo aprovecharía para entregar
proyectos más rápido y con menos errores que empezando de cero cada vez?
No es teoría — es el recorrido real, archivo por archivo, con un ejemplo de
principio a fin.

## La idea de fondo, en una frase
**Nunca empiezas un proyecto en blanco.** Empiezas con una base ya probada
(`02-bases/`), la configuras con los datos del cliente (la ficha de
contexto), y el 80% del trabajo técnico ya está hecho antes de escribir la
primera línea nueva.

## El recorrido completo, con un cliente inventado

Imagina que te escribe "Casa Tela" — una tienda de ropa y accesorios que
hoy vende solo por Instagram y WhatsApp, y quiere una tienda online de
verdad. Esto es ecommerce, tu línea principal, así que es el caso que más
se va a repetir.

### 1. Capturas el alcance sin improvisar
Le envías `06-plantillas-de-negocio/brief-de-cliente.md`. No es un
formulario genérico — cada pregunta ya sabe a qué campo de la ficha de
contexto va a parar. Cuando te responde, no tienes que "traducir" sus
respuestas a nada: ya vienen en el lenguaje que el sistema entiende.

### 2. Cotizas con un número que ya calculaste, no que improvisas
Abres `06-plantillas-de-negocio/lista-de-precios.md` — empieza por
**Ecommerce & Ventas**, tu línea principal. No tiene precios de ejemplo:
tiene la fórmula (costo por hora × horas reales que te toma *reutilizando
una base*, no construyendo desde cero). Como esta es tu línea más frecuente,
ya deberías tener el número de "Ecommerce Completo" calculado de la primera
vez — y solo lo repites en cada propuesta nueva.

### 3. El alcance queda escrito antes de tocar código
Llenas `06-plantillas-de-negocio/plantilla-de-propuesta.md`: qué incluye,
qué no incluye, tiempos, precio. El cliente la confirma. Esto evita la
conversación incómoda de "yo pensé que eso estaba incluido" a mitad de
proyecto — ya quedó negro sobre blanco.

### 4. Eliges la base, no la reinventas
El brief te dice: catálogo con varios productos, control de cuántas
unidades quedan de cada uno, y que ella misma quiere editar precios sin
pedírtelo. Eso es exactamente `02-bases/ecommerce-completo/` — que ya trae
el login real del panel integrado (no necesitas sumar `auth` aparte, ya
está cableado). Si en cambio fuera una tienda simple sin inventario que
solo necesita cobrar, sería `landing-modular` + `carrito-reutilizable`
(ver `04-fichas-de-contexto/tienda.yml` como punto de partida).

Antes de construir, revisas `04-fichas-de-contexto/validador-de-ficha.md`:
¿tiene nombre real del negocio? ¿colores de marca? ¿catálogo real con
precios y stock, no "Producto 1, Producto 2"? Si falta algo obligatorio,
se lo preguntas ahora — no inventas un valor "para no parar" y lo
arrastras hasta la entrega.

### 5. Construyes con el proceso, no a memoria
Le pasas a quien construya (tú mismo, u otra persona del equipo)
`05-prompts-maestros/prompt-de-arranque.md` junto con la ficha ya llena.
Ese documento ya dice: dónde crear el proyecto (fuera de este repo — este
es la fábrica, no el entregable), qué copiar tal cual de la base, qué
NO inventar, y un checklist de entrega que no se puede saltar.

Lo específico de `ecommerce-completo` que no es obvio con solo leer el
código (que el stock es la única fuente de disponibilidad, que el carrito
está copiado de `carrito-reutilizable` sin cambios, qué hacer si el
inventario es muy ajustado) está en `05-prompts-maestros/prompt-por-base.md`.

### 6. Si falta contenido real, no inventas datos falsos
Casa Tela no te mandó fotos ni descripciones de cada producto todavía.
Usas `05-prompts-maestros/prompt-de-contenido.md` para un borrador de copy
en el tono del negocio — pero queda marcado explícitamente como borrador
pendiente de aprobación, nunca como contenido final. Las cifras de
inventario y precio nunca se inventan, ni siquiera como borrador — eso
viene del cliente, sin excepción.

### 7. Revisas antes de entregar, con criterio fijo, no con "se ve bien"
Antes de mandar el link al cliente, corres
`05-prompts-maestros/prompt-de-revision.md` sobre tu propio trabajo:
separación datos/presentación, tokens de marca, seguridad (¿el `.env` no
quedó commiteado? ¿el login es real, no el de la demo?), accesibilidad,
performance. Severidad por hallazgo, no intuición.

### 8. Entregas y, si toma soporte, ya sabes qué vendes
`06-plantillas-de-negocio/planes-de-soporte.md` ya tiene los 3 niveles
definidos (básico, crecimiento, marketing) — no negocias el soporte cada
vez desde cero.

## Por qué esto es más rápido que "ser bueno construyendo sitios"
Un freelancer experimentado sin este sistema sigue siendo rápido — pero
cada decisión (qué motor de datos, cómo nombrar las variables CSS, cómo
proteger el panel admin, qué le dice al cliente que sí/no incluye) la toma
de nuevo cada vez, y de memoria. Este sistema saca esas decisiones de tu
cabeza y las pone en archivos: **la próxima vez no las vuelves a tomar, las
copias.** Eso es lo que te permite escalar de un proyecto al mes a varios,
o sumar a alguien al equipo sin que tenga que adivinar cómo trabajas
(`07-operacion-equipo/onboarding.md` y `guia-de-estilo-de-codigo.md` existen
exactamente para eso).

## Lo que el sistema NO hace por ti (y un experto lo sabe)
- No decide tu precio — te da la fórmula, el número lo pones tú.
- No diseña la marca del cliente — los tokens están listos para recibirla,
  no para sustituirla.
- No mueve dinero real ni conecta cuentas — Supabase, GA4, Wompi, Mercado
  Pago necesitan que tú crees esas cuentas; el código ya está listo para
  recibir las claves en el momento en que existan (ver `.env.example` de
  cada base).
- No reemplaza tu juicio sobre qué pedir o no aceptar de un cliente — solo
  hace que, una vez decidido, ejecutarlo sea repetible.

## Mapa rápido de "qué archivo abro según lo que necesito"
| Necesito... | Abro... |
|---|---|
| Ver qué puedo ofrecer y a qué precio | `01-documentos/1-catalogo-de-servicios.html`, `06-plantillas-de-negocio/lista-de-precios.md` |
| Capturar un cliente nuevo | `06-plantillas-de-negocio/brief-de-cliente.md` |
| Cotizar y dejar el alcance escrito | `06-plantillas-de-negocio/plantilla-de-propuesta.md` |
| Saber qué base(s) usar | `04-fichas-de-contexto/` (rubro más cercano) |
| Validar que la ficha esté completa | `04-fichas-de-contexto/validador-de-ficha.md` |
| Construir el proyecto | `05-prompts-maestros/prompt-de-arranque.md` + `prompt-por-base.md` |
| Generar copy temporal | `05-prompts-maestros/prompt-de-contenido.md` |
| Auditar antes de entregar | `05-prompts-maestros/prompt-de-revision.md` |
| Copiar un componente visual | `03-componentes-ui/components.css` |
| Conectar GA4/Wompi reales | `.env.example` de la base + `03-componentes-ui/analytics.js` / `wompi.adapter.js` |
| Sumar a alguien al equipo | `07-operacion-equipo/onboarding.md` |
