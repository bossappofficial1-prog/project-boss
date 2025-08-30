"use client"
import BottomNav from "@/components/layouts/BottomNav";
import { FloatingCartButton } from "@/components/cart/CartDrawer";
import { ThemeProvider } from "next-themes";
import { AppToaster } from "@/components/ui/toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Suspense } from "react";
import { AppBarProviderV2 } from "@/context/AppBarContextV2";
import AppBar from "@/components/AppBarV2";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class">
                <AppBarProviderV2>
                    <AppBar />
                    <main className="lg:max-w-2xl min-h-[calc(100vh-56px)] p-4 mx-auto">
                        <Suspense fallback={<div>Loading...</div>}>
                            {children}
                        </Suspense>
                    </main>
                    <AppToaster />
                    <FloatingCartButton />
                </AppBarProviderV2>
                <BottomNav />
            </ThemeProvider>
        </QueryClientProvider>
    );
}