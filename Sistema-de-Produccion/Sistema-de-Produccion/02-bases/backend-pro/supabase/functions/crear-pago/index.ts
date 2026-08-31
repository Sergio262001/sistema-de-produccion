// ════════════════════════════════════════════════════════════
//  Edge Function: crear-pago
//
//  Qué resuelve: hoy el frontend calcula el total y firma nada.
//  Eso significa que (a) Wompi solo funciona en sandbox, y (b) un
//  usuario con la consola abierta puede cambiar el precio antes de
//  enviar el pedido.
//
//  Esta función:
//   1. Recibe SOLO el código del pedido (nunca un monto).
//   2. Recalcula el total leyendo la base con precios reales.
//   3. Devuelve la firma de integridad que Wompi exige en producción.
//
//  El monto nunca viene del navegador. Ese es todo el punto.
//
//  Desplegar:  supabase functions deploy crear-pago
//  Secretos:   supabase secrets set WOMPI_INTEGRITY_SECRET=... \
//                                   WOMPI_PUBLIC_KEY=...
// ════════════════════════════════════════════════════════════

import { createClient } from 'jsr:@supabase/supabase-js@2';

const CORS = {
  'Access-Control-Allow-Origin': Deno.env.get('SITIO_URL') ?? '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

/** SHA-256 en hexadecimal, que es el formato que pide Wompi. */
async function sha256(texto: string): Promise<string> {
  const bytes = new TextEncoder().encode(texto);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)].map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Método no permitido' }, 405);

  const secreto = Deno.env.get('WOMPI_INTEGRITY_SECRET');
  if (!secreto) return json({ error: 'Falta WOMPI_INTEGRITY_SECRET en los secretos' }, 500);

  let codigo: string;
  try {
    ({ codigo } = await req.json());
  } catch {
    return json({ error: 'Cuerpo inválido' }, 400);
  }
  if (!codigo) return json({ error: 'Falta el código del pedido' }, 400);

  // SERVICE_ROLE aquí sí es correcto: estamos en el servidor, esta
  // llave nunca llega al navegador. Es justamente lo que permite
  // leer el pedido saltando el RLS que bloquea al comprador anónimo.
  const db = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );

  const { data: pedido, error } = await db
    .from('pedidos')
    .select('codigo, estado, pago_estado, envio, impuesto, moneda, pedidos_items(producto_id, qty)')
    .eq('codigo', codigo)
    .single();

  if (error || !pedido) return json({ error: 'Ese pedido no existe' }, 404);
  if (pedido.pago_estado === 'aprobado') return json({ error: 'Ese pedido ya fue pagado' }, 409);
  if (pedido.estado === 'cancelado')     return json({ error: 'Ese pedido está cancelado' }, 409);

  // ── Recalcular el total contra los precios REALES de la base ──
  const ids = (pedido.pedidos_items ?? []).map((i: any) => i.producto_id);
  const { data: productos } = await db.from('productos').select('id, precio').in('id', ids);
  const precioDe = new Map((productos ?? []).map((p: any) => [p.id, p.precio]));

  let subtotal = 0;
  for (const item of pedido.pedidos_items ?? []) {
    const precio = precioDe.get(item.producto_id);
    if (precio === undefined) return json({ error: 'Un producto del pedido ya no existe' }, 409);
    subtotal += precio * item.qty;
  }
  const total = subtotal + (pedido.envio ?? 0) + (pedido.impuesto ?? 0);

  // Guardamos el total recalculado: si el navegador mandó otro, el
  // que vale es este. Queda la evidencia en la base.
  await db.from('pedidos').update({ total }).eq('codigo', codigo);

  // ── Firma de integridad ──
  // Wompi la define como SHA256 de:
  //   <referencia><monto-en-centavos><moneda><secreto-de-integridad>
  // Concatenados sin separadores, en ese orden exacto.
  const moneda = 'COP';
  const centavos = total * 100;
  const firma = await sha256(`${codigo}${centavos}${moneda}${secreto}`);

  return json({
    referencia:      codigo,
    monto_en_centavos: centavos,
    moneda,
    firma_integridad: firma,
    llave_publica:   Deno.env.get('WOMPI_PUBLIC_KEY') ?? null,
  });
});

// ════════════════════════════════════════════════════════════
//  NOTA · Esta función devuelve la firma, no confirma el pago.
//  Que el comprador vea "aprobado" en la pantalla de Wompi no
//  significa que el dinero entró: eso lo confirma el webhook
//  (ver ../wompi-webhook/). Nunca despaches un pedido solo porque
//  el navegador volvió con un "éxito" en la URL — eso se falsifica
//  escribiendo la dirección a mano.
// ════════════════════════════════════════════════════════════
