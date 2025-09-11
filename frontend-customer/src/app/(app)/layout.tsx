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
                    <main className="flex-1 pb-16 md:pb-20 pt-[72px] lg:max-w-2xl w-full overflow-hidden overflow-x-auto p-4 mx-auto overflow-y-auto">
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