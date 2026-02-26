'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, initiateSmartGoogleSignIn, handleRedirectResult } from '@/firebase';
import { WelcomeHero } from '@/features/onboarding/components/welcome-hero';
import { FeaturesSection } from '@/features/onboarding/components/features-section';
import { ArrowRight, Loader2, LayoutDashboard } from "lucide-react";
import Link from 'next/link';

export function LandingPageClient() {
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Handle the redirect result from Google Sign-In when the component mounts
    useEffect(() => {
        if (auth && !isUserLoading) {
            handleRedirectResult(auth)
                .then(result => {
                    if (result) {
                        console.log("Successfully processed redirect result");
                        setIsProcessingRedirect(true);
                        router.push('/onboarding/steps/name');
                    }
                })
                .catch(error => {
                    console.error("Error processing redirect result:", error);
                    setAuthError(error.message || 'Authentication failed');
                });
        }
    }, [auth, router, isUserLoading]);

    const handleGetStarted = () => {
        if (user) {
            router.push('/onboarding/steps/name');
        } else if (auth) {
            initiateSmartGoogleSignIn(auth);
        }
    };

    // Only show loading during actual redirect processing, not initial auth check
    if (isProcessingRedirect) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <p className="mt-4 text-muted-foreground font-medium text-lg">Redirecting...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 overflow-x-hidden pt-32 md:pt-24">
            {/* Top Navigation for Landing Page */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xl">C</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">Colater</span>
                    </div>
                    {user ? (
                        <Button asChild variant="ghost" size="sm" className="gap-2">
                            <Link href="/dashboard">
                                <LayoutDashboard className="w-4 h-4" />
                                Dashboard
                            </Link>
                        </Button>
                    ) : (
                        <Button onClick={handleGetStarted} variant="ghost" size="sm">
                            Sign In
                        </Button>
                    )}
                </div>
            </nav>

            <div className="w-full max-w-6xl space-y-20">
                {/* Hero Section with CTA */}
                <WelcomeHero
                    ctaButton={
                        <Button
                            onClick={handleGetStarted}
                            size="lg"
                            className="h-14 px-10 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all"
                        >
                            <span className="flex items-center gap-2">
                                {user ? 'Create Your Brand' : 'Get Started with Google'}
                                <ArrowRight className="w-5 h-5" />
                            </span>
                        </Button>
                    }
                />

                {/* Features Section */}
                <FeaturesSection />
            </div>

            {authError && (
                <div className="fixed bottom-4 right-4 p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm shadow-lg max-w-md z-50">
                    <p className="font-semibold mb-1">Authentication Error</p>
                    <p>{authError}</p>
                    <button
                        onClick={() => setAuthError(null)}
                        className="mt-2 text-xs underline hover:no-underline"
                    >
                        Dismiss
                    </button>
                </div>
            )}
        </div>
    );
}
