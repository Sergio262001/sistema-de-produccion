// ════════════════════════════════════════════════════════════
//  Adaptador FIREBASE (Firestore) — mismo principio que el de
//  Supabase: solo registra suscripciones, no automatiza el cobro
//  recurrente (eso necesita backend + webhook del proveedor).
//  Requiere: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
// ════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, getDocs, addDoc, updateDoc, doc, serverTimestamp,
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
    const planesSnap = await getDocs(collection(dbf, 'planes'));
    const suscSnap = await getDocs(collection(dbf, 'suscripciones'));
    return {
      planes: planesSnap.docs.map(d => ({ id: d.id, ...d.data() })),
      suscripciones: suscSnap.docs.map(d => ({ id: d.id, ...d.data() })),
    };
  },

  async suscribir(clienteEmail, planId) {
    if (!dbf) throw new Error('Faltan credenciales de Firebase');
    const ref = await addDoc(collection(dbf, 'suscripciones'), {
      clienteEmail, planId, estado: 'activa', inicio: serverTimestamp(),
    });
    return { ok: true, motor: 'firebase', id: ref.id };
  },

  async cancelar(suscripcionId) {
    if (!dbf) throw new Error('Faltan credenciales de Firebase');
    await updateDoc(doc(dbf, 'suscripciones', suscripcionId), { estado: 'cancelada' });
    return { ok: true, motor: 'firebase' };
  },
};
