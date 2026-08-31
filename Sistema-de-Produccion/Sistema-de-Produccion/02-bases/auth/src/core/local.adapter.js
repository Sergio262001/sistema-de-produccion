// Adaptador LOCAL — sin backend. Usuarios en memoria, para desarrollo
// y demos. NO usar en producción: la contraseña no se hashea.
const USERS = [
  { email: 'admin@demo.com', password: 'admin123', rol: 'admin', nombre: 'Admin Demo' },
];

let current = null;
const listeners = new Set();

function emit() { listeners.forEach(fn => fn(current)); }

export const localAuth = {
  async register(email, password, meta = {}) {
    if (USERS.some(u => u.email === email)) throw new Error('Ese correo ya está registrado');
    const user = { email, password, rol: meta.rol || 'cliente', nombre: meta.nombre || '' };
    USERS.push(user);
    current = { email: user.email, rol: user.rol, nombre: user.nombre };
    emit();
    return { ok: true, user: current };
  },

  async login(email, password) {
    const user = USERS.find(u => u.email === email && u.password === password);
    if (!user) throw new Error('Correo o contraseña incorrectos');
    current = { email: user.email, rol: user.rol, nombre: user.nombre };
    emit();
    return { ok: true, user: current };
  },

  async logout() {
    current = null;
    emit();
    return { ok: true };
  },

  subscribe(fn) { listeners.add(fn); fn(current); return () => listeners.delete(fn); },
  current() { return current; },
};
