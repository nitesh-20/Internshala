import type { FirebaseApp } from "firebase/app";
import type { Auth, GoogleAuthProvider } from "firebase/auth";

export const app: FirebaseApp | null;
export const auth: Auth | null;
export const provider: GoogleAuthProvider;
export const firebaseInitError: Error | null;
