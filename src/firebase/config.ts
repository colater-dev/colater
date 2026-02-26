
import { initializeApp, getApps, FirebaseApp, getApp } from "firebase/app";

// This is a public configuration and can be safely exposed in client code.
// Security is enforced by Firestore and Storage security rules, not by hiding these keys.
// Env vars are supported to allow overriding for different environments.
const baseConfig = {
  "projectId": process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-6830756272-ca1a2",
  "appId": process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:251098089151:web:7dfc5b869ff6e11af6e80a",
  "apiKey": process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCVNej025Wh4yX0SP_Vl0ODl6Bq259CCFY",
  "storageBucket": process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-6830756272-ca1a2.firebasestorage.app",
  "measurementId": "",
  "messagingSenderId": process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "251098089151",
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
