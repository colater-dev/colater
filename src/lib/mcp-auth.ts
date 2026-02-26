/**
 * MCP API authentication utilities
 */

import { headers } from 'next/headers';
import { adminAuth, adminDb } from '@/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export interface MCPAuthResult {
  valid: boolean;
  userId?: string;
  brandId?: string;
  permissions?: {
    read: boolean;
    validate: boolean;
    generate: boolean;
    modify: boolean;
  };
  error?: string;
}

/**
 * Hash an API key using SHA-256
 */
function hashAPIKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Extract brand ID from API key
 * Format: colater_sk_brand_{brandId}_{random}
 */
function extractBrandIdFromKey(key: string): string | null {
  const match = key.match(/^colater_sk_brand_([^_]+)_/);
  return match ? match[1] : null;
}

/**
 * Validate MCP API key and return user ID, brand ID, and permissions
 */
export async function validateMCPApiKey(): Promise<MCPAuthResult> {
  const headersList = await headers();
  const authHeader = headersList.get('authorization');

  if (!authHeader) {
    return { valid: false, error: 'Missing Authorization header' };
  }

  // Extract key
  const key = authHeader.replace('Bearer ', '');

  if (!key) {
    return { valid: false, error: 'Invalid Authorization header format' };
  }

  try {
    // Check if it's a brand-specific API key
    if (key.startsWith('colater_sk_brand_')) {
      // Extract brand ID from key
      const brandId = extractBrandIdFromKey(key);
      if (!brandId) {
        return { valid: false, error: 'Invalid API key format' };
      }

      // Hash the key
      const keyHash = hashAPIKey(key);

      // Search for matching API key in Firestore
      // We need to check all users' brands (in production, you'd have a better index)
      // For now, we'll extract userId from the brandId path structure
      // This is a simplified approach - in production, consider a separate API keys collection

      // Try to find the key by querying across all potential users
      // Since we can't easily do a collection group query here, we'll use the brandId
      // to construct potential paths. A better approach would be to have a global
      // apiKeys collection with userId and brandId fields.

      // For now, let's assume the API key document stores the full path info
      // We'll need to do a collection group query
      const apiKeysQuery = await adminDb
        .collectionGroup('apiKeys')
        .where('keyHash', '==', keyHash)
        .where('brandId', '==', brandId)
        .limit(1)
        .get();

      if (apiKeysQuery.empty) {
        return { valid: false, error: 'Invalid API key' };
      }

      const keyDoc = apiKeysQuery.docs[0];
      const keyData = keyDoc.data();

      // Check if key is revoked
      if (keyData.revokedAt) {
        return { valid: false, error: 'API key has been revoked' };
      }

      // Check if key is expired
      if (keyData.expiresAt && keyData.expiresAt.toDate() < new Date()) {
        return { valid: false, error: 'API key has expired' };
      }

      // Update usage stats (fire and forget)
      keyDoc.ref.update({
        lastUsedAt: FieldValue.serverTimestamp(),
        usageCount: (keyData.usageCount || 0) + 1,
      }).catch((err: unknown) => console.error('Failed to update API key usage:', err));

      return {
        valid: true,
        userId: keyData.userId,
        brandId: keyData.brandId,
        permissions: keyData.permissions,
      };
    }

    // Fallback: Try Firebase ID token (for backwards compatibility)
    try {
      const decodedToken = await adminAuth.verifyIdToken(key);
      return {
        valid: true,
        userId: decodedToken.uid,
        // No brandId or permissions - legacy auth
      };
    } catch {
      return {
        valid: false,
        error: 'Invalid API key or token',
      };
    }
  } catch (error: unknown) {
    console.error('MCP API key validation error:', error);
    return {
      valid: false,
      error: 'Invalid or expired API key',
    };
  }
}

/**
 * Middleware to require valid MCP API key
 * Returns userId and optionally brandId
 */
export async function requireMCPAuth(): Promise<{
  userId: string;
  brandId?: string;
  permissions?: MCPAuthResult['permissions'];
}> {
  const result = await validateMCPApiKey();

  if (!result.valid || !result.userId) {
    throw new Error(result.error || 'Unauthorized');
  }

  return {
    userId: result.userId,
    brandId: result.brandId,
    permissions: result.permissions,
  };
}
