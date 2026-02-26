/**
 * MCP API Route: Get Brand Assets
 * POST /api/mcp/assets/get
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireMCPAuth } from '@/lib/mcp-auth';
import { adminDb } from '@/firebase/server';
import { z } from 'zod';

const AssetsGetRequestSchema = z.object({
  brandId: z.string(),
  assetTypes: z.array(z.enum(['logo', 'colors', 'fonts', 'mockups'])),
  format: z
    .object({
      logo: z.enum(['url', 'svg', 'png', 'data_uri']).optional(),
      colors: z.enum(['hex', 'rgb', 'hsl', 'tailwind', 'css', 'figma']).optional(),
      fonts: z.enum(['names', 'google_fonts_url', 'css_imports']).optional(),
    })
    .optional(),
});

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate
    const userId = await requireMCPAuth();

    // Parse request body
    const body = await request.json();
    const { brandId, assetTypes, format } = AssetsGetRequestSchema.parse(body);

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
    const response: Record<string, unknown> = {};

    // Get logos
    if (assetTypes.includes('logo')) {
      const logosSnapshot = await adminDb
        .collection(`users/${userId}/brands/${brandId}/logoGenerations`)
        .orderBy('createdAt', 'desc')
        .limit(5)
        .get();

      const logos = logosSnapshot.docs.map((doc: FirebaseFirestore.QueryDocumentSnapshot) => doc.data());
      const primaryLogo = logos[0];

      response.logos = {
        primary: {
          url: brandData.logoUrl || primaryLogo?.logoUrl || '',
          dimensions: { width: 512, height: 512 },
        },
        variations: logos.map((logo: Record<string, unknown>, index: number) => ({
          id: index.toString(),
          type: index === 0 ? 'color' : 'bw',
          url: logo.logoUrl,
        })),
      };
    }

    // Get colors
    if (assetTypes.includes('colors')) {
      const logosSnapshot = await adminDb
        .collection(`users/${userId}/brands/${brandId}/logoGenerations`)
        .orderBy('createdAt', 'desc')
        .limit(1)
        .get();

      const primaryLogo = logosSnapshot.docs[0]?.data();
      const colorVersions = primaryLogo?.colorVersions || [];
      const palette = colorVersions.length > 0 ? colorVersions[0].palette : ['#000000'];

      const colorFormat = format?.colors || 'hex';
      const colorsData: Record<string, unknown> = {
        usage: palette.map((hex: string, index: number) => ({
          color: hex,
          name: `Color ${index + 1}`,
          usage: index === 0 ? 'Primary brand color' : 'Accent color',
        })),
      };

      if (colorFormat === 'hex') {
        colorsData.hex = palette;
      } else if (colorFormat === 'rgb') {
        colorsData.rgb = palette.map((hex: string) => hexToRgb(hex));
      } else if (colorFormat === 'hsl') {
        colorsData.hsl = palette.map((hex: string) => {
          const rgb = hexToRgb(hex);
          return rgbToHsl(rgb.r, rgb.g, rgb.b);
        });
      } else if (colorFormat === 'tailwind') {
        colorsData.tailwind = palette.reduce((acc: Record<string, string>, hex: string, index: number) => {
          acc[`brand-${index === 0 ? 'primary' : `accent-${index}`}`] = hex;
          return acc;
        }, {});
      } else if (colorFormat === 'css') {
        colorsData.css = `:root {\n${palette
          .map((hex: string, index: number) => `  --brand-${index === 0 ? 'primary' : `accent-${index}`}: ${hex};`)
          .join('\n')}\n}`;
      } else if (colorFormat === 'figma') {
        colorsData.figma = palette.reduce((acc: Record<string, { r: number; g: number; b: number; a: number }>, hex: string, index: number) => {
          const rgb = hexToRgb(hex);
          acc[`brand-${index === 0 ? 'primary' : `accent-${index}`}`] = {
            r: rgb.r / 255,
            g: rgb.g / 255,
            b: rgb.b / 255,
            a: 1,
          };
          return acc;
        }, {});
      }

      response.colors = colorsData;
    }

    // Get fonts
    if (assetTypes.includes('fonts')) {
      const fontName = brandData.font || 'Inter';
      const fontFormat = format?.fonts || 'names';

      const primary: Record<string, unknown> = {
        name: fontName,
        weights: [400, 600, 700],
      };

      if (fontFormat === 'google_fonts_url') {
        primary.googleFontsUrl = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;600;700&display=swap`;
      } else if (fontFormat === 'css_imports') {
        primary.cssImport = `@import url('https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}:wght@400;600;700&display=swap');`;
      }

      response.fonts = {
        primary,
        fallbacks: ['system-ui', 'sans-serif'],
      };
    }

    return NextResponse.json(response);
  } catch (error: unknown) {
    console.error('MCP Assets Get Error:', error);

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
