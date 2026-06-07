"use client";

import React, { useEffect, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { LogOut, ShoppingBag } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import Image from "next/image";
import { CashierNavbar } from "@/components/layouts";
import { useOutletStore } from "@/stores/outlet.store";
import { authApi } from "@/lib/api";
import { apiClient } from "@/lib/apis/base";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/theme-toggle";
import { SocketCashierProvider } from "@/contexts/SocketCashierContext";
// Printer store is used directly via usePrinterStore
import { FeatureGuideOverlay } from "@/features/guides/components/feature-guide-overlay";

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

export default function CashierLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
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
    refetchOnMount: true, // Force background validation on mount to check for session expiration
  });

  const [mounted, setMounted] = React.useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log(
            "Service Worker registered in dashboard with scope:",
            reg.scope,
          );
        })
        .catch((err) => {
          console.error("Dashboard Service Worker registration failed:", err);
        });
    }
  }, []);

  // Online/Offline Background Auto Sync for Offline POS Orders
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = async () => {
      const OFFLINE_ORDERS_KEY = "boss_offline_orders_v2";
      const raw = localStorage.getItem(OFFLINE_ORDERS_KEY);
      if (!raw) return;

      try {
        const orders = JSON.parse(raw);
        if (orders.length === 0) return;

        toast.info(
          `Koneksi kembali terhubung! Sinkronisasi ${orders.length} transaksi offline sedang berjalan... 📡`,
        );

        let successCount = 0;
        const remainingOrders = [];

        const { posV2Api } = await import("@/lib/apis/pos-v2");

        for (const order of orders) {
          try {
            const { offlineId, ...cleanOrder } = order;
            await posV2Api.createOrder(cleanOrder);
            successCount++;
          } catch (err) {
            console.error(
              "Gagal sinkronisasi satu transaksi, akan dicoba nanti:",
              err,
            );
            remainingOrders.push(order);
          }
        }

        if (remainingOrders.length > 0) {
          localStorage.setItem(
            OFFLINE_ORDERS_KEY,
            JSON.stringify(remainingOrders),
          );
        } else {
          localStorage.removeItem(OFFLINE_ORDERS_KEY);
        }

        if (successCount > 0) {
          toast.success(
            `Sukses! ${successCount} transaksi offline berhasil disinkronisasikan ke server. 🎉`,
          );
          queryClient.invalidateQueries({ queryKey: ["pos-v2"] });
        }
      } catch (e) {
        console.error("Kesalahan sinkronisasi transaksi offline:", e);
      }
    };

    window.addEventListener("online", handleOnline);
    if (navigator.onLine) {
      handleOnline();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }, [queryClient]);

  const outletData = cashierData?.outlet;

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(CASHIER_SESSION_CACHE_KEY);
        localStorage.removeItem(CASHIER_SESSION_CACHE_KEY);
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
      const dataStr = JSON.stringify(cashierData);
      sessionStorage.setItem(CASHIER_SESSION_CACHE_KEY, dataStr);
      localStorage.setItem(CASHIER_SESSION_CACHE_KEY, dataStr);
    } catch {
      // ignore session storage failures
    }
  }, [cashierData]);

  useEffect(() => {
    if (!isCashierAuthError) return;

    if (typeof window !== "undefined") {
      // Jangan redirect jika sedang offline
      if (!navigator.onLine) {
        toast.warning(
          "Koneksi internet terputus. Menggunakan sesi kasir lokal.",
        );
        return;
      }

      // Ambil error response status jika ada (dari Axios / Fetch)
      const err = isCashierAuthError as any;
      const status = err?.response?.status || err?.status;

      // Jika error bukan karena 401/403 (misalnya Network Error / DNS Error / Server down), jangan paksa logout
      if (status && status !== 401 && status !== 403) {
        toast.warning(
          "Gagal memperbarui sesi kasir dari server. Menggunakan sesi lokal.",
        );
        return;
      }

      // Jika memang tidak ada status (misal Axios Network Error karena putus koneksi di tengah jalan), jangan paksa redirect
      if (!status && err?.message?.toLowerCase().includes("network error")) {
        toast.warning(
          "Gagal memperbarui sesi kasir karena masalah jaringan. Menggunakan sesi lokal.",
        );
        return;
      }

      toast.error("Sesi login tidak valid, silakan login kembali");
      window.location.href = "/auth/login/cashier";
    }
  }, [isCashierAuthError]);

  // Set outlet in Zustand store
  useEffect(() => {
    if (!outletData) return;
    const store = useOutletStore.getState();
    store.setSelectedOutlet(outletData as any);
  }, [outletData]);

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
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Sistem Kasir
          </span>
          <span className="text-sm text-muted-foreground">
            Memuat data kasir...
          </span>
        </div>

        <div className="h-1 w-40 overflow-hidden rounded-full bg-muted">
          <div className="h-full w-full animate-[loading_1.5s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>

        <Toaster
          position="top-right"
          richColors
          toastOptions={{ duration: 5000 }}
        />
      </div>
    );
  }

  if (!cashierData || !outletData) {
    if (isCashierAuthError) {
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

    return (
      <div className="min-h-screen text-slate-900 transition-colors dark:text-slate-50">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="mx-auto flex max-w-375 items-center justify-between px-4 py-3">
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
    <>
      <FeatureGuideOverlay />
      <SocketCashierProvider outletId={outletData.id}>
        <CashierContext.Provider value={{ cashierData, outletData }}>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <CashierNavbar
              cashierName={cashierData.name}
              cashierUsername={cashierData.username}
              outletName={outletData.name}
              outletType={outletData.type}
            />
            <main>{children}</main>
          </div>
          <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
        </CashierContext.Provider>
      </SocketCashierProvider>
    </>
  );
}
