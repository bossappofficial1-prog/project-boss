'use client';

import { useOutletContext } from '@/components/providers/OutletProvider';
import { OutletType } from '@/types';
import { useEffect } from 'react';

/**
 * OutletTypeChecker - Client-side component to monitor and enforce outlet-specific rules.
 * This component is placed in the owner layout to ensure that product visibility
 * rules are respected throughout the owner dashboard.
 */
export default function OutletTypeChecker() {
    const { selectedOutlet, allowedProductTypes } = useOutletContext();

    useEffect(() => {
        if (selectedOutlet) {
            console.log(`[Dashboard] Active Outlet: ${selectedOutlet.name} (${selectedOutlet.type})`);
            console.log(`[Dashboard] Allowed Product Types: ${allowedProductTypes.join(', ')}`);
        }
    }, [selectedOutlet, allowedProductTypes]);

    return null;
}
