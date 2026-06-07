"use client";

import React, { useEffect, createContext, useContext, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import Image from "next/image";
import { authApi } from "@/lib/api";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import ManagerSidebar from "@/components/layouts/manager-sidebar";
import ManagerHeader from "@/components/layouts/manager-header";
import Loading from "@/components/ui/loading";
import { useOutletStore } from "@/stores/outlet.store";
import { OutletType, ProductType, type Outlet } from "@/types";

const MANAGER_SESSION_CACHE_KEY = "cashier-auth-cache-v1";

interface ManagerContextValue {
  managerData: any;
  outletData: any;
}

const ManagerContext = createContext<ManagerContextValue | null>(null);

export function useManagerContext() {
  const context = useContext(ManagerContext);
  if (!context) {
    throw new Error("useManagerContext must be used within ManagerLayout");
  }
  return context;
}

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: cashierData,
    isLoading: isLoadingAuth,
    isFetching: isFetchingAuth,
    isError: isManagerAuthError,
  } = useQuery({
    queryKey: ["cashier-auth"],
    queryFn: async () => authApi.cashierMe(),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Force background validation on mount to check for session expiration
    initialData: () => {
      if (typeof window === "undefined") return undefined;

      try {
        const rawData = sessionStorage.getItem(MANAGER_SESSION_CACHE_KEY);
        return rawData ? JSON.parse(rawData) : undefined;
      } catch {
        return undefined;
      }
    },
  });

  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const outletData = cashierData?.outlet as Outlet | undefined;

  useEffect(() => {
    if (!cashierData || typeof window === "undefined") return;

    try {
      sessionStorage.setItem(MANAGER_SESSION_CACHE_KEY, JSON.stringify(cashierData));
    } catch {
      // ignore
    }
  }, [cashierData]);

  useEffect(() => {
    if (isManagerAuthError) {
      toast.error("Sesi login tidak valid, silakan login kembali");
      if (typeof window !== "undefined") {
        window.location.href = "/auth/login/cashier";
      }
    }
  }, [isManagerAuthError]);

  useEffect(() => {
    if (cashierData && cashierData.role !== "MANAGER") {
      toast.error("Anda tidak memiliki akses ke area Manager");
      router.replace("/unauthorized");
    }
  }, [cashierData, router]);

  const allowedProductTypes = useMemo(() => {
    if (!outletData) return [ProductType.GOODS, ProductType.SERVICE, ProductType.TICKET];
    
    switch (outletData.type) {
      case OutletType.FNB:
      case OutletType.RETAIL:
        return [ProductType.GOODS];
      case OutletType.EVENT:
        return [ProductType.TICKET];
      case OutletType.SERVICE:
        return [ProductType.SERVICE];
      case OutletType.CUSTOM:
      default:
        return [ProductType.GOODS, ProductType.SERVICE, ProductType.TICKET];
    }
  }, [outletData]);

  // Set outlet data in Zustand store
  useEffect(() => {
    const store = useOutletStore.getState();
    if (outletData) {
      store.setSelectedOutlet(outletData);
    }
  }, [outletData]);

  const privilegesList = useMemo(() => {
    const rawPrivileges = cashierData?.privileges || [];
    return rawPrivileges.map((p: any) => p.privilege || p);
  }, [cashierData]);
  const hasPrivileges = privilegesList.length > 0;

  if (!mounted || ((isLoadingAuth || isFetchingAuth) && !cashierData)) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
        <div className="relative flex items-center justify-center">
          <span className="absolute h-20 w-20 animate-ping rounded-full bg-primary/20" />
          <div className="relative h-16 w-16 overflow-hidden rounded-xl shadow-md">
            <Image
              src="/icon-192x192.png"
              alt="Boss Logo"
              width={64}
              height={64}
              priority
            />
          </div>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-semibold tracking-tight text-foreground">Sistem Manager</span>
          <span className="text-sm text-muted-foreground animate-pulse">Memverifikasi sesi manager...</span>
        </div>
        <Toaster position="top-right" richColors toastOptions={{ duration: 5000 }} />
      </div>
    );
  }

  if (!cashierData || cashierData.role !== "MANAGER" || !outletData) {
    if (isManagerAuthError) {
      return (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-background">
          <div className="flex flex-col items-center gap-1">
            <span className="text-lg font-semibold tracking-tight text-foreground">
              Sesi Berakhir
            </span>
            <span className="text-sm text-muted-foreground animate-pulse">
              Mengalihkan ke halaman login...
            </span>
          </div>
        </div>
      );
    }
    return null;
  }

  return (
    <ManagerContext.Provider value={{ managerData: cashierData, outletData }}>
      <SidebarProvider defaultOpen={hasPrivileges}>
        {hasPrivileges && <ManagerSidebar />}
        <SidebarInset className="flex flex-col flex-1">
          <ManagerHeader />
          <main className="flex-1 overflow-auto bg-muted/50">
            <div className="w-full mx-auto max-w-400 p-4 md:p-6 animate-fade-in-up">
              {children}
            </div>
          </main>
        </SidebarInset>
        <Toaster position="top-right" richColors toastOptions={{ duration: 5000 }} />
      </SidebarProvider>
    </ManagerContext.Provider>
  );
}
