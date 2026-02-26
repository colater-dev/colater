/**
 * Logo Analysis Utility
 *
 * Analyzes logo images and wordmarks to calculate optimal visual balance
 * between logo icon and text for professional brand presentations.
 */

export interface LogoAnalysisResult {
    visualWeight: number;      // 0-1: overall visual presence
    density: number;           // 0-1: how much of the space is filled
    contrast: number;          // 0-1: average luminance contrast
    complexity: number;        // 0-1: edge complexity (detail level)
    aspectRatio: number;       // width / height
    dominantOrientation: 'horizontal' | 'vertical' | 'square';
    boundingBox: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
}

export interface WordmarkAnalysisResult {
    visualWeight: number;      // 0-1: overall text presence
    characterCount: number;
    estimatedWidth: number;    // in pixels at base size
    estimatedHeight: number;   // in pixels at base size
    fontWeight: number;        // 0.7-1.5: light to bold
    hasDescenders: boolean;    // g, j, p, q, y
    hasAscenders: boolean;     // b, d, f, h, k, l, t
}

export interface BalanceResult {
    logoScale: number;         // 0.5-2.0: multiplier for logo size
    wordmarkScale: number;     // 0.5-2.0: multiplier for text size
    suggestedGap: number;      // gap in pixels (at base size)
    confidence: number;        // 0-1: how confident we are in this result
    reasoning: string;         // explanation of the calculation
}

/**
 * Load an image from URL and extract ImageData for analysis
 */
export async function loadImageData(imageUrl: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';

        img.onload = () => {
            // Create canvas to extract image data
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Failed to get canvas context'));
                return;
            }

            ctx.drawImage(img, 0, 0);

            try {
                const imageData = ctx.getImageData(0, 0, img.width, img.height);
                resolve(imageData);
            } catch (error) {
                reject(error);
            }
        };

        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = imageUrl;
    });
}

/**
 * Analyze logo image for visual weight and characteristics
 */
export function analyzeLogoImage(imageData: ImageData): LogoAnalysisResult {
    const { width, height, data } = imageData;
    const totalPixels = width * height;

    // Track metrics
    let filledPixels = 0;
    let totalLuminance = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    // Edge detection arrays
    const edges: boolean[] = new Array(totalPixels).fill(false);

    // First pass: analyze pixel data
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const alpha = data[idx + 3];

            if (alpha > 30) { // Consider semi-transparent pixels
                filledPixels++;

                // Calculate luminance (perceived brightness)
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
                totalLuminance += luminance;

                // Track bounding box
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    // Second pass: edge detection (simplified Sobel)
    let edgePixels = 0;
    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;
            const alpha = data[idx + 3];

            if (alpha > 30) {
                // Check neighbors for alpha differences (edges)
                const neighbors = [
                    data[((y - 1) * width + x) * 4 + 3],     // top
                    data[((y + 1) * width + x) * 4 + 3],     // bottom
                    data[(y * width + (x - 1)) * 4 + 3],     // left
                    data[(y * width + (x + 1)) * 4 + 3],     // right
                ];

                const avgNeighborAlpha = neighbors.reduce((a, b) => a + b, 0) / 4;
                const alphaDiff = Math.abs(alpha - avgNeighborAlpha);

                if (alphaDiff > 50) {
                    edgePixels++;
                    edges[(y * width + x)] = true;
                }
            }
        }
    }

    // Calculate metrics
    const density = filledPixels / totalPixels;
    const avgLuminance = filledPixels > 0 ? totalLuminance / filledPixels : 128;
    const contrast = avgLuminance / 255;
    const complexity = filledPixels > 0 ? edgePixels / filledPixels : 0;

    // Bounding box dimensions
    const boundingWidth = maxX - minX + 1;
    const boundingHeight = maxY - minY + 1;
    const aspectRatio = boundingWidth / boundingHeight;

    // Determine orientation
    let dominantOrientation: 'horizontal' | 'vertical' | 'square';
    if (aspectRatio > 1.3) dominantOrientation = 'horizontal';
    else if (aspectRatio < 0.7) dominantOrientation = 'vertical';
    else dominantOrientation = 'square';

    // Calculate visual weight (weighted formula)
    // Dense logos feel heavier
    // High contrast (very light or very dark) feels stronger
    // Complex logos with lots of edges feel heavier
    const contrastFactor = Math.abs(contrast - 0.5) * 2; // 0-1, peaks at extreme contrast
    const visualWeight = (
        density * 0.45 +           // Density is most important
        contrastFactor * 0.30 +    // Contrast matters
        complexity * 0.25          // Complexity adds weight
    );

    return {
        visualWeight,
        density,
        contrast,
        complexity,
        aspectRatio,
        dominantOrientation,
        boundingBox: {
            x: minX,
            y: minY,
            width: boundingWidth,
            height: boundingHeight,
        },
    };
}

