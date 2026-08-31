// ════════════════════════════════════════════════════════════
//  Adaptador FIREBASE — mismo principio que el de Supabase: lee
//  las colecciones "leads" y "productos" que ya generan otras
//  bases, no inventa datos de ventas que no existen en Firestore.
//  Requiere: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
// ════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';

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

    const leadsSnap = await getDocs(query(collection(dbf, 'leads'), orderBy('creadoEn', 'desc'), limit(500)));
    const leads = leadsSnap.docs.map(d => {
      const data = d.data();
      const fecha = data.creadoEn?.toDate ? data.creadoEn.toDate().toISOString().slice(0, 10) : '';
      return { id: d.id, fecha };
    });

    const prodsSnap = await getDocs(collection(dbf, 'productos'));
    const productos = prodsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    return { leads, productos };
  },
};
