import { initializeApp } from "firebase/app";
import { getAuth, browserLocalPersistence, setPersistence } from "firebase/auth";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyAv3Edtsb8eNsZm3mGAo41dIDbAFw07hPk",
    authDomain: "banco-academia-2026.firebaseapp.com",
    projectId: "banco-academia-2026",
    storageBucket: "banco-academia-2026.firebasestorage.app",
    messagingSenderId: "270942535836",
    appId: "1:270942535836:web:e9a1f7c2c4b9ffc2ce2d59"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// 🛡️ O "Blindado" Offline (Arquitetura Local-First)
// Força o Firebase Auth a manter o aluno logado no App persistentemente mesmmo sem internet
setPersistence(auth, browserLocalPersistence).catch(console.error);

// Ativa o cache local profundo (Multi-tab IndexedDB). 
// Isso converte o App em Local-First: dados são puxados e lidos mesmo num subsolo de academia "Modo Avião"
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});