/**
 * Analyze wordmark for visual weight
 */
export function analyzeWordmark(
    text: string,
    font: string,
    baseSize: number = 100
): WordmarkAnalysisResult {
    // Create canvas for text measurement
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        throw new Error('Failed to get canvas context for text measurement');
    }

    // Set font
    ctx.font = `${baseSize}px ${font}`;

    // Measure text
    const metrics = ctx.measureText(text);
    const estimatedWidth = metrics.width;

    // Estimate height (approximation based on font size)
    const estimatedHeight = baseSize * 1.2; // Account for ascenders/descenders

    // Analyze characters
    const characterCount = text.length;
    const descenders = ['g', 'j', 'p', 'q', 'y'];
    const ascenders = ['b', 'd', 'f', 'h', 'k', 'l', 't'];

    const hasDescenders = text.split('').some(char => descenders.includes(char.toLowerCase()));
    const hasAscenders = text.split('').some(char => ascenders.includes(char.toLowerCase()));

    // Estimate font weight from font family name
    const fontLower = font.toLowerCase();
    let fontWeight = 1.0;

    if (fontLower.includes('thin') || fontLower.includes('hairline')) fontWeight = 0.7;
    else if (fontLower.includes('light')) fontWeight = 0.85;
    else if (fontLower.includes('medium')) fontWeight = 1.0;
    else if (fontLower.includes('semibold')) fontWeight = 1.15;
    else if (fontLower.includes('bold')) fontWeight = 1.3;
    else if (fontLower.includes('black') || fontLower.includes('heavy')) fontWeight = 1.5;

    // Calculate visual weight
    // Longer words feel heavier
    const lengthFactor = Math.min(characterCount / 8, 1.5);

    // Font weight is direct factor
    // Width relative to character count (some fonts are wider)
    const widthPerChar = estimatedWidth / characterCount;
    const widthFactor = Math.min(widthPerChar / baseSize, 1.2);

    const visualWeight = (
        fontWeight * 0.5 +
        lengthFactor * 0.3 +
        widthFactor * 0.2
    ) / 2; // Normalize to roughly 0-1 range

    return {
        visualWeight,
        characterCount,
        estimatedWidth,
        estimatedHeight,
        fontWeight,
        hasDescenders,
        hasAscenders,
    };
}

/**
 * Calculate optimal balance between logo and wordmark
 */
