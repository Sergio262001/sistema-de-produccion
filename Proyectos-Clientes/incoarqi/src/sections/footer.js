// SECCIÓN: Footer — datos de contacto y marca, desde el contexto.
export function renderFooter(content, ctx) {
  return `
    <footer>
      <span>${ctx.cliente}</span>
      <span>${content.footer_nota || ''}</span>
    </footer>
  `;
}
