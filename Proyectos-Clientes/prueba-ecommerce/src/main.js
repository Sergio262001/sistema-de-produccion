// ════════════════════════════════════════════════════════════
//  Prueba Ecommerce — conecta la base "ecommerce-completo" a un
//  proyecto Supabase real. La URL/anon key viven solo en .env
//  (import.meta.env), nunca aquí — ver vite.config.js (envPrefix)
//  y src/data/supabase.adapter.js (adaptador copiado tal cual).
// ════════════════════════════════════════════════════════════
import { getDB } from './data/adapter.js';
import { createCart, money } from './core/cart.js';
import { checkout } from './core/checkout.js';

const CONTEXT = {
  cliente: 'Prueba Ecommerce',
  linea: 'pro',
  marca: { primario: '#1B36C9', secundario: '#F5F7FB', inicial: 'P' },
  base_de_datos: { motor: import.meta.env?.DB_MOTOR || 'local' },
  apis: { pagos: 'whatsapp', whatsapp_num: import.meta.env?.WHATSAPP_NUM || '' },
  moneda: '$',
};

const db = getDB(CONTEXT.base_de_datos.motor);
const M = CONTEXT.moneda;
let DATA = { categorias: [] };

/* ---- auth local solo para entrar al panel de esta demo ----
   No protege la escritura en Supabase: eso lo hace RLS (ver README). */
const ADMIN_USERS = [{ email: 'admin@prueba.co', password: 'admin123', rol: 'admin', nombre: 'Dueño' }];
let authUser = null;
const localAuth = {
  async login(email, password) {
    const u = ADMIN_USERS.find(u => u.email === email && u.password === password);
    if (!u) throw new Error('Correo o contraseña incorrectos');
    authUser = { email: u.email, rol: u.rol, nombre: u.nombre };
    return { ok: true, user: authUser };
  },
  async logout() { authUser = null; return { ok: true }; },
  current() { return authUser; },
};
function checkAdminAccess() {
  const user = localAuth.current();
  const logged = !!user && user.rol === 'admin';
  document.getElementById('adminLogin').style.display = logged ? 'none' : 'block';
  document.getElementById('adminPanel').classList.toggle('hide', !logged);
  if (logged) renderAdmin();
}
window.adminLogout = async function () { await localAuth.logout(); checkAdminAccess(); };

const cart = createCart({ moneda: CONTEXT.moneda, envio: 0 });

function applyTheme() {
  const m = CONTEXT.marca, r = document.documentElement.style;
  r.setProperty('--brand', m.primario);
  r.setProperty('--bg', m.secundario);
  document.getElementById('logo').textContent = m.inicial;
  document.getElementById('biz').textContent = CONTEXT.cliente;
}

let activeCat = null;
function renderCatalogo() {
  const cats = document.getElementById('cats'); const grid = document.getElementById('grid');
  cats.innerHTML = ''; grid.innerHTML = '';
  if (!DATA.categorias.length) {
    grid.innerHTML = '<p class="empty-state">Sin productos todavía — corre el supabase.schema.sql (ver README.md) para crear datos de ejemplo.</p>';
    return;
  }
  DATA.categorias.forEach((c, i) => {
    const b = document.createElement('button'); b.type = 'button';
    b.textContent = c.nombre; b.className = (activeCat === c.id || (!activeCat && i === 0)) ? 'on' : '';
    b.onclick = () => { activeCat = c.id; renderCatalogo(); };
    cats.appendChild(b);
  });
  const cat = DATA.categorias.find(c => c.id === (activeCat || DATA.categorias[0]?.id));
  if (!cat) return;
  cat.productos.forEach(p => {
    const agotado = p.stock <= 0;
    const el = document.createElement('div'); el.className = 'product' + (agotado ? ' agotado' : '');
    el.innerHTML = `<div class="ph">${p.emoji || '🛍️'}</div><div class="b">
      <h3>${p.nombre} ${p.badge ? '<span class="badge">' + p.badge + '</span>' : ''}</h3>
      <div class="d">${p.desc || ''}</div>
      <div class="row"><span class="pr">${money(p.precio, M)}</span>
      <button type="button" class="add" ${agotado ? 'disabled' : ''}>${agotado ? 'Agotado' : 'Agregar'}</button></div>
      ${!agotado ? `<div class="badge stock-tag">stock: ${p.stock}</div>` : ''}
    </div>`;
    if (!agotado) el.querySelector('.add').onclick = () => { cart.add(p, 1); pulse(); };
    grid.appendChild(el);
  });
}

cart.subscribe(state => {
  document.getElementById('count').textContent = state.count;
  renderLines(state); renderFoot(state);
});