export function calculateBalance(
    logoAnalysis: LogoAnalysisResult,
    wordmarkAnalysis: WordmarkAnalysisResult
): BalanceResult {
    const logoWeight = logoAnalysis.visualWeight;
    const wordmarkWeight = wordmarkAnalysis.visualWeight;

    // Target: achieve visual equilibrium
    const currentRatio = logoWeight / wordmarkWeight;

    let logoScale = 1.0;
    let wordmarkScale = 1.0;
    let reasoning = '';

    // Adjust based on weight ratio
    if (currentRatio > 1.3) {
        // Logo is significantly heavier - reduce logo OR increase text
        logoScale = Math.max(0.6, 1 / Math.sqrt(currentRatio));
        wordmarkScale = Math.min(1.4, Math.sqrt(currentRatio * 0.8));
        reasoning = 'Logo appears visually heavier than text. Reducing logo size and/or increasing text size for balance.';
    } else if (currentRatio < 0.7) {
        // Wordmark is heavier - increase logo OR reduce text
        logoScale = Math.min(1.6, Math.sqrt(1 / currentRatio));
        wordmarkScale = Math.max(0.7, Math.sqrt(currentRatio));
        reasoning = 'Text appears visually heavier than logo. Increasing logo size and/or reducing text size for balance.';
    } else {
        // Reasonably balanced
        reasoning = 'Logo and text are reasonably balanced. Minor adjustments for optical refinement.';
        logoScale = 1.0 + (1.0 - currentRatio) * 0.3;
        wordmarkScale = 1.0 - (1.0 - currentRatio) * 0.2;
    }

    // Adjust for aspect ratio - horizontal logos need more space
    if (logoAnalysis.dominantOrientation === 'horizontal') {
        logoScale *= 0.9; // Slightly smaller to fit better
        reasoning += ' Horizontal logo adjusted for better proportions.';
    } else if (logoAnalysis.dominantOrientation === 'vertical') {
        logoScale *= 1.1; // Can be slightly larger
        reasoning += ' Vertical logo adjusted for better proportions.';
    }

    // Adjust for text length - very long text needs to be smaller
    if (wordmarkAnalysis.characterCount > 15) {
        wordmarkScale *= 0.85;
        reasoning += ' Long brand name reduced for readability.';
    } else if (wordmarkAnalysis.characterCount < 5) {
        wordmarkScale *= 1.15;
        reasoning += ' Short brand name increased for presence.';
    }

    // Calculate suggested gap
    // More visual weight = needs more breathing room
    const totalWeight = logoWeight + wordmarkWeight;
    const baseGap = 40; // pixels at 100px base size
    const suggestedGap = Math.max(20, Math.min(80, baseGap * totalWeight));

    // Calculate confidence
    // Higher confidence when weights are moderate (not extreme)
    const weightBalance = Math.min(logoWeight, wordmarkWeight) / Math.max(logoWeight, wordmarkWeight);
    const extremityFactor = 1 - Math.abs(0.5 - totalWeight / 2);
    const confidence = (weightBalance * 0.6 + extremityFactor * 0.4);

    // Clamp values to reasonable ranges
    logoScale = Math.max(0.5, Math.min(2.0, logoScale));
    wordmarkScale = Math.max(0.5, Math.min(2.0, wordmarkScale));

    return {
        logoScale,
        wordmarkScale,
        suggestedGap,
        confidence: Math.max(0.4, Math.min(1.0, confidence)), // At least 40% confidence
        reasoning,
    };
}

/**
 * High-level function to analyze and calculate optimal balance
 */
export async function analyzeLogoWordmarkBalance(
    logoUrl: string,
    brandName: string,
    font: string,
    baseSize: number = 100
): Promise<{
    logoAnalysis: LogoAnalysisResult;
    wordmarkAnalysis: WordmarkAnalysisResult;
    balance: BalanceResult;
}> {
    // Load and analyze logo
    const imageData = await loadImageData(logoUrl);
    const logoAnalysis = analyzeLogoImage(imageData);

    // Analyze wordmark
    const wordmarkAnalysis = analyzeWordmark(brandName, font, baseSize);

    // Calculate balance
    const balance = calculateBalance(logoAnalysis, wordmarkAnalysis);

    return {
        logoAnalysis,
        wordmarkAnalysis,
        balance,
    };
}

/**
 * Convert balance result to display settings format
 * Maps the calculated scales to the existing verticalLogoTextBalance (0-100)
 */
export function balanceToDisplaySettings(balance: BalanceResult): {
    verticalLogoTextBalance: number;
    horizontalLogoTextGap: number;
    verticalLogoTextGap: number;
} {
    // The balance value of 50 means equal size
    // Lower values = bigger logo, smaller text
    // Higher values = smaller logo, bigger text

    // Convert logoScale and wordmarkScale to a single 0-100 balance value
    // When logoScale is high and wordmarkScale is low → balance should be low (logo dominates)
    // When logoScale is low and wordmarkScale is high → balance should be high (text dominates)

    const ratio = balance.wordmarkScale / balance.logoScale;
    // Map ratio to 0-100 scale
    // ratio of 0.5 (text half of logo) → balance of 25
    // ratio of 1.0 (equal) → balance of 50
    // ratio of 2.0 (text double logo) → balance of 75

    const balanceValue = 50 * (1 + Math.log2(ratio));

    return {
        verticalLogoTextBalance: Math.max(10, Math.min(90, balanceValue)),
        horizontalLogoTextGap: balance.suggestedGap,
        verticalLogoTextGap: balance.suggestedGap * 1.2, // Slightly more for vertical
    };
}
