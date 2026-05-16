"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/owner/layout/Sidebar";
import Header from "@/components/owner/layout/Header";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { OutletProvider } from "@/components/providers/OutletProvider";
import { Toaster } from "sonner";
import { SidebarInset, SidebarProvider } from "../../ui/sidebar";
import { type UserRole } from "@/lib/auth";
import Loading from "../../ui/loading";
import { CommandSearch } from "../../ui/command-search";
import { useRouter } from "next/navigation";

interface LayoutProps {
  children: React.ReactNode;
  requiredRole?: UserRole | UserRole[];
}

export default function DashboardLayout({
  children,
  requiredRole,
}: LayoutProps) {
  const [mounted, setMounted] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const router = useRouter();
  const { loading: isLoading } = useAuthGuard({
    requiredRole,
    onboardingCheck: true,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === "k" ||
          event.key === "K" ||
          event.key === "f" ||
          event.key === "F")
      ) {
        event.preventDefault();
        setCommandOpen((open) => !open);
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === "p" || event.key === "P")
      ) {
        event.preventDefault();
        router.push("/owner/profile");
      }

      if (
        (event.metaKey || event.ctrlKey) &&
        (event.key === "s" || event.key === "S")
      ) {
        event.preventDefault();
        router.push("/owner/settings");
      }

      if (event.key === "Escape") {
        setCommandOpen(false);
      }
    };

    window.addEventListener("keydown", handler);

    return () => {
      window.removeEventListener("keydown", handler);
    };
  }, []);

  if (!mounted || isLoading) return <Loading />;

  return (
    <OutletProvider>
      <SidebarProvider defaultOpen={true}>
        <Sidebar />
        <SidebarInset className="flex flex-col flex-1">
          <Header />

          {/* Main Content with Responsive Padding */}
          <main className="flex-1 overflow-auto bg-muted/50">
            <div className="w-full mx-auto max-w-400 p-4 md:p-6">
              {children}
            </div>
          </main>
        </SidebarInset>

        <Toaster
          position="top-right"
          richColors
          toastOptions={{
            duration: 5000,
          }}
        />
        <CommandSearch open={commandOpen} setOpen={setCommandOpen} />
      </SidebarProvider>
    </OutletProvider>
  );
}
