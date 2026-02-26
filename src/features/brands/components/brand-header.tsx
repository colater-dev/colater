'use client';

import { useState, useEffect } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { PillInput } from '@/components/ui/pill-input';
import { useFirestore, useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import type { Brand } from '@/lib/types';

interface BrandHeaderProps {
  brand: Brand;
}

// Helper function to parse comma-separated string into array
const parseToArray = (value: string): string[] => {
  if (!value || value.trim() === '') return [];
  return value.split(',').map(item => item.trim()).filter(item => item !== '');
};

// Helper function to convert array back to comma-separated string
const arrayToString = (arr: string[]): string => {
  return arr.join(', ');
};

export function BrandHeader({ brand }: BrandHeaderProps) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  // Local state for pill values
  const [audience, setAudience] = useState<string[]>([]);
  const [desirableCues, setDesirableCues] = useState<string[]>([]);
  const [undesirableCues, setUndesirableCues] = useState<string[]>([]);

  // Initialize state from brand data
  useEffect(() => {
    setAudience(parseToArray(brand.latestAudience)); // eslint-disable-line react-hooks/set-state-in-effect
    setDesirableCues(parseToArray(brand.latestDesirableCues));
    setUndesirableCues(parseToArray(brand.latestUndesirableCues));
  }, [brand.latestAudience, brand.latestDesirableCues, brand.latestUndesirableCues]);

  // Update Firestore when values change
  const updateBrandField = async (field: string, value: string[]) => {
    if (!user) return;

    try {
      const brandRef = doc(firestore, `users/${user.uid}/brands/${brand.id}`);
      await updateDoc(brandRef, {
        [field]: arrayToString(value)
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: `Could not update ${field.replace('latest', '').replace(/([A-Z])/g, ' $1').trim()}.`,
      });
    }
  };

  const handleAudienceChange = (value: string[]) => {
    setAudience(value);
    updateBrandField('latestAudience', value);
  };

  const handleDesirableCuesChange = (value: string[]) => {
    setDesirableCues(value);
    updateBrandField('latestDesirableCues', value);
  };

  const handleUndesirableCuesChange = (value: string[]) => {
    setUndesirableCues(value);
    updateBrandField('latestUndesirableCues', value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-3xl font-bold">{brand.latestName}</CardTitle>
        <CardDescription>{brand.latestElevatorPitch}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-semibold">Target Audience</label>
          <PillInput
            value={audience}
            onChange={handleAudienceChange}
            placeholder="Add target audience (e.g., Enterprise clients)..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Desirable Cues</label>
          <PillInput
            value={desirableCues}
            onChange={handleDesirableCuesChange}
            placeholder="Add desirable cues (e.g., Minimalist, Futuristic)..."
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold">Undesirable Cues</label>
          <PillInput
            value={undesirableCues}
            onChange={handleUndesirableCuesChange}
            placeholder="Add undesirable cues (e.g., Complex, Childish)..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
