import { adminAuth } from '@/firebase/server';

export async function requireServerAuth(idToken: string): Promise<{ uid: string }> {
  if (!adminAuth) {
    throw new Error('Firebase Admin SDK not initialized');
  }
  if (!idToken) {
    throw new Error('Authentication required');
  }
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    return { uid: decoded.uid };
  } catch {
    throw new Error('Invalid or expired authentication token');
  }
}
