// ════════════════════════════════════════════════════════════
//  Adaptador FIREBASE (Firestore)
//  Requiere: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
//  Estructura sugerida:
//    coleccion "categorias" -> doc { nombre, desc, orden }
//      subcoleccion "items" -> doc { nombre, desc, precio,
//                                    emoji, disp, badge, orden }
//  Reglas: lectura pública, escritura solo usuarios admin.
// ════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, writeBatch, doc,
} from 'firebase/firestore';

const cfg = {
  apiKey:    import.meta.env?.FIREBASE_API_KEY,
  projectId: import.meta.env?.FIREBASE_PROJECT_ID,
  appId:     import.meta.env?.FIREBASE_APP_ID,
};

const ready = cfg.apiKey && cfg.projectId;
const dbf = ready ? getFirestore(initializeApp(cfg)) : null;

export const firebaseAdapter = {
  async load() {
    if (!dbf) throw new Error('Faltan credenciales de Firebase');
    const catsSnap = await getDocs(collection(dbf, 'categorias'));
    const categorias = [];
    for (const c of catsSnap.docs) {
      const itemsSnap = await getDocs(collection(dbf, 'categorias', c.id, 'items'));
      categorias.push({
        id: c.id, ...c.data(),
        items: itemsSnap.docs.map(i => ({ id: i.id, ...i.data() })),
      });
    }
    return { categorias };
  },

  async save(data) {
    if (!dbf) throw new Error('Faltan credenciales de Firebase');
    const batch = writeBatch(dbf);
    data.categorias.forEach(c => {
      c.items.forEach(i => {
        const ref = doc(dbf, 'categorias', c.id, 'items', i.id);
        batch.set(ref, {
          nombre: i.nombre, desc: i.desc, precio: i.precio,
          emoji: i.emoji, disp: i.disp, badge: i.badge || null,
        });
      });
    });
    await batch.commit();
    return { ok: true, motor: 'firebase' };
  },
};
