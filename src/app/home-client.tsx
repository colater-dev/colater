'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth, useUser, initiateSmartGoogleSignIn, handleRedirectResult } from '@/firebase';
import { Loader2, Wand2, Download, Shirt, Palette, ArrowRight, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

export function HomeClient() {
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const router = useRouter();
    const [isProcessingRedirect, setIsProcessingRedirect] = useState(false);
    const [authError, setAuthError] = useState<string | null>(null);

    // Debug auth instance loading
    useEffect(() => {
        console.log('Auth instance changed:', auth);
    }, [auth]);

    // Handle the redirect result from Google Sign-In when the component mounts
    useEffect(() => {
        if (auth) {
            setIsProcessingRedirect(true); // eslint-disable-line react-hooks/set-state-in-effect -- Auth redirect processing
            handleRedirectResult(auth)
                .then(result => {
                    if (result) {
                        console.log("Successfully processed redirect result");
                    }
                })
                .catch(error => {
                    console.error("Error processing redirect result:", error);
                    if (error?.code === 'auth/unauthorized-domain') {
                        setAuthError('This domain is not authorized. Please add it in Firebase Console.');
                    } else if (error?.code === 'auth/popup-closed-by-user') {
                        setAuthError('Sign-in was cancelled. Please try again.');
                    } else {
                        setAuthError(`Authentication failed: ${error.message || 'Unknown error'}`);
                    }
                })
                .finally(() => {
                    setIsProcessingRedirect(false);
                });
        }
    }, [auth]);

    useEffect(() => {
        if (!isUserLoading && !isProcessingRedirect && user) {
            router.push('/dashboard');
        }
    }, [user, isUserLoading, isProcessingRedirect, router]);


    const handleSignIn = () => {
        if (auth) {
            initiateSmartGoogleSignIn(auth);
        }
    };

    if (isUserLoading || isProcessingRedirect || user) {
        return (
            <div className="flex items-center justify-center h-screen bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground">Loading user session...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
            {/* Navigation */}
            <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xl">C</span>
                        </div>
                        <span className="font-bold text-xl tracking-tight">Colater</span>
                    </div>
                    <Button onClick={handleSignIn} variant="default" size="sm">
                        Sign In
                    </Button>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="pt-32 pb-20 px-4">
                <div className="container mx-auto max-w-6xl">
                    <div className="flex flex-col items-center text-center space-y-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5 }}
                            className="space-y-4 max-w-3xl"
                        >
                            <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80 mb-4">
                                <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2"></span>
                                v2.0 Now Available
                            </div>
                            <h1 className="text-5xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-gray-900 via-gray-700 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white pb-2">
                                Design Your Brand Identity in Seconds
                            </h1>
                            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                                AI-powered logo generation, vector exports, and instant mockups. The all-in-one tool for modern brands.
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.2 }}
                            className="flex flex-col sm:flex-row gap-4"
                        >
                            <Button variant="outline" size="lg" className="h-12 px-8 text-lg" onClick={() => {
                                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
                            }}>
                                View Features
                            </Button>
                            <Button onClick={handleSignIn} size="lg" className="h-12 px-8 text-lg gap-2">
                                Start Creating <ArrowRight className="w-4 h-4" />
                            </Button>

                        </motion.div>

                        {/* Hero Image / Preview */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.4 }}
                            className="w-full max-w-5xl mt-16 relative"
                        >
                            <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur opacity-20 animate-pulse"></div>
                            <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden aspect-[16/9] flex items-center justify-center bg-gray-50/50 dark:bg-gray-900/50">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 w-full h-full opacity-80">
                                    {/* Abstract representation of the dashboard grid */}
                                    <div className="col-span-2 row-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 flex items-center justify-center">
                                        <Wand2 className="w-16 h-16 text-primary/20" />
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 flex items-center justify-center">
                                        <Palette className="w-8 h-8 text-primary/20" />
                                    </div>
                                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 flex items-center justify-center">
                                        <Download className="w-8 h-8 text-primary/20" />
                                    </div>
                                    <div className="col-span-2 bg-white dark:bg-gray-800 rounded-lg shadow-sm border p-4 flex items-center justify-center relative overflow-hidden">
                                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                                        <div className="flex gap-2 items-center text-sm font-medium text-muted-foreground">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            Generating Concepts...
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="bg-background/80 backdrop-blur-sm border rounded-full px-6 py-3 shadow-lg flex items-center gap-3">
                                        <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                        <span className="font-semibold">AI-Powered Design Engine</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-24 bg-secondary/30">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Everything you need to launch</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            From initial concept to final assets, Colater handles the entire brand identity process.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <FeatureCard
                            icon={<Wand2 className="w-10 h-10 text-blue-500" />}
                            title="AI Generation"
                            description="Create unique, professional logos in seconds using advanced AI models tailored for branding."
                        />
                        <FeatureCard
                            icon={<Download className="w-10 h-10 text-green-500" />}
                            title="Vector Export"
                            description="Download production-ready SVG files perfect for print, web, and scaling to any size."
                        />
                        <FeatureCard
                            icon={<Shirt className="w-10 h-10 text-purple-500" />}
                            title="Instant Mockups"
                            description="Visualize your brand on t-shirts, stickers, and devices automatically."
                        />
                    </div>
                </div>
            </section>

            {/* Gallery Section */}
            <section className="py-24">
                <div className="container mx-auto px-4 max-w-6xl">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold tracking-tight mb-4">Made with Colater</h2>
                        <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
                            Explore brand identities generated by our users.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {SAMPLE_GALLERY.map((item, index) => (
                            <GalleryCard key={index} item={item} />
                        ))}
                    </div>
                </div>
            </section>

            {/* Social Proof / Trust */}
            <section className="py-24 border-t">
                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h2 className="text-3xl font-bold mb-12">Trusted by creators worldwide</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
                        {/* Placeholders for logos */}
                        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                        <div className="h-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"></div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-24 bg-primary text-primary-foreground">
                <div className="container mx-auto px-4 text-center max-w-3xl">
                    <h2 className="text-4xl font-bold mb-6">Ready to create your brand?</h2>
                    <p className="text-primary-foreground/80 text-xl mb-10">
                        Join thousands of founders and creators building their identity with Colater.
                    </p>
                    <Button onClick={handleSignIn} size="lg" variant="secondary" className="h-14 px-8 text-lg">
                        Get Started for Free
                    </Button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 border-t bg-background">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                            <span className="text-primary-foreground font-bold text-xs">C</span>
                        </div>
                        <span className="font-bold">Colater</span>
                    </div>
                    <div className="flex gap-8 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
                        <a href="#" className="hover:text-foreground transition-colors">Terms</a>
                        <a href="#" className="hover:text-foreground transition-colors">Twitter</a>
                    </div>
                    <div className="text-sm text-muted-foreground">
                        © 2024 Colater Inc.
                    </div>
                </div>
            </footer>

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

const SAMPLE_GALLERY = [
    {
        name: "Lumina",
        category: "Tech & AI",
        color: "bg-blue-500",
        logo: <Zap className="w-12 h-12 text-white" />,
        link: "#"
    },
    {
        name: "Natura",
        category: "Wellness",
        color: "bg-green-500",
        logo: <div className="w-12 h-12 rounded-full border-4 border-white" />,
        link: "#"
    },
    {
        name: "Velvet",
        category: "Fashion",
        color: "bg-purple-500",
        logo: <div className="w-12 h-12 rotate-45 bg-white/20 backdrop-blur border-2 border-white" />,
        link: "#"
    },
    {
        name: "Bolt",
        category: "Energy",
        color: "bg-yellow-500",
        logo: <div className="w-0 h-0 border-l-[20px] border-l-transparent border-b-[40px] border-b-white border-r-[20px] border-r-transparent" />,
        link: "#"
    }
];

function GalleryCard({ item }: { item: typeof SAMPLE_GALLERY[0] }) {
    return (
        <motion.a
            href={item.link}
            whileHover={{ y: -5, scale: 1.02 }}
            className="group block relative aspect-[4/5] rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all"
        >
            <div className={`absolute inset-0 ${item.color} flex items-center justify-center transition-transform duration-500 group-hover:scale-110`}>
                <div className="transform transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3">
                    {item.logo}
                </div>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />
            <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                <p className="text-sm text-white/80 font-medium">{item.category}</p>
            </div>
            <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="w-4 h-4 text-white" />
            </div>
        </motion.a>
    );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="p-6 rounded-2xl bg-card border shadow-sm hover:shadow-md transition-all"
        >
            <div className="mb-4 p-3 bg-secondary rounded-xl w-fit">
                {icon}
            </div>
            <h3 className="text-xl font-bold mb-2">{title}</h3>
            <p className="text-muted-foreground leading-relaxed">
                {description}
            </p>
        </motion.div>
    );
}
