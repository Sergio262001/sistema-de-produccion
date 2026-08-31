# Prompt de revisión

Úsalo sobre un proyecto **ya construido** (propio o de otra persona del
equipo) antes de entregarlo, o para auditar algo que ya está en producción.
Es una revisión de calidad y accesibilidad, no de funcionalidad — eso ya
debería estar cubierto por el checklist de entrega del
[prompt de arranque](./prompt-de-arranque.md).

---

## INSTRUCCIONES (copiar desde aquí)

Vas a auditar un proyecto construido con este sistema de producción. No
estás construyendo nada nuevo — solo señalando lo que no cumple el estándar,
con la línea de código o el archivo exacto donde está el problema.

### 1. Qué revisar y en qué orden
1. **Separación de datos y presentación** — busca contenido (textos,
   precios, nombres) incrustado directamente en HTML/JS en vez de venir de
   `CONTENT`/`DATA`/la ficha de contexto. Señala cada caso con archivo y línea.
2. **Tokens de marca** — busca colores o tipografías escritos a mano (hex,
   nombres de fuente) en vez de usar las variables `--brand`, `--bg`, etc.
3. **Seguridad** —
   - ¿Hay alguna clave o secreto real en un archivo que no sea `.env`?
     (Si lo encuentras, es crítico — repórtalo primero y aparte de todo lo demás)
   - ¿El `.env` está en `.gitignore`?
   - Si hay panel admin, ¿el login es real (no el adaptador `local` en
     producción)?
   - Si hay datos sensibles (ver criterio de `clinica.yml`), ¿hay RLS o
     reglas de acceso configuradas, no solo "lectura pública"?
4. **Accesibilidad mínima** —
   - Contraste de texto sobre fondo (usa el cálculo WCAG AA, 4.5:1 para
     texto normal).
   - Todo elemento interactivo tiene foco visible por teclado
     (`:focus-visible`, no solo `:hover`).
   - Toda imagen con significado tiene `alt`; las decorativas, `alt=""`.
   - Todo `<button>` sin texto visible tiene `aria-label`.
5. **Performance básica** —
   - Imágenes sin optimizar (formato pesado, sin `width`/`height`, sin lazy
     load fuera del viewport inicial).
   - JS o CSS no usado que se quedó de una iteración anterior.
   - Fuentes externas cargadas sin `preconnect` si hay más de una.
6. **Consistencia con la base original** — si el proyecto partió de una
   base de `02-bases/`, ¿se mantuvo la interfaz de los adaptadores
   (`load/save`, `login/logout`) o se reescribió algo que no debía tocarse?
   Revisa contra `05-prompts-maestros/prompt-por-base.md` para esa base.

### 2. Cómo reportar
Para cada hallazgo:
- **Archivo y línea** (o selector/elemento si es visual).
- **Qué está mal**, en una frase.
- **Por qué importa** (no "porque sí" — cuál es el riesgo real: seguridad,
  accesibilidad para un usuario real, o que se rompa al cambiar de motor).
- **Severidad**: crítico (bloquea entrega — ej. secreto expuesto, login
  falso en producción) / importante (corregir antes de entregar) / menor
  (se puede entregar y agendar para después).

No reportes preferencias de estilo personal como si fueran errores —
distingue entre "esto no cumple el estándar del sistema" y "esto yo lo
haría distinto".

### 3. Qué NO hacer
- No corrijas nada automáticamente sin que te lo pidan — esto es una
  auditoría, el siguiente paso (corregir) es una tarea separada y explícita.
- No inventes problemas de accesibilidad sin verificar el contraste real
  con la fórmula — "se ve un poco bajo" no es un hallazgo válido.
- No marques como crítico algo que es solo una preferencia de UI.
