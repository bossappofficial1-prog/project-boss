"use client"
import BottomNav from "@/components/layouts/BottomNav";
import { FloatingCartButton } from "@/components/cart/CartDrawer";
import { AppToaster } from "@/components/ui/toast";
import { Suspense } from "react";
import { AppBarProviderV2 } from "@/context/AppBarContextV2";
import AppBar from "@/components/AppBarV2";
import { LoadingState } from "@/components/Base";
import { NavigationProgress } from "@/components/shared/NavigationProgress";

export default function AppLayout({ children }: { children: React.ReactNode }) {

    return (
        <AppBarProviderV2>
            <Suspense fallback={null}>
                <NavigationProgress />
            </Suspense>
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
    );
}