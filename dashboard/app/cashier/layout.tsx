"use client";

import React, { useEffect, useState, createContext, useContext } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { LogOut, ShoppingBag } from "lucide-react";

import { CashierNavbar } from "@/components/cashier/CashierNavbar";
import { SocketProvider } from "@/components/providers/SocketProvider";
import { CashierOutletProvider } from "@/components/providers/CashierOutletProvider";
import { authApi } from "@/lib/api";
import { apiClient } from "@/lib/apis/base";
import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";

// Context for cashier data
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

/**
 * Layout khusus kasir - handles auth and provides shared navbar
 */
export default function CashierLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [cashierData, setCashierData] = useState<any>(null);
  const [outletData, setOutletData] = useState<any>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      toast.success("Logout berhasil");
      router.push("/auth/login/cashier");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Gagal logout");
    }
  };

  // Fetch cashier data on mount
  useEffect(() => {
    const fetchCashierData = async () => {
      try {
        setIsLoadingAuth(true);
        const response = await authApi.cashierMe();
        setCashierData(response);

        if (response.outlet) {
          setOutletData(response.outlet);
        }
      } catch (error) {
        console.error("Failed to fetch cashier data:", error);
        toast.error("Sesi login tidak valid, silakan login kembali");
        router.push("/auth/login/cashier");
      } finally {
        setIsLoadingAuth(false);
      }
    };

    fetchCashierData();
  }, [router]);

  if (isLoadingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Memuat data kasir...</p>
        </div>
        <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
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
    <SocketProvider outletId={outletData.id}>
      <CashierOutletProvider outlet={outletData}>
        <CashierContext.Provider value={{ cashierData, outletData }}>
          <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <CashierNavbar cashierName={cashierData.name} outletName={outletData.name} />
            <main>{children}</main>
          </div>
          <Toaster position="top-right" toastOptions={{ duration: 5000 }} />
        </CashierContext.Provider>
      </CashierOutletProvider>
    </SocketProvider>
  );
}
