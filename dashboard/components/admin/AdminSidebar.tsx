'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { LayoutDashboard, Building2, BarChart3, Users, FileBarChart, ShieldCheck, Settings2, LifeBuoy, ChevronLeft, ChevronRight, ChevronDown, type LucideIcon, PieChart, Activity, Image, CreditCard, Banknote, Receipt, Server } from 'lucide-react';

import { useUserData } from '@/hooks/useUserData';
import { useResponsiveBreakpoints } from '@/hooks/useResponsiveBreakpoints';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdminSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    isCollapsed?: boolean;
    onToggleCollapse?: () => void;
}

interface SidebarSubItem {
    label: string;
    href: string;
}

interface SidebarItem {
    label: string;
    href?: string; // Optional if it only has subItems
    icon: LucideIcon;
    description?: string;
    badge?: {
        label: string;
        variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    };
    disabled?: boolean;
    subItems?: SidebarSubItem[];
}

interface SidebarSection {
    heading: string;
    items: SidebarItem[];
}

export default function AdminSidebar({ isOpen, onClose, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
    const pathname = usePathname();
    const { data: userData, isLoading, error } = useUserData();
    const { isMobile, isDesktop } = useResponsiveBreakpoints();
    const prefersReducedMotion = usePrefersReducedMotion();
    const [internalCollapsed, setInternalCollapsed] = useState(false);

    const isControlled = typeof isCollapsed === 'boolean' && onToggleCollapse !== undefined;
    const collapsed = isControlled ? (isCollapsed as boolean) : internalCollapsed;
    const toggleCollapse = useCallback(() => {
        if (onToggleCollapse) {
            onToggleCollapse();
            return;
        }
        setInternalCollapsed((prev) => !prev);
    }, [onToggleCollapse]);

    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});

    // Auto-collapse on wide screens when internal state is used
    useEffect(() => {
        if (isControlled) {
            return;
        }

        if (isDesktop) {
            setInternalCollapsed(false);
        } else {
            setInternalCollapsed(true);
        }
    }, [isControlled, isDesktop]);

    const navSections = useMemo<SidebarSection[]>(() => [
        {
            heading: 'Overview',
            items: [
                {
                    label: 'Dashboard',
                    href: '/admin/dashboard',
                    icon: LayoutDashboard,
                },
                {
                    label: 'Platform Analytics',
                    icon: BarChart3,
                    subItems: [
                        { label: 'User Growth', href: '/admin/analytics/users' },
                        { label: 'Revenue (MRR)', href: '/admin/analytics/revenue' },
                    ],
                },
            ],
        },
        {
            heading: 'Manajemen Tenant (SaaS)',
            items: [
                {
                    label: 'Bisnis Terdaftar',
                    icon: Building2,
                    subItems: [
                        { label: 'Semua Merchant', href: '/admin/businesses/all' },
                    ],
                },
                {
                    label: 'Database User',
                    href: '/admin/users',
                    icon: Users,
                },
            ],
        },
        {
            heading: 'Langganan & Billing',
            items: [
                {
                    label: 'Paket Langganan',
                    icon: CreditCard,
                    subItems: [
                        { label: 'Paket Harga', href: '/admin/subscriptions/plans' },
                    ],
                },
                {
                    label: 'Pendapatan Platform',
                    icon: Banknote,
                    subItems: [
                        { label: 'Subscription Revenue', href: '/admin/platform-income/subs' },
                    ],
                },
            ],
        },
        {
            heading: 'Reports',
            items: [
                {
                    label: 'Financial Reports',
                    href: '/admin/reports',
                    icon: FileBarChart,
                },
            ],
        },
        {
            heading: 'Validasi Pembayaran',
            items: [
                {
                    label: 'Bukti Langganan',
                    href: '/admin/payments/manual',
                    icon: Receipt,
                },
            ],
        },
        {
            heading: 'Operasional Platform',
            items: [
                {
                    label: 'Global Banner',
                    href: '/admin/banners',
                    icon: Image,
                },
                {
                    label: 'Server Status',
                    href: '/admin/server',
                    icon: Server,
                    badge: { label: 'Beta', variant: 'outline' },
                },
            ],
        },
        {
            heading: 'System & Settings',
            items: [
                {
                    label: 'System Monitor',
                    href: '/admin/system',
                    icon: Activity,
                    badge: { label: 'Beta', variant: 'outline' },
                },
                {
                    label: 'Platform Config',
                    href: '/admin/settings',
                    icon: Settings2,
                    badge: { label: 'Beta', variant: 'outline' },
                },
            ],
        },
    ], []);

    const isActivePath = useCallback((href: string) => {
        if (!href) return false;
        if (pathname === href) {
            return true;
        }
        return pathname.startsWith(`${href}/`);
    }, [pathname]);

    useEffect(() => {
        if (!collapsed) {
            navSections.forEach(section => {
                section.items.forEach(item => {
                    if (item.subItems) {
                        const isChildActive = item.subItems.some(sub => pathname === sub.href || pathname.startsWith(`${sub.href}/`));
                        if (isChildActive) {
                            setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
                        }
                    }
                });
            });
        }
    }, [pathname, navSections, collapsed]);

    const handleItemClick = useCallback(() => {
        if (isMobile) {
            onClose();
        }
    }, [isMobile, onClose]);

    const itemAnimationClass = prefersReducedMotion ? '' : 'transition-all duration-200';

    return (
        <>
            <aside
                className={cn(
                    'fixed inset-y-0 left-0 w-64 top-0 z-50 h-full bg-white dark:bg-gray-800 shadow-2xl border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out lg:translate-x-0',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                    collapsed ? 'w-20' : 'w-72'
                )}
                style={{ willChange: 'transform, width' }}
                aria-label="Admin navigation"
            >
                <div className="flex flex-col h-full">
                    <div className="flex items-center justify-between h-16 px-4 bg-gradient-to-r from-red-600 to-red-700 dark:from-red-700 dark:to-red-800 border-b border-red-500/30">
                        <div className={cn('flex items-center gap-3 text-white', collapsed && 'justify-center w-full')}>
                            <div className="w-9 h-9 bg-white/20 rounded-lg flex items-center justify-center">
                                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                                </svg>
                            </div>
                            {!collapsed && (
                                <div className="flex flex-col">
                                    <span className="text-sm font-semibold tracking-wide">BOSS Admin</span>
                                    <span className="text-xs text-white/80">Platform control center</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <nav
                        className="flex-1 px-3 py-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
                        aria-label="Primary"
                    >
                        <div className="space-y-6">
                            {navSections.map((section) => (
                                <div key={section.heading} className="space-y-2">
                                    {!collapsed && (
                                        <p className="px-2 text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                                            {section.heading}
                                        </p>
                                    )}
                                    <div className="space-y-1">
                                        {section.items.map((item) => {
                                            const Icon = item.icon;
                                            const hasSubItems = item.subItems && item.subItems.length > 0;
                                            const isChildActive = hasSubItems && item.subItems!.some(sub => pathname === sub.href || pathname.startsWith(`${sub.href}/`));
                                            const active = !item.disabled && (item.href ? isActivePath(item.href) : isChildActive);
                                            const isExpanded = expandedMenus[item.label] || false;

                                            const content = (
                                                <div
                                                    className={cn(
                                                        'group flex items-center justify-between rounded-xl px-3 py-3 text-left text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/60 focus:ring-offset-1 dark:focus:ring-offset-gray-900',
                                                        itemAnimationClass,
                                                        collapsed && 'justify-center px-2',
                                                        item.disabled
                                                            ? 'text-gray-400 dark:text-gray-600 cursor-not-allowed opacity-70'
                                                            : active
                                                                ? 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 shadow-sm border border-red-200 dark:border-red-800'
                                                                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/60'
                                                    )}
                                                >
                                                    <div className="flex items-center gap-3 w-full min-w-0">
                                                        <span
                                                            className={cn(
                                                                'flex items-center justify-center rounded-lg border border-transparent bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400 group-hover:text-red-600 group-hover:bg-red-100 dark:group-hover:bg-red-900/30 dark:group-hover:text-red-300 transition-colors',
                                                                collapsed ? 'h-10 w-10' : 'h-11 w-11',
                                                                active && 'bg-red-600 text-white dark:bg-red-500',
                                                                item.disabled && 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600'
                                                            )}
                                                        >
                                                            <Icon className="h-5 w-5 shrink-0" strokeWidth={1.8} />
                                                        </span>

                                                        {!collapsed && (
                                                            <div className="flex flex-1 items-center justify-between min-w-0 pr-1">
                                                                <div className="flex flex-col min-w-0">
                                                                    <span className="truncate" aria-hidden={item.disabled}>
                                                                        {item.label}
                                                                    </span>
                                                                    {item.description && (
                                                                        <span className="text-xs font-normal text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                                                            {item.description}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {item.badge && (
                                                                    <Badge variant={item.badge.variant ?? 'default'} className="ml-2">
                                                                        {item.badge.label}
                                                                    </Badge>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>

                                                    {!collapsed && hasSubItems && (
                                                        <ChevronDown
                                                            className={cn(
                                                                'w-4 h-4 text-gray-400 transition-transform duration-200 shrink-0 ml-1 group-hover:text-gray-600 dark:group-hover:text-gray-300',
                                                                isExpanded && 'transform rotate-180',
                                                                active && 'text-red-500'
                                                            )}
                                                        />
                                                    )}

                                                    {collapsed && !item.disabled && (
                                                        <span className="pointer-events-none z-[99999] absolute left-full ml-2 hidden whitespace-nowrap rounded-md bg-gray-900 px-2 py-1 text-xs text-white opacity-0 shadow-md transition-opacity duration-200 group-hover:block group-hover:opacity-100">
                                                            {item.label}
                                                        </span>
                                                    )}
                                                </div>
                                            );

                                            return (
                                                <div key={item.label} className="w-full">
                                                    {item.disabled ? (
                                                        <div aria-disabled="true" tabIndex={-1} className="cursor-not-allowed w-full">
                                                            {content}
                                                        </div>
                                                    ) : hasSubItems ? (
                                                        <button
                                                            type="button"
                                                            className="w-full"
                                                            onClick={(e) => {
                                                                if (collapsed) {
                                                                    if (onToggleCollapse) onToggleCollapse();
                                                                    else setInternalCollapsed(false);
                                                                    setExpandedMenus(prev => ({ ...prev, [item.label]: true }));
                                                                } else {
                                                                    setExpandedMenus(prev => ({ ...prev, [item.label]: !prev[item.label] }));
                                                                }
                                                            }}
                                                        >
                                                            {content}
                                                        </button>
                                                    ) : (
                                                        <Link
                                                            href={item.href || '#'}
                                                            aria-current={active ? 'page' : undefined}
                                                            onClick={handleItemClick}
                                                            className="block w-full"
                                                        >
                                                            {content}
                                                        </Link>
                                                    )}

                                                    {hasSubItems && !collapsed && isExpanded && (
                                                        <div className="mt-1 ml-4 pl-8 border-l border-gray-100 dark:border-gray-700/50 space-y-1">
                                                            {item.subItems!.map(sub => {
                                                                const subActive = pathname === sub.href || pathname.startsWith(`${sub.href}/`);
                                                                return (
                                                                    <Link
                                                                        key={sub.href}
                                                                        href={sub.href}
                                                                        onClick={handleItemClick}
                                                                        className={cn(
                                                                            'block px-3 py-2 text-sm rounded-lg transition-colors',
                                                                            subActive
                                                                                ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10 font-medium'
                                                                                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                                                        )}
                                                                    >
                                                                        {sub.label}
                                                                    </Link>
                                                                );
                                                            })}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </nav>

                    <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex items-center gap-3">
                            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-sm">
                                <span className="text-sm font-semibold">
                                    {userData?.user?.email?.charAt(0).toUpperCase() || 'A'}
                                </span>
                            </div>
                            {!collapsed && (
                                <div className="min-w-0">
                                    {isLoading ? (
                                        <div className="space-y-2">
                                            <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                            <div className="h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                                        </div>
                                    ) : error ? (
                                        <p className="text-xs text-red-500">Gagal memuat data admin</p>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                                {userData?.user?.email?.split('@')[0] || 'Admin'}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                                {userData?.user?.role || 'Administrator'}
                                            </p>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
}