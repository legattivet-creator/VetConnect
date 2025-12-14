import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCvthDP8LsNfFB1sD9X53hwrdeKuNOQm-7k",
  authDomain: "vetconnect-6d4a8.firebaseapp.com",
  projectId: "vetconnect-6d4a8",
  storageBucket: "vetconnect-6d4a8.firebasestorage.app",
  messagingSenderId: "502108263748",
  appId: "1:502108263748:web:5366107802f225eb08f311"
};

const app = initializeApp(firebaseConfig);

// Firestore
export const db = getFirestore(app);

// Auth
export const auth = getAuth(app);

// Messaging – com verificação para evitar erro no iOS ou navegador sem suporte
export const messaging = await (async () => {
  return (await isSupported()) ? getMessaging(app) : null;
})();

export { app };
