'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useOutletsQuery } from '@/hooks/useOutlets';
import { Outlet, OutletType, ProductType } from '@/types';
import { useUserData } from '@/hooks/useUserData';

interface OutletContextType {
    selectedOutlet: Outlet | null;
    selectedOutletId: string | null;
    outlets: Outlet[];
    setSelectedOutlet: (outlet: Outlet | null) => void;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
    allowedProductTypes: string[];
    isPlanMismatch: boolean;
}

export const OutletContext = createContext<OutletContextType | null>(null);

interface OutletProviderProps {
    children: React.ReactNode;
}

// Helper function to get selected outlet from localStorage and outlets array
function getInitialSelectedOutlet(outlets: Outlet[]): Outlet | null {
    if (!outlets?.length) return null;

    const savedOutletId = localStorage.getItem('selectedOutlet');

    if (savedOutletId) {
        const savedOutlet = outlets.find(outlet => outlet.id === savedOutletId);
        if (savedOutlet) {
            return savedOutlet;
        }
    }

    // Check old format
    const oldSavedOutlet = localStorage.getItem('selectedOutletId');
    if (oldSavedOutlet) {
        try {
            const exists = outlets.find(outlet => outlet.id === oldSavedOutlet);
            if (exists) {
                localStorage.setItem('selectedOutlet', exists.id);
                localStorage.removeItem('selectedOutletId');
                return exists;
            }

            const parsed = JSON.parse(oldSavedOutlet);
            const existsParsed = outlets.find(outlet => outlet.id === parsed.id);
            if (existsParsed) {
                localStorage.setItem('selectedOutlet', existsParsed.id);
                localStorage.removeItem('selectedOutletId');
                return existsParsed;
            }
        } catch {
            // Invalid JSON, continue to fallback
        }
    }

    // Fallback to first outlet
    const firstOutlet = outlets[0];
    if (firstOutlet) {
        localStorage.setItem('selectedOutlet', firstOutlet.id);
        localStorage.removeItem('selectedOutletId');
    }

    return firstOutlet;
}

export function OutletProvider({ children }: OutletProviderProps) {
    const { data: userData } = useUserData();
    const { data, isLoading, error, refetch } = useOutletsQuery();
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const outlets = (data?.outlets || []) as Outlet[];

    // Keep selected outlet in sync with latest query data.
    useEffect(() => {
        if (outlets.length === 0) {
            if (selectedOutlet) {
                setSelectedOutlet(null);
            }
            return;
        }

        if (!selectedOutlet) {
            const initialOutlet = getInitialSelectedOutlet(outlets);
            setSelectedOutlet(initialOutlet);
            return;
        }

        const matchedOutlet = outlets.find((outlet) => outlet.id === selectedOutlet.id);

        if (matchedOutlet) {
            if (matchedOutlet !== selectedOutlet) {
                setSelectedOutlet(matchedOutlet);
            }
            return;
        }

        const fallbackOutlet = getInitialSelectedOutlet(outlets);
        setSelectedOutlet(fallbackOutlet);
    }, [outlets, selectedOutlet]);

    const handleSetSelectedOutlet = (outlet: Outlet | null) => {
        setSelectedOutlet(outlet);

        if (typeof window !== 'undefined') {
            if (outlet) {
                try {
                    localStorage.setItem('selectedOutlet', outlet.id);
                    localStorage.removeItem('selectedOutletId');
                    // Set cookie for middleware access
                    document.cookie = `selectedOutlet=${outlet.id}; path=/; max-age=${30 * 24 * 60 * 60}`;
                    document.cookie = `selectedOutletType=${outlet.type}; path=/; max-age=${30 * 24 * 60 * 60}`;
                } catch (error) {
                    console.error('Failed to save outlet to localStorage:', error);
                }
            } else {
                localStorage.removeItem('selectedOutlet');
                localStorage.removeItem('selectedOutletId');
                document.cookie = `selectedOutlet=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
                document.cookie = `selectedOutletType=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
        }
    };

    const isPlanMismatch = useMemo(() => {
        if (!selectedOutlet || !userData?.business) return false;
        if (selectedOutlet.type === OutletType.CUSTOM) {
            const plan = userData.business.subscriptionPlan;
            return plan !== 'TRIAL' && plan !== 'PRO';
        }
        return false;
    }, [selectedOutlet, userData]);

    const allowedProductTypes = useMemo(() => {
        if (!selectedOutlet) return [ProductType.GOODS, ProductType.SERVICE, ProductType.TICKET];
        
        const type = (selectedOutlet.type === OutletType.CUSTOM && isPlanMismatch) 
            ? OutletType.FNB 
            : selectedOutlet.type;

        switch (type) {
            case OutletType.FNB:
            case OutletType.RETAIL:
                return [ProductType.GOODS];
            case OutletType.EVENT:
                return [ProductType.TICKET];
            case OutletType.SERVICE:
                return [ProductType.SERVICE];
            case OutletType.CUSTOM:
            default:
                return [ProductType.GOODS, ProductType.SERVICE, ProductType.TICKET];
        }
    }, [selectedOutlet, isPlanMismatch]);

    const contextValue: OutletContextType = {
        selectedOutlet,
        selectedOutletId: selectedOutlet?.id || null,
        outlets,
        setSelectedOutlet: handleSetSelectedOutlet,
        isLoading,
        error: error?.message || null,
        refetch,
        allowedProductTypes,
        isPlanMismatch
    };

    return (
        <OutletContext.Provider value={contextValue}>
            {children}
        </OutletContext.Provider>
    );
}

export function useOutletContext() {
    const context = useContext(OutletContext);
    if (!context) {
        throw new Error('useOutletContext must be used within OutletProvider');
    }
    return context;
}