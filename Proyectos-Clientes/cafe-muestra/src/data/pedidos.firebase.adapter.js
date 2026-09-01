// ════════════════════════════════════════════════════════════
//  Adaptador FIREBASE de pedidos (Firestore)
//  Requiere: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
//  Colección: pedidos (los ítems van embebidos en el documento —
//  en Firestore no se normaliza como en SQL).
//
//  ⚠ DIFERENCIA REAL CON SUPABASE: aquí NO hay descuento atómico de
//  stock. El equivalente sería una transacción de Firestore o una
//  Cloud Function, y eso ya es backend. Si el proyecto vende
//  unidades limitadas y necesita que no se sobrevenda, usa Supabase
//  (que resuelve esto con la función `crear_pedido` del esquema) o
//  cotiza la Cloud Function. No es un descuido: es la razón por la
//  que Supabase es el motor por defecto de este sistema.
// ════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, addDoc, getDocs, query,
  orderBy, limit as fbLimit, where, updateDoc, doc,
} from 'firebase/firestore';

const cfg = {
  apiKey:    import.meta.env?.FIREBASE_API_KEY,
  projectId: import.meta.env?.FIREBASE_PROJECT_ID,
  appId:     import.meta.env?.FIREBASE_APP_ID,
};
const db = cfg.apiKey ? getFirestore(initializeApp(cfg)) : null;

export const pedidosFirebase = {
  async guardar(pedido) {
    if (!db) throw new Error('Faltan credenciales de Firebase');
    const ref = await addDoc(collection(db, 'pedidos'), pedido);
    return { ok: true, motor: 'firebase', id: pedido.id, docId: ref.id };
  },

  async listar({ estado = null, limite = 200 } = {}) {
    if (!db) throw new Error('Faltan credenciales de Firebase');
    const partes = [collection(db, 'pedidos')];
    if (estado) partes.push(where('estado', '==', estado));
    partes.push(orderBy('creado_en', 'desc'), fbLimit(limite));

    const snap = await getDocs(query(...partes));
    return { pedidos: snap.docs.map(d => ({ ...d.data(), docId: d.id })) };
  },

  async cambiarEstado(codigo, estado) {
    if (!db) throw new Error('Faltan credenciales de Firebase');
    const snap = await getDocs(query(collection(db, 'pedidos'), where('id', '==', codigo)));
    if (snap.empty) throw new Error(`No existe el pedido ${codigo}`);
    await updateDoc(doc(db, 'pedidos', snap.docs[0].id), {
      estado, actualizado_en: new Date().toISOString(),
    });
    return { ok: true, motor: 'firebase' };
  },
};
