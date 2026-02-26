'use client';

import { useState, useEffect, useCallback } from 'react';
import { OnboardingState } from '../types';

const STORAGE_KEY = 'colater_onboarding_v1';

const INITIAL_STATE: OnboardingState = {
    brandName: '',
    elevatorPitch: '',
    targetAudience: '',
    desirableStyles: [],
    undesirableStyles: [],
    currentStep: 1,
    completedSteps: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    usedAiHelper: {},
    skippedFields: [],
};

export function useOnboardingState() {
    const [state, setState] = useState<OnboardingState>(INITIAL_STATE);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                setState(parsed); // eslint-disable-line react-hooks/set-state-in-effect -- Loading persisted state on mount
            } catch (e) {
                console.error('Failed to parse onboarding state', e);
                localStorage.removeItem(STORAGE_KEY);
            }
        }
        setIsLoaded(true);  
    }, []);

    // Save to localStorage on state change (debounced)
    useEffect(() => {
        if (!isLoaded) return;

        const timeoutId = setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [state, isLoaded]);

    const updateField = useCallback((field: keyof OnboardingState, value: OnboardingState[keyof OnboardingState]) => {
        setState(prev => ({
            ...prev,
            [field]: value,
            lastUpdatedAt: new Date().toISOString(),
        }));
    }, []);

    const updateFields = useCallback((fields: Partial<OnboardingState>) => {
        setState(prev => ({
            ...prev,
            ...fields,
            lastUpdatedAt: new Date().toISOString(),
        }));
    }, []);

    const clearState = useCallback(() => {
        localStorage.removeItem(STORAGE_KEY);
        setState(INITIAL_STATE);
    }, []);

    return {
        state,
        isLoaded,
        updateField,
        updateFields,
        clearState,
    };
}