function renderLines(state) {
  const c = document.getElementById('lines');
  if (!state.items.length) { c.innerHTML = '<div class="empty">Tu carrito está vacío.</div>'; return; }
  c.innerHTML = '';
  state.items.forEach(i => {
    const row = document.createElement('div'); row.className = 'line';
    row.innerHTML = `<div class="em">${i.emoji || '🛍️'}</div>
      <div class="li"><div class="nm">${i.nombre}</div><div class="lp">${money(i.precio, M)} c/u</div></div>
      <div class="qty"><button type="button" aria-label="menos">−</button><span>${i.qty}</span><button type="button" aria-label="más">+</button></div>`;
    const [minus, , plus] = row.querySelectorAll('.qty *');
    minus.onclick = () => cart.decrement(i.id);
    plus.onclick = () => cart.increment(i.id);
    c.appendChild(row);
  });
}
function renderFoot(state) {
  const f = document.getElementById('foot');
  if (!state.items.length) { f.innerHTML = ''; return; }
  f.innerHTML = `
    <div class="totrow"><span>Subtotal</span><span>${money(state.subtotal, M)}</span></div>
    <div class="totrow big"><span>Total</span><span>${money(state.total, M)}</span></div>
    <button type="button" class="pay-btn" id="payBtn">Pedir por WhatsApp</button>`;
  document.getElementById('payBtn').onclick = () => {
    const res = checkout(state, CONTEXT);
    if (res.tipo === 'redirect') window.open(res.url, '_blank');
    else alert(`→ Iría a ${res.proveedor}\n(${res.nota})`);
  };
}

function renderAdmin() {
  const list = document.getElementById('adminList'); list.innerHTML = '';
  DATA.categorias.forEach(c => {
    const box = document.createElement('div'); box.className = 'acat';
    box.innerHTML = `<h3>${c.nombre}</h3>`;
    c.productos.forEach(p => {
      const row = document.createElement('div'); row.className = 'arow';
      row.innerHTML = `
        <input class="field" type="text" value="${p.nombre.replace(/"/g, '&quot;')}" data-cat="${c.id}" data-id="${p.id}" data-field="nombre">
        <input class="field" type="number" value="${p.precio}" step="500" data-cat="${c.id}" data-id="${p.id}" data-field="precio">
        <input class="field" type="number" value="${p.stock}" min="0" data-cat="${c.id}" data-id="${p.id}" data-field="stock">
        <button type="button" class="del" aria-label="Eliminar" data-cat="${c.id}" data-id="${p.id}">×</button>`;
      box.appendChild(row);
    });
    list.appendChild(box);
  });
  list.querySelectorAll('.field').forEach(inp => {
    inp.addEventListener('input', () => {
      const val = inp.type === 'number' ? +inp.value : inp.value;
      upd(inp.dataset.cat, inp.dataset.id, inp.dataset.field, val);
    });
  });
  list.querySelectorAll('.del').forEach(btn => {
    btn.addEventListener('click', () => delProducto(btn.dataset.cat, btn.dataset.id));
  });
}
function upd(cat, id, field, val) {
  const c = DATA.categorias.find(x => x.id === cat); const p = c.productos.find(x => x.id === id); p[field] = val;
}
function delProducto(cat, id) {
  const c = DATA.categorias.find(x => x.id === cat); c.productos = c.productos.filter(x => x.id !== id); renderAdmin();
}
window.addProducto = function () {
  if (!DATA.categorias.length) return;
  const c = DATA.categorias[0];
  c.productos.push({ id: 'n' + Date.now(), nombre: 'Nuevo producto', desc: '', precio: 0, emoji: '🛍️', stock: 0 });
  renderAdmin();
  document.getElementById('adminList').scrollIntoView({ behavior: 'smooth' });
};
window.save = async function () {
  const m = document.getElementById('savedMsg');
  const errBox = document.getElementById('rlsWarning');
  errBox.classList.remove('show');
  try {
    await db.save(DATA);
    renderCatalogo();
    m.textContent = '✓ Guardado (' + CONTEXT.base_de_datos.motor + ')';
    m.classList.add('show'); setTimeout(() => m.classList.remove('show'), 2200);
  } catch (err) {
    errBox.classList.add('show');
    errBox.textContent = '⚠️ No se pudo guardar: ' + err.message + ' — revisa el README.md (probablemente necesitas un usuario real de Supabase Auth, no el login local).';
  }
};

document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const f = e.target; const err = document.getElementById('adminLoginErr');
  try {
    await localAuth.login(f.email.value.trim(), f.password.value);
    err.textContent = ''; f.reset(); checkAdminAccess();
  } catch (loginErr) { err.textContent = loginErr.message; }
});

window.setView = function (v) {
  document.getElementById('cats').classList.toggle('hide', v === 'admin');
  document.getElementById('grid').classList.toggle('hide', v === 'admin');
  document.getElementById('admin').classList.toggle('show', v === 'admin');
  document.getElementById('tCatalog').classList.toggle('on', v === 'catalog');
  document.getElementById('tAdmin').classList.toggle('on', v === 'admin');
  document.querySelector('.cartbtn').style.display = v === 'admin' ? 'none' : 'flex';
  if (v === 'admin') checkAdminAccess();
};

window.openCart = function () { document.getElementById('drawer').classList.add('show'); document.getElementById('overlay').classList.add('show'); };
window.closeCart = function () { document.getElementById('drawer').classList.remove('show'); document.getElementById('overlay').classList.remove('show'); };
function pulse() { const b = document.getElementById('count'); b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 250 }); }

(async function init() {
  applyTheme();
  try {
    DATA = await db.load();
  } catch (err) {
    document.getElementById('grid').innerHTML = `<p class="empty-state error">No se pudo leer Supabase: ${err.message}. Revisa el README.md de esta carpeta.</p>`;
    return;
  }
  renderCatalogo();
})();
