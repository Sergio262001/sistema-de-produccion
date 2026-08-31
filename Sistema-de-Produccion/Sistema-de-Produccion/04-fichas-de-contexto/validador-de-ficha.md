# Validador de ficha — checklist de campos mínimos

Antes de pasar una ficha de contexto a construcción (`05-prompts-maestros/prompt-de-arranque.md`),
recórrela contra esta lista. Si falta algo marcado como **obligatorio**,
detente y pídeselo al cliente — no lo completes con un valor inventado "para
no parar el trabajo". Un campo mal asumido se nota en el entregable.

## Cómo usarlo
Marca cada casilla mientras revisas la ficha. Si llegas al final con todo
marcado, está lista para construir. Si algo queda sin marcar y es
obligatorio, esa es la pregunta que le devuelves al cliente.

## Campos universales (toda ficha, sin importar la base)
- [ ] `proyecto` y `cliente` — nombres reales, no placeholders tipo "Cliente X"
- [ ] `linea` — `starter` o `pro`, explícito (no "decidir después")
- [ ] `bases` — lista qué base(s) de `02-bases/` usa este proyecto
- [ ] `marca.primario` y `marca.secundario` — colores reales o, si no los
      tiene definidos, una nota explícita de que se va a diseñar la marca
      como parte del proyecto (no inventes colores "bonitos" por tu cuenta)
- [ ] `entrega.dominio` — el dominio real, o nota de que falta comprarlo
- [ ] `entrega.idiomas` — al menos `[es]`

## Si usa `menu-con-panel-admin`
- [ ] `base_de_datos.motor` definido (`local` es válido como punto de
      partida, pero debe decir explícitamente que es temporal si el cliente
      espera datos persistentes)
- [ ] Si `necesita_auth: true` → `auth.motor` y `auth.rol_requerido` están
      definidos, no solo el de la base de datos
- [ ] Al menos una categoría y un producto reales (no "Producto 1, Producto 2")
- [ ] `apis.whatsapp_num` con un número real, si `apis.mensajeria: whatsapp`

## Si usa `carrito-reutilizable`
- [ ] `apis.pagos` definido y, si no es `whatsapp`/`ninguno`, confirmado que
      el cliente ya tiene cuenta con esa pasarela (o un plan para tramitarla)
- [ ] `carrito.moneda` definido (asume `$` solo si el cliente no especifica)
- [ ] `carrito.envio` — un número real o `0` explícito, nunca vacío (un
      campo vacío en el carrito real rompe el cálculo de total)

## Si usa `landing-modular`
- [ ] `contenido.hero.titulo` y `contenido.hero.subtitulo` — texto real,
      no "Título aquí"
- [ ] Al menos 2 `contenido.servicios` con descripción real
- [ ] `base_de_datos.motor` para los leads — igual que el menú, `local` es
      válido pero debe quedar anotado como temporal si se espera producción

## Si usa `auth`
- [ ] `auth.roles` lista todos los roles que el proyecto necesita, no solo
      `admin` — si hay recepcionista/vendedor/etc., están todos
- [ ] `auth.rol_requerido` por cada panel que se protege (puede haber más
      de uno si hay varias secciones con distinto nivel de acceso)
- [ ] Si el negocio maneja datos sensibles (ver `clinica.yml` como ejemplo):
      `linea: pro` y una nota sobre RLS/habeas data — no se asume "starter
      está bien" solo porque es más barato

## Campos que NUNCA deben aparecer en la ficha (van solo en `.env`)
- [ ] Ninguna clave de API real (`SUPABASE_ANON_KEY`, `WOMPI_PRIVATE_KEY`, etc.)
- [ ] Ninguna contraseña
- [ ] Si encuentras un secreto real en una ficha, sácalo inmediatamente y
      avisa al cliente que rote esa clave — no asumas que "no pasa nada
      porque es un archivo interno".
