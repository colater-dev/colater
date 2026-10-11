'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/**
 * Email/password sign-in for local development against the Firebase Auth emulator.
 * Only rendered when NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true (see `npm run dev:local`).
 * Signs in, or creates the account if it doesn't exist yet in the emulator.
 */
export function DevEmailLogin() {
    const auth = useAuth();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isBusy, setIsBusy] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsBusy(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
            } catch (createError) {
                setError(createError instanceof Error ? createError.message : 'Sign-in failed');
                setIsBusy(false);
                return;
            }
        }
        router.push('/dashboard');
    };

    return (
        <form
            onSubmit={handleSubmit}
            aria-label="Dev sign-in"
            className="mx-auto w-full max-w-sm space-y-2 rounded-lg border border-dashed p-4 text-left"
        >
            <p className="text-xs font-medium text-muted-foreground">Local emulator sign-in</p>
            <Input type="email" placeholder="test@colater.test" value={email} onChange={e => setEmail(e.target.value)} required />
            <Input type="password" placeholder="Password (6+ characters)" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
            {error && <p className="text-xs text-destructive">{error}</p>}
            <Button type="submit" variant="outline" className="w-full" disabled={isBusy}>
                {isBusy ? 'Signing in…' : 'Sign in or create test account'}
            </Button>
        </form>
    );
}
