'use client';

import { createContext, useContext, useMemo } from 'react';
import { Outlet } from '@/types';

interface OutletContextType {
    selectedOutlet: Outlet | null;
    selectedOutletId: string | null;
    outlets: Outlet[];
    setSelectedOutlet: (outlet: Outlet | null) => void;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

const OutletContext = createContext<OutletContextType | null>(null);

interface CashierOutletProviderProps {
    children: React.ReactNode;
    outlet: Outlet | null;
}

/**
 * Provider khusus untuk kasir yang tidak perlu fetch outlets dari API
 * karena kasir hanya terkait dengan satu outlet tertentu
 */
export function CashierOutletProvider({ children, outlet }: CashierOutletProviderProps) {
    const contextValue: OutletContextType = useMemo(() => ({
        selectedOutlet: outlet,
        selectedOutletId: outlet?.id || null,
        outlets: outlet ? [outlet] : [],
        setSelectedOutlet: () => {
            // Kasir tidak bisa ganti outlet
            console.warn('Cashier cannot change outlet');
        },
        isLoading: false,
        error: null,
        refetch: () => {
            // No-op untuk kasir
        }
    }), [outlet]);

    return (
        <OutletContext.Provider value={contextValue}>
            {children}
        </OutletContext.Provider>
    );
}

export function useOutletContext() {
    const context = useContext(OutletContext);
    if (!context) {
        throw new Error('useOutletContext must be used within OutletProvider or CashierOutletProvider');
    }
    return context;
}
