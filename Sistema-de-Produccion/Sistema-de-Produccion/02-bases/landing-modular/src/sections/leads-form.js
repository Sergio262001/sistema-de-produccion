// SECCIÓN: Formulario de leads — captura nombre/contacto/mensaje y
// lo guarda con el adaptador activo (local/Supabase/Firebase).
export function renderLeadsForm(content) {
  return `
    <section class="leads" id="leads">
      <h2>${content.leads_titulo || 'Hablemos de tu proyecto'}</h2>
      <form id="leadForm" novalidate>
        <input name="nombre" type="text" placeholder="Tu nombre" required>
        <input name="contacto" type="text" placeholder="WhatsApp o correo" required>
        <textarea name="mensaje" placeholder="Cuéntame qué necesitas" rows="3"></textarea>
        <button type="submit">Enviar</button>
        <p class="msg" id="leadMsg" role="status"></p>
      </form>
    </section>
  `;
}

// db: adaptador con save(lead). ctx: ficha de contexto (para WhatsApp opcional).
export function bindLeadsForm(db, ctx) {
  const form = document.getElementById('leadForm');
  const msg = document.getElementById('leadMsg');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const lead = {
      nombre: form.nombre.value.trim(),
      contacto: form.contacto.value.trim(),
      mensaje: form.mensaje.value.trim(),
    };
    if (!lead.nombre || !lead.contacto) return;

    try {
      await db.save(lead);
      msg.textContent = '¡Gracias! Te contactamos pronto.';
      form.reset();
      if (ctx.apis?.mensajeria === 'whatsapp' && ctx.apis?.whatsapp_num) {
        const texto = `Hola, soy ${lead.nombre}. ${lead.mensaje || 'Quiero más información.'}`;
        window.open(`https://wa.me/${ctx.apis.whatsapp_num}?text=${encodeURIComponent(texto)}`, '_blank');
      }
    } catch (err) {
      msg.textContent = 'No se pudo enviar. Intenta de nuevo.';
    }
  });
}
