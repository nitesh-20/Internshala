// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const clean = (val) => (val ? String(val).replace(/["']/g, "").trim() : "");

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || process.env.NEXT_PUBLIC_APP_FB_API_KEY || "AIzaSyB8VMfxTNXpVEEZo2sxJ2gRk-O2nVzatSI"),
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || process.env.NEXT_PUBLIC_APP_FB_AUTH_DOMAIN || "internshala-b0d41.firebaseapp.com"),
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_APP_FB_PROJECT_ID || "internshala-b0d41"),
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || process.env.NEXT_PUBLIC_APP_FB_STORAGE_BUCKET || "internshala-b0d41.firebasestorage.app"),
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || process.env.NEXT_PUBLIC_APP_FB_MESSAGING_SENDER_ID || "509604426013"),
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || process.env.NEXT_PUBLIC_APP_FB_APP_ID || "1:509604426013:web:387cff0acc962096b331f4"),
  measurementId: clean(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_APP_FB_MEASUREMENT_ID || "G-V5KTVJ249V")
};

// Initialize Firebase safely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { auth, provider };
