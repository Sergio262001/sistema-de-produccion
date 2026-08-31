// ════════════════════════════════════════════════════════════
//  Contraste WCAG — matemática pura, cero IA, cero costo.
//  Detecta el problema de accesibilidad más común y más caro
//  de arreglar después de entregar.
// ════════════════════════════════════════════════════════════

/** '#1B36C9' | '#fff' | 'rgb(27,54,201)' → {r,g,b} | null */
export function aRgb(color) {
  if (!color) return null;
  const c = String(color).trim().toLowerCase();

  const hex = c.match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (hex) {
    let h = hex[1];
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return {
      r: parseInt(h.slice(0, 2), 16),
      g: parseInt(h.slice(2, 4), 16),
      b: parseInt(h.slice(4, 6), 16),
    };
  }

  const rgb = c.match(/^rgba?\(\s*(\d+)[\s,]+(\d+)[\s,]+(\d+)/);
  if (rgb) return { r: +rgb[1], g: +rgb[2], b: +rgb[3] };

  return null;
}

/** Luminancia relativa según WCAG 2.1 */
export function luminancia({ r, g, b }) {
  const canal = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/** Razón de contraste entre dos colores: 1 (nulo) a 21 (máximo) */
export function contraste(colorA, colorB) {
  const a = aRgb(colorA), b = aRgb(colorB);
  if (!a || !b) return null;
  const la = luminancia(a), lb = luminancia(b);
  const claro = Math.max(la, lb), oscuro = Math.min(la, lb);
  return (claro + 0.05) / (oscuro + 0.05);
}

/**
 * ¿Pasa el mínimo WCAG?
 * texto normal AA = 4.5 · texto grande AA = 3 · AAA = 7
 */
export function evaluar(fg, bg, { grande = false, nivel = 'AA' } = {}) {
  const ratio = contraste(fg, bg);
  if (ratio === null) return null;
  const minimo = nivel === 'AAA' ? (grande ? 4.5 : 7) : (grande ? 3 : 4.5);
  return { ratio: Math.round(ratio * 100) / 100, minimo, pasa: ratio >= minimo };
}
