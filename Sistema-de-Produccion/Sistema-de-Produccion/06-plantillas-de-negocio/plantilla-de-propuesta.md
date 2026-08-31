# Plantilla de propuesta

Documento que le envías al cliente después del brief, antes de cobrar nada.
Convierte las respuestas del [brief-de-cliente.md](./brief-de-cliente.md) y
la ficha de contexto en un alcance escrito que ambos firman — así "incluido"
y "no incluido" queda explícito antes de empezar, no se descubre a mitad de
camino.

---

## [Nombre del cliente] — Propuesta de [nombre del proyecto]

**Fecha:** _____
**Línea:** Starter / Pro *(de la ficha de contexto)*
**Base(s) usada(s):** _____ *(de `bases:` en la ficha — ej. `landing-modular` + `carrito-reutilizable`)*

### 1. Lo que entendí que necesitas
*(2-4 frases, en tus palabras, resumiendo las respuestas del brief. Si el
cliente lee esto y dice "no, no es eso", mejor que lo corrija aquí y no
después de empezar a construir.)*

### 2. Qué incluye esta propuesta
*(Lista concreta, no genérica — usa el lenguaje de las bases, no promesas
vagas.)*
- [ ] Página/panel funcionando con tu marca (colores, tipografía, logo)
- [ ] Contenido real cargado (productos/servicios que me compartiste)
- [ ] Conectado a: ___________ (motor de base de datos: Supabase/Firebase/local)
- [ ] Conectores activos: ___________ (WhatsApp / pasarela de pago / GA4)
- [ ] Acceso de administrador con login real *(si aplica — base `auth`)*
- [ ] Dominio configurado: ___________
- [ ] 1 ronda de ajustes de diseño después de la primera entrega

### 3. Qué NO incluye
*(Tan importante como la sección anterior — sé explícito.)*
- Cuenta de pasarela de pago / GA4 / dominio — el cliente la crea, o se
  cotiza aparte si pide que tú la gestiones.
- Contenido/fotos que el cliente no entregó a tiempo (se usa contenido
  genérico temporal y se reemplaza cuando lo envíen, sin retrasar el resto).
- Funcionalidad fuera de las bases existentes (ver `02-bases/`) — eso se
  cotiza como desarrollo a medida, aparte.
- Soporte después de la entrega, salvo que se incluya un plan mensual
  (ver sección 5).

### 4. Tiempos
| Etapa | Duración estimada |
|---|---|
| Ficha de contexto + brief confirmado | _____ |
| Primera versión funcionando (con contenido real) | _____ |
| Ronda de ajustes | _____ |
| Entrega final + capacitación de uso del panel (si aplica) | _____ |

*(Los tiempos asumen que el cliente entrega contenido/fotos/aprobaciones a
tiempo. Si se demora, el cronograma se corre la misma cantidad de días —
dilo aquí para que no sea una sorpresa después.)*

### 5. Inversión
| Concepto | Valor | Cuándo se paga |
|---|---|---|
| Servicio base (de `lista-de-precios.md`) | _____ | Anticipo / contra entrega |
| Plan de soporte mensual (opcional) | _____ | Mensual, desde la entrega |
| Alcance adicional (si surge durante el proyecto) | Se cotiza aparte, por escrito, antes de empezarlo | — |

### 6. Cómo seguimos
1. Confirmas esta propuesta (respondiendo este correo / firmando).
2. Pagas el anticipo (si aplica).
3. Llenamos juntos la ficha de contexto final (o la llenas tú con el brief).
4. Empiezo a construir siguiendo `05-prompts-maestros/prompt-de-arranque.md`.
5. Te muestro la primera versión para la ronda de ajustes.
6. Entrego, y si tomaste soporte mensual, quedamos en contacto para
   actualizaciones.

---

*Plantilla — borra este pie antes de enviar al cliente.*
