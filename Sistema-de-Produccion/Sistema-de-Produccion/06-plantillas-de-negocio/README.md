# Plantillas de negocio

Documentos reutilizables (E7 del backlog) para la parte comercial de cada
proyecto — antes y después de construir, no durante.

## Qué contiene
- **[brief-de-cliente.md](./brief-de-cliente.md)** — el cuestionario que le
  envías a un cliente nuevo. Cada pregunta dice a qué campo de la ficha de
  contexto va, para que llenarla después sea directo.
- **[lista-de-precios.md](./lista-de-precios.md)** — plantilla de precios
  por servicio, alineada con `01-documentos/1-catalogo-de-servicios.html`.
  Sin cifras inventadas: trae la fórmula para que calcules tus propios
  precios y deja las celdas para que las completes tú.
- **[plantilla-de-propuesta.md](./plantilla-de-propuesta.md)** — el
  documento que el cliente firma/confirma antes de empezar, con alcance
  explícito de qué incluye y qué no.

## El flujo completo, de punta a punta
```
brief-de-cliente.md  →  (respuestas del cliente)
        ↓
04-fichas-de-contexto/<rubro>.yml  →  (ficha llena)
        ↓
plantilla-de-propuesta.md  →  (cliente confirma alcance y precio)
        ↓
05-prompts-maestros/prompt-de-arranque.md  →  (se ensambla el proyecto)
```

## Por qué no incluí "Contrato base" ni "Planes de soporte" todavía
Son P2 en el backlog (`01-documentos/2-plan-de-construccion.html`, épica
E7) — quedan pendientes para cuando los P1 (este conjunto) estén en uso real
y se sepa qué cláusulas hacen falta de verdad, en vez de redactar un
contrato genérico sin haber visto qué pasa en la práctica.
