/**
 * API Route: Brand API Keys Management
 * POST /api/brands/{brandId}/api-keys - Create new API key
 * GET /api/brands/{brandId}/api-keys - List API keys
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/server';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';
import crypto from 'crypto';

const CreateAPIKeyRequestSchema = z.object({
  name: z.string().min(1).max(100),
  permissionType: z.enum(['owner', 'team', 'developer']).default('team'),
  expiresInDays: z.number().min(1).max(365).optional(),
});

const DEFAULT_PERMISSIONS = {
  owner: {
    read: true,
    validate: true,
    generate: true,
    modify: true,
  },
  team: {
    read: true,
    validate: true,
    generate: false,
    modify: false,
  },
  developer: {
    read: true,
    validate: false,
    generate: true,
    modify: false,
  },
};

/**
 * Generate a secure API key
 */
function generateAPIKey(brandId: string): string {
  const randomBytes = crypto.randomBytes(16);
  const randomString = randomBytes.toString('hex');
  return `colater_sk_brand_${brandId}_${randomString}`;
}

/**
 * Hash an API key using SHA-256
 */
function hashAPIKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Authenticate request and return user ID
 */
async function authenticateRequest(request: NextRequest): Promise<string> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Unauthorized');
  }

  const token = authHeader.substring(7);
  const decodedToken = await adminAuth.verifyIdToken(token);
  return decodedToken.uid;
}

/**
 * POST - Create new API key
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const userId = await authenticateRequest(request);

    // Verify brand ownership
    const brandDoc = await adminDb.doc(`users/${userId}/brands/${brandId}`).get();
    if (!brandDoc.exists) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name, permissionType, expiresInDays } = CreateAPIKeyRequestSchema.parse(body);

    // Generate the key
    const key = generateAPIKey(brandId);
    const keyHash = hashAPIKey(key);
    const keyPrefix = key.substring(0, 20) + '...';

    // Calculate expiration
    let expiresAt: FirebaseFirestore.Timestamp | undefined;
    if (expiresInDays) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiresInDays);
      expiresAt = Timestamp.fromDate(expiryDate);
    }

    // Create API key document
    const apiKeyData = {
      userId,
      brandId,
      name,
      keyHash,
      keyPrefix,
      permissions: DEFAULT_PERMISSIONS[permissionType],
      createdAt: FieldValue.serverTimestamp(),
      expiresAt: expiresAt || null,
      usageCount: 0,
      revokedAt: null,
    };

    const apiKeyRef = await adminDb
      .collection(`users/${userId}/brands/${brandId}/apiKeys`)
      .add(apiKeyData);

    return NextResponse.json({
      keyId: apiKeyRef.id,
      key, // Only returned once!
      keyPrefix,
      name,
      permissions: DEFAULT_PERMISSIONS[permissionType],
      expiresAt: expiresAt?.toDate().toISOString(),
      createdAt: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('Create API key error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET - List API keys for a brand
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string }> }
) {
  try {
    const { brandId } = await params;
    const userId = await authenticateRequest(request);

    // Verify brand ownership
    const brandDoc = await adminDb.doc(`users/${userId}/brands/${brandId}`).get();
    if (!brandDoc.exists) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    // List API keys (exclude revoked by default)
    const includeRevoked = request.nextUrl.searchParams.get('includeRevoked') === 'true';

    let query = adminDb
      .collection(`users/${userId}/brands/${brandId}/apiKeys`)
      .orderBy('createdAt', 'desc');

    if (!includeRevoked) {
      query = query.where('revokedAt', '==', null);
    }

    const snapshot = await query.get();
    const apiKeys = snapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name,
        keyPrefix: data.keyPrefix,
        permissions: data.permissions,
        createdAt: data.createdAt?.toDate().toISOString(),
        expiresAt: data.expiresAt?.toDate().toISOString(),
        lastUsedAt: data.lastUsedAt?.toDate().toISOString(),
        usageCount: data.usageCount || 0,
        revokedAt: data.revokedAt?.toDate().toISOString(),
      };
    });

    return NextResponse.json({ apiKeys });
  } catch (error: unknown) {
    console.error('List API keys error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
