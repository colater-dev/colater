import { describe, it, expect } from 'vitest';
import {
  analyzeLogoImage,
  calculateBalance,
  balanceToDisplaySettings,
  type LogoAnalysisResult,
  type WordmarkAnalysisResult,
} from '../logo-analysis';

/**
 * Helper to create a mock ImageData object.
 * Fills all pixels with the given RGBA values.
 */
function createImageData(
  width: number,
  height: number,
  fill: [number, number, number, number] = [0, 0, 0, 0]
): ImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < width * height; i++) {
    data[i * 4] = fill[0];
    data[i * 4 + 1] = fill[1];
    data[i * 4 + 2] = fill[2];
    data[i * 4 + 3] = fill[3];
  }
  return { data, width, height, colorSpace: 'srgb' } as ImageData;
}

/**
 * Helper to set a specific pixel's RGBA values in ImageData.
 */
function setPixel(
  imageData: ImageData,
  x: number,
  y: number,
  r: number,
  g: number,
  b: number,
  a: number
) {
  const idx = (y * imageData.width + x) * 4;
  imageData.data[idx] = r;
  imageData.data[idx + 1] = g;
  imageData.data[idx + 2] = b;
  imageData.data[idx + 3] = a;
}

describe('analyzeLogoImage', () => {
  it('reports zero density for a fully transparent image', () => {
    const imageData = createImageData(10, 10, [0, 0, 0, 0]);
    const result = analyzeLogoImage(imageData);
    expect(result.density).toBe(0);
    expect(result.visualWeight).toBeCloseTo(0, 1);
  });

  it('reports full density for a fully opaque image', () => {
    const imageData = createImageData(10, 10, [128, 128, 128, 255]);
    const result = analyzeLogoImage(imageData);
    expect(result.density).toBe(1);
  });

  it('calculates correct aspect ratio', () => {
    // Create a 20x10 image with content filling the entire area
    const imageData = createImageData(20, 10, [0, 0, 0, 255]);
    const result = analyzeLogoImage(imageData);
    expect(result.aspectRatio).toBe(2);
    expect(result.dominantOrientation).toBe('horizontal');
  });

  it('detects vertical orientation', () => {
    // Create a 10x20 transparent image with a vertical strip of content
    const imageData = createImageData(10, 20, [0, 0, 0, 0]);
    // Draw a 2-pixel wide vertical line in the center
    for (let y = 0; y < 20; y++) {
      setPixel(imageData, 5, y, 0, 0, 0, 255);
      setPixel(imageData, 6, y, 0, 0, 0, 255);
    }
    const result = analyzeLogoImage(imageData);
    expect(result.dominantOrientation).toBe('vertical');
  });

  it('detects square orientation for equal-sized content', () => {
    const imageData = createImageData(10, 10, [0, 0, 0, 255]);
    const result = analyzeLogoImage(imageData);
    expect(result.dominantOrientation).toBe('square');
  });

  it('reports bounding box of content pixels', () => {
    const imageData = createImageData(20, 20, [0, 0, 0, 0]);
    // Place a block of opaque pixels from (5,5) to (14,14)
    for (let y = 5; y <= 14; y++) {
      for (let x = 5; x <= 14; x++) {
        setPixel(imageData, x, y, 128, 128, 128, 255);
      }
    }
    const result = analyzeLogoImage(imageData);
    expect(result.boundingBox).toEqual({ x: 5, y: 5, width: 10, height: 10 });
  });

  it('high contrast content has higher visual weight than mid-gray', () => {
    // Black content (high contrast from mid-gray)
    const darkImage = createImageData(10, 10, [0, 0, 0, 255]);
    const darkResult = analyzeLogoImage(darkImage);

    // Mid-gray content (low contrast, near 0.5)
    const grayImage = createImageData(10, 10, [128, 128, 128, 255]);
    const grayResult = analyzeLogoImage(grayImage);

    // Both have density=1 and same complexity, but dark has higher contrastFactor
    expect(darkResult.visualWeight).toBeGreaterThan(grayResult.visualWeight);
  });

  it('visualWeight stays within 0-1 range', () => {
    const imageData = createImageData(10, 10, [255, 255, 255, 255]);
    const result = analyzeLogoImage(imageData);
    expect(result.visualWeight).toBeGreaterThanOrEqual(0);
    expect(result.visualWeight).toBeLessThanOrEqual(1);
  });
});

