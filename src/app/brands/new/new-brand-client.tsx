'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useAuth, FirestorePermissionError, errorEmitter } from '@/firebase';
import { useRequireAuth } from '@/features/auth/hooks';
import { createBrandService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { getBrandSuggestions, getBrandCompletion } from '@/app/actions';
import { Label } from '@/components/ui/label';
import { ContentCard } from '@/components/layout';
import { getRandomFontByCategory, type FontCategory } from '@/config/brand-fonts';

const formSchema = z.object({
    name: z.string().min(2, 'Brand name must be at least 2 characters.'),
    elevatorPitch: z.string().min(10, 'Elevator pitch must be at least 10 characters.'),
    audience: z.string().min(10, 'Target audience must be at least 10 characters.'),
    desirableCues: z.string().optional(),
    undesirableCues: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function NewBrandClient() {
    const router = useRouter();
    const { user } = useRequireAuth();
    const auth = useAuth();
    const firestore = useFirestore();
    const brandService = useMemo(() => createBrandService(firestore), [firestore]);
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [topic, setTopic] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<FontCategory | null>(null);

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            elevatorPitch: '',
            audience: '',
            desirableCues: '',
            undesirableCues: '',
        },
    });

    const handleFillForMe = async () => {
        if (!topic) {
            toast({
                variant: 'destructive',
                title: 'Topic Required',
                description: 'Please enter a topic to generate brand details.',
            });
            return;
        }
        setIsGenerating(true);
        try {
            const idToken = await auth.currentUser?.getIdToken() ?? '';
            const result = await getBrandSuggestions(idToken, topic);
            if (result.success && result.data) {
                form.setValue('name', result.data.name);
                form.setValue('elevatorPitch', result.data.elevatorPitch);
                form.setValue('audience', result.data.audience);
                form.setValue('desirableCues', result.data.desirableCues);
                form.setValue('undesirableCues', result.data.undesirableCues);
                toast({
                    title: 'Brand details generated!',
                    description: 'The form has been filled with AI suggestions.',
                });
            } else {
                throw new Error(result.error || 'Failed to get brand suggestions.');
            }
        } catch (error) {
            console.error('Error filling form:', error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: (error instanceof Error) ? error.message : 'Could not generate brand details.',
            });
        } finally {
            setIsGenerating(false);
        }
    }

    const handleFillEverythingElse = async () => {
        const name = form.getValues('name');
        const elevatorPitch = form.getValues('elevatorPitch');

        if (!name || !elevatorPitch || name.length < 2 || elevatorPitch.length < 10) {
            toast({
                variant: 'destructive',
                title: 'Missing Information',
                description: 'Please fill in the Brand Name and Elevator Pitch first.',
            });
            return;
        }

        setIsGenerating(true);
        try {
            const idToken = await auth.currentUser?.getIdToken() ?? '';
            const result = await getBrandCompletion(idToken, name, elevatorPitch);
            if (result.success && result.data) {
                form.setValue('audience', result.data.audience);
                form.setValue('desirableCues', result.data.desirableCues);
                form.setValue('undesirableCues', result.data.undesirableCues);
                toast({
                    title: 'Details Generated!',
                    description: 'Audience and visual cues have been filled.',
                });
            } else {
                throw new Error(result.error || 'Failed to complete brand details.');
            }
        } catch (error) {
            console.error('Error completing details:', error);
            toast({
                variant: 'destructive',
                title: 'Generation Failed',
                description: (error instanceof Error) ? error.message : 'Could not generate details.',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const onSubmit: SubmitHandler<FormValues> = async (values) => {
        if (!user) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'You must be logged in to create a brand.',
            });
            return;
        }

        setIsSubmitting(true);

        try {
            const selectedFont = selectedCategory
                ? getRandomFontByCategory(selectedCategory)
                : null;

            const brandId = await brandService.createBrand(user.uid, {
                latestName: values.name,
                latestElevatorPitch: values.elevatorPitch,
                latestAudience: values.audience,
                latestDesirableCues: values.desirableCues,
                latestUndesirableCues: values.undesirableCues,
                font: selectedFont?.name || 'Inter',
            });

            toast({
                title: 'Brand Created!',
                description: 'Redirecting to generate assets...',
            });

            router.push(`/brands/${brandId}`);
        } catch (error: unknown) {
            setIsSubmitting(false);

            if (error instanceof Object && 'code' in error && error.code === 'permission-denied') {
                const brandsCollection = brandService.getBrandsCollection(user.uid);
                const permissionError = new FirestorePermissionError({
                    path: brandsCollection.path,
                    operation: 'create',
                    requestResourceData: values,
                });
                errorEmitter.emit('permission-error', permissionError);
            } else {
                console.error('Error creating brand:', error);
                toast({
                    variant: 'destructive',
                    title: 'Something went wrong',
                    description: error instanceof Error ? error.message : 'Could not save the brand.',
                });
            }
        }
    };

    return (
        <ContentCard>
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Create a New Brand</h1>
                    <p className="text-muted-foreground">Choose how you want to start.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
                    <div className="space-y-6 p-8 bg-muted/30 rounded-xl border">
                        <div>
                            <h2 className="text-xl font-semibold mb-2">Help me brainstorm a name</h2>
                            <p className="text-sm text-muted-foreground">
                                Not sure where to start? Enter a topic and let AI generate a complete brand identity for you.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Label htmlFor="topic-input">Topic or Idea</Label>
                            <div className="flex flex-col gap-3">
                                <Input
                                    id="topic-input"
                                    placeholder="e.g. A coffee shop for developers"
                                    value={topic}
                                    onChange={(e) => setTopic(e.target.value)}
                                />
                                <Button onClick={handleFillForMe} disabled={isGenerating} className="w-full">
                                    {isGenerating ? <Loader2 className="animate-spin mr-2" /> : <Sparkles className="mr-2" />}
                                    Brainstorm Brand
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div>
                        <div className="mb-6">
                            <h2 className="text-xl font-semibold mb-2">I have a name for my brand</h2>
                            <p className="text-sm text-muted-foreground">
                                Already have a vision? Fill in the details below.
                            </p>
                        </div>

                        <div className="space-y-4 mb-8">
                            <Label>Font Style Category</Label>
                            <div className="flex flex-wrap gap-2">
                                {(['Formal', 'Rounded', 'Stylish', 'Cute', 'Modern'] as FontCategory[]).map((category) => (
                                    <Button
                                        key={category}
                                        type="button"
                                        variant={selectedCategory === category ? 'default' : 'outline'}
                                        onClick={() => setSelectedCategory(category)}
                                        className="capitalize"
                                        size="sm"
                                    >
                                        {category}
                                    </Button>
                                ))}
                            </div>
                        </div>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Brand Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Acmecorp" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="elevatorPitch"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Elevator Pitch</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Describe your brand in a few sentences."
                                                    rows={4}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="w-full"
                                    onClick={handleFillEverythingElse}
                                    disabled={isGenerating}
                                >
                                    {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                                    Fill everything else for me
                                </Button>
                                <FormField
                                    control={form.control}
                                    name="audience"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Target Audience</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="e.g., 'Tech-savvy millennials who value design...'"
                                                    rows={3}
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="desirableCues"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Desirable visual cues</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="e.g., 'minimalist, elegant, bird, blue'"
                                                        rows={3}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="undesirableCues"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Undesirable visual cues</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="e.g., 'complex, childish, gradients, red'"
                                                        rows={3}
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" disabled={isSubmitting} size="lg" className="w-full">
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Creating...
                                            </>
                                        ) : (
                                            'Create Brand & Generate Assets'
                                        )}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </div>
                </div>
            </div>
        </ContentCard>
    );
}
