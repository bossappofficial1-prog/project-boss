'use client';

import { useOutletContext } from '@/components/providers/OutletProvider';
import { useUserData } from '@/hooks/useUserData';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { MENU_GROUPS } from './sidebar/sidebar';
import { toast } from 'sonner';

/**
 * OutletTypeChecker - Client-side component to monitor and enforce outlet-specific and plan-specific rules.
 */
export default function OutletTypeChecker({ children }: { children: React.ReactNode }) {
    const { selectedOutlet } = useOutletContext();
    const { data: userData, isLoading: isUserLoading } = useUserData();
    const pathname = usePathname();
    const router = useRouter();
    const [isAuthorized, setIsAuthorized] = useState(false);

    useEffect(() => {
        // Wait until we have the required data
        if (!selectedOutlet || isUserLoading) return;

        const hasProAccess = ["TRIAL", "PRO", "ENTERPRISE"].includes(
            userData?.business?.subscriptionPlan?.toUpperCase() || "BASIC"
        );

        // Find matching route in MENU_GROUPS
        let matchedItem: any = null;
        let longestMatchLength = 0;
        
        for (const group of MENU_GROUPS) {
            for (const item of group.items) {
                // Check if current route matches parent item
                if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
                    if (item.href.length > longestMatchLength) {
                        matchedItem = item;
                        longestMatchLength = item.href.length;
                    }
                }
                
                // Check if current route matches sub items
                if (item.subItems) {
                    for (const sub of item.subItems) {
                        if (pathname === sub.href || pathname.startsWith(`${sub.href}/`)) {
                            if (sub.href.length > longestMatchLength) {
                                matchedItem = sub;
                                longestMatchLength = sub.href.length;
                            }
                        }
                    }
                }
            }
        }

        if (matchedItem) {
            // 1. Check Outlet Type
            if (matchedItem.requiredTypes && !matchedItem.requiredTypes.includes(selectedOutlet.type)) {
                toast.error("Fitur tidak tersedia untuk tipe outlet ini");
                router.replace('/owner');
                return;
            }

            // 2. Check PRO Access
            if (matchedItem.requirePro && !hasProAccess) {
                toast.error("Upgrade ke PRO untuk mengakses fitur ini");
                router.replace('/owner/subscription');
                return;
            }
        }

        // If all checks pass, authorize rendering
        setIsAuthorized(true);

    }, [pathname, selectedOutlet, userData, isUserLoading, router]);

    if (!isAuthorized) return null;

    return <>{children}</>;
}
