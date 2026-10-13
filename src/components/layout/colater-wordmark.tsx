import Image from 'next/image';
import { cn } from '@/lib/utils';

interface ColaterWordmarkProps {
    className?: string;
    priority?: boolean;
}

/** Colater's own wordmark. Black ink in light mode, inverted to paper in dark mode. */
export function ColaterWordmark({ className, priority }: ColaterWordmarkProps) {
    return (
        <Image
            src="/colater.png"
            alt="Colater"
            width={488}
            height={200}
            priority={priority}
            className={cn('h-8 w-auto dark:invert', className)}
        />
    );
}
