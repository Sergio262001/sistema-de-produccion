// ════════════════════════════════════════════════════════════
//  DE LO QUE RESPONDE EL CLIENTE A LO QUE VE EL CLIENTE.
//
//  Todas las demás pruebas miran una pieza. Esta recorre la cadena
//  entera con las respuestas de un cliente inventado y comprueba que
//  el HTML final habla DE ÉL: su nombre, su logo, su WhatsApp, su
//  catálogo. Nada del negocio del ejemplo.
//
//  Existe porque los cuatro bugs que llegaron a una entrega vivían
//  justo en las costuras entre piezas, y cada pieza pasaba sus
//  pruebas por separado:
//    · 19 respuestas del brief entraban y sobrevivían 5
//    · el entregable de "tacos mauricio" decía "Café Raíz"
//    · el catálogo era siempre el del ejemplo
//  Ninguna prueba unitaria podía verlos. Esta sí.
// ════════════════════════════════════════════════════════════

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, join } from 'node:path';
import { respuestasAFicha } from '../lib/brief.js';
import { construirFicha, adaptarEntregable } from '../crear-proyecto.js';
import { leerYaml } from '../lib/yaml.js';

const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..');
const BASES = resolve(AQUI, '..', 'Sistema-de-Produccion', 'Sistema-de-Produccion', '02-bases');

/** Lo que mandaría brief.html de un cliente real. */
const RESPUESTAS = {
  base: 'menu-con-panel-admin',
  objetivo: 'menu-con-panel-admin',
  cliente: 'Tacos Mauricio',
  subtitulo: 'Taquería de barrio • Medellín',
  dominio: 'tacosmauricio.co',
  sedes: 'una',
  tienemarca: 'si',
  logo: 'https://cdn.tacosmauricio.co/logo.svg',
  banner: 'https://cdn.tacosmauricio.co/local.jpg',
  primario: '#B23A2E',
  secundario: '#FFF6EC',
  inicial: 'TM',
  tono: 'cercano y de barrio',
  whatsapp: '3666778839',
  pagos: 'whatsapp',
  motor: 'supabase',
  contenido_listo: 'si',
  fotos: 'si',
  catalogo: 'Tacos\nAl pastor | 12000 | Piña y cilantro\nCarnitas | 11500\n\n'
          + 'Bebidas\nAgua de horchata | 6000',
  analitica: 'ninguna',
  soporte: 'plan_mensual',
  linea: 'starter',
};

/** La cadena completa: respuestas → ficha → HTML del cliente. */
function cadena(respuestas = RESPUESTAS) {
  const { ficha: dado, avisos } = respuestasAFicha(respuestas);
  const ejemplo = leerYaml(
    readFileSync(join(BASES, respuestas.base, 'contexto.ejemplo.yml'), 'utf8'));
  const ficha = construirFicha(ejemplo, {
    proyecto: dado.cliente, cliente: dado.cliente,
    base: respuestas.base, linea: dado.linea, ficha: dado,
  });
  const html = adaptarEntregable(
    readFileSync(join(BASES, respuestas.base, 'demo.html'), 'utf8'),
    ficha.marca, dado.cliente, { ...ficha, _catalogo: dado._catalogo });
  return { html, ficha, avisos };
}

test('el entregable habla del cliente, no del negocio del ejemplo', () => {
  const { html } = cadena();
  assert.ok(html.includes('Tacos Mauricio'), 'su nombre tiene que estar');
  assert.ok(!html.includes('Café Raíz'),
    'este es EL bug: applyTheme lee el CONTEXT y sobreescribe todo al arrancar');
  assert.ok(!html.includes('caferaiz'), 'ni el dominio del ejemplo');
});

test('el catálogo del entregable es el que escribió el cliente', () => {
  const { html } = cadena();
  assert.ok(html.includes('Al pastor'), 'sin esto la entrega sale con el menú del ejemplo');
  assert.ok(html.includes('Agua de horchata'));
  assert.ok(!html.includes('Cappuccino'), 'y el del ejemplo se va entero');
});

test('el logo y el banner del cliente llegan hasta el HTML', () => {
  const { html } = cadena();
  assert.ok(html.includes('https://cdn.tacosmauricio.co/logo.svg'));
  assert.ok(html.includes('https://cdn.tacosmauricio.co/local.jpg'));
});

test('el WhatsApp llega completo, con indicativo', () => {
  const { html, avisos } = cadena();
  assert.ok(html.includes('573666778839'),
    'sin el 57 el enlace de wa.me no abre');
  assert.ok(!html.includes('573001234567'), 'el número del ejemplo escribe a otro negocio');
  assert.ok(avisos.some((a) => a.includes('indicativo')), 'y hay que avisarlo para confirmarlo');
});

test('ninguna respuesta del brief se pierde por el camino', () => {
  // El bug: crearProyecto recibía 4 campos de los 19 que llenó el cliente.
  const { ficha } = cadena();
  assert.equal(ficha.cliente, 'Tacos Mauricio');
  assert.equal(ficha.marca.inicial, 'TM');
  assert.equal(ficha.marca.subtitulo, 'Taquería de barrio • Medellín');
  assert.equal(ficha.marca.tono, 'cercano y de barrio');
  assert.equal(ficha.marca.logo, 'https://cdn.tacosmauricio.co/logo.svg');
  assert.equal(ficha.entrega.dominio, 'tacosmauricio.co');
  assert.equal(ficha.apis.whatsapp_num, '573666778839');
  assert.equal(ficha.base_de_datos.motor, 'supabase');
});

