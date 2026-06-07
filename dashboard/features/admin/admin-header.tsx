'use client';

import { useState, useEffect, useMemo, useRef, type FormEvent } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
    Menu,
    ChevronLeft,
    ChevronRight,
    ChevronDown,
    Search,
    Bell,
    ArrowUpRight,
    Sparkles,
    BarChart3,
    ShieldCheck,
    Users,
    Settings2,
    LifeBuoy,
    Command,
    LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import ThemeToggle from '@/components/theme-toggle';
import { useUserData } from '@/hooks/use-user-data';
import { apiClient } from '@/lib/apis/base';
import ConfirmationModal from '@/components/ui/confirmation-modal';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useResponsiveBreakpoints } from '@/hooks/use-responsive-breakpoints';
import { usePrefersReducedMotion } from '@/hooks/use-prefers-reduced-motion';

interface AdminHeaderProps {
    onToggleSidebar: () => void;
    sidebarCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface BreadcrumbItem {
    label: string;
    href: string;
}

type QuickActionBadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline';

interface QuickAction {
    id: string;
    label: string;
    description: string;
    icon: LucideIcon;
    href?: string;
    onClick?: () => void;
    badge?: {
        label: string;
        variant?: QuickActionBadgeVariant;
    };
}

function formatBreadcrumbLabel(segment: string): string {
    const dictionary: Record<string, string> = {
        admin: 'Admin',
        dashboard: 'Dashboard',
        businesses: 'Businesses',
        users: 'User Management',
        analytics: 'Analytics',
        reports: 'Reports',
        system: 'System Health',
        settings: 'Settings',
        support: 'Support',
        profile: 'Profile',
    };

    if (dictionary[segment]) {
        return dictionary[segment];
    }

    if (/^\d+$/.test(segment)) {
        return `#${segment}`;
    }

    if (segment === 'new') {
        return 'Create New';
    }

    return segment
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
}

export default function AdminHeader({ onToggleSidebar, sidebarCollapsed = false, onToggleCollapse }: AdminHeaderProps) {
    const router = useRouter();
    const pathname = usePathname();
    const { data: userData, isLoading } = useUserData();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const mobileSearchRef = useRef<HTMLInputElement>(null);
    const desktopSearchRef = useRef<HTMLInputElement>(null);
    const { isMobile, isDesktop } = useResponsiveBreakpoints();
    const prefersReducedMotion = usePrefersReducedMotion();

    const breadcrumbs = useMemo<BreadcrumbItem[]>(() => {
        if (!pathname) {
            return [{ label: 'Admin', href: '/admin' }];
        }

        const segments = pathname.split('/').filter(Boolean);
        if (segments.length === 0) {
            return [{ label: 'Admin', href: '/admin' }];
        }

        const items: BreadcrumbItem[] = [];
        segments.forEach((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join('/')}`;
            items.push({
                label: formatBreadcrumbLabel(segment),
                href,
            });
        });

        return items;
    }, [pathname]);

    const pageTitle = breadcrumbs.length > 0 ? breadcrumbs[breadcrumbs.length - 1].label : 'Admin Dashboard';

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        setDropdownOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (showSearch && mobileSearchRef.current) {
            mobileSearchRef.current.focus();
        }
    }, [showSearch]);

    useEffect(() => {
        if (isDesktop) {
            setShowSearch(false);
        }
    }, [isDesktop]);

    useEffect(() => {
        if (!showSearch) {
            return;
        }

        const handleEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setShowSearch(false);
            }
        };

        window.addEventListener('keydown', handleEscape);
        return () => window.removeEventListener('keydown', handleEscape);
    }, [showSearch]);

    useEffect(() => {
        const handleShortcut = (event: KeyboardEvent) => {
            if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
                event.preventDefault();
                if (isDesktop) {
                    desktopSearchRef.current?.focus();
                } else {
                    setShowSearch(true);
                }
            }
        };

        window.addEventListener('keydown', handleShortcut);
        return () => window.removeEventListener('keydown', handleShortcut);
    }, [isDesktop]);

    const handleLogoutClick = () => {
        setDropdownOpen(false);
        setShowLogoutModal(true);
    };

    const handleLogoutConfirm = async () => {
        try {
            const response = await apiClient.post('/auth/logout');
            if (response.status === 200) {
                window.location.href = '/auth/login';
            }
        } catch (error) {
            console.error('Failed to log out admin user', error);
        } finally {
            setShowLogoutModal(false);
        }
    };

    const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmed = searchQuery.trim();
        if (!trimmed) {
            if (!isDesktop) {
                setShowSearch(false);
            }
            return;
        }

        router.push(`/admin/search?query=${encodeURIComponent(trimmed)}`);
        if (!isDesktop) {
            setShowSearch(false);
        }
    };

    const handleQuickAction = (action: QuickAction) => {
        if (action.href) {
            router.push(action.href);
            return;
        }

        action.onClick?.();
    };

    const userInitial = userData?.user?.email?.charAt(0).toUpperCase() ?? 'A';
    const userEmail = userData?.user?.email ?? 'admin@example.com';
    const userName = userEmail.split('@')[0] ?? 'Admin';

    return (
        <header className="sticky top-0 z-20">
            <div className="px-3 py-2 sm:px-4 sm:py-3 lg:px-6">
                {/* Mobile Layout */}
                <div className="flex items-center justify-between md:hidden">
                    {/* Left side - Menu + Title */}
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                            type="button"
                            onClick={onToggleSidebar}
                            className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-gray-600 shadow-sm transition hover:border-red-200 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:border-red-700 dark:hover:text-red-300"
                            aria-label="Toggle navigation menu"
                        >
                            <Menu className="h-4 w-4" />
                        </button>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-0.5">
                                <span className="text-gray-600 dark:text-gray-300">ADMIN</span>
                                <ChevronRight className="h-2.5 w-2.5 opacity-60" aria-hidden="true" />
                                <span className="text-gray-700 dark:text-gray-200 truncate">DASHBOARD</span>
                            </div>
                            <h1 className="text-base font-semibold text-gray-900 dark:text-gray-50 truncate">
                                {pageTitle}
                            </h1>
                        </div>
                    </div>

                    {/* Right side - Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => setShowSearch((prev) => !prev)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-gray-500 shadow-sm transition hover:border-red-200 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:border-red-700 dark:hover:text-red-300"
                            aria-label="Toggle search"
                        >
                            <Search className="h-4 w-4" />
                        </button>

                        <button
                            type="button"
                            className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-white/80 text-gray-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:bg-red-900/20"
                            aria-label="View notifications"
                        >
                            <Bell className="h-4 w-4" />
                            <span className="absolute -top-0.5 -right-0.5 inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-red-500" />
                        </button>

                        <div className="hidden xs:block">
                            <ThemeToggle />
                        </div>

                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className="flex items-center gap-1.5 rounded-lg border border-transparent px-1.5 py-1 text-left transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-gray-700/60"
                                aria-haspopup="true"
                                aria-expanded={dropdownOpen}
                            >
                                {isLoading ? (
                                    <div className="h-7 w-7 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                ) : (
                                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm">
                                        <span className="text-xs font-semibold">{userInitial}</span>
                                    </div>
                                )}
                                <ChevronDown
                                    className={cn(
                                        'h-3 w-3 text-gray-400 transition-transform duration-200 dark:text-gray-500',
                                        dropdownOpen ? 'rotate-180' : ''
                                    )}
                                    aria-hidden="true"
                                />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10 md:hidden" onClick={() => setDropdownOpen(false)} />
                                    <div className="absolute right-0 z-20 mt-2 w-56 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900/95 md:w-64">
                                        <div className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-800/70">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm">
                                                <span className="text-xs font-semibold">{userInitial}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{userName}</p>
                                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                                            </div>
                                        </div>

                                        <div className="mt-2 space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    router.push('/admin/profile');
                                                }}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-gray-300 dark:hover:bg-gray-700/60"
                                            >
                                                <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                                                Profile
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    router.push('/admin/settings');
                                                }}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-gray-300 dark:hover:bg-gray-700/60"
                                            >
                                                <Settings2 className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                                                Settings
                                            </button>

                                            <div className="block xs:hidden">
                                                <ThemeToggle />
                                            </div>
                                        </div>

                                        <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                                            <button
                                                type="button"
                                                onClick={handleLogoutClick}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
                                            >
                                                <LogOut className="h-4 w-4" aria-hidden="true" />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Desktop Layout */}
                <div className="hidden md:flex md:flex-wrap md:items-center md:justify-between md:gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                        {onToggleCollapse && (
                            <button
                                type="button"
                                onClick={onToggleCollapse}
                                className="hidden h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white/80 text-gray-500 shadow-sm transition hover:border-red-200 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:border-red-700 dark:hover:text-red-300 lg:inline-flex"
                                aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
                            >
                                {sidebarCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
                            </button>
                        )}

                        <div className="flex min-w-0 flex-col">
                            <div className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                                {breadcrumbs.map((crumb, index) => (
                                    <span key={crumb.href} className="flex items-center gap-1">
                                        {index > 0 && <ChevronRight className="h-3 w-3 opacity-60" aria-hidden="true" />}
                                        <span
                                            className={cn(
                                                'truncate',
                                                index === breadcrumbs.length - 1
                                                    ? 'text-gray-700 dark:text-gray-200'
                                                    : 'text-gray-400 dark:text-gray-500'
                                            )}
                                        >
                                            {crumb.label}
                                        </span>
                                    </span>
                                ))}
                            </div>
                            <div className="flex items-center gap-2">
                                <h1 className="truncate text-lg font-semibold text-gray-900 dark:text-gray-50 sm:text-xl">
                                    {pageTitle}
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className="hidden items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium uppercase tracking-wide sm:inline-flex"
                                >
                                    <Sparkles className="h-3 w-3" />
                                    {isMobile ? 'Adaptive' : 'Live'}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        <form onSubmit={handleSearchSubmit} className="relative hidden md:flex">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                            <input
                                ref={desktopSearchRef}
                                type="search"
                                value={searchQuery}
                                onChange={(event) => setSearchQuery(event.target.value)}
                                placeholder="Search across admin..."
                                className="w-56 rounded-lg border border-gray-200 bg-white/80 py-2 pl-9 pr-16 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900/60 dark:text-gray-100 dark:placeholder:text-gray-500 lg:w-72"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 items-center gap-1 rounded-md border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 md:flex">
                                <Command className="h-3 w-3" />
                                K
                            </span>
                        </form>

                        <button
                            type="button"
                            className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-transparent bg-white/80 text-gray-500 shadow-sm transition hover:bg-red-50 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-900/60 dark:text-gray-300 dark:hover:bg-red-900/20"
                            aria-label="View notifications"
                        >
                            <Bell className="h-5 w-5" />
                            <span className="absolute -top-0.5 -right-0.5 inline-flex h-3 w-3 items-center justify-center rounded-full bg-red-500" />
                        </button>

                        <ThemeToggle />

                        <div className="relative" ref={dropdownRef}>
                            <button
                                type="button"
                                onClick={() => setDropdownOpen((prev) => !prev)}
                                className="flex items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-left transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:hover:bg-gray-700/60"
                                aria-haspopup="true"
                                aria-expanded={dropdownOpen}
                            >
                                {isLoading ? (
                                    <div className="h-9 w-9 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700" aria-hidden="true" />
                                ) : (
                                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm">
                                        <span className="text-sm font-semibold">{userInitial}</span>
                                    </div>
                                )}
                                <div className="hidden min-w-0 sm:flex sm:flex-col">
                                    <span className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{userName}</span>
                                    <span className="truncate text-xs text-gray-500 dark:text-gray-400">{userEmail}</span>
                                </div>
                                <ChevronDown
                                    className={cn(
                                        'h-4 w-4 text-gray-400 transition-transform duration-200 dark:text-gray-500',
                                        dropdownOpen ? 'rotate-180' : ''
                                    )}
                                    aria-hidden="true"
                                />
                            </button>

                            {dropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10 lg:hidden" onClick={() => setDropdownOpen(false)} />
                                    <div className="absolute right-0 z-20 mt-2 w-64 rounded-xl border border-gray-200 bg-white/95 p-2 shadow-xl dark:border-gray-700 dark:bg-gray-900/95">
                                        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-3 dark:bg-gray-800/70">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm">
                                                <span className="text-sm font-semibold">{userInitial}</span>
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{userName}</p>
                                                <p className="truncate text-xs text-gray-500 dark:text-gray-400">{userEmail}</p>
                                            </div>
                                        </div>

                                        <div className="mt-2 space-y-1">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    router.push('/admin/profile');
                                                }}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-gray-300 dark:hover:bg-gray-700/60"
                                            >
                                                <Users className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                                                Profile
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    router.push('/admin/settings');
                                                }}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-gray-300 dark:hover:bg-gray-700/60"
                                            >
                                                <Settings2 className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                                                Settings
                                            </button>

                                            <div className="block xs:hidden">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setDropdownOpen(false);
                                                        // Theme toggle functionality would go here
                                                    }}
                                                    className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-gray-300 dark:hover:bg-gray-700/60"
                                                >
                                                    <Settings2 className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                                                    Theme
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setDropdownOpen(false);
                                                    router.push('/admin/support');
                                                }}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-gray-300 dark:hover:bg-gray-700/60"
                                            >
                                                <LifeBuoy className="h-4 w-4 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                                                Help &amp; Support
                                            </button>
                                        </div>

                                        <div className="mt-2 border-t border-gray-200 pt-2 dark:border-gray-700">
                                            <button
                                                type="button"
                                                onClick={handleLogoutClick}
                                                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 dark:text-red-400 dark:hover:bg-red-900/20"
                                            >
                                                <LogOut className="h-4 w-4" aria-hidden="true" />
                                                Sign out
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* {quickActions.length > 0 && (
                    <div
                        className={cn(
                            'rounded-2xl border border-gray-200 bg-white/80 p-3 shadow-sm backdrop-blur-sm dark:border-gray-700 dark:bg-gray-900/50 sm:p-4',
                            prefersReducedMotion ? '' : 'animate-in slide-in-from-top-1 duration-300'
                        )}
                    >
                        <div className="mb-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-sm font-semibold text-gray-700 dark:text-gray-200">
                                <Sparkles className="h-4 w-4 text-red-500 dark:text-red-400" aria-hidden="true" />
                                <span>Quick actions</span>
                            </div>
                            <span className="hidden text-xs text-gray-400 dark:text-gray-500 sm:inline">
                                {pageTitle ? `Shortcut for ${pageTitle}` : 'Stay in control'}
                            </span>
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:gap-2 sm:overflow-visible lg:grid-cols-4 lg:gap-3">
                            {quickActions.map((action) => (
                                <button
                                    key={action.id}
                                    type="button"
                                    onClick={() => handleQuickAction(action)}
                                    className={cn(
                                        'relative flex min-w-[14rem] flex-col items-start gap-1 rounded-xl border border-transparent bg-white/90 px-4 py-3 text-left shadow-sm transition focus:outline-none focus:ring-2 focus:ring-red-500 dark:bg-gray-800/70',
                                        prefersReducedMotion
                                            ? 'hover:border-red-300'
                                            : 'hover:-translate-y-0.5 hover:border-red-200 hover:shadow-md dark:hover:border-red-800'
                                    )}
                                >
                                    <div className="flex items-center gap-2">
                                        <action.icon className="h-4 w-4 text-red-500 dark:text-red-400" aria-hidden="true" />
                                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {action.label}
                                        </span>
                                        {action.badge && (
                                            <Badge variant={action.badge.variant ?? 'default'} className="text-[10px]">
                                                {action.badge.label}
                                            </Badge>
                                        )}
                                    </div>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{action.description}</p>
                                    <ArrowUpRight className="absolute right-3 top-3 h-4 w-4 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                                </button>
                            ))}
                        </div>
                    </div>
                )} */}
            </div>

            {/* Mobile Search Overlay */}
            {showSearch && (
                <div className="border-t border-gray-200 bg-white/95 px-3 pb-3 pt-2 shadow-lg dark:border-gray-700 dark:bg-gray-900/95 md:hidden">
                    <form onSubmit={handleSearchSubmit} className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" aria-hidden="true" />
                        <input
                            ref={mobileSearchRef}
                            type="search"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search admin..."
                            className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm text-gray-700 shadow-sm placeholder:text-gray-400 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900/70 dark:text-gray-100 dark:placeholder:text-gray-500"
                        />
                    </form>
                </div>
            )}

            <ConfirmationModal
                open={showLogoutModal}
                onOpenChange={setShowLogoutModal}
                title="Confirm Sign Out"
                description="Are you sure you want to sign out of your admin account? You'll be redirected to the login page."
                confirmText="Sign Out"
                cancelText="Cancel"
                confirmVariant="destructive"
                onConfirm={handleLogoutConfirm}
                icon={<LogOut className="h-6 w-6 text-red-600 dark:text-red-400" aria-hidden="true" />}
            />
        </header>
    );
}