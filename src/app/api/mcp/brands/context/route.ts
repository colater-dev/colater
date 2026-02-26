/**
 * MCP API Route: Get Brand Context
 * POST /api/mcp/brands/context
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireMCPAuth } from '@/lib/mcp-auth';
import { adminDb } from '@/firebase/server';
import { z } from 'zod';

const BrandContextRequestSchema = z.object({
  brandId: z.string(),
  sections: z.array(z.enum(['identity', 'voice', 'visual', 'positioning'])).optional(),
  includeAssets: z.boolean().optional().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const userId = await requireMCPAuth();

    // Parse request body
    const body = await request.json();
    const { brandId, sections } = BrandContextRequestSchema.parse(body);

    // Fetch brand from Firestore
    const brandDoc = await adminDb
      .doc(`users/${userId}/brands/${brandId}`)
      .get();

    if (!brandDoc.exists) {
      return NextResponse.json(
        { error: 'Brand not found' },
        { status: 404 }
      );
    }

    const brandData = brandDoc.data()!;

    // Fetch additional data
    const [logosSnapshot, taglinesSnapshot] = await Promise.all([
      adminDb
        .collection(`users/${userId}/brands/${brandId}/logoGenerations`)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get(),
      adminDb
        .collection(`users/${userId}/brands/${brandId}/taglineGenerations`)
        .orderBy('createdAt', 'desc')
        .where('status', '==', 'liked')
        .limit(3)
        .get(),
    ]);

    const logos = logosSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        logoUrl: data.logoUrl || '',
        colorVersions: data.colorVersions || [],
        ...data,
      };
    });

    const taglines = taglinesSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => {
      const data = doc.data();
      return {
        id: doc.id,
        tagline: data.tagline || '',
        ...data,
      };
    });

    // Build response based on requested sections
    const response: Record<string, unknown> = {
      brand: {
        id: brandDoc.id,
        name: brandData.latestName,
        tagline: brandData.primaryTagline || taglines[0]?.tagline || '',
        elevatorPitch: brandData.latestElevatorPitch,
        targetAudience: brandData.latestAudience,
        createdAt: brandData.createdAt?.toDate().toISOString(),
        lastUpdated: new Date().toISOString(),
      },
    };

    // Identity section
    if (!sections || sections.includes('identity') || sections.includes('positioning')) {
      response.identity = {
        positioning: {
          challenge: brandData.latestElevatorPitch || '',
          solution: brandData.latestConcept || brandData.latestName,
          keyAttributes: brandData.latestDesirableCues
            ? brandData.latestDesirableCues.split(',').map((s: string) => s.trim())
            : [],
        },
      };
    }

    // Voice section
    if (!sections || sections.includes('voice')) {
      const desirableCues = brandData.latestDesirableCues
        ? brandData.latestDesirableCues.split(',').map((s: string) => s.trim())
        : [];
      const undesirableCues = brandData.latestUndesirableCues
        ? brandData.latestUndesirableCues.split(',').map((s: string) => s.trim())
        : [];

      response.voice = {
        tone: desirableCues,
        preferWords: desirableCues,
        avoidWords: undesirableCues,
        examples: {
          formal: brandData.primaryTagline || '',
          casual: taglines[1]?.tagline || brandData.primaryTagline || '',
        },
      };
    }

    // Visual section
    if (!sections || sections.includes('visual')) {
      const primaryLogo = logos[0];
      const colorVersions = primaryLogo?.colorVersions || [];

      response.visual = {
        logos: {
          primary: brandData.logoUrl || primaryLogo?.logoUrl || '',
          icon: brandData.logoUrl || primaryLogo?.logoUrl || '',
          wordmark: brandData.logoUrl || primaryLogo?.logoUrl || '',
          variations: logos.map((logo: Record<string, unknown>, index: number) => ({
            id: logo.id,
            url: logo.logoUrl,
            type: index === 0 ? 'primary' : 'bw',
          })),
        },
        colors: {
          palette:
            colorVersions.length > 0
              ? colorVersions[0].palette.map((hex: string, index: number) => ({
                  hex,
                  name: `Color ${index + 1}`,
                  usage: index === 0 ? 'Primary brand color' : 'Accent color',
                }))
              : [
                  {
                    hex: '#000000',
                    name: 'Black',
                    usage: 'Default color',
                  },
                ],
          philosophy: brandData.latestDesirableCues || 'Modern and minimalist',
        },
        typography: {
          primary: {
            name: brandData.font || 'Inter',
            weights: [400, 600, 700],
            usage: 'All text and UI elements',
          },
          pairings: [brandData.font || 'Inter', 'Georgia'],
        },
      };
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('MCP Brand Context Error:', error);

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
