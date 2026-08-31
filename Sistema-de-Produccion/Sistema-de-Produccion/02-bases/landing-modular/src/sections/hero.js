// SECCIÓN: Hero — título, subtítulo y CTA. El contenido viene del
// contexto (content.hero), nunca incrustado aquí.
export function renderHero(content) {
  const { titulo, subtitulo, cta } = content.hero;
  return `
    <section class="hero">
      <h1>${titulo}</h1>
      <p class="lead">${subtitulo}</p>
      <a class="cta" href="#leads">${cta}</a>
    </section>
  `;
}
