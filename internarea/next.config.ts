import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_FIREBASE_API_KEY: "AIzaSyB8VMfxTNXpVEEZo2sxJ2gRk-O2nVzatSI",
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: "internshala-b0d41.firebaseapp.com",
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: "internshala-b0d41",
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: "internshala-b0d41.firebasestorage.app",
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: "509604426013",
    NEXT_PUBLIC_FIREBASE_APP_ID: "1:509604426013:web:387cff0acc962096b331f4",
    NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: "G-V5KTVJ249V",
  },
};

export default nextConfig;
