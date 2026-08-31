# Fichas de contexto por rubro

Variantes de la ficha de contexto (E3 del backlog) ya llenas con datos
realistas para los rubros más comunes del estudio. Sirven para cotizar y
arrancar un proyecto nuevo más rápido: copias la del rubro que más se parezca
al cliente, le cambias nombre/marca/claves, y ya tienes el 80% de las
decisiones tomadas (qué bases usar, qué motor de datos, qué APIs).

## Diferencia con `contexto.ejemplo.yml` de cada base
Cada base en `02-bases/` trae su propio `contexto.ejemplo.yml` con **solo**
los campos que esa base necesita. Las fichas de aquí son **compuestas**: un
proyecto real casi siempre usa más de una base (ej. landing + carrito), así
que el campo `bases:` lista cuáles, y el resto de la ficha trae las
secciones de cada una juntas en un solo archivo.

## Rubros incluidos
| Ficha | Rubro | Bases que combina | Línea típica |
|---|---|---|---|
| `restaurante.yml` | Restaurante / café / bar | `menu-con-panel-admin` (+ `auth` si es pro) | starter |
| `tienda.yml` | Tienda / retail pequeño | `landing-modular` + `carrito-reutilizable` | starter |
| `clinica.yml` | Clínica / consultorio | `landing-modular` + `auth` | pro |

## Cómo usar una ficha
1. Copia el archivo del rubro más cercano al cliente nuevo.
2. Renómbralo `contexto.<cliente>.yml`.
3. Ajusta `proyecto`, `cliente`, `marca` y `contenido` con los datos reales.
4. Revisa `bases:` — si el cliente no necesita una de las bases listadas
   (ej. no quiere panel de pedidos), quítala y simplifica esa sección.
5. Revísala contra **[validador-de-ficha.md](./validador-de-ficha.md)** —
   un checklist de campos mínimos por base, para no construir sobre algo
   incompleto o con un valor inventado.
6. Pásame la ficha + dime qué bases copiaste; ensamblo el producto.

## Por qué `clinica.yml` viene en línea `pro`
Maneja datos de pacientes (nombre, contacto, motivo de consulta), así que
por defecto pide roles (`admin`/`recepcion`) y RLS estricto en la tabla de
leads — no es un capricho de alcance, es el mínimo razonable para datos
sensibles. Bájala a `starter` solo si el cliente explícitamente no va a
guardar información de pacientes en la base de datos.

## Limitaciones honestas
Ninguna de las 3 fichas asume bases que no existen todavía:
- `clinica.yml` usa un formulario de leads como "solicitud de cita", no un
  calendario real con disponibilidad — esa es una base futura.
- `tienda.yml` usa el carrito reutilizable, no inventario/filtros — eso es
  "Ecommerce Completo" (E2 del backlog, sin construir).
Si el cliente pide algo de la lista anterior, dilo explícitamente en la
ficha (`notas:`) en vez de prometerlo en el alcance.
