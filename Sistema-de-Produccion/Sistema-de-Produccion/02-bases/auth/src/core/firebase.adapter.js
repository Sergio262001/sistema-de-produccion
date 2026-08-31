// ════════════════════════════════════════════════════════════
//  Adaptador FIREBASE (Firebase Auth)
//  Requiere: FIREBASE_API_KEY, FIREBASE_PROJECT_ID, FIREBASE_APP_ID
//  El rol no vive en Firebase Auth: se guarda en Firestore, colección
//  "perfiles" -> doc(uid) { rol, nombre }. Reglas: cada usuario lee/
//  escribe solo su perfil; el campo rol solo lo cambia un admin.
// ════════════════════════════════════════════════════════════

import { initializeApp } from 'firebase/app';
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const cfg = {
  apiKey:    import.meta.env?.FIREBASE_API_KEY,
  projectId: import.meta.env?.FIREBASE_PROJECT_ID,
  appId:     import.meta.env?.FIREBASE_APP_ID,
};

const ready = cfg.apiKey && cfg.projectId;
const app = ready ? initializeApp(cfg) : null;
const authf = app ? getAuth(app) : null;
const dbf = app ? getFirestore(app) : null;

async function perfilDe(uid) {
  const snap = await getDoc(doc(dbf, 'perfiles', uid));
  return snap.exists() ? snap.data() : { rol: 'cliente', nombre: '' };
}

export const firebaseAuth = {
  async register(email, password, meta = {}) {
    if (!authf) throw new Error('Faltan credenciales de Firebase');
    const { user } = await createUserWithEmailAndPassword(authf, email, password);
    const perfil = { rol: meta.rol || 'cliente', nombre: meta.nombre || '' };
    await setDoc(doc(dbf, 'perfiles', user.uid), perfil);
    return { ok: true, user: { email: user.email, ...perfil } };
  },

  async login(email, password) {
    if (!authf) throw new Error('Faltan credenciales de Firebase');
    const { user } = await signInWithEmailAndPassword(authf, email, password);
    const perfil = await perfilDe(user.uid);
    return { ok: true, user: { email: user.email, ...perfil } };
  },

  async logout() {
    if (!authf) throw new Error('Faltan credenciales de Firebase');
    await signOut(authf);
    return { ok: true };
  },

  subscribe(fn) {
    if (!authf) { fn(null); return () => {}; }
    return onAuthStateChanged(authf, async (user) => {
      if (!user) return fn(null);
      const perfil = await perfilDe(user.uid);
      fn({ email: user.email, ...perfil });
    });
  },
};
