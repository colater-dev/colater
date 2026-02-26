'use server';

import { fal } from "@fal-ai/client";
import { z } from 'zod';
import { Buffer } from 'buffer';

const VectoriseLogoInputSchema = z.object({
    logoUrl: z.string().describe('The URL of the logo to be vectorized.'),
});
export type VectoriseLogoInput = z.infer<typeof VectoriseLogoInputSchema>;

export type VectoriseLogoOutput = {
    vectorLogoUrl: string;
};

export async function vectoriseLogo(
    input: VectoriseLogoInput
): Promise<VectoriseLogoOutput> {
    const parsed = VectoriseLogoInputSchema.parse(input);

    if (!process.env.FAL_KEY) {
        throw new Error('FAL_KEY environment variable is not set');
    }

    fal.config({
        credentials: process.env.FAL_KEY.trim(),
    });

    console.log('[vectorise-logo] Input details:', {
        logoUrl: parsed.logoUrl.substring(0, 50) + '...',
    });

    try {
        const result = await fal.subscribe("fal-ai/recraft/vectorize", {
            input: {
                image_url: parsed.logoUrl,
            },
            logs: true,
            onQueueUpdate: (update) => {
                if (update.status === "IN_PROGRESS") {
                    update.logs?.map((log) => log.message).forEach(console.log);
                }
            },
        });

        console.log('[vectorise-logo] Generation completed');

        // The output schema says:
        // "image": { "file_size": ..., "file_name": ..., "content_type": ..., "url": ... }
        const imageObj = result.data?.image;
        if (!imageObj || !imageObj.url) {
            throw new Error('Fal did not return an image URL.');
        }

        const vectorUrl = imageObj.url;
        console.log('[vectorise-logo] Vector URL received:', vectorUrl);

        // Fetch the SVG content to convert to data URI or just return the URL?
        // The user wants an SVG version.
        // Usually, for SVGs, it's nice to have the content or a data URI.
        // Let's fetch it and convert to data URI to be consistent with other flows and avoid CORS issues later if we try to display it directly from Fal's CDN (though Fal's CDN is usually fine).
        // Also, we might want to store it in our own storage later, but the action returns a string.

        const response = await fetch(vectorUrl);
        if (!response.ok) {
            throw new Error(`Failed to fetch generated vector: ${response.statusText}`);
        }

        const buffer = await response.arrayBuffer();
        const contentType = response.headers.get('content-type') || 'image/svg+xml';
        const base64 = Buffer.from(buffer).toString('base64');
        const dataUri = `data:${contentType};base64,${base64}`;

        console.log('[vectorise-logo] Vector converted to data URI, size:', buffer.byteLength, 'bytes');
        return { vectorLogoUrl: dataUri };

    } catch (error: unknown) {
        console.error('[vectorise-logo] Error:', error);
        const err = error as { body?: unknown; message?: string };
        const errorDetails = err.body ? JSON.stringify(err.body) : err.message;
        throw new Error(`Fal vectorization failed: ${errorDetails}`);
    }
}
