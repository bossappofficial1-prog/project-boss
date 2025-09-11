"use client"
import BottomNav from "@/components/layouts/BottomNav";
import { FloatingCartButton } from "@/components/cart/CartDrawer";
import { AppToaster } from "@/components/ui/toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from "react";
import { AppBarProviderV2 } from "@/context/AppBarContextV2";
import AppBar from "@/components/AppBarV2";
import { LoadingState } from "@/components/Base";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <AppBarProviderV2>
                <div className="flex flex-col min-h-screen">
                    <AppBar />
                    <main
                        style={{
                            paddingTop: 'var(--appbar-height, 0px)',
                            paddingBottom: 'var(--bottomnav-height, 0px)'
                        }}
                        className="flex-1 lg:max-w-2xl w-full m-2 overflow-hidden p-3 overflow-x-auto mx-auto"
                    >
                        <Suspense fallback={<LoadingState />}>
                            {children}
                        </Suspense>
                    </main>
                    <AppToaster />
                    <FloatingCartButton />
                    <BottomNav />
                </div>
            </AppBarProviderV2>
        </QueryClientProvider>
    );
}