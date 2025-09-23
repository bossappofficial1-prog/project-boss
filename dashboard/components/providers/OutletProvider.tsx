'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { authApi } from '@/lib/api';
import type { Outlet } from '@/types/dashboard';

interface OutletContextType {
    selectedOutlet: Outlet | null;
    outlets: Outlet[];
    setSelectedOutlet: (outlet: Outlet | null) => void;
    isLoading: boolean;
}

const OutletContext = createContext<OutletContextType | null>(null);

interface OutletProviderProps {
    children: React.ReactNode;
}

export function OutletProvider({ children }: OutletProviderProps) {
    const [outlets, setOutlets] = useState<Outlet[]>([]);
    const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchOutlets = async () => {
            try {
                setIsLoading(true);

                // Use authApi.me() instead of direct apiCall
                const response = await authApi.me();

                if (response.outlets) {
                    console.log('OutletProvider: Outlets fetched successfully:', response.outlets.length);
                    setOutlets(response.outlets);

                    // Set selected outlet from localStorage or default to first
                    const savedOutletId = localStorage.getItem('selectedOutletId');
                    console.log('OutletProvider: Saved outlet ID from localStorage:', savedOutletId);

                    if (savedOutletId) {
                        const savedOutlet = response.outlets.find((o: any) => o.id === savedOutletId);
                        if (savedOutlet) {
                            console.log('OutletProvider: Using saved outlet (found by ID):', savedOutlet);
                            setSelectedOutlet(savedOutlet);
                        } else {
                            console.log('OutletProvider: Saved outlet ID not found, using first outlet');
                            // Saved outlet doesn't exist, use first available
                            const firstOutlet = response.outlets[0];
                            setSelectedOutlet(firstOutlet);
                            localStorage.setItem('selectedOutletId', firstOutlet.id);
                        }
                    } else {
                        // Try to migrate from old format (selectedOutlet object)
                        const oldSavedOutlet = localStorage.getItem('selectedOutlet');
                        if (oldSavedOutlet) {
                            try {
                                const parsed = JSON.parse(oldSavedOutlet);
                                const exists = response.outlets.find((o: any) => o.id === parsed.id);
                                if (exists) {
                                    console.log('OutletProvider: Migrating from old format to outlet ID:', parsed.id);
                                    setSelectedOutlet(exists);
                                    localStorage.setItem('selectedOutletId', exists.id);
                                    localStorage.removeItem('selectedOutlet'); // Clean up old format
                                } else {
                                    const firstOutlet = response.outlets[0];
                                    setSelectedOutlet(firstOutlet);
                                    localStorage.setItem('selectedOutletId', firstOutlet.id);
                                    localStorage.removeItem('selectedOutlet');
                                }
                            } catch {
                                const firstOutlet = response.outlets[0];
                                setSelectedOutlet(firstOutlet);
                                localStorage.setItem('selectedOutletId', firstOutlet.id);
                                localStorage.removeItem('selectedOutlet');
                            }
                        } else if (response.outlets.length > 0) {
                            console.log('OutletProvider: No saved outlet, using first outlet');
                            // No saved outlet, use first
                            const firstOutlet = response.outlets[0];
                            setSelectedOutlet(firstOutlet);
                            localStorage.setItem('selectedOutletId', firstOutlet.id);
                        }
                    }
                } else {
                    console.log('OutletProvider: No outlets in response');
                }
            } catch (error) {
                console.error('Error fetching outlets:', error);

                // Fallback: check localStorage for previous outlet ID
                const savedOutletId = localStorage.getItem('selectedOutletId');
                if (savedOutletId) {
                    console.log('OutletProvider: Using cached outlet ID from localStorage:', savedOutletId);
                    // We can't reconstruct the full outlet object from just ID
                    // Let the UI show the loading state until a proper fetch succeeds
                }

                // Try old format as fallback
                const savedOutlet = localStorage.getItem('selectedOutlet');
                if (savedOutlet) {
                    try {
                        const parsed = JSON.parse(savedOutlet);
                        setSelectedOutlet(parsed);
                        setOutlets([parsed]); // Set as single outlet for now
                        // Migrate to new format
                        localStorage.setItem('selectedOutletId', parsed.id);
                        localStorage.removeItem('selectedOutlet');
                        console.log('OutletProvider: Using and migrating cached outlet from localStorage');
                    } catch {
                        console.log('OutletProvider: No valid cached outlet found');
                    }
                }

                // Don't throw error, allow app to continue
                // The socket and other features can still work without outlet data
            } finally {
                setIsLoading(false);
            }
        };

        fetchOutlets();
    }, []);

    const handleSetSelectedOutlet = (outlet: Outlet | null) => {
        console.log('OutletProvider: setSelectedOutlet called with:', outlet);
        setSelectedOutlet(outlet);
        if (typeof window !== 'undefined') {
            if (outlet) {
                try {
                    localStorage.setItem('selectedOutletId', outlet.id);
                    console.log('OutletProvider: Outlet ID saved to localStorage successfully:', outlet.id);
                    // Dispatch custom event for other components
                    window.dispatchEvent(new CustomEvent('outletChanged', {
                        detail: { outlet }
                    }));
                    console.log('OutletProvider: outletChanged event dispatched');
                } catch (error) {
                    console.error('OutletProvider: Failed to save outlet ID to localStorage:', error);
                }
            } else {
                console.log('OutletProvider: Outlet is null, removing from localStorage');
                localStorage.removeItem('selectedOutletId');
                // Also clean up old format
                localStorage.removeItem('selectedOutlet');
            }
        } else {
            console.warn('OutletProvider: Window not available (SSR)');
        }
    };

    const contextValue: OutletContextType = {
        selectedOutlet,
        outlets,
        setSelectedOutlet: handleSetSelectedOutlet,
        isLoading
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