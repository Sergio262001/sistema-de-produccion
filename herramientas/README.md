# Herramientas · la fábrica del estudio

Convierte el sistema de producción de "carpeta de plantillas" en algo que se
opera. **Cero dependencias** para todo lo gratis: solo Node.

```
node panel.js     →  http://localhost:4321   ← empieza aquí
```

## Los dos modos

El panel tiene un conmutador arriba. Tú eliges, por operación:

| | Modo gratis | Modo con IA |
|---|---|---|
| **Qué hace** | Reglas deterministas | Criterio de UX/UI |
| **Costo** | $0, siempre | Estimado antes de ejecutar |
| **Red** | No usa | Llama a la API de Claude |
| **Necesita** | Nada | `ANTHROPIC_API_KEY` |

**Nada corre solo.** El modo con IA muestra el costo, espera tu confirmación, y
solo entonces gasta. Si nunca lo confirmas, nunca cuesta nada.

## Modo gratis — qué revisa

Reglas que existen porque son bugs **reales** que tuvo este sistema:

| Regla | Por qué existe |
|---|---|
| `xss` | El XSS almacenado del panel de pedidos: `innerHTML` con el nombre de un comprador |
| `token-muerto` | El `--accent` declarado y nunca usado de la página del estudio v1 |
| `contraste` | WCAG 2.1, matemática pura sobre los tokens |
| `rls` | Tabla de Supabase sin `ENABLE ROW LEVEL SECURITY` |
| `secreto` | `service_role`, JWT o llave privada dentro del código |
| `alt` / `teclado` | Accesibilidad mínima: alt, `:focus-visible`, `lang` |

```bash
node validar.js                       # todo el sistema
node validar.js ../Proyectos-Clientes/casa-tela
node validar.js --solo-errores        # omite avisos
node validar.js --json                # para scripts
```

Sale con código 1 si hay errores — sirve como puerta antes de entregar.

## Generador de proyectos

Lo que antes tomaba ~2 horas a mano:

```bash
node crear-proyecto.js --listar-bases
node crear-proyecto.js --cliente "Café Raíz" --base menu-con-panel-admin \
                       --primario "#8B4513" --inicial "C" \
                       --logo "https://cliente.com/logo.svg" \
                       --banner "https://cliente.com/local.jpg"
node crear-proyecto.js --ficha ruta/a/contexto.yml
```

`--logo` y `--banner` son opcionales y solo aceptan `https://`, `/` o `./`
(lo mismo que filtra `urlSegura()` en las bases). Sin logo se pinta la
inicial en un cuadro de color; sin banner no se muestra ninguno — nunca se
rellena con una imagen de archivo.

Crea `Proyectos-Clientes/<slug>/` con `src/` copiado literal (nunca reescribe
adaptadores), el esquema SQL, el `index.html` ya con los tokens de marca y sin
la sysbar de demo, `.env` en blanco, `.gitignore` y un `README` con qué pedirle
al cliente.

**Los campos de identidad de otro negocio** (dominio, WhatsApp, subtítulo, tono)
salen como `POR DEFINIR` — para que no se cuelen hasta la entrega.

## Modo con IA — solo si lo pides

```bash
npm install @anthropic-ai/sdk        # una sola vez, solo para este modo
```

Luego pon `ANTHROPIC_API_KEY` en el entorno (consíguela en console.anthropic.com).

```bash
node auditor-ia.js <ruta> --estimar   # dice cuánto costaría, no gasta
node auditor-ia.js <ruta>             # pregunta antes de gastar
node auditor-ia.js <ruta> --modelo opus
```

Solo revisa lo que una regla no puede ver: jerarquía visual, si el copy suena
genérico, fricción, coherencia. Tiene instrucción explícita de **no repetir**
nada que ya cubra el validador gratis.

### Lo que cuesta de verdad

Medido sobre las 9 bases (~35.500 tokens de entrada):

| Modelo | Las 9 bases | Un archivo |
|---|---|---|
| Haiku 4.5 (por defecto) | **$0.05** | ~$0.009 |
| Sonnet 5 | $0.11 | ~$0.018 |
| Opus 5 | $0.27 | ~$0.045 |

El `system` prompt va con `cache_control`, así que auditar varios archivos
seguidos abarata mucho a partir del segundo.

## Acceso

Dos vías, la misma sesión de 12 horas:

