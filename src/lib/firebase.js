import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const db = getFirestore(app);
