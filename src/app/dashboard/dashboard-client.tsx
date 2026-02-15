'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo, useState, useEffect } from 'react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { useRequireAuth } from '@/features/auth/hooks';
import { createBrandService } from '@/services';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardTitle } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { Loader2, Plus, Presentation, Star } from 'lucide-react';
import { CreateProjectCard } from '@/components/dashboard/create-project-card';
import { UploadLogoCard } from '@/components/dashboard/upload-logo-card';
import type { Brand } from '@/lib/types';
import { BRAND_FONTS } from '@/config/brand-fonts';
import { ErrorBoundary } from '@/components/error-boundary';

const BrandListItem = ({ brand }: { brand: Brand }) => {
    const [croppedLogoUrl, setCroppedLogoUrl] = useState<string | null>(null);
    const displayLogoUrl = croppedLogoUrl || brand.logoUrl;

    useEffect(() => {
        if (brand.logoUrl) {
            import('@/lib/image-utils').then(({ cropImageToContent }) => {
                if (brand.logoUrl) {
                    cropImageToContent(brand.logoUrl).then(setCroppedLogoUrl).catch(() => {
                        // CORS or load failure — display original URL instead of crashing
                    });
                }
            });
        }
    }, [brand.logoUrl]);

    // Display settings
    const settings = brand.displaySettings;
    const gap = (settings?.horizontalLogoTextGap ?? settings?.logoTextGap ?? 50) * 0.75; // Scale up: 0.5 * 1.5 = 0.75
    const balance = settings?.horizontalLogoTextBalance ?? settings?.logoTextBalance ?? 50;
    const contrast = settings?.logoContrast ?? 120;
    const invert = settings?.invertLogo ?? false;
    const textTransform = settings?.textTransform || 'none';
    const showBrandName = settings?.showBrandName ?? true;

    // Font configuration
    const fontConfig = BRAND_FONTS.find(f => f.name === brand.font) || BRAND_FONTS[0];
    const fontVariable = fontConfig.variable;
    const sizeMultiplier = fontConfig.sizeMultiplier || 1.0;

    // Base scaling for dashboard relative to editor (keeping the 1.5x scale boost)
    const cardScale = 1.2;
    const logoSize = 64 * cardScale * (1.5 - (balance / 100));
    const fontSize = 18 * cardScale * (0.5 + (balance / 100)) * sizeMultiplier;
    const logoGap = gap * 0.4 * cardScale;

    return (
        <motion.div
            className="relative group h-full"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
        >
            <Link href={`/brands/${brand.id}/presentation`} className="block h-full transition-all">
                <Card className="h-full aspect-video flex flex-col shadow-[0px_2px_8px_-2px_rgba(0,0,0,0.15),0px_0px_0px_1px_rgba(0,0,0,0.05)] hover:shadow-[0px_4px_12px_-2px_rgba(0,0,0,0.2),0px_0px_0px_1px_rgba(0,0,0,0.08)] transition-shadow overflow-hidden">
                    <CardContent className="h-full flex flex-col items-center justify-center p-4">
                        <div className="flex flex-col items-center justify-center">
                            <div
                                className="flex-shrink-0 flex items-center justify-center relative z-0"
                                style={{
                                    width: logoSize,
                                    height: logoSize,
                                    marginBottom: showBrandName ? `${logoGap}px` : 0
                                }}
                            >
                                {displayLogoUrl ? (
                                    <Image
                                        src={displayLogoUrl}
                                        alt={`${brand.latestName} logo`}
                                        fill
                                        className="object-contain"
                                        unoptimized={displayLogoUrl.startsWith('data:')}
                                        style={{
                                            filter: `contrast(${contrast}%)${invert ? ' invert(1)' : ''}`
                                        }}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-muted rounded-md" />
                                )}
                            </div>
                            {showBrandName && (
                                <CardTitle
                                    className="leading-none text-center relative z-10"
                                    style={{
                                        fontFamily: `var(${fontVariable}), sans-serif`,
                                        fontSize: `${fontSize}px`,
                                        textTransform: textTransform === 'none' ? 'none' : textTransform === 'capitalize' ? 'capitalize' : textTransform as any,
                                        fontWeight: 700
                                    }}
                                >
                                    {brand.latestName}
                                </CardTitle>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </Link>
            <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button asChild size="sm" variant="secondary" className="shadow-sm">
                    <Link href={`/brands/${brand.id}`}>
                        <Plus className="mr-2 h-4 w-4 rotate-45" />
                        Editor
                    </Link>
                </Button>
            </div>
        </motion.div>
    );
};

export function DashboardClient() {
    const { user, isLoading } = useRequireAuth();
    const firestore = useFirestore();
    const brandService = useMemo(() => createBrandService(firestore), [firestore]);

    const brandsQuery = useMemoFirebase(
        () => user ? brandService.getBrandsQuery(user.uid) : null,
        [user, brandService]
    );

    const { data: brands, isLoading: isLoadingBrands } = useCollection<Brand>(brandsQuery);

    if (isLoading || !user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-[72px] p-4 md:p-8 mt-[60px]">
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sm:gap-0">
                <h1 className="text-2xl font-bold">My Brands</h1>
                <div className="flex gap-2">
                    <Button asChild variant="outline">
                        <Link href="/ranker">
                            <Star className="mr-2 h-4 w-4" />
                            Logo Ranker
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/brands/new">
                            <Plus className="mr-2" />
                            Create New Brand
                        </Link>
                    </Button>
                </div>
            </div>

            {isLoadingBrands && (
                <div className="text-center">
                    <Loader2 className="mx-auto w-8 h-8 animate-spin text-primary" />
                    <p className="text-muted-foreground mt-2">Loading your brands...</p>
                </div>
            )}

            {!isLoadingBrands && brands && brands.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <CreateProjectCard />
                    <UploadLogoCard />
                    {brands.map((brand) => (
                        <ErrorBoundary key={brand.id} section={`Brand: ${brand.latestName}`}>
                            <BrandListItem brand={brand} />
                        </ErrorBoundary>
                    ))}
                </div>
            )}

            {!isLoadingBrands && (!brands || brands.length === 0) && (
                <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <h2 className="text-xl font-semibold">No Brands Yet</h2>
                    <p className="text-muted-foreground mt-2 mb-4">Start by creating your first brand identity.</p>
                    <Button asChild>
                        <Link href="/brands/new">
                            <Plus className="mr-2" />
                            Create New Brand
                        </Link>
                    </Button>
                </div>
            )}
        </div>
    );
}
