import { z } from 'zod';
import { ELEVATOR_PITCH_MAX } from '@/lib/brand-limits';

export const nameStepSchema = z.object({
    brandName: z.string()
        .min(1, 'Please enter a brand name')
        .max(50, 'Brand name must be less than 50 characters')
        .regex(/^[a-zA-Z0-9\s\-&]+$/, 'Only letters, numbers, spaces, hyphens and & allowed'),
});

export const pitchStepSchema = z.object({
    elevatorPitch: z.string()
        .min(10, 'Please provide more detail (at least 10 characters)')
        .max(ELEVATOR_PITCH_MAX, `Please keep it under ${ELEVATOR_PITCH_MAX} characters`),
});

export const audienceStepSchema = z.object({
    targetAudience: z.string()
        .min(5, 'Please describe your target audience')
        .max(200, 'Keep it concise (under 200 characters)'),
});

export const styleStepSchema = z.object({
    desirableStyles: z.array(z.string())
        .min(1, 'Select at least one desirable style')
        .max(5, 'Select up to 5 styles'),
    undesirableStyles: z.array(z.string())
        .max(5, 'Select up to 5 styles'),
});

export const onboardingSchema = nameStepSchema
    .merge(pitchStepSchema)
    .merge(audienceStepSchema)
    .merge(styleStepSchema);

export type NameStepValues = z.infer<typeof nameStepSchema>;
export type PitchStepValues = z.infer<typeof pitchStepSchema>;
export type AudienceStepValues = z.infer<typeof audienceStepSchema>;
export type StyleStepValues = z.infer<typeof styleStepSchema>;
export type OnboardingValues = z.infer<typeof onboardingSchema>;
