'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import type { Outlet } from '@/types/dashboard';

interface OutletContextType {
    selectedOutlet: Outlet | null;
    selectedOutletId: string | null;
    outlets: Outlet[];
    setSelectedOutlet: (outlet: Outlet | null) => void;
    isLoading: boolean;
    error: string | null;
    refetch: () => Promise<void>;
}

const OutletContext = createContext<OutletContextType | null>(null);

interface OutletProviderProps {
    children: React.ReactNode;
}

export function OutletProvider({ children }: OutletProviderProps) {
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchOutlets = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await authApi.me();

            if (response.outlets) {
                setOutlets(response.outlets);

                const savedOutletId = localStorage.getItem('selectedOutlet');

                if (savedOutletId) {
                    const savedOutlet = response.outlets.find((o: any) => o.id === savedOutletId);
                    if (savedOutlet) {
                        setSelectedOutlet(savedOutlet);
                    } else {
                        const firstOutlet = response.outlets[0];
                        setSelectedOutlet(firstOutlet);
                        localStorage.setItem('selectedOutlet', firstOutlet.id);
                    }
                } else {
                    const oldSavedOutlet = localStorage.getItem('selectedOutletId');
                    if (oldSavedOutlet) {
                        try {
                            const exists = response.outlets.find((o: any) => o.id === oldSavedOutlet);
                            if (exists) {
                                setSelectedOutlet(exists);
                                localStorage.setItem('selectedOutlet', exists.id);
                                localStorage.removeItem('selectedOutletId');
                            } else {
                                const parsed = JSON.parse(oldSavedOutlet);
                                const existsParsed = response.outlets.find((o: any) => o.id === parsed.id);
                                if (existsParsed) {
                                    setSelectedOutlet(existsParsed);
                                    localStorage.setItem('selectedOutlet', existsParsed.id);
                                    localStorage.removeItem('selectedOutletId');
                                } else {
                                    const firstOutlet = response.outlets[0];
                                    setSelectedOutlet(firstOutlet);
                                    localStorage.setItem('selectedOutlet', firstOutlet.id);
                                    localStorage.removeItem('selectedOutletId');
                                }
                            }
                        } catch {
                            const firstOutlet = response.outlets[0];
                            setSelectedOutlet(firstOutlet);
                            localStorage.setItem('selectedOutlet', firstOutlet.id);
                            localStorage.removeItem('selectedOutletId');
                        }
                    } else if (response.outlets.length > 0) {
                        const firstOutlet = response.outlets[0];
                        setSelectedOutlet(firstOutlet);
                        localStorage.setItem('selectedOutlet', firstOutlet.id);
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching outlets:', error);

            const savedOutletOld = localStorage.getItem('selectedOutletId');
            if (savedOutletOld) {
                try {
                    const parsed = JSON.parse(savedOutletOld);
                    if (parsed && parsed.id) {
                        setSelectedOutlet(parsed);
                        setOutlets([parsed]);
                        localStorage.setItem('selectedOutlet', parsed.id);
                        localStorage.removeItem('selectedOutletId');
                    }
                } catch {
                    // Handle plain ID format silently
                }
            }
            setError('Failed to fetch outlets');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOutlets();
    }, []);

    const handleSetSelectedOutlet = (outlet: Outlet | null) => {
        console.log(`🔄 OutletProvider: handleSetSelectedOutlet called with outlet:`, outlet?.id || 'null');
        console.log(`🔄 OutletProvider: Previous selectedOutlet:`, selectedOutlet?.id || 'null');

        setSelectedOutlet(outlet);

        console.log(`🔄 OutletProvider: State updated, new selectedOutlet:`, outlet?.id || 'null');

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
        error,
        refetch: fetchOutlets
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