1. **Entrar con Google** — tu cuenta, y solo los correos que autorices.
2. **Frase** — el respaldo. Si Google se cae, cambias de red o el `.env` queda
   mal, no te quedas por fuera de tu propio panel.

**Qué protege:** que alguien que se siente en tu computador, o esté en tu misma
red, abra el panel, cree proyectos o gaste tu saldo de API.
**Qué no protege:** los archivos — quien tenga acceso al disco los lee igual.
Es la puerta del panel, no cifrado del sistema.

El servidor solo escucha en `127.0.0.1`. La frase se guarda como hash scrypt con
sal en `.acceso.json`; la sesión es un token HMAC en cookie `HttpOnly`.

### Configurar Google (una vez, ~5 minutos, gratis)

En [console.cloud.google.com](https://console.cloud.google.com):

1. Crea un proyecto (o usa uno tuyo).
2. **APIs y servicios → Pantalla de consentimiento de OAuth**
   · Tipo **Externo** · nombre "Panel del estudio" · tu correo de contacto
   · En **Usuarios de prueba**, agrega tu propio correo.
   Déjala **en prueba** — así solo entran esos correos. No hay que publicarla.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth**
   · Tipo **Aplicación web**
   · URI de redireccionamiento autorizado, exactamente:
     `http://localhost:4321/api/acceso/google/retorno`
4. Copia `cp .env.example .env` y pega el ID y el secreto.

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_CORREOS_AUTORIZADOS=tu-correo@gmail.com
```

**`GOOGLE_CORREOS_AUTORIZADOS` no es opcional.** Sin esa lista, entrar con
Google queda desactivado a propósito: si no, cualquier persona con una cuenta
de Google abriría tu panel.

Flujo de código de autorización: el `id_token` se canjea servidor-a-servidor
por TLS con Google, y se comprueban `aud`, `iss`, `exp`, `email_verified` y la
lista de correos. El `state` va firmado con HMAC y es de un solo uso.

## El formulario del cliente

`herramientas/brief.html` — autocontenido, abre con doble clic. Se lo mandas
al cliente en vez de preguntarle por WhatsApp, o lo llenas tú en una llamada.

1. **Elige el servicio** — los 9, con los nombres de `09-que-necesito-de-ti/`
   en lenguaje de negocio ("Tienda online", no "ecommerce-completo").
2. **Solo las preguntas que aplican** — quien pide una landing no ve las de
   pasarela de pago.
3. **Devuelve un brief** con un bloque `--- BRIEF-ESTUDIO v1 ---` que el panel
   lee **exacto y gratis**: sin patrones, sin IA, sin adivinar.

También está en `http://localhost:4321/brief.html` mientras el panel corre.
Esa ruta no pide sesión a propósito: es la pieza que se comparte, y no lee ni
escribe nada del sistema — todo pasa en el navegador de quien la llena.

Si el documento trae ese bloque, el modo IA **no cobra**: detecta que ya es
exacto y se salta la llamada. Pagar por interpretar algo estructurado sería
tirar el dinero.

## Asistente de cliente nuevo

Tres fases:

1. **Cargar el documento** — pegas el WhatsApp o correo del cliente tal cual.
   Modo gratis: extrae por patrones (nombre, teléfono, colores, dominio,
   pasarela, multisede). Modo IA: Claude lee texto libre, ~$0.002.
   Lo que no está en el documento **queda vacío** — nunca se inventa.
2. **Las 8 preguntas** — son tu `brief-de-cliente.md`, y cada respuesta va
   al campo de ficha que ese archivo ya indicaba.
3. **La compuerta** — es tu `validador-de-ficha.md`, ejecutable. Si falta un
   campo obligatorio, el botón de construir queda deshabilitado.

Reglas que aplica solo: multisede o datos personales fuerzan `linea: pro`;
una pasarela distinta de WhatsApp avisa que la cuenta la crea el cliente.

Probado con un WhatsApp real desordenado: extrajo 12 campos, eligió
`ecommerce-completo`, derivó `linea: pro` por las 3 sedes, y pasó la compuerta.

## El proyecto generado CORRE

`crear-proyecto.js` no deja una carpeta de archivos: deja algo que arranca.

```bash
cd ../Proyectos-Clientes/<cliente>
npm install
npm run dev
```

Genera `package.json` (con la dependencia que pida la ficha —
`@supabase/supabase-js` o `firebase`, no las dos) y `vite.config.js` con el
`envPrefix` ampliado. Vite hace falta porque **un HTML suelto no puede leer un
`.env` desde el navegador**; es el mismo patrón que ya probamos en
`prueba-ecommerce`.

El `.env` sale con lo que la ficha ya sabía puesto y lo que falta marcado
`FALTA`, con el enlace de dónde sacarlo. El proyecto arranca igual: los
adaptadores caen a datos locales, y lo que falte simplemente no persiste.

Verificado: `npm install` (20 paquetes, 6s) y `npm run dev` levantan y sirven
la página con los tokens de marca aplicados.

## Prompts maestros

Sección **Prompts** del panel. Lee los cuatro archivos **reales** de
`05-prompts-maestros/` (no copias que se desincronizan), recorta desde
"INSTRUCCIONES (copiar desde aquí)" y le incrusta la ficha del proyecto que
elijas. Copias y pegas.

| Prompt | Para |
|---|---|
| Arranque | Ensamblar el proyecto, con checklist de entrega |
| Detalle de la base | Las reglas finas: qué no tocar, qué confirmar |
| Revisión | Auditar antes de entregar |
| Contenido | Copy en el tono de la ficha, siempre como borrador |

Al de **Revisión** se le añade una nota para que **no repita** lo que el
validador gratis ya cubre — si no, pagarías por los mismos hallazgos dos veces.

> Las 10 bases tienen bloque. Los 5 últimos (`crm-simple`, `dashboard-analytics`,
> `suscripciones`, `marketplace`, `backend-pro`) son **borradores** escritos a
> partir del código y el README de cada base: revísalos, porque codifican
> criterio tuyo sobre esas bases.

## Pruebas

```bash
npm test              # 92 pruebas, ~1 segundo
npm run test:ver      # con el detalle de cada una
```

Usan `node:test`, que **viene con Node**: cero dependencias, cero
configuración. Corren sin red y sin tocar el disco.

| Archivo | Qué protege |
|---|---|
| `yaml.test.js` | Que las fichas se lean y escriban sin perder datos |
| `extraer.test.js` | Los tres bugs reales del brief, y que no vuelvan |
| `colores.test.js` | El contraste WCAG contra los valores de la norma |
| `reglas.test.js` | Que el validador detecte, y que no dé falsos positivos |
| `brief.test.js` | La compuerta: que no se construya con datos inventados |
| `crear-proyecto.test.js` | Que el proyecto generado arranque y no herede identidad ajena |

**Las pruebas fijan las dos caras.** Un validador con falsos positivos se deja
de mirar, y entonces no sirve de nada — por eso cada regla se prueba también
con el caso correcto que NO debe marcar.

Los casos marcados `regresión` son bugs que ya ocurrieron:

- `de parte de X` capturaba "parte de X" como nombre del negocio.
- `laespiga.com.co` se cortaba en `.com`.
- `una tienda en línea` anulaba la detección de "3 sedes".
- `Somos Cafe Raiz` no se reconocía: el patrón no admitía mayúscula inicial.
  Este último **lo encontró la propia suite**, no una prueba manual.

## Estructura

```
herramientas/
├─ panel.js / panel.html   interfaz: acceso, asistente, clientes, calidad
├─ brief.html              formulario para el cliente (autocontenido)
├─ pruebas/                92 pruebas con node:test
├─ validar.js              modo gratis · control de calidad
├─ crear-proyecto.js       modo gratis · generador
├─ auditor-ia.js           modo con costo · criterio UX/UI
└─ lib/
   ├─ colores.js           contraste WCAG
   ├─ yaml.js              lector/escritor de fichas
   ├─ reglas.js            las reglas del validador
   ├─ brief.js             el cuestionario y la compuerta de ficha
   ├─ extraer.js           documento → respuestas (gratis o IA)
   ├─ prompts.js           compone los prompts maestros con la ficha
   ├─ acceso.js            frase de acceso y sesión firmada
   └─ google.js            entrar con Google (OAuth)
```

## Añadir una regla

En `lib/reglas.js`: escribe una función que reciba `{ruta, texto, lineas}` y
devuelva hallazgos, y regístrala en `REGLAS` con las extensiones que aplica.
Si una regla lanza una excepción, el validador la reporta como aviso y sigue —
nunca tumba la corrida entera.
