
'use client';

import { initializeFirebaseApp } from '@/firebase/config';
import { type FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

// Set by `npm run dev:local`; routes Auth + Firestore to the local emulators.
export const USE_FIREBASE_EMULATORS = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === 'true';

let emulatorsConnected = false;

// This function is the single entry point for client-side Firebase initialization.
export function initializeFirebase() {
  const firebaseApp = initializeFirebaseApp();
  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  const auth = getAuth(firebaseApp);
  const firestore = getFirestore(firebaseApp);
  if (USE_FIREBASE_EMULATORS && !emulatorsConnected) {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
    connectFirestoreEmulator(firestore, '127.0.0.1', 8080);
    emulatorsConnected = true;
  }
  return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
