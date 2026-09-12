// ════════════════════════════════════════════════════════════
//  Adaptador FIREBASE (Firestore)
//  Requiere: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
//  Estructura sugerida:
//    coleccion "leads" -> doc { nombre, contacto, mensaje, creadoEn }
//  Reglas: escritura pública (create), lectura solo usuarios admin.
// ════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, addDoc, serverTimestamp, query, orderBy,
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
    const snap = await getDocs(query(collection(dbf, 'leads'), orderBy('creadoEn', 'desc')));
    return { leads: snap.docs.map(d => ({ id: d.id, ...d.data() })) };
  },

  async save(lead) {
    if (!dbf) throw new Error('Faltan credenciales de Firebase');
    await addDoc(collection(dbf, 'leads'), {
      nombre: lead.nombre, contacto: lead.contacto, mensaje: lead.mensaje,
      creadoEn: serverTimestamp(),
    });
    return { ok: true, motor: 'firebase' };
  },
};
