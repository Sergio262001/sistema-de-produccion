// ════════════════════════════════════════════════════════════
//  Adaptador FIREBASE (Firestore)
//  Requiere: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
//  Estructura sugerida:
//    coleccion "clientes" -> doc { nombre, contacto, estado }
//      subcoleccion "interacciones" -> doc { fecha, nota }
//  Reglas: lectura/escritura solo usuarios admin.
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
    const clientesSnap = await getDocs(collection(dbf, 'clientes'));
    const clientes = [];
    for (const c of clientesSnap.docs) {
      const interSnap = await getDocs(collection(dbf, 'clientes', c.id, 'interacciones'));
      clientes.push({ id: c.id, ...c.data(), interacciones: interSnap.docs.map(i => ({ id: i.id, ...i.data() })) });
    }
    return { clientes };
  },

  async agregarNota(clienteId, nota) {
    if (!dbf) throw new Error('Faltan credenciales de Firebase');
    await addDoc(collection(dbf, 'clientes', clienteId, 'interacciones'), { nota, fecha: serverTimestamp() });
    return { ok: true, motor: 'firebase' };
  },

  async actualizarEstado(clienteId, estado) {
    if (!dbf) throw new Error('Faltan credenciales de Firebase');
    await updateDoc(doc(dbf, 'clientes', clienteId), { estado });
    return { ok: true, motor: 'firebase' };
  },
};
