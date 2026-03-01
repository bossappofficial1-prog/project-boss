"use client"
import BottomNav from "@/components/layouts/BottomNav";
import { FloatingCartButton } from "@/components/cart/CartDrawer";
import { AppToaster } from "@/components/ui/toast";
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { Suspense } from "react";
import { AppBarProviderV2 } from "@/context/AppBarContextV2";
import AppBar from "@/components/AppBarV2";
import { LoadingState } from "@/components/Base";
import { useState } from 'react'
import localforage from 'localforage';

const queryStorage = localforage.createInstance({
    name: 'boss-customer',
    storeName: 'reactQueryCache',
});

export default function AppLayout({ children }: { children: React.ReactNode }) {
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

    return (
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
            <AppBarProviderV2>
                <div className="flex flex-col min-h-screen">
                    <Suspense fallback={<LoadingState />}>
                        <AppBar />
                    </Suspense>
                    <main
                        style={{
                            paddingTop: 'var(--appbar-height, 0px)',
                            paddingBottom: 'var(--bottomnav-height, 0px)'
                        }}
                        className="flex-1 md:max-w-4xl w-full m-2 overflow-hidden p-3 overflow-x-auto mx-auto"
                    >
                        <Suspense fallback={<LoadingState />}>
                            {children}
                        </Suspense>
                    </main>
                    <AppToaster />
                    <FloatingCartButton />
                    <Suspense fallback={null}>
                        <BottomNav />
                    </Suspense>
                </div>
            </AppBarProviderV2>
        </PersistQueryClientProvider>
    );
}