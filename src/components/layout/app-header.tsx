'use client';

import { useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useUser, useAuth, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LogOut, Loader2, Coins } from 'lucide-react';
import { Menu } from '@/components/animate-ui/icons/menu';
import { createBrandService } from '@/services';
import { useCredits } from '@/hooks/use-credits';
import type { Brand } from '@/lib/types';

function getInitials(name: string | null | undefined): string {
    if (!name) return 'U';
    const nameParts = name.split(' ');
    if (nameParts.length > 1) {
        return `${nameParts[0][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

interface AppHeaderProps {
    onMenuClick: () => void;
    isSidebarOpen: boolean;
}

export function AppHeader({ onMenuClick, isSidebarOpen }: AppHeaderProps) {
    const { user } = useUser();
    const auth = useAuth();
    const router = useRouter();
    const pathname = usePathname();
    const firestore = useFirestore();
    const { balance: creditBalance, isLoading: isCreditsLoading } = useCredits();

    // Fetch brands
    const brandService = useMemo(() => createBrandService(firestore), [firestore]);
    const brandsQuery = useMemoFirebase(
        () => user ? brandService.getBrandsQuery(user.uid) : null,
        [user, brandService]
    );
    const { data: brands, isLoading: isLoadingBrands } = useCollection<Brand>(brandsQuery);

    // Extract brand ID from pathname if on a brand page
    const currentBrandId = useMemo(() => {
        const brandMatch = pathname.match(/\/brands\/([^\/]+)/);
        return brandMatch ? brandMatch[1] : null;
    }, [pathname]);

    const handleSignOut = () => {
        auth.signOut();
    };

    const handleBrandChange = (brandId: string) => {
        // Navigate based on current page
        if (pathname.startsWith('/taglines')) {
            // On taglines page, update query param
            router.push(`/taglines?brandId=${brandId}`);
        } else {
            // Otherwise, navigate to brand page
            router.push(`/brands/${brandId}`);
        }
    };

    return (
        <header className="fixed top-0 left-0 right-0 z-50 h-[60px] flex items-center justify-between px-4 md:px-6">
            {/* Logo with menu icon and brand selector */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onMenuClick}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    aria-label="Toggle menu"
                >
                    <Menu animate={isSidebarOpen} className="h-5 w-5 text-black" />
                </button>
                <Link href="/dashboard" className="cursor-pointer">
                    <Image
                        src="/colater.png"
                        alt="Colater"
                        width={120}
                        height={36}
                        className="h-8 w-auto"
                        priority
                    />
                </Link>
                {user && (brands && brands.length > 0 || currentBrandId === 'new') && (
                    <div className="ml-2">
                        {isLoadingBrands ? (
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        ) : (
                            <Select
                                value={currentBrandId || ''}
                                onValueChange={handleBrandChange}
                            >
                                <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue
                                        placeholder={currentBrandId === 'new' ? 'New Brand' : 'Select brand'}
                                        className={currentBrandId === 'new' ? 'opacity-50' : ''}
                                    />
                                </SelectTrigger>
                                <SelectContent>
                                    {brands?.map((brand) => (
                                        <SelectItem key={brand.id} value={brand.id}>
                                            {brand.latestName}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    </div>
                )}
            </div>

            {/* User info on the right */}
            {user && (
                <div className="flex items-center gap-3">
                <Link
                    href="/credits"
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
                >
                    <Coins className="w-3.5 h-3.5 text-primary" />
                    {isCreditsLoading ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                        <span>{creditBalance}</span>
                    )}
                </Link>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center gap-4 hover:opacity-80 transition-opacity focus:outline-none">
                            <span className="hidden md:block text-sm font-semibold text-black">
                                {user.displayName || 'User'}
                            </span>
                            <Avatar className="h-8 w-8 cursor-pointer">
                                <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
                                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                    {getInitials(user.displayName)}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    {user.email}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleSignOut}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
                </div>
            )}
        </header>
    );
}
