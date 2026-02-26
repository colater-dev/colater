/**
 * MCP API Route: Validate Brand Voice
 * POST /api/mcp/voice/validate
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireMCPAuth } from '@/lib/mcp-auth';
import { adminDb } from '@/firebase/server';
import { z } from 'zod';
import { ai } from '@/ai/genkit';

const VoiceValidateRequestSchema = z.object({
  brandId: z.string(),
  text: z.string().max(5000),
  context: z.string().optional(),
  strictness: z.number().min(0).max(1).optional().default(0.7),
});

const VoiceValidationOutputSchema = z.object({
  score: z.number(),
  onBrand: z.boolean(),
  analysis: z.object({
    toneMatch: z.number(),
    vocabularyMatch: z.number(),
    structureMatch: z.number(),
  }),
  issues: z.array(
    z.object({
      type: z.enum(['avoid_word', 'off_tone', 'jargon', 'complexity']),
      text: z.string(),
      reason: z.string(),
      suggestion: z.string(),
      severity: z.enum(['low', 'medium', 'high']),
    })
  ),
  rewrite: z.string().optional(),
  highlights: z.object({
    good: z.array(z.string()),
    bad: z.array(z.string()),
  }),
});

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const userId = await requireMCPAuth();

    // Parse request body
    const body = await request.json();
    const { brandId, text, context, strictness } = VoiceValidateRequestSchema.parse(body);

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

    // Build AI prompt for voice validation
    const prompt = `
You are a brand voice expert. Analyze the following text against the brand voice guidelines.

Brand: ${brandData.latestName}
Brand Pitch: ${brandData.latestElevatorPitch}
Target Audience: ${brandData.latestAudience}
Desirable Cues: ${brandData.latestDesirableCues}
Undesirable Cues: ${brandData.latestUndesirableCues}
Context: ${context || 'general'}
Strictness: ${strictness}

Text to Analyze:
"""
${text}
"""

Analyze this text and provide:
1. Overall score (0-1) for how well it matches the brand voice
2. Whether it's "on brand" (true/false)
3. Detailed analysis of tone, vocabulary, and structure match
4. Specific issues with problematic text, reasons, and suggestions
5. Highlights of good and bad phrases
6. An optional rewrite that better matches the brand voice

Be specific and actionable in your feedback.
    `.trim();

    const response = await ai.generate({
      model: 'googleai/gemini-3-flash-preview',
      prompt,
      output: { format: 'json', schema: VoiceValidationOutputSchema },
    });

    if (!response.output) {
      throw new Error('Failed to validate brand voice');
    }

    return NextResponse.json(response.output);
  } catch (error: unknown) {
    console.error('MCP Voice Validate Error:', error);

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
