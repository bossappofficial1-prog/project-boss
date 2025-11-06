'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useOutletsQuery } from '@/hooks/useOutlets';
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
    const { data, isLoading, error, refetch } = useOutletsQuery();
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);

    const outlets = (data?.outlets || []) as Outlet[];

    // Initialize selected outlet when outlets data is available
    useEffect(() => {
        if (outlets.length > 0 && !selectedOutlet) {
            const initialOutlet = getInitialSelectedOutlet(outlets);
            setSelectedOutlet(initialOutlet);
        }
    }, [outlets, selectedOutlet]);

    const handleSetSelectedOutlet = (outlet: Outlet | null) => {
        setSelectedOutlet(outlet);

        if (typeof window !== 'undefined') {
            if (outlet) {
                try {
                    localStorage.setItem('selectedOutlet', outlet.id);
                    localStorage.removeItem('selectedOutletId');
                } catch (error) {
                    console.error('Failed to save outlet to localStorage:', error);
                }
            } else {
                localStorage.removeItem('selectedOutlet');
                localStorage.removeItem('selectedOutletId');
            }
        }
    };

    const contextValue: OutletContextType = {
        selectedOutlet,
        selectedOutletId: selectedOutlet?.id || null,
        outlets,
        setSelectedOutlet: handleSetSelectedOutlet,
        isLoading,
        error: error?.message || null,
        refetch
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