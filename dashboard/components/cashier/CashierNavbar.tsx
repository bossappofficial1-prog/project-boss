"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShoppingBag, ShoppingCart, Package, Receipt, LayoutGrid, Ticket, Store } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { apiClient } from "@/lib/apis/base";
import { cn } from "@/lib/utils";
import ReceiptSetting from "../ReceiptSetting";
import { useOutletContext } from "../providers/CashierOutletProvider";
import { PrinterSettingDialog } from "./PrinterSettingDialog";

interface CashierNavbarProps {
  cashierName: string;
  outletName: string;
}

export function CashierNavbar({ cashierName, outletName }: CashierNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedOutletId } = useOutletContext();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cashier-auth-cache-v1");
      }
      queryClient.removeQueries({ queryKey: ["cashier-auth"] });
      toast.success("Logout berhasil");
      router.push("/auth/login/cashier");
    } catch (error) {
      console.error("Logout error:", error);
      toast.error("Gagal logout");
    }
  };

  const { data } = useQuery({
    queryKey: ['badge-count', selectedOutletId],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/v2/${selectedOutletId}/badge`);
      return res.data.data as {
        orderBadgeCount: number,
        serviceBadgeCount: number
      };
    },
    enabled: !!selectedOutletId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (previousData) => previousData,
  });

  const CASHIER_NAV_ITEMS = useMemo(() => [
    { href: "/cashier/pos", label: "POS", icon: ShoppingCart },
    { href: "/cashier/orders", badge: data?.orderBadgeCount, label: "Pesanan Barang", icon: ShoppingBag },
    { href: "/cashier/queue", badge: data?.serviceBadgeCount, label: "Antrian", icon: LayoutGrid },
    { href: "/cashier/pob", label: "POB", icon: Package },
    { href: "/cashier/ticket-scan", label: "Scan Tiket", icon: Ticket },
    { href: "/cashier/expenses", label: "Pengeluaran", icon: Receipt },
  ], [data]);

  useEffect(() => {
    CASHIER_NAV_ITEMS.forEach((item) => {
      router.prefetch(item.href);
    });
  }, [router]);

  return (
    <div className="sticky top-0 z-40 w-full flex flex-col bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b shadow-sm">
      {/* Top Header Row: Logo, Outlet Info, and Actions */}
      <div className="mx-auto flex w-full max-w-[1600px] h-16 items-center justify-between px-4 md:px-6">

        {/* Left: Brand / Info */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Store className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-base font-bold leading-tight text-foreground truncate max-w-[140px] md:max-w-[250px]">
              {outletName}
            </h1>
            <p className="text-[11px] md:text-xs font-medium text-muted-foreground truncate max-w-[140px] md:max-w-[250px]">
              Kasir: {cashierName}
            </p>
          </div>
        </div>

        {/* Center: Desktop Navigation */}
        <nav className="hidden lg:flex flex-1 items-center justify-center gap-1.5 px-6">
          {CASHIER_NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className={cn("h-4 w-4", isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground")} />
                <span>{item.label}</span>

                {/* Dynamic Badge Desktop */}
                {!!item.badge && item.badge > 0 && (
                  <span className={cn(
                    "ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold transition-colors",
                    isActive ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground"
                  )}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <PrinterSettingDialog />
          <ReceiptSetting outletId={selectedOutletId!} />
          <ThemeToggle />
          <Button onClick={handleLogout} variant="outline" size="sm" className="hidden sm:flex rounded-full px-4">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </Button>
          {/* Mobile Logout (Icon only) */}
          <Button onClick={handleLogout} variant="outline" size="icon" className="flex sm:hidden rounded-full h-9 w-9">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Bottom Header Row: Mobile Navigation (Scrollable) */}
      <nav className="lg:hidden flex items-center gap-2 overflow-x-auto px-4 py-2 border-t border-border/50 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {CASHIER_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "relative flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm ring-1 ring-primary/20"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>

              {/* Dynamic Badge Mobile */}
              {!!item.badge && item.badge > 0 && (
                <span className={cn(
                  "ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold",
                  isActive ? "bg-primary-foreground text-primary" : "bg-destructive text-destructive-foreground"
                )}>
                  {item.badge > 99 ? '99+' : item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}