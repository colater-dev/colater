'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Folder, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

const navigationItems = [
    {
        name: 'Logo',
        href: '/dashboard',
        icon: Folder,
    },
    {
        name: 'Tagline',
        href: '/taglines',
        icon: Sparkles,
    }
];

interface AppSidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AppSidebar({ isOpen, onClose }: AppSidebarProps) {
    const pathname = usePathname();

    return (
        <aside
            className={cn(
                'fixed left-0 top-0 h-screen w-[240px] bg-white z-[150] transition-transform duration-300 ease-in-out border-r shadow-2xl',
                isOpen ? 'translate-x-0' : '-translate-x-full'
            )}
        >
            <nav className="flex flex-col gap-1 p-4">
                {navigationItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            onClick={onClose}
                            className={cn(
                                'flex items-center gap-3 px-4 py-2 rounded-lg text-sm font-medium transition-all',
                                isActive
                                    ? 'bg-white text-black shadow-[0px_0px_0px_1px_rgba(0,0,0,0.02)]'
                                    : 'hover:bg-gray-50'
                            )}
                        >
                            <Icon className={cn('h-4 w-4', isActive ? 'opacity-100' : 'opacity-40')} />
                            <span className={cn(isActive ? 'opacity-100 text-black' : 'opacity-60 text-black')}>{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
