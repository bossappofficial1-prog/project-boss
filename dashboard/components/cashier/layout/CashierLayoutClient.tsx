"use client";

import React, { useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { LogOut, ShoppingBag } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Image from "next/image";
import { CashierNavbar } from "@/components/cashier/CashierNavbar";
import { CashierOutletProvider } from "@/components/providers/CashierOutletProvider";
import { authApi } from "@/lib/api";
import { apiClient } from "@/lib/apis/base";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { SocketCashierProvider } from "@/contexts/SocketCashierContext";
import { PrinterProvider } from "@/contexts/PrinterContext";

const CASHIER_SESSION_CACHE_KEY = "cashier-auth-cache-v1";

interface CashierContextValue {
  cashierData: any;
  outletData: any;
}

const CashierContext = createContext<CashierContextValue | null>(null);

export function useCashierContext() {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error("useCashierContext must be used within CashierLayout");
  }
  return context;
}

export default function CashierLayoutClient({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: cashierData,
    isLoading: isLoadingAuth,
    isFetching: isFetchingAuth,
    isError: isCashierAuthError,
  } = useQuery({
    queryKey: ["cashier-auth"],
    queryFn: async () => authApi.cashierMe(),
    staleTime: 5 * 60_000,
    gcTime: 30 * 60_000,
    retry: 1,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    initialData: () => {
      if (typeof window === "undefined") return undefined;

      try {
        const rawData = sessionStorage.getItem(CASHIER_SESSION_CACHE_KEY);
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

  const outletData = cashierData?.outlet;

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(CASHIER_SESSION_CACHE_KEY);
      }
      queryClient.removeQueries({ queryKey: ["cashier-auth"] });
      toast.success("Logout berhasil");
      router.push("/auth/login/cashier");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Gagal logout");
    }
  };

  useEffect(() => {
    if (!cashierData || typeof window === "undefined") return;

    try {
      sessionStorage.setItem(CASHIER_SESSION_CACHE_KEY, JSON.stringify(cashierData));
    } catch {
      // ignore session storage failures
    }
  }, [cashierData]);

  useEffect(() => {
    if (!isCashierAuthError) return;

    toast.error("Sesi login tidak valid, silakan login kembali");
    router.replace("/auth/login/cashier");
  }, [isCashierAuthError, router]);

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
          <span className="text-lg font-semibold tracking-tight text-foreground">Sistem Kasir</span>
          <span className="text-sm text-muted-foreground">Memuat data kasir...</span>
        </div>

        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>

        <Toaster position="top-right" richColors toastOptions={{ duration: 5000 }} />
      </div>
    );
  }

  if (!cashierData || !outletData) {
    return (
      <div className="min-h-screen text-slate-900 transition-colors dark:text-slate-50">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3">
            <div className="flex items-center gap-3">
              <ShoppingBag className="h-6 w-6 text-blue-600" />
              <div>
                <h1 className="text-lg font-semibold">Sistem Kasir</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <Button onClick={handleLogout} variant="outline" size="sm">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </header>
        <div className="flex h-[70vh] flex-col items-center justify-center gap-3 text-center">
          <ShoppingBag className="h-10 w-10 text-red-500" />
          <p className="text-lg font-semibold">Data outlet tidak ditemukan</p>
          <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
            Hubungi owner untuk mengatur akun kasir Anda.
          </p>
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
      </div>
    );
  }

  return (
    <SocketCashierProvider outletId={outletData.id}>
      <CashierOutletProvider outlet={outletData}>
        <CashierContext.Provider value={{ cashierData, outletData }}>
          <PrinterProvider>
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
              <CashierNavbar 
                cashierName={cashierData.name} 
                outletName={outletData.name} 
                outletType={outletData.type} 
              />
              <main>{children}</main>
            </div>
            <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
          </PrinterProvider>
        </CashierContext.Provider>
      </CashierOutletProvider>
    </SocketCashierProvider>
  );
}
