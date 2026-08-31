// Adaptador LOCAL — sin backend. Los leads quedan en memoria;
// útil para desarrollo, demos y para que la base arranque sin configurar nada.
let leads = [];

export const localAdapter = {
  async load() {
    return { leads };
  },
  async save(lead) {
    leads.push({ ...lead, id: crypto.randomUUID(), fecha: new Date().toISOString() });
    return { ok: true, motor: 'local' };
  },
};
