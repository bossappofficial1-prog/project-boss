"use client"
import BottomNav from "@/components/layouts/BottomNav";
import { FloatingCartButton } from "@/components/cart/CartDrawer";
import { AppToaster } from "@/components/ui/toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from "react";
import { AppBarProviderV2 } from "@/context/AppBarContextV2";
import AppBar from "@/components/AppBarV2";
import { LoadingState } from "@/components/Base";
import { OfflineOverlay } from "@/components/OfflineOverlay";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
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
                        <OfflineOverlay>
                            <Suspense fallback={<LoadingState />}>
                                {children}
                            </Suspense>
                        </OfflineOverlay>
                    </main>
                    <AppToaster />
                    <FloatingCartButton />
                    <BottomNav />
                </div>
            </AppBarProviderV2>
        </QueryClientProvider>
    );
}