'use client'

import React, { useEffect, useState } from "react";
import LoadingEffect from "@/components/shared/LoadingEffect";
import dynamic from 'next/dynamic';
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { QueryClient } from "@tanstack/react-query";
import { createAsyncStoragePersister } from "@tanstack/query-async-storage-persister";
import localforage from 'localforage';

const OnboardingModal = dynamic(() => import('../onboarding/OnboardingModal'), { ssr: false, loading: () => null });
const PWAInstallPrompt = dynamic(() => import('../PWAInstallPrompt'), { ssr: false, loading: () => null });
const OnlineStatusIndicator = dynamic(() => import('../OnlineStatusIndicator'), { ssr: false, loading: () => null });

type RootLayoutProps = {
    children: React.ReactNode;
    fallback?: React.ReactNode;
    minDuration?: number;
    onLoaded?: () => void;
};

const queryStorage = localforage.createInstance({
    name: 'boss-customer',
    storeName: 'reactQueryCache',
});

export default function RootLayout({
    children,
    fallback,
    minDuration = 300,
    onLoaded,
}: RootLayoutProps) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                networkMode: 'offlineFirst',
                staleTime: 1000 * 60 * 5,
                gcTime: 1000 * 60 * 10,
                refetchOnWindowFocus: false,
                retry: 2,
            },
            mutations: {
                retry: 0,
            }
        },
    }));

    const [persister] = useState(() => createAsyncStoragePersister({
        storage: queryStorage,
        key: 'boss-react-query',
        throttleTime: 1000,
        serialize: JSON.stringify,
        deserialize: JSON.parse,
    }));
    const [loading, setLoading] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        let mounted = true;
        try {
            const seen = localStorage.getItem("hasSeenOnboarding");
            if (!seen) {
                const id = setTimeout(() => {
                    if (mounted) setShowOnboarding(true);
                }, 1500);
                return () => {
                    mounted = false;
                    clearTimeout(id);
                };
            }
        } catch {
            const id = setTimeout(() => {
                if (mounted) setShowOnboarding(true);
            }, 1500);
            return () => {
                mounted = false;
                clearTimeout(id);
            };
        }
    }, []);

    // removed waiting for window.load so the page can render quickly and
    // avoid a render-blocking overlay that negatively impacts LCP.

    const defaultFallback = (
        // keep a minimal fallback markup for API compatibility; not shown by default
        <div aria-live="polite" role="status" style={{ position: 'absolute', top: 0, left: 0 }}>
            <LoadingEffect standalone />
        </div>
    );

    const handleCompleteOnboarding = () => {
        try {
            localStorage.setItem("hasSeenOnboarding", "1");
        } catch { }
        setShowOnboarding(false);
    };

    const handleCloseOnboarding = () => {
        // Only close the modal, don't mark as seen.
        // The user will see it again on next visit unless they complete it.
        setShowOnboarding(false);
    };

    return (
        <div style={{ minHeight: "100vh", position: "relative" }}>
            <div className="bg-[var(--bg)] text-[var(--fg)]">
                <PersistQueryClientProvider
                    client={queryClient}
                    persistOptions={{
                        persister,
                        buster: 'rq-v1',
                        maxAge: 1000 * 60 * 60 * 24,
                        dehydrateOptions: {
                            shouldDehydrateQuery: (query) => query.state.status === 'success',
                        },
                    }}
                    onSuccess={() => {
                        queryClient.resumePausedMutations().catch(() => undefined);
                    }}
                >
                    {children}
                </PersistQueryClientProvider>
            </div>

            {/* loading overlay is disabled by default to improve LCP. */}

            {/* onboarding modal shown after initial load (or you can show immediately by removing !loading) */}
            {!loading && (
                <OnboardingModal
                    open={showOnboarding}
                    onComplete={handleCompleteOnboarding}
                    onClose={handleCloseOnboarding}
                />
            )}

            {/* PWA Install Prompt */}
            <PWAInstallPrompt />

            {/* Online Status Indicator */}
            <OnlineStatusIndicator />
        </div>
    );
}

/* ---------- Inline styles (kept simple so no extra CSS files needed) ---------- */

const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.5))",
    zIndex: 9999,
    flexDirection: "column",
};