test('el JavaScript del entregable compila', () => {
  // Que el HTML se genere no dice nada. Tres veces se entregó una página en
  // blanco porque el script no compilaba o moría en la primera línea.
  const { html } = cadena();
  const bloques = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  assert.ok(bloques.length, 'el entregable se quedó sin script');
  for (const b of bloques) {
    assert.doesNotThrow(() => new Function(b[1]), 'un <script> del entregable no compila');
  }
});

test('todo id que pide el script existe en el HTML', () => {
  // El otro camino a la página en blanco: getElementById devuelve null,
  // la línea lanza, y todo el JavaScript posterior deja de ejecutarse.
  const { html } = cadena();
  const declarados = new Set([...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]));
  const pedidos = [...html.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
  const fantasmas = [...new Set(pedidos)].filter((id) => !declarados.has(id));
  assert.deepEqual(fantasmas, [], 'ids que el script pide y no existen');
});

test('no queda andamiaje de demo en la entrega', () => {
  const { html } = cadena();
  for (const rastro of ['sysbar', 'verMarca', '@demo-only', 'logo-demo.svg']) {
    assert.ok(!html.includes(rastro), 'quedó andamiaje de demo: ' + rastro);
  }
});

// La línea principal del negocio es ecommerce: la cadena tiene que
// funcionar igual ahí, no solo en el menú.
test('la misma cadena funciona para la tienda online', () => {
  const { html, ficha } = cadena({ ...RESPUESTAS,
    base: 'ecommerce-completo', objetivo: 'ecommerce-completo',
    cliente: 'Casa Tela Norte', linea: 'pro',
    catalogo: 'Ropa\nCamiseta orgánica | 45000 | Algodón 100%\nJogger | 89000' });
  assert.ok(html.includes('Casa Tela Norte'));
  assert.ok(html.includes('Camiseta orgánica'), 'su catálogo, no el del ejemplo');
  assert.ok(!html.includes('Café Raíz'));
  assert.equal(ficha.marca.logo, 'https://cdn.tacosmauricio.co/logo.svg');
  const bloques = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
  for (const b of bloques) assert.doesNotThrow(() => new Function(b[1]));
  const declarados = new Set([...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]));
  const pedidos = [...html.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(pedidos)].filter((id) => !declarados.has(id)), []);
});

// Las cuatro bases de venta tienen que aguantar la cadena entera. Son las
// que se le entregan a un negocio con una vitrina, y las que más se venden.
for (const base of ['menu-con-panel-admin', 'ecommerce-completo',
                    'carrito-reutilizable', 'marketplace']) {
  test(base + ': el entregable arranca y es del cliente', () => {
    const { html } = cadena({ ...RESPUESTAS, base, objetivo: base });

    assert.ok(html.includes('Tacos Mauricio'), 'no aparece el nombre del cliente');
    assert.ok(!html.includes('Café Raíz') && !html.includes('Casa Tela'),
      'quedó el negocio del ejemplo');

    const bloques = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)];
    assert.ok(bloques.length, 'el entregable se quedó sin script');
    for (const b of bloques) {
      assert.doesNotThrow(() => new Function(b[1]), 'un <script> no compila');
    }

    const declarados = new Set([...html.matchAll(/\sid\s*=\s*["']([^"']+)["']/g)].map((m) => m[1]));
    const pedidos = [...html.matchAll(/getElementById\(\s*["']([^"']+)["']\s*\)/g)].map((m) => m[1]);
    assert.deepEqual([...new Set(pedidos)].filter((id) => !declarados.has(id)), [],
      'ids que el script pide y no existen: página en blanco');

    for (const rastro of ['sysbar', 'verMarca', '@demo-only', 'logo-demo.svg']) {
      assert.ok(!html.includes(rastro), 'quedó andamiaje de demo: ' + rastro);
    }

    if (base === 'marketplace') {
      // No se siembra a ciegas: su DATA lleva vendedores y borrarlos deja
      // la página rota. Se conserva el ejemplo y el aviso lo dice.
      assert.ok(html.includes('vendedores'), 'los vendedores tienen que sobrevivir');
    } else {
      assert.ok(html.includes('Al pastor'),
        'el catálogo del cliente no llegó a ' + base);
      assert.ok(!html.includes('Cold brew') && !html.includes('Camiseta básica'),
        'quedó el catálogo del ejemplo en ' + base);
    }
  });
}

test('si el catálogo no se puede sembrar, el aviso lo dice', () => {
  const { avisos } = cadena({ ...RESPUESTAS, base: 'marketplace', objetivo: 'marketplace' });
  assert.ok(avisos.some((a) => a.includes('no se puede sembrar')),
    'callarlo sería entregar el catálogo del ejemplo sin avisar');
});

test('sin catálogo se conserva el del ejemplo y se avisa', () => {
  // A propósito: un catálogo vacío se ve roto, y unos datos que se ven
  // claramente de ejemplo dicen la verdad sobre lo que falta.
  const { html, avisos } = cadena({ ...RESPUESTAS, catalogo: '' });
  assert.ok(html.includes('Tacos Mauricio'), 'el nombre sigue siendo el suyo');
  assert.ok(avisos.some((a) => a.includes('Sin catálogo')));
});
