// ════════════════════════════════════════════════════════════
//  Adaptador FIREBASE (Firestore)
//  Requiere: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
//  Estructura sugerida:
//    coleccion "vendedores" -> doc { nombre, contacto }
//    coleccion "productos"  -> doc { vendedorId, nombre, desc,
//                                     precio, emoji, stock }
// ════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, writeBatch, doc } from 'firebase/firestore';

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
    const [vendSnap, prodSnap] = await Promise.all([
      getDocs(collection(dbf, 'vendedores')),
      getDocs(collection(dbf, 'productos')),
    ]);
    return {
      vendedores: vendSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      productos: prodSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    };
  },

  async save(data) {
    if (!dbf) throw new Error('Faltan credenciales de Firebase');
    const batch = writeBatch(dbf);
    data.productos.forEach(p => {
      batch.set(doc(dbf, 'productos', p.id), {
        vendedorId: p.vendedorId, nombre: p.nombre, desc: p.desc,
        precio: p.precio, emoji: p.emoji, stock: p.stock,
      });
    });
    await batch.commit();
    return { ok: true, motor: 'firebase' };
  },
};
