// Adaptador LOCAL — sin backend. Útil para desarrollo y demos.
let data = {
  planes: [
    { id: 'basico', nombre: 'Básico', precio: 29000, ciclo: 'mensual', beneficios: ['Acceso al contenido base', 'Soporte por correo'] },
    { id: 'pro', nombre: 'Pro', precio: 59000, ciclo: 'mensual', beneficios: ['Todo lo del plan Básico', 'Contenido exclusivo', 'Soporte prioritario'], destacado: true },
  ],
  suscripciones: [], // { id, clienteEmail, planId, estado, inicio }
};

export const localAdapter = {
  async load() { return data; },
  async suscribir(clienteEmail, planId) {
    const id = 's' + Date.now();
    data.suscripciones.push({ id, clienteEmail, planId, estado: 'activa', inicio: new Date().toISOString().slice(0, 10) });
    return { ok: true, motor: 'local', id };
  },
  async cancelar(suscripcionId) {
    const s = data.suscripciones.find(s => s.id === suscripcionId);
    if (s) s.estado = 'cancelada';
    return { ok: true, motor: 'local' };
  },
};
