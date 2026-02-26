/**
 * API Route: Individual API Key Management
 * DELETE /api/brands/{brandId}/api-keys/{keyId} - Revoke/Delete API key
 */

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/firebase/server';
import { FieldValue } from 'firebase-admin/firestore';

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
 * DELETE - Revoke an API key
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ brandId: string; keyId: string }> }
) {
  try {
    const { brandId, keyId } = await params;
    const userId = await authenticateRequest(request);

    // Verify brand ownership
    const brandDoc = await adminDb.doc(`users/${userId}/brands/${brandId}`).get();
    if (!brandDoc.exists) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    // Check if API key exists
    const keyDoc = await adminDb
      .doc(`users/${userId}/brands/${brandId}/apiKeys/${keyId}`)
      .get();

    if (!keyDoc.exists) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    // Revoke the key (soft delete)
    await adminDb
      .doc(`users/${userId}/brands/${brandId}/apiKeys/${keyId}`)
      .update({
        revokedAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({
      success: true,
      message: 'API key revoked successfully',
    });
  } catch (error: unknown) {
    console.error('Revoke API key error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
