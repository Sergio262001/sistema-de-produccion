---
name: ficha-de-contexto
description: El contrato del YAML que define un proyecto de cliente y la compuerta que decide si se puede construir — qué campos son obligatorios, qué significa POR DEFINIR y cómo llegan las respuestas del brief a la ficha. Úsala al leer, escribir o validar un contexto.yml.
---

# La ficha de contexto

Es la pieza operativa del sistema: un YAML por proyecto. Sin ficha válida no
se construye — **se pregunta**.

```yaml
cliente:   "Tacos Mauricio"        # el nombre real, con tildes
proyecto:  "Tacos Mauricio"
base:      menu-con-panel-admin
linea:     starter                 # starter | pro

marca:
  logo:       ""                   # URL https:// , /ruta , ./ruta , o vacío
  banner:     ""
  inicial:    "TM"                 # respaldo si no hay logo
  primario:   "#B23A2E"
  secundario: "#FFF6EC"
  direccion:  mercado              # mercado | boutique | taller
  subtitulo:  "Taquería de barrio • Medellín"
  tono:       "cercano y de barrio"

pagina:                            # los bloques. Vacío = no se pinta
  hero:      { titular: "...", bajada: "..." }
  sobre:     { titulo: "...", texto: "..." }
  horarios:  ["Martes a domingo · 12:00 a 22:00"]
  ubicacion: { direccion: "..." }
  redes:     { instagram: "tacosmauricio" }

base_de_datos: { motor: supabase }  # supabase | firebase | local
apis:   { pagos: whatsapp, whatsapp_num: "573666778839", analitica: ninguna }
auth:   { motor: local, rol_requerido: admin }
entrega:{ dominio: "tacosmauricio.co", soporte: plan_mensual }
env:    [SUPABASE_URL, SUPABASE_ANON_KEY]   # SOLO NOMBRES, nunca valores
```

---

## La compuerta

`validarFicha()` en `herramientas/lib/brief.js` es el validador ejecutable. Si
falta un campo marcado `clave`, **el botón de construir queda deshabilitado**.

Obligatorios: `cliente`, `entrega.dominio`, `linea`, `apis.pagos`,
`base_de_datos.motor`, `marca.primario`, `marca.secundario`, y el servicio.

Y rechaza placeholders disfrazados de respuesta: `Cliente X`, `Proyecto 1`,
`prueba`, `test`. Un nombre falso que llega a la entrega se nota.

---

## `POR DEFINIR` no es un valor, es una nota

Los campos de **identidad** (`subtitulo`, `tono`, `dominio`, `whatsapp_num`,
`inicial`, `logo`, `banner`) nunca se heredan del ejemplo: se marcan
`POR DEFINIR` en la ficha del cliente.

Y `POR DEFINIR` **no se escribe en el HTML**. Es una nota interna para ti; el
entregable simplemente no muestra ese campo.

## `"no aplica"` se omite, no se simula

Lo que el cliente marcó así no se entrega: no se rellena con el ejemplo, no se
inventa un valor razonable. Se omite y queda escrito como pendiente.

La lista de formas reconocidas es **corta a propósito**: `no aplica`,
`no-aplica`, `n/a`, `n.a.`. Se probó con `"todavía no"` dentro y se tragaba una
respuesta legítima — "todavía no" como dominio significa "hay que comprarlo", y
eso es información, no ausencia de ella. Ante la duda, se trata como respuesta:
perder un dato del cliente es peor que arrastrar uno ambiguo.

---

## Del brief a la ficha

Dos caminos llegan a la misma función, `respuestasAFicha()`:

1. **`herramientas/brief.html`** — el formulario que se le manda al cliente.
   Autocontenido, abre con doble clic. Devuelve un bloque
   `--- BRIEF-ESTUDIO v1 ---` que el panel lee **exacto y gratis**.
2. **El asistente del panel** — lo llenas tú en una llamada.

Las normalizaciones viven en `respuestasAFicha()` y no en cada formulario,
porque por ahí pasan los dos caminos. Arreglarlo en uno dejaría el otro mal:

- WhatsApp sin indicativo: `3666778839` → `573666778839` (y avisa).
- `"no"` / `"ninguno"` como dominio → `"por comprar"`.
- Horarios y servicios de texto libre → lista.
- Instagram con arroba o URL completa → solo el usuario.
- URL de logo que no es URL → se descarta **con aviso**.

## Las coherencias que se fuerzan

| Si… | Entonces |
|---|---|
| guarda datos personales | `linea: pro` y RLS estricto. No es negociable |
| tiene varias sedes | `linea: pro` |
| la pasarela ≠ whatsapp | aviso: la cuenta la crea el cliente, con su NIT |
| `motor: local` | aviso: es punto de partida válido, pero queda escrito como temporal |

---

## Los avisos son parte del entregable

`respuestasAFicha()` devuelve `avisos`, y no son decoración: son lo que el
estudio tiene que saber **antes** de publicar. Sin catálogo, sin logo, sin
ningún bloque de página, una URL sospechosa de Drive, un WhatsApp dudoso.

Si te los callas, el dueño lo descubre abriendo la entrega delante del cliente.
