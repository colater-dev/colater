/**
 * Firebase Admin SDK for server-side operations
 * Used for API routes and server actions
 */

import * as admin from 'firebase-admin';
import { resolveServiceAccount } from './service-account';

// Initialize Firebase Admin SDK
if (!admin.apps.length && process.env.NODE_ENV !== 'test') {
  try {
    const serviceAccount = resolveServiceAccount(process.env);

    // Only initialize if we have valid credentials
    if (serviceAccount) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
    } else {
      console.warn('Firebase Admin SDK credentials not configured. Server-side features will be unavailable.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

export const adminAuth = admin.apps.length > 0 ? admin.auth() : (null as unknown as admin.auth.Auth);
export const adminDb = admin.apps.length > 0 ? admin.firestore() : (null as unknown as admin.firestore.Firestore);
export const adminStorage = admin.apps.length > 0 ? admin.storage() : (null as unknown as admin.storage.Storage);
