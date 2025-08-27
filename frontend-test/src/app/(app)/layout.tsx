"use client"
import BottomNav from "@/components/layouts/BottomNav";
import { FloatingCartButton } from "@/components/cart/CartDrawer";
import { ThemeProvider } from "next-themes";
import { AppToaster } from "@/components/ui/toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppBarProvider } from "@/context/AppBarContext";
import GlobalAppBar from "@/components/shared/GlobalAppBar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
    const queryClient = new QueryClient();
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider attribute="class">
                <AppBarProvider>
                    <GlobalAppBar />
                    <main className="lg:max-w-2xl min-h-[calc(100vh-56px)] p-4 mx-auto">{children}</main>
                    <AppToaster />
                    <FloatingCartButton />
                    <BottomNav />
                    {/* </div> */}
                </AppBarProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}