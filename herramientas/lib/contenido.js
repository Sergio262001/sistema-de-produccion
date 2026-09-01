// ════════════════════════════════════════════════════════════
//  EL CONTENIDO REAL DEL CLIENTE
//
//  Sin esto, todo entregable sale con el catálogo del ejemplo: un menú
//  de tacos mostrando huevos benedictinos. Ninguna mejora de diseño se
//  nota cuando el contenido es del negocio de otro.
//
//  FORMATO — pensado para que alguien transcriba su carta sin aprender
//  nada. Una categoría por línea suelta; debajo sus productos, separados
//  con barras:
//
//      Desayunos
//      Huevos rancheros | 18000 | Con frijoles y arepa
//      Chilaquiles | 16000
//
//      Tacos al pastor
//      Sencillo | 5000
//
//  · Línea sin barras  → categoría nueva
//  · Línea con barras  → producto de la categoría abierta
//  · nombre | precio | descripción   (la descripción es opcional)
//  · El precio acepta 18000, $18.000 o 18.000 — se queda con los dígitos
// ════════════════════════════════════════════════════════════

/** Quita separadores de miles y símbolos: "$18.000" → 18000 */
export function aPrecio(v) {
  const d = String(v ?? '').replace(/[^\d]/g, '');
  return d ? parseInt(d, 10) : 0;
}

/** Identificador estable y legible a partir del nombre */
function aId(nombre, usados) {
  let base = String(nombre).toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 24);
  if (!base) base = 'item';
  let id = base, n = 2;
  while (usados.has(id)) id = base + '-' + n++;
  usados.add(id);
  return id;
}

/**
 * Texto libre → categorías con sus productos.
 * Devuelve { categorias, avisos }. Nunca lanza: un formato raro produce
 * menos contenido, no un error — pero lo dice en los avisos.
 */
export function leerContenido(texto) {
  const categorias = [];
  const avisos = [];
  const usados = new Set();
  let actual = null;

  const lineas = String(texto || '').split(/\r?\n/);

  lineas.forEach((cruda, i) => {
    const l = cruda.trim();
    if (!l || l.startsWith('#')) return;

    if (!l.includes('|')) {
      // Categoría nueva
      actual = { id: aId(l, usados), nombre: l, desc: '', productos: [] };
      categorias.push(actual);
      return;
    }

    // Producto
    const [nombre, precio, desc] = l.split('|').map((x) => x.trim());
    if (!nombre) {
      avisos.push('Línea ' + (i + 1) + ': producto sin nombre, se omitió.');
      return;
    }
    if (!actual) {
      // Producto antes de cualquier categoría: se le abre una general.
      actual = { id: aId('general', usados), nombre: 'Productos', desc: '', productos: [] };
      categorias.push(actual);
      avisos.push('Había productos antes de la primera categoría: quedaron en "Productos".');
    }
    const p = aPrecio(precio);
    if (!p) avisos.push('Línea ' + (i + 1) + ' ("' + nombre + '"): sin precio válido, quedó en 0.');

    actual.productos.push({
      id: aId(nombre, usados),
      nombre,
      desc: desc || '',
      precio: p,
    });
  });

  const vacias = categorias.filter((c) => !c.productos.length).map((c) => c.nombre);
  if (vacias.length) {
    avisos.push('Categorías sin productos: ' + vacias.join(', ')
      + '. Se omiten del entregable — no se rellenan con ejemplos.');
  }

  return {
    categorias: categorias.filter((c) => c.productos.length),
    avisos,
  };
}

/** ¿Cómo llama cada base a la lista de productos dentro de una categoría? */
const CLAVE_PRODUCTOS = {
  'menu-con-panel-admin': 'items',
  'ecommerce-completo': 'productos',
  'carrito-reutilizable': 'productos',
  'marketplace': 'productos',
};

/**
 * Convierte las categorías al literal JavaScript que espera la base, con
 * sus campos propios (`disp` en el menú, `stock` en las de venta).
 */
export function aSemilla(categorias, base) {
  const clave = CLAVE_PRODUCTOS[base] || 'productos';
  const esVenta = clave === 'productos';
  const cita = (s) => JSON.stringify(String(s ?? ''));

  const bloques = categorias.map((c) => {
    const prods = c[clave] || c.productos || [];
    const items = prods.map((p) => {
      const campos = [
        'id:' + cita(p.id),
        'nombre:' + cita(p.nombre),
        'desc:' + cita(p.desc),
        'precio:' + (p.precio | 0),
      ];
      // Sin emoji ni imagen a propósito: el respaldo lo pone la base, y no
      // se inventa una foto que el cliente no entregó.
      campos.push(esVenta ? 'stock:0' : 'disp:true');
      return '      { ' + campos.join(', ') + ' }';
    }).join(',\n');

    return '    { id:' + cita(c.id) + ', nombre:' + cita(c.nombre)
      + ', desc:' + cita(c.desc) + ', ' + clave + ':[\n' + items + '\n    ]}';
  }).join(',\n');

  return 'let DATA = {\n  categorias: [\n' + bloques + '\n  ]\n};';
}

/**
 * Reemplaza el bloque `let DATA = { ... };` del entregable por el contenido
 * real. Si no hay contenido, devuelve el html intacto: mejor los datos de
 * ejemplo — que se ven claramente de ejemplo — que un catálogo vacío.
 */
export function ponerContenido(html, categorias, base) {
  if (!categorias || !categorias.length) return html;

  const i = html.search(/\blet DATA\s*=\s*\{/);
  if (i === -1) return html;

  // Cierre del literal: la primera línea que empieza con "};" desde ahí.
  const fin = html.indexOf('\n};', i);
  if (fin === -1) return html;

  return html.slice(0, i) + aSemilla(categorias, base) + html.slice(fin + 3);
}
