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
                       --primario "#8B4513" --inicial "C"
node crear-proyecto.js --ficha ruta/a/contexto.yml
```

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

## Estructura

```
herramientas/
├─ panel.js / panel.html   la interfaz con el conmutador de modo
├─ validar.js              modo gratis · control de calidad
├─ crear-proyecto.js       modo gratis · generador
├─ auditor-ia.js           modo con costo · criterio UX/UI
└─ lib/
   ├─ colores.js           contraste WCAG
   ├─ yaml.js              lector/escritor de fichas
   └─ reglas.js            las reglas del validador
```

## Añadir una regla

En `lib/reglas.js`: escribe una función que reciba `{ruta, texto, lineas}` y
devuelva hallazgos, y regístrala en `REGLAS` con las extensiones que aplica.
Si una regla lanza una excepción, el validador la reporta como aviso y sigue —
nunca tumba la corrida entera.
