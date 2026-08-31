// ════════════════════════════════════════════════════════════
//  Lector de fichas de contexto (YAML) — sin dependencias.
//  No es un parser YAML completo: cubre exactamente el subconjunto
//  que usan las fichas del sistema (mapas anidados, listas en
//  bloque y en línea, comentarios, comillas). Si una ficha usa
//  algo fuera de esto, avisa en vez de adivinar mal.
// ════════════════════════════════════════════════════════════

function valorEscalar(txt) {
  const t = txt.trim();
  if (t === '') return '';
  if (t === 'true') return true;
  if (t === 'false') return false;
  if (t === 'null' || t === '~') return null;

  // lista en línea: [a, b, c]
  if (t.startsWith('[') && t.endsWith(']')) {
    const dentro = t.slice(1, -1).trim();
    if (!dentro) return [];
    return dentro.split(',').map((x) => valorEscalar(x));
  }

  // comillas
  if ((t.startsWith('"') && t.endsWith('"')) || (t.startsWith("'") && t.endsWith("'"))) {
    return t.slice(1, -1);
  }

  // número (pero no algo como "573098765432" que ya venía con comillas)
  if (/^-?\d+$/.test(t)) return parseInt(t, 10);
  if (/^-?\d*\.\d+$/.test(t)) return parseFloat(t);

  return t;
}

/** Quita comentarios respetando los # dentro de comillas (ej. colores #1B36C9) */
function sinComentario(linea) {
  let comilla = null;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (comilla) {
      if (c === comilla) comilla = null;
    } else if (c === '"' || c === "'") {
      comilla = c;
    } else if (c === '#') {
      // sólo es comentario si va precedido de espacio o empieza la línea
      if (i === 0 || /\s/.test(linea[i - 1])) return linea.slice(0, i);
    }
  }
  return linea;
}

export function leerYaml(texto) {
  const raiz = {};
  // pila de contextos: {indent, contenedor}
  const pila = [{ indent: -1, cont: raiz }];

  const lineas = texto.split(/\r?\n/);

  for (let n = 0; n < lineas.length; n++) {
    const cruda = sinComentario(lineas[n]);
    if (!cruda.trim()) continue;

    const indent = cruda.match(/^ */)[0].length;
    const linea = cruda.trim();

    // desapilar hasta el nivel correcto
    while (pila.length > 1 && indent <= pila[pila.length - 1].indent) pila.pop();
    const actual = pila[pila.length - 1].cont;

    // ─ elemento de lista
    if (linea.startsWith('- ') || linea === '-') {
      if (!Array.isArray(actual)) continue;
      actual.push(valorEscalar(linea.slice(1)));
      continue;
    }

    // ─ clave: valor
    const m = linea.match(/^([\w.-]+)\s*:\s*(.*)$/);
    if (!m) continue;
    const [, clave, resto] = m;

    if (resto === '') {
      // mira la siguiente línea con contenido para saber si es lista o mapa
      let siguiente = null;
      for (let k = n + 1; k < lineas.length; k++) {
        const s = sinComentario(lineas[k]);
        if (s.trim()) { siguiente = s; break; }
      }
      const esLista = siguiente && siguiente.trim().startsWith('- ')
        && siguiente.match(/^ */)[0].length > indent;

      const hijo = esLista ? [] : {};
      actual[clave] = hijo;
      pila.push({ indent, cont: hijo });
    } else {
      actual[clave] = valorEscalar(resto);
    }
  }

  return raiz;
}

/** Serializa de vuelta a YAML legible (para escribir el contexto.yml del cliente) */
export function escribirYaml(obj, indent = 0) {
  const pad = ' '.repeat(indent);
  let salida = '';

  for (const [clave, valor] of Object.entries(obj)) {
    if (valor === null || valor === undefined) {
      salida += `${pad}${clave}:\n`;
    } else if (Array.isArray(valor)) {
      if (valor.length === 0) { salida += `${pad}${clave}: []\n`; continue; }
      const simples = valor.every((v) => typeof v !== 'object');
      if (simples && valor.join(', ').length < 60) {
        salida += `${pad}${clave}: [${valor.join(', ')}]\n`;
      } else {
        salida += `${pad}${clave}:\n`;
        for (const v of valor) salida += `${pad}  - ${v}\n`;
      }
    } else if (typeof valor === 'object') {
      salida += `${pad}${clave}:\n${escribirYaml(valor, indent + 2)}`;
    } else {
      const necesitaComillas = typeof valor === 'string'
        && (/[:#]/.test(valor) || /^\d/.test(valor) || valor === '');
      salida += `${pad}${clave}: ${necesitaComillas ? `"${valor}"` : valor}\n`;
    }
  }
  return salida;
}
