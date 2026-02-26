
import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";

// Security is enforced by Firestore and Storage security rules,
// but we still require env vars to avoid silently using wrong project.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}. Check your .env file.`);
  }
  return value;
}

const baseConfig = {
  projectId: requireEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID'),
  appId: requireEnv('NEXT_PUBLIC_FIREBASE_APP_ID'),
  apiKey: requireEnv('NEXT_PUBLIC_FIREBASE_API_KEY'),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || '',
  measurementId: '',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '',
};

// Simplified configuration - always use Firebase auth domain
export const firebaseConfig = {
  ...baseConfig,
  "authDomain": "studio-6830756272-ca1a2.firebaseapp.com"
};


/**
 * Initializes and/or returns the singleton FirebaseApp instance.
 * Ensures Firebase is initialized correctly in any environment (client or server).
 * This function is idempotent.
 * @returns The initialized FirebaseApp instance.
 */
export function initializeFirebaseApp(): FirebaseApp {
  // If apps are already initialized, return the default app.
  // This is safe for both client and server environments.
  if (getApps().length) {
    return getApp();
  }

  // Initialize the app with the provided config.
  // The automaticDataCollectionEnabled: false prevents Firebase from attempting
  // to auto-fetch config from /__/firebase/init.json
  return initializeApp(firebaseConfig, {
    automaticDataCollectionEnabled: false,
  });
}
