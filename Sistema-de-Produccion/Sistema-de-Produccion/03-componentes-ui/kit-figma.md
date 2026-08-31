# Kit Figma equivalente — especificación para reconstruirlo

No puedo generar un archivo `.fig` real (no tengo acceso a la API de Figma
desde aquí). Esto es la especificación exacta — mismos valores que
`tokens.css` y `components.css` — para que construyas el archivo de Figma
una vez, a mano o con un plugin de "tokens a estilos", y quede 1:1 con el
código. Diseño y código en paralelo significa que cambiar un valor aquí
implica cambiar el otro, no que estén desincronizados.

## Estilos de color (Figma → "Color styles")
| Nombre del estilo | Valor | Variable CSS equivalente |
|---|---|---|
| Brand/Primario | `#2F54FF` | `--brand` |
| Brand/Fondo | `#F5F7FB` | `--bg` |
| Brand/Acento | `#E8A02C` | `--accent` |
| Superficie | `#FFFFFF` | `--surface` |
| Texto/Principal | `#0F1626` | `--ink` |
| Texto/Suave | `#454F66` | `--ink-soft` |
| Línea/Borde | `#E2E7F0` | `--line` |
| Estado/Peligro | `#E5484D` | `--danger` |

Estos son los valores **neutros** del kit (`03-componentes-ui/tokens.css`).
Cada base/cliente sobreescribe `Brand/Primario`, `Brand/Fondo` y
`Brand/Acento` con los de su `marca.*` en la ficha de contexto — en Figma,
crea una página "Marca: [cliente]" que reasigna estos 3 estilos por proyecto.

## Estilos de texto (Figma → "Text styles")
| Nombre del estilo | Fuente | Uso |
|---|---|---|
| Display/H1 | Space Grotesk, 600, 28-48px | títulos de hero |
| Display/H2 | Space Grotesk, 600, 20-26px | títulos de sección |
| Display/H3 | Space Grotesk, 600, 15-16px | títulos de card |
| Body/Base | Inter, 400, 14-15px | texto general |
| Body/Soft | Inter, 400-500, 12-13px | texto secundario, ayuda |
| Mono/Tag | JetBrains Mono, 500, 10-12px | pills, badges, sysbar |

`Display` y `Body` son las dos familias del contrato (`--display`,
`--body`) — cada proyecto puede cambiarlas (ver `marca.display`/`marca.body`
en las fichas), `Mono` se mantiene fijo porque es parte del lenguaje visual
de "sistema/demo", no de la marca del cliente.

## Espaciado y forma
| Token | Valor |
|---|---|
| Radio de borde | `14px` (`16px` en menú/carrito — algunas bases usan un radio mayor, revisa su `tokens.css`) |
| Espaciado base | `16px` (múltiplos: 8/12/16/20/24px) |

## Inventario de componentes (un frame de Figma por cada uno)
Corresponde 1:1 a `03-componentes-ui/components.css` — no hay componente en
ese CSS sin su equivalente aquí, y viceversa:
- Sysbar
- Botón (Primario / Ghost / Danger, con estado disabled)
- Pill / Badge
- Nav por pills (estado activo/inactivo)
- Card (genérica y variante Producto con precio)
- Input + mensaje de error/éxito
- Switch (on/off)
- Drawer/Modal lateral
- Línea de carrito (con selector de cantidad)
- Resumen de checkout
- Footer simple

## Cómo mantenerlo sincronizado
1. Si cambias un valor en `tokens.css`, actualiza la fila correspondiente
   en este documento y el estilo en Figma — los tres deben decir lo mismo.
2. Si agregas un componente nuevo a `components.css`, agrégalo a la lista
   de arriba y créale el frame en Figma antes de darlo por "terminado".
3. Cuando tengas el archivo de Figma real, enlázalo aquí (este documento
   pasa a ser el índice, el archivo de Figma la fuente visual).
