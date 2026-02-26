'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useFirestore } from '@/firebase';
import { useRequireAuth } from '@/features/auth/hooks';
import { createBrandService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ContentCard } from '@/components/layout';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, X } from 'lucide-react';
import { uploadDataUriToR2Client } from '@/lib/r2-upload-client';

export function StartFromImageClient() {
    const router = useRouter();
    const { user } = useRequireAuth();
    const firestore = useFirestore();
    const brandService = useMemo(() => createBrandService(firestore), [firestore]);
    const { toast } = useToast();

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [brandName, setBrandName] = useState('');
    const [elevatorPitch, setElevatorPitch] = useState('');
    const [audience, setAudience] = useState('');
    const [desirableCues, setDesirableCues] = useState('');
    const [undesirableCues, setUndesirableCues] = useState('');

    const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast({
                variant: 'destructive',
                title: 'Invalid File',
                description: 'Please select an image file.',
            });
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            toast({
                variant: 'destructive',
                title: 'File Too Large',
                description: 'Please select an image smaller than 5MB.',
            });
            return;
        }

        setSelectedFile(file);

        const reader = new FileReader();
        reader.onloadend = () => {
            setPreviewUrl(reader.result as string);
        };
        reader.readAsDataURL(file);
    }, [toast]);

    const handleRemoveImage = useCallback(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You must be logged in to create a brand.',
            });
            return;
        }

        if (!selectedFile || !previewUrl) {
            toast({
                variant: 'destructive',
                title: 'No Image Selected',
                description: 'Please upload a logo image.',
            });
            return;
        }

        if (!brandName.trim() || brandName.trim().length < 2) {
            toast({
                variant: 'destructive',
                title: 'Invalid Brand Name',
                description: 'Brand name must be at least 2 characters.',
            });
            return;
        }

        if (!elevatorPitch.trim() || elevatorPitch.trim().length < 10) {
            toast({
                variant: 'destructive',
                title: 'Invalid Elevator Pitch',
                description: 'Elevator pitch must be at least 10 characters.',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('Uploading logo to R2...');
            const logoUrl = await uploadDataUriToR2Client(previewUrl, user.uid, 'logos');
            console.log('Logo uploaded successfully to R2:', logoUrl);

            const brandId = await brandService.createBrand(user.uid, {
                latestName: brandName.trim(),
                latestElevatorPitch: elevatorPitch.trim(),
                latestAudience: audience.trim() || 'General audience',
                latestDesirableCues: desirableCues.trim(),
                latestUndesirableCues: undesirableCues.trim(),
            });

            await brandService.updateBrandLogo(user.uid, brandId, logoUrl);

            toast({
                title: 'Brand Created!',
                description: 'Your brand has been created with your uploaded logo.',
            });

            router.push(`/brands/${brandId}`);
        } catch (error: unknown) {
            console.error('Error creating brand:', error);
            toast({
                variant: 'destructive',
                title: 'Something went wrong',
                description: error instanceof Error ? error.message : 'Could not create the brand.',
            });
            setIsSubmitting(false);
        }
    };

    return (
        <ContentCard>
            <div className="max-w-[640px] mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Start From Your Logo</h1>
                    <p className="text-muted-foreground">
                        Upload your existing logo and fill in your brand details.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <Label>Logo Image</Label>
                        {!previewUrl ? (
                            <div className="border-2 border-dashed rounded-xl p-8 text-center hover:border-gray-400 transition-colors">
                                <input
                                    type="file"
                                    id="logo-upload"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                                <label
                                    htmlFor="logo-upload"
                                    className="cursor-pointer flex flex-col items-center gap-4"
                                >
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                                        <Upload className="w-8 h-8 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-sm">Click to upload your logo</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            PNG, JPG, SVG up to 5MB
                                        </p>
                                    </div>
                                </label>
                            </div>
                        ) : (
                            <div className="relative border-2 rounded-xl p-8 bg-white">
                                <button
                                    type="button"
                                    onClick={handleRemoveImage}
                                    className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/80 hover:bg-black text-white flex items-center justify-center transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                                <div className="flex justify-center">
                                    <div className="relative w-64 h-64">
                                        <Image
                                            src={previewUrl}
                                            alt="Logo preview"
                                            fill
                                            className="object-contain"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="brand-name">Brand Name *</Label>
                        <Input
                            id="brand-name"
                            placeholder="Acmecorp"
                            value={brandName}
                            onChange={(e) => setBrandName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="elevator-pitch">Elevator Pitch *</Label>
                        <Textarea
                            id="elevator-pitch"
                            placeholder="Describe your brand in a few sentences."
                            rows={4}
                            value={elevatorPitch}
                            onChange={(e) => setElevatorPitch(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="audience">Target Audience</Label>
                        <Textarea
                            id="audience"
                            placeholder="e.g., 'Tech-savvy millennials who value design...'"
                            rows={3}
                            value={audience}
                            onChange={(e) => setAudience(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="desirable-cues">Desirable Visual Cues</Label>
                        <Textarea
                            id="desirable-cues"
                            placeholder="e.g., 'minimalist, elegant, bird, blue'"
                            rows={3}
                            value={desirableCues}
                            onChange={(e) => setDesirableCues(e.target.value)}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="undesirable-cues">Undesirable Visual Cues</Label>
                        <Textarea
                            id="undesirable-cues"
                            placeholder="e.g., 'complex, childish, gradients, red'"
                            rows={3}
                            value={undesirableCues}
                            onChange={(e) => setUndesirableCues(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => router.push('/dashboard')}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting || !previewUrl}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Brand'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </ContentCard>
    );
}
