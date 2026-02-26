// src/features/onboarding/utils/onboarding-analytics.ts

type OnboardingEvent =
    | 'onboarding_started'
    | 'onboarding_step_viewed'
    | 'onboarding_step_completed'
    | 'onboarding_field_skipped'
    | 'onboarding_ai_helper_used'
    | 'onboarding_completed'
    | 'first_logo_generated';

interface EventProperties {
    step?: number;
    field?: string;
    duration?: number;
    [key: string]: string | number | boolean | undefined;
}

export function trackOnboardingEvent(
    event: OnboardingEvent,
    properties?: EventProperties
) {
    // Log to console for development
    console.log(`[Analytics] ${event}`, properties);

    // Example: Integrate with Google Analytics if available
    if (typeof window !== 'undefined' && (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag) {
        (window as unknown as { gtag: (...args: unknown[]) => void }).gtag('event', event, properties);
    }
}
