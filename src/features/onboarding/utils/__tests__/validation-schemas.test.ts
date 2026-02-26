import { describe, it, expect } from 'vitest';
import {
  nameStepSchema,
  pitchStepSchema,
  audienceStepSchema,
  styleStepSchema,
  onboardingSchema,
} from '../validation-schemas';

describe('nameStepSchema', () => {
  it('accepts a valid brand name', () => {
    expect(nameStepSchema.safeParse({ brandName: 'Acme Corp' }).success).toBe(true);
  });

  it('accepts names with hyphens and ampersands', () => {
    expect(nameStepSchema.safeParse({ brandName: 'Ben & Jerry' }).success).toBe(true);
    expect(nameStepSchema.safeParse({ brandName: 'Coca-Cola' }).success).toBe(true);
  });

  it('accepts names with numbers', () => {
    expect(nameStepSchema.safeParse({ brandName: 'Level 5' }).success).toBe(true);
  });

  it('rejects empty string', () => {
    const result = nameStepSchema.safeParse({ brandName: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('brand name');
    }
  });

  it('rejects names over 50 characters', () => {
    const result = nameStepSchema.safeParse({ brandName: 'A'.repeat(51) });
    expect(result.success).toBe(false);
  });

  it('accepts names at exactly 50 characters', () => {
    expect(nameStepSchema.safeParse({ brandName: 'A'.repeat(50) }).success).toBe(true);
  });

  it('rejects special characters', () => {
    expect(nameStepSchema.safeParse({ brandName: 'Acme!' }).success).toBe(false);
    expect(nameStepSchema.safeParse({ brandName: 'Acme@Corp' }).success).toBe(false);
    expect(nameStepSchema.safeParse({ brandName: 'Acme#1' }).success).toBe(false);
  });
});

describe('pitchStepSchema', () => {
  it('accepts a valid elevator pitch', () => {
    const result = pitchStepSchema.safeParse({
      elevatorPitch: 'We make the best widgets for modern teams',
    });
    expect(result.success).toBe(true);
  });

  it('rejects pitches under 10 characters', () => {
    const result = pitchStepSchema.safeParse({ elevatorPitch: 'Short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('10 characters');
    }
  });

  it('accepts pitch at exactly 10 characters', () => {
    expect(pitchStepSchema.safeParse({ elevatorPitch: '1234567890' }).success).toBe(true);
  });

  it('rejects pitches over 200 characters', () => {
    const result = pitchStepSchema.safeParse({ elevatorPitch: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });

  it('accepts pitch at exactly 200 characters', () => {
    expect(pitchStepSchema.safeParse({ elevatorPitch: 'A'.repeat(200) }).success).toBe(true);
  });
});

describe('audienceStepSchema', () => {
  it('accepts a valid audience description', () => {
    const result = audienceStepSchema.safeParse({
      targetAudience: 'Small business owners aged 25-45',
    });
    expect(result.success).toBe(true);
  });

  it('rejects audiences under 5 characters', () => {
    const result = audienceStepSchema.safeParse({ targetAudience: 'All' });
    expect(result.success).toBe(false);
  });

  it('accepts audience at exactly 5 characters', () => {
    expect(audienceStepSchema.safeParse({ targetAudience: 'Teens' }).success).toBe(true);
  });

  it('rejects audiences over 200 characters', () => {
    const result = audienceStepSchema.safeParse({ targetAudience: 'A'.repeat(201) });
    expect(result.success).toBe(false);
  });
});

describe('styleStepSchema', () => {
  it('accepts valid style selections', () => {
    const result = styleStepSchema.safeParse({
      desirableStyles: ['Modern', 'Minimal'],
      undesirableStyles: ['Vintage'],
    });
    expect(result.success).toBe(true);
  });

  it('requires at least one desirable style', () => {
    const result = styleStepSchema.safeParse({
      desirableStyles: [],
      undesirableStyles: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toContain('at least one');
    }
  });

  it('allows empty undesirable styles', () => {
    const result = styleStepSchema.safeParse({
      desirableStyles: ['Bold'],
      undesirableStyles: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 5 desirable styles', () => {
    const result = styleStepSchema.safeParse({
      desirableStyles: ['A', 'B', 'C', 'D', 'E', 'F'],
      undesirableStyles: [],
    });
    expect(result.success).toBe(false);
  });

  it('accepts exactly 5 desirable styles', () => {
    const result = styleStepSchema.safeParse({
      desirableStyles: ['A', 'B', 'C', 'D', 'E'],
      undesirableStyles: [],
    });
    expect(result.success).toBe(true);
  });

  it('rejects more than 5 undesirable styles', () => {
    const result = styleStepSchema.safeParse({
      desirableStyles: ['A'],
      undesirableStyles: ['A', 'B', 'C', 'D', 'E', 'F'],
    });
    expect(result.success).toBe(false);
  });
});

describe('onboardingSchema (merged)', () => {
  const validData = {
    brandName: 'Colater',
    elevatorPitch: 'AI-powered brand identity design platform',
    targetAudience: 'Startup founders and designers',
    desirableStyles: ['Modern', 'Clean'],
    undesirableStyles: ['Grunge'],
  };

  it('accepts complete valid data', () => {
    expect(onboardingSchema.safeParse(validData).success).toBe(true);
  });

  it('rejects when brand name is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { brandName, ...rest } = validData;
    expect(onboardingSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects when elevator pitch is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { elevatorPitch, ...rest } = validData;
    expect(onboardingSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects when target audience is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { targetAudience, ...rest } = validData;
    expect(onboardingSchema.safeParse(rest).success).toBe(false);
  });

  it('rejects when desirable styles is missing', () => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { desirableStyles, ...rest } = validData;
    expect(onboardingSchema.safeParse(rest).success).toBe(false);
  });

  it('collects errors from multiple fields at once', () => {
    const result = onboardingSchema.safeParse({
      brandName: '',
      elevatorPitch: 'Short',
      targetAudience: 'No',
      desirableStyles: [],
      undesirableStyles: [],
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      // Should have errors for brandName, elevatorPitch, targetAudience, and desirableStyles
      const paths = result.error.issues.map((i) => i.path[0]);
      expect(paths).toContain('brandName');
      expect(paths).toContain('elevatorPitch');
      expect(paths).toContain('targetAudience');
      expect(paths).toContain('desirableStyles');
    }
  });
});
