// SECCIÓN: Servicios — grilla de tarjetas. content.servicios es una
// lista; agregar/quitar un servicio es editar el contexto, no el HTML.
export function renderServicios(content) {
  const items = content.servicios.map(s => `
    <div class="card">
      <div class="ic">${s.icono}</div>
      <h3>${s.titulo}</h3>
      <p>${s.desc}</p>
    </div>
  `).join('');
  return `
    <section class="servicios" id="servicios">
      <h2>${content.servicios_titulo || 'Lo que hacemos'}</h2>
      <div class="grid">${items}</div>
    </section>
  `;
}