describe('calculateBalance', () => {
  function makeLogo(overrides: Partial<LogoAnalysisResult> = {}): LogoAnalysisResult {
    return {
      visualWeight: 0.5,
      density: 0.5,
      contrast: 0.5,
      complexity: 0.1,
      aspectRatio: 1.0,
      dominantOrientation: 'square',
      boundingBox: { x: 0, y: 0, width: 100, height: 100 },
      ...overrides,
    };
  }

  function makeWordmark(overrides: Partial<WordmarkAnalysisResult> = {}): WordmarkAnalysisResult {
    return {
      visualWeight: 0.5,
      characterCount: 8,
      estimatedWidth: 400,
      estimatedHeight: 120,
      fontWeight: 1.0,
      hasDescenders: false,
      hasAscenders: true,
      ...overrides,
    };
  }

  it('returns balanced scales when weights are equal', () => {
    const balance = calculateBalance(makeLogo(), makeWordmark());
    // With equal weights ratio is 1.0, which falls in the "balanced" branch
    expect(balance.logoScale).toBeCloseTo(1.0, 1);
    expect(balance.wordmarkScale).toBeCloseTo(1.0, 1);
    expect(balance.reasoning).toContain('reasonably balanced');
  });

  it('reduces logo scale when logo is much heavier', () => {
    const balance = calculateBalance(
      makeLogo({ visualWeight: 0.9 }),
      makeWordmark({ visualWeight: 0.3 })
    );
    expect(balance.logoScale).toBeLessThan(1.0);
    expect(balance.reasoning).toContain('Logo appears visually heavier');
  });

  it('increases logo scale when wordmark is much heavier', () => {
    const balance = calculateBalance(
      makeLogo({ visualWeight: 0.2 }),
      makeWordmark({ visualWeight: 0.8 })
    );
    expect(balance.logoScale).toBeGreaterThan(1.0);
    expect(balance.reasoning).toContain('Text appears visually heavier');
  });

  it('adjusts for horizontal logo orientation', () => {
    const squareBalance = calculateBalance(
      makeLogo({ dominantOrientation: 'square' }),
      makeWordmark()
    );
    const horizontalBalance = calculateBalance(
      makeLogo({ dominantOrientation: 'horizontal' }),
      makeWordmark()
    );
    expect(horizontalBalance.logoScale).toBeLessThan(squareBalance.logoScale);
    expect(horizontalBalance.reasoning).toContain('Horizontal logo');
  });

  it('adjusts for vertical logo orientation', () => {
    const squareBalance = calculateBalance(
      makeLogo({ dominantOrientation: 'square' }),
      makeWordmark()
    );
    const verticalBalance = calculateBalance(
      makeLogo({ dominantOrientation: 'vertical' }),
      makeWordmark()
    );
    expect(verticalBalance.logoScale).toBeGreaterThan(squareBalance.logoScale);
    expect(verticalBalance.reasoning).toContain('Vertical logo');
  });

  it('reduces wordmark scale for long brand names', () => {
    const shortBalance = calculateBalance(makeLogo(), makeWordmark({ characterCount: 8 }));
    const longBalance = calculateBalance(makeLogo(), makeWordmark({ characterCount: 20 }));
    expect(longBalance.wordmarkScale).toBeLessThan(shortBalance.wordmarkScale);
    expect(longBalance.reasoning).toContain('Long brand name');
  });

  it('increases wordmark scale for short brand names', () => {
    const normalBalance = calculateBalance(makeLogo(), makeWordmark({ characterCount: 8 }));
    const shortBalance = calculateBalance(makeLogo(), makeWordmark({ characterCount: 3 }));
    expect(shortBalance.wordmarkScale).toBeGreaterThan(normalBalance.wordmarkScale);
    expect(shortBalance.reasoning).toContain('Short brand name');
  });

  it('clamps scales to valid ranges', () => {
    const balance = calculateBalance(
      makeLogo({ visualWeight: 0.01 }),
      makeWordmark({ visualWeight: 0.99 })
    );
    expect(balance.logoScale).toBeGreaterThanOrEqual(0.5);
    expect(balance.logoScale).toBeLessThanOrEqual(2.0);
    expect(balance.wordmarkScale).toBeGreaterThanOrEqual(0.5);
    expect(balance.wordmarkScale).toBeLessThanOrEqual(2.0);
  });

  it('confidence is at least 0.4', () => {
    const balance = calculateBalance(
      makeLogo({ visualWeight: 0.01 }),
      makeWordmark({ visualWeight: 0.99 })
    );
    expect(balance.confidence).toBeGreaterThanOrEqual(0.4);
  });

  it('confidence does not exceed 1.0', () => {
    const balance = calculateBalance(makeLogo(), makeWordmark());
    expect(balance.confidence).toBeLessThanOrEqual(1.0);
  });

  it('suggestedGap is clamped between 20 and 80', () => {
    const tinyBalance = calculateBalance(
      makeLogo({ visualWeight: 0.01 }),
      makeWordmark({ visualWeight: 0.01 })
    );
    expect(tinyBalance.suggestedGap).toBeGreaterThanOrEqual(20);

    const hugeBalance = calculateBalance(
      makeLogo({ visualWeight: 1.0 }),
      makeWordmark({ visualWeight: 1.0 })
    );
    expect(hugeBalance.suggestedGap).toBeLessThanOrEqual(80);
  });
});

