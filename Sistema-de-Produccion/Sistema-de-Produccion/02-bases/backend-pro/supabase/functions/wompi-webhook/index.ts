// ════════════════════════════════════════════════════════════
//  Edge Function: wompi-webhook
//
//  Qué resuelve: sin esto, saber si un pedido se pagó depende de
//  que el comprador vuelva a tu página después de pagar. Si cierra
//  la pestaña, se le acaba el internet o paga por PSE (que redirige
//  al banco), el pedido queda "pendiente" para siempre aunque el
//  dinero haya entrado.
//
//  Wompi llama a esta URL cuando una transacción cambia de estado.
//  Aquí se verifica que la llamada sea legítima y se actualiza el
//  pedido.
//
//  Desplegar (sin JWT: quien llama es Wompi, no un usuario):
//    supabase functions deploy wompi-webhook --no-verify-jwt
//  Secreto:
//    supabase secrets set WOMPI_EVENTS_SECRET=...
//  Registrar la URL en: comercio.wompi.co → Desarrolladores → Eventos
// ════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';

async function sha256(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Lee "transaction.amount_in_cents" dentro del objeto del evento. */
function leerRuta(obj: any, ruta: string) {
  return ruta.split('.').reduce((o, k) => o?.[k], obj);
}

// Wompi → nuestro vocabulario. Lo que no reconocemos se ignora
// (mejor quedarse pendiente que marcar aprobado por error).
const MAPA: Record<string, string> = {
  APPROVED: 'aprobado',
  DECLINED: 'rechazado',
  ERROR:    'rechazado',
  VOIDED:   'reembolsado',
};

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Método no permitido', { status: 405 });

  const secreto = Deno.env.get('WOMPI_EVENTS_SECRET');
  if (!secreto) return new Response('Falta WOMPI_EVENTS_SECRET', { status: 500 });

  let evento: any;
  try {
    evento = await req.json();
  } catch {
    return new Response('Cuerpo inválido', { status: 400 });
  }

  // ── 1. Verificar que el evento venga de verdad de Wompi ──
  //  Sin esta verificación, cualquiera que descubra la URL puede
  //  mandar un POST diciendo "el pedido X está pagado" y recibir
  //  mercancía gratis. Es la parte más importante del archivo.
  const props: string[] = evento?.signature?.properties ?? [];
  const checksumRecibido: string = evento?.signature?.checksum ?? '';
  const timestamp = evento?.timestamp ?? '';

  if (!props.length || !checksumRecibido) {
    return new Response('Evento sin firma', { status: 400 });
  }

  const concatenado = props.map(p => String(leerRuta(evento.data, p) ?? '')).join('')
    + String(timestamp) + secreto;
  const checksumCalculado = await sha256(concatenado);

  if (checksumCalculado !== checksumRecibido.toLowerCase()) {
    // 401 y nada más: no damos pistas sobre por qué falló.
    return new Response('Firma inválida', { status: 401 });
  }

  // ── 2. Actualizar el pedido ──
  const tx = evento?.data?.transaction;
  const referencia: string | undefined = tx?.reference;
  const estadoWompi: string | undefined = tx?.status;

  if (!referencia || !estadoWompi) return new Response('Evento incompleto', { status: 400 });

  const pagoEstado = MAPA[estadoWompi];
  if (!pagoEstado) return new Response('ok (estado ignorado)', { status: 200 });

  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const cambios: Record<string, unknown> = {
    pago_estado:     pagoEstado,
    pago_referencia: tx.id ?? null,
    actualizado_en:  new Date().toISOString(),
  };
  // Un pago aprobado confirma el pedido solo, sin que nadie lo toque.
  if (pagoEstado === 'aprobado') cambios.estado = 'confirmado';

  const { error } = await db.from('pedidos').update(cambios).eq('codigo', referencia);
  if (error) return new Response('No se pudo actualizar', { status: 500 });

  // Wompi reintenta si no recibe 200. Responder rápido y siempre.
  return new Response('ok', { status: 200 });
});

// ════════════════════════════════════════════════════════════
//  NOTA 1 · Wompi puede mandar el mismo evento más de una vez.
//  Esto es seguro ante repeticiones: escribir "aprobado" dos veces
//  deja el mismo resultado. Si algún día se agrega algo que sume
//  (por ejemplo, contar ingresos en otra tabla), hay que verificar
//  primero si ese evento ya se procesó.
//
//  NOTA 2 · El stock ya se descontó al crear el pedido, no aquí.
//  Si un pago se rechaza, ese stock queda reservado de más. Para un
//  volumen normal está bien (el dueño lo ajusta). Si el negocio
//  vende unidades escasas, hay que devolverlo cuando llegue un
//  'rechazado' — son 5 líneas, pero decídelo a conciencia porque
//  puede descuadrar el inventario si alguien ya despachó.
//
//  NOTA 3 · Esto NO está probado contra Wompi real (no tengo cuenta).
//  El algoritmo de firma sale de su documentación. Antes de cobrarle
//  a un cliente: prueba en sandbox, manda un evento de prueba desde
//  el panel de Wompi y confirma en los logs que la firma valida.
// ════════════════════════════════════════════════════════════
