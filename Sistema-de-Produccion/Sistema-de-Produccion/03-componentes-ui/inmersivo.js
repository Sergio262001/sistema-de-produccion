/* ══════════════════════════════════════════════════════════════
   INMERSIVO — los bloques que rodean el espacio de la foto.

   Va con `inmersivo.css`. Ahí está el porqué de todo esto; aquí solo está
   lo que pinta.

   ── CÓMO SE USA ────────────────────────────────────────────────
   Se copia y se pega dentro del <script> de la demo de la base. NO se
   importa: cada base es autocontenida y su demo.html abre con doble clic,
   sin servidor. Este archivo es la fuente de la verdad.

   ── DE QUÉ DEPENDE ─────────────────────────────────────────────
   `esc(valor)`      escapa HTML          — las cinco bases lo tienen
   `urlSegura(url)`  filtra javascript:   — las cinco bases lo tienen
   `CONTEXT.pagina`  la ficha del cliente

   ── LA REGLA QUE NO SE PUEDE OLVIDAR ───────────────────────────
   Cada bloque tiene su versión SIN foto. El espacio se reserva en el
   diseño, pero NO queda un hueco gris en la entrega publicada: sin
   imagen, la sección se reacomoda a texto y sigue funcionando.
   ══════════════════════════════════════════════════════════════ */

/* Las tres únicas texturas. Un nombre inventado devuelve cadena vacía, no
   una textura de respaldo: una que no corresponde al negocio miente. */
const TEXTURAS = ['plano', 'concreto', 'trama'];

function textura(nombre, porDefecto){
  const n = String(nombre || porDefecto || '').trim().toLowerCase();
  if(!TEXTURAS.includes(n)) return '';
  return '<span class="textura tex-'+n+'" aria-hidden="true"></span>';
}

/* FRANJA — banda a sangre con una frase encima.
   Sin frase no existe: una banda de color sin nada dentro es un bloque de
   relleno, y el sistema no rellena. */
function pintarFranja(){
  const el = document.getElementById('franja');
  if(!el) return;
  const f = (CONTEXT.pagina && CONTEXT.pagina.franja) || {};
  const frase = String(f.frase||'').trim();
  if(!frase){ el.hidden = true; return; }
  const foto = urlSegura(f.foto);
  const firma = String(f.firma||'').trim();
  // Con foto, la foto. Sin foto, la textura — y el corte de ritmo se
  // mantiene igual, que es para lo que está la franja.
  el.classList.add('con-textura');
  el.innerHTML = (foto
      ? '<img src="'+esc(foto)+'" alt="" loading="lazy" decoding="async">'
      : textura(f.textura, 'concreto'))
    + '<blockquote>'+esc(frase)
    + (firma ? '<span class="firma">'+esc(firma)+'</span>' : '')
    + '</blockquote>';
  el.hidden = false;
}

/* SECCIÓN PARTIDA — devuelve el MARCADO, no lo pinta.
   Las bases de venta meten sus bloques dentro de un contenedor común
   (`#bloques`), así que esto compone y quien llame decide dónde va.

   El espacio de la foto es la MITAD de la sección: la imagen es
   estructura, no un adorno al lado del párrafo. */
function bloquePartido(titulo, texto, foto, nombreTextura){
  const t = String(texto||'').trim();
  if(!t) return '';
  const img = urlSegura(foto);
  // Sin foto pero con textura, la sección conserva sus dos mitades.
  // Sin ninguna de las dos, el texto toma el ancho completo.
  const tex = img ? '' : textura(nombreTextura, 'plano');
  return '<div class="partida'+((img || tex) ? '' : ' sin-img')+'">'
    + '<div class="lado-txt">'
    +   '<h2>'+esc(String(titulo||'Sobre nosotros').trim())+'</h2>'
    +   '<p class="prosa">'+esc(t)+'</p>'
    + '</div>'
    + (img
        ? '<div class="lado-img"><img src="'+esc(img)+'" alt="" '
          + 'loading="lazy" decoding="async"></div>'
        : (tex ? '<div class="lado-img con-textura">'+tex+'</div>' : ''))
    + '</div>';
}

/* HERO A SANGRE — devuelve el marcado interior del hero y deja la clase
   puesta. Quien llama decide si lo muestra.

   Con portada oscura, la CABECERA también va oscura: si no, queda una
   franja clara con el logo encima del hero oscuro y se lee como un error
   de maquetación, no como una decisión. */
function heroInmersivo(el, titular, bajada){
  const h = (CONTEXT.pagina && CONTEXT.pagina.hero) || {};
  const oscuro = /^oscuro$/i.test(String(h.fondo||'').trim());
  const foto = oscuro ? urlSegura(h.foto) : '';

  document.documentElement.setAttribute('data-portada', oscuro ? 'oscura' : 'clara');
  el.className = 'hero' + (oscuro ? ' oscuro con-textura' : '');

  return (oscuro
      ? (foto
          ? '<img class="hero-foto" src="'+esc(foto)+'" alt="" '
            + 'decoding="async" fetchpriority="high">'
          : textura(h.textura, 'plano'))
      : '')
    + (titular ? '<h2>'+esc(titular)+'</h2>' : '')
    + (bajada ? '<p>'+esc(bajada)+'</p>' : '');
}
