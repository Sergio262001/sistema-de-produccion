# Lista de precios — plantilla

Plantilla para fijar tus precios por servicio, alineada con
`01-documentos/1-catalogo-de-servicios.html`. **No trae cifras reales** —
las columnas de precio están vacías a propósito porque solo tú conoces tu
costo de vida, el mercado donde cotizas y cuánto tiempo te toma cada base.
Llénala una vez y reutilízala en cada propuesta.

## Cómo fijar el número (antes de llenar la tabla)
1. Calcula tu costo por hora real: gastos fijos del mes ÷ horas facturables
   que de verdad puedes vender (no las horas que trabajas, las que cobras).
2. Estima cuántas horas te toma cada servicio **con las bases ya hechas**
   (copiar base + ficha + ajustar marca/contenido), no desde cero.
3. Precio = horas estimadas × tu costo por hora, redondeado. El "Pago único"
   de Starter ya asume que reutilizas una base; si por algo construyes desde
   cero, cótizalo aparte.
4. Revisa cada 3-6 meses — si una base te ahorra más tiempo del que
   esperabas, el precio puede bajar (más competitivo); si un cliente pide
   algo fuera de la base (alcance no previsto), eso se cotiza aparte, nunca
   se mete gratis "porque ya estás ahí".

## Ecommerce & Ventas — línea principal
| Servicio | Línea | Incluye (de la base) | Precio | Recurrencia |
|---|---|---|---|---|
| Checkout WhatsApp | Starter | `carrito-reutilizable` en modo `whatsapp`, sin pasarela | _completa_ | Pago único |
| Ecommerce Simple | Starter | `landing-modular` + `carrito-reutilizable`, pasarela real (Wompi) | _completa_ | Pago único + soporte |
| Ecommerce Completo | Pro | `ecommerce-completo` — inventario real + panel admin con login | _completa_ | Por fases + retainer |
| Marketplace | Pro | `marketplace` — multi-vendedor + desglose de comisión (sin split automático, ver su README) | _completa_ | Por fases + retainer |
| Suscripciones | Pro | `suscripciones` — planes + registro (cobro recurrente automático = backend aparte) | _completa_ | Por fases + retainer |

## Menús digitales
| Servicio | Línea | Incluye (de la base) | Precio | Recurrencia |
|---|---|---|---|---|
| Menú QR Básico | Starter | `menu-con-panel-admin`, motor local o Supabase simple, sin login | _completa_ | Pago único |
| Menú con Panel | Pro | + `auth` (login real), edición ilimitada por el dueño | _completa_ | Pago único + soporte |
| Menú con Pedidos | Pro | + `carrito-reutilizable`, checkout WhatsApp o pasarela | _completa_ | Pago único + soporte |
| Menú Activo | Ambas | Solo actualizar contenido de un menú ya entregado | _completa_ | Mensual |

## Web & Landing
| Servicio | Línea | Incluye (de la base) | Precio | Recurrencia |
|---|---|---|---|---|
| Landing Page | Starter | `landing-modular`, secciones fijas, sin leads a BD | _completa_ | Pago único |
| Presencia Web Básica | Starter | Landing + dominio + GA4 configurado | _completa_ | Pago único |
| Link in Bio Pro | Starter | Landing reducida a una sola sección de links | _completa_ | Pago único |
| Web App a Medida | Pro | UX research + desarrollo fuera de las bases existentes | _completa_ | Por fases |

## Gestión y datos
| Servicio | Línea | Incluye (de la base) | Precio | Recurrencia |
|---|---|---|---|---|
| Dashboard Analytics | Pro | `dashboard-analytics` — KPIs de leads/inventario (sin tráfico GA4, ver su README) | _completa_ | Pago único + soporte |
| CRM Simple | Pro | `crm-simple` — clientes + historial de interacciones | _completa_ | Pago único + soporte |

## Servicios recurrentes — ingreso fijo
| Servicio | Incluye | Precio | Recurrencia |
|---|---|---|---|
| Mantenimiento Básico | Cambios de contenido/precios, sin desarrollo nuevo | _completa_ | Mensual |
| Plan Crecimiento | Mantenimiento + mejoras pequeñas continuas | _completa_ | Mensual |
| Plan Marketing | Piezas para redes + reporte de analítica | _completa_ | Mensual |

## Automatización — servicios recurrentes a futuro
Ideas evaluadas en `01-documentos/3-automatizacion-y-nuevos-servicios.md`,
**ninguna construida todavía**. No las cotices como entregables reales hasta
que exista el código — esta tabla es para cuando decidas construirlas.
| Servicio | Extiende | Incluye | Precio | Recurrencia |
|---|---|---|---|---|
| Seguimiento automático de leads | `crm-simple` | Aviso cuando un lead lleva N días sin contactar | _por construir_ | Mensual |
| Recuperación de carrito abandonado | `carrito-reutilizable` / `ecommerce-completo` | Recordatorio automático tras X horas sin pagar | _por construir_ | Mensual |
| Reporte semanal automático | `dashboard-analytics` | Resumen de KPIs por email/WhatsApp sin entrar al panel | _por construir_ | Mensual |
| Recordatorio de citas/pedidos | `crm-simple` | Reduce inasistencias vía WhatsApp Business API | _por construir_ | Mensual |

## Marca & Auditoría
| Servicio | Línea | Incluye | Precio | Recurrencia |
|---|---|---|---|---|
| Identidad Digital | Ambas | Tokens de marca (`marca.*`) + kit básico | _completa_ | Pago único |
| Auditoría UX/UI | Pro | Revisión + reporte priorizado (ver `prompt-de-revision` cuando exista, E6) | _completa_ | Pago único |

## Notas
- Las bases de **Ecommerce & Ventas** ya están construidas (`02-bases/`) —
  no es desarrollo a medida, es configurar una base existente. Donde el
  README de la base avisa que algo necesita backend aparte (split de pago
  en marketplace, cobro recurrente en suscripciones), cotiza eso como
  alcance adicional explícito, no lo prometas incluido.
- "Pago único" en Starter asume que usas una base ya hecha. Si el cliente
  pide cambios que no caben en la base (otra sección de cero, una
  integración rara), eso es alcance adicional — cotízalo aparte, no lo
  incluyas en el precio base "para no pelear por poco".
