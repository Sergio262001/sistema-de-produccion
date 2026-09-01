// Adaptador LOCAL — sin backend. Útil para desarrollo, demos y
// para que la base arranque sin configurar nada.
import { SEED } from './seed.js';

let data = structuredClone(SEED);

export const localAdapter = {
  async load() {
    return data;
  },
  async save(next) {
    data = next;
    return { ok: true, motor: 'local' };
  },
};
