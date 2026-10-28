import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, GithubAuthProvider, initializeAuth, browserLocalPersistence, indexedDBLocalPersistence, browserPopupRedirectResolver } from "firebase/auth";
import { initializeFirestore } from "firebase/firestore";
import { getStorage as getFirebaseStorage } from "firebase/storage";

// Safe environment resolver for both Vite and Node environments
const metaEnv = (typeof import.meta !== 'undefined' && import.meta && import.meta.env) 
  ? import.meta.env 
  : (typeof process !== 'undefined' && process.env ? process.env : {});

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: metaEnv.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "your-app.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "your-app.appspot.com",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:123456789:web:abcdef"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const isNode = typeof window === 'undefined';
const isElectron = typeof window !== 'undefined' && window.location && window.location.protocol === 'file:';
const isCapacitor = typeof window !== 'undefined' && window.Capacitor && window.Capacitor.isNativePlatform();

export const auth = isNode
  ? getAuth(app)
  : initializeAuth(app, {
      persistence: (isElectron || isCapacitor) ? browserLocalPersistence : [indexedDBLocalPersistence, browserLocalPersistence],
      popupRedirectResolver: browserPopupRedirectResolver,
    });

// Initialize Firestore
export const dbFirestore = initializeFirestore(app, {});

export const storage = getFirebaseStorage(app);

// Setup Auth Providers
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const githubProvider = new GithubAuthProvider();

export default app;