describe('balanceToDisplaySettings', () => {
  it('returns 50 balance when scales are equal', () => {
    const settings = balanceToDisplaySettings({
      logoScale: 1.0,
      wordmarkScale: 1.0,
      suggestedGap: 40,
      confidence: 0.8,
      reasoning: '',
    });
    expect(settings.verticalLogoTextBalance).toBeCloseTo(50, 0);
  });

  it('returns lower balance when logo dominates', () => {
    const settings = balanceToDisplaySettings({
      logoScale: 1.5,
      wordmarkScale: 0.75,
      suggestedGap: 40,
      confidence: 0.8,
      reasoning: '',
    });
    expect(settings.verticalLogoTextBalance).toBeLessThan(50);
  });

  it('returns higher balance when text dominates', () => {
    const settings = balanceToDisplaySettings({
      logoScale: 0.75,
      wordmarkScale: 1.5,
      suggestedGap: 40,
      confidence: 0.8,
      reasoning: '',
    });
    expect(settings.verticalLogoTextBalance).toBeGreaterThan(50);
  });

  it('clamps balance to 10-90 range', () => {
    const extremeLogo = balanceToDisplaySettings({
      logoScale: 2.0,
      wordmarkScale: 0.5,
      suggestedGap: 40,
      confidence: 0.8,
      reasoning: '',
    });
    expect(extremeLogo.verticalLogoTextBalance).toBeGreaterThanOrEqual(10);

    const extremeText = balanceToDisplaySettings({
      logoScale: 0.5,
      wordmarkScale: 2.0,
      suggestedGap: 40,
      confidence: 0.8,
      reasoning: '',
    });
    expect(extremeText.verticalLogoTextBalance).toBeLessThanOrEqual(90);
  });

  it('vertical gap is 1.2x the horizontal gap', () => {
    const settings = balanceToDisplaySettings({
      logoScale: 1.0,
      wordmarkScale: 1.0,
      suggestedGap: 50,
      confidence: 0.8,
      reasoning: '',
    });
    expect(settings.verticalLogoTextGap).toBeCloseTo(50 * 1.2);
    expect(settings.horizontalLogoTextGap).toBe(50);
  });
});
