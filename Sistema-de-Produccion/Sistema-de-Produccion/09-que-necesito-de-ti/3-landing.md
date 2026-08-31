# 3 · Landing page — `landing-modular`

**Qué incluye:** página de una sola vista por secciones (hero, servicios,
formulario de contacto, footer) con los leads guardados en base de datos.
**Qué NO incluye:** blog, multipágina, tienda. Es una página que convierte,
no un sitio web completo.

---

## A. Identidad 🔴

```
Nombre del negocio    : ______________________
Qué hace, en 1 frase  : ______________________
A quién le vende      : ______________________
Ciudad                : ______________________
WhatsApp              : 57________
Correo de contacto    : ______________________
Redes                 : ______________________
```

## B. Objetivo de la página 🔴 — solo uno

```
[ ] Que escriban por WhatsApp
[ ] Que dejen sus datos en el formulario
[ ] Que agenden una cita
[ ] Que llamen
```

**Elige uno.** Una landing con cuatro objetivos no cumple ninguno: cada
botón adicional le quita fuerza al principal. El resto de vías de contacto
van en el footer, no compitiendo con el botón grande.

## C. Secciones 🔴

Marca las que van y en qué orden:

```
[ ] Hero (título + subtítulo + botón)          orden: __
[ ] Servicios / qué ofrece                     orden: __
[ ] Cómo funciona (pasos)                      orden: __
[ ] Preguntas frecuentes                       orden: __
[ ] Formulario de contacto                     orden: __
[ ] Footer                                     orden: __
```

**Hero** 🔴 — lo único que casi todos leen:

```
Titular (máx. 8 palabras): ______________________
Subtítulo (1 frase)      : ______________________
Texto del botón          : ______________________
```

El titular dice qué gana el cliente, no cómo se llama la empresa.
"Tu contabilidad al día sin perseguir recibos" > "Bienvenidos a Contadores
S.A.S.".

**Servicios** 🔴 — 3 a 6:

| Título | Descripción (1-2 líneas) | Icono/emoji |
|---|---|---|
| | | |

**Preguntas frecuentes** 🟢 — 3 a 6. Escribe las que de verdad le hacen
por WhatsApp; son las que quitan fricción.

## D. Testimonios 🟢

```
[ ] No hay todavía  → la sección no se pone
[ ] Sí, reales:
    "____________" — Nombre, cargo/negocio  [ ] autorizó publicarlo
```

**No invento testimonios ni cifras.** Si no hay clientes reales todavía,
la sección se omite: una landing sin testimonios es normal, una con
testimonios falsos es un problema legal y de confianza el día que alguien
pregunte.

## E. Formulario de leads 🔴

```
Campos: [x] nombre  [x] contacto  [ ] mensaje  [ ] empresa  [ ] presupuesto
¿A dónde llega el aviso de un lead nuevo?
  [ ] solo se guarda en la base (lo revisa entrando)
  [ ] correo a: ____________  (necesita RESEND_API_KEY 🔒)
  [ ] WhatsApp   (no es automático — hay que abrir el panel)
Texto después de enviar: ______________________
```

Cada campo extra baja la cantidad de leads. Pide lo mínimo para poder
devolver la llamada; el resto se pregunta hablando.

⚠️ **Política de privacidad**: si guardas datos de personas, en Colombia
(Ley 1581 de 2012) el negocio necesita autorización del titular y una
política publicada. Un checkbox de "autorizo el tratamiento de mis datos"
enlazado a esa política. La política la tiene que dar el cliente — no la
redactes tú.

## F. Marca 🟡

```
Color principal : #______
Color secundario: #______
Tipografía      : ______________
Logo            : ______
Fotos           : [ ] propias, carpeta: ______  [ ] de banco  [ ] no hay
Tono: [ ] cercano  [ ] formal  [ ] técnico  [ ] aspiracional
```

## G. SEO 🟡

```
Título para Google (máx. 60 caracteres): ______________________
Descripción (máx. 155)                 : ______________________
Palabras que la gente buscaría         : ______________________
```

## H. Credenciales

Ver [0-credenciales-comunes.md](./0-credenciales-comunes.md).
Usa: `DB_MOTOR`, `SUPABASE_*` (o `FIREBASE_*`), `GA4_ID`,
`RESEND_API_KEY` 🔒 (solo si los leads se avisan por correo).

---

## 🔴 Sin esto no arranco

1. Objetivo único de la página
2. Titular y subtítulo del hero
3. Lista de servicios
4. Motor de base de datos (dónde caen los leads)

## ⚠️ Dilo antes de firmar

- **Publicar no es aparecer en Google.** Posicionar toma meses y es otro
  servicio. Lo que sí entregas es una página técnicamente lista para
  posicionar.
- Sin `RESEND_API_KEY`, los leads **no llegan solos por correo**: quedan
  guardados y hay que entrar a mirarlos. Si el cliente cree que le van a
  llegar avisos, va a perder leads y va a decir que la página no sirve.
- Un lead sin respuesta en 24 horas está perdido. Eso no es tu página: es
  su proceso. Vale la pena decirlo en la entrega.
