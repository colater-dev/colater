/**
 * MCP API Route: List Brands
 * POST /api/mcp/brands/list
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireMCPAuth } from '@/lib/mcp-auth';
import { adminDb } from '@/firebase/server';
import { z } from 'zod';

const ListBrandsRequestSchema = z.object({
  limit: z.number().min(1).max(100).optional().default(50),
  offset: z.number().min(0).optional().default(0),
  sortBy: z.enum(['name', 'created', 'updated']).optional().default('updated'),
  filter: z
    .object({
      search: z.string().optional(),
      hasLogo: z.boolean().optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const userId = await requireMCPAuth();

    // Parse request body
    const body = await request.json();
    const { limit, offset, sortBy, filter } = ListBrandsRequestSchema.parse(body);

    // Build query
    let query = adminDb
      .collection(`users/${userId}/brands`)
      .orderBy(
        sortBy === 'name'
          ? 'latestName'
          : sortBy === 'created'
            ? 'createdAt'
            : 'createdAt',
        'desc'
      )
      .limit(limit + 1); // Get one extra to check if there are more

    // Apply offset
    if (offset > 0) {
      const offsetSnapshot = await adminDb
        .collection(`users/${userId}/brands`)
        .orderBy(
          sortBy === 'name'
            ? 'latestName'
            : sortBy === 'created'
              ? 'createdAt'
              : 'createdAt',
          'desc'
        )
        .limit(offset)
        .get();

      if (!offsetSnapshot.empty) {
        const lastDoc = offsetSnapshot.docs[offsetSnapshot.docs.length - 1];
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();

    // Determine if there are more results
    const hasMore = snapshot.docs.length > limit;
    const brands = snapshot.docs.slice(0, limit);

    // Build response
    const brandsData = await Promise.all(
      brands.map(async (doc: FirebaseFirestore.QueryDocumentSnapshot) => {
        const brandData = doc.data();

        // Get stats
        const [logosSnapshot, taglinesSnapshot] = await Promise.all([
          adminDb
            .collection(`users/${userId}/brands/${doc.id}/logoGenerations`)
            .count()
            .get(),
          adminDb
            .collection(`users/${userId}/brands/${doc.id}/taglineGenerations`)
            .count()
            .get(),
        ]);

        // Apply filters
        if (filter?.hasLogo && !brandData.logoUrl) {
          return null;
        }

        if (filter?.search) {
          const searchLower = filter.search.toLowerCase();
          const nameLower = brandData.latestName?.toLowerCase() || '';
          if (!nameLower.includes(searchLower)) {
            return null;
          }
        }

        return {
          id: doc.id,
          name: brandData.latestName,
          tagline: brandData.primaryTagline || '',
          thumbnailUrl: brandData.logoUrl || '',
          createdAt: brandData.createdAt?.toDate().toISOString() || new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          stats: {
            logoCount: logosSnapshot.data().count,
            taglineCount: taglinesSnapshot.data().count,
            hasGuidelines: Boolean(brandData.primaryTagline && brandData.logoUrl),
          },
        };
      })
    );

    // Filter out nulls from filter application
    const filteredBrands = brandsData.filter(Boolean);

    // Get total count (approximate)
    const totalSnapshot = await adminDb
      .collection(`users/${userId}/brands`)
      .count()
      .get();

    const response = {
      brands: filteredBrands,
      pagination: {
        total: totalSnapshot.data().count,
        limit,
        offset,
        hasMore,
      },
    };

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('MCP List Brands Error:', error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return NextResponse.json(
        { error: 'Invalid API key' },
        { status: 401 }
      );
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
