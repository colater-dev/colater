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

// ---------------------------------------------------------------------------
// URL allowlist for SSRF prevention
// ---------------------------------------------------------------------------

const ALLOWED_HOSTS = [
  'firebasestorage.googleapis.com',
  'storage.googleapis.com',
  '.r2.dev',
  '.fal.media',
  '.fal.ai',
  '.replicate.delivery',
  '.replicate.com',
];

const BLOCKED_PATTERNS = [
  /^https?:\/\/localhost/i,
  /^https?:\/\/127\./,
  /^https?:\/\/10\./,
  /^https?:\/\/172\.(1[6-9]|2\d|3[01])\./,
  /^https?:\/\/192\.168\./,
  /^https?:\/\/169\.254\./,
  /^https?:\/\/0\./,
  /^https?:\/\/\[::1\]/,
];

/**
 * Validates that a URL points to a known, trusted storage provider.
 * Blocks internal/private IPs to prevent SSRF attacks.
 * Allows data: URIs for legacy base64 support.
 */
export function isAllowedUrl(url: string): boolean {
  if (url.startsWith('data:')) return true;
  try {
    const parsed = new URL(url);
    if (BLOCKED_PATTERNS.some(p => p.test(url))) return false;
    return ALLOWED_HOSTS.some(h =>
      h.startsWith('.') ? parsed.hostname.endsWith(h) : parsed.hostname === h
    );
  } catch {
    return false;
  }
}
