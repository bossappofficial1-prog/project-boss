"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShoppingBag, ShoppingCart, Package, Receipt, Zap, LayoutGrid, Ticket, CreditCard } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { apiClient } from "@/lib/apis/base";
import { cn } from "@/lib/utils";
import ReceiptSetting from "../ReceiptSetting";
import { useOutletContext } from "../providers/CashierOutletProvider";
import { Badge } from "../ui/badge";
import { QueryClient, useQuery } from "@tanstack/react-query";

interface CashierNavbarProps {
  cashierName: string;
  outletName: string;
}

const navItems = [
  { href: "/cashier/pos", label: "POS", icon: ShoppingCart },
  { href: "/cashier/orders", badge: 0, label: "Pesanan Barang", icon: ShoppingBag },
  { href: "/cashier/queue", badge: 0, label: "Antrian", icon: LayoutGrid },
  { href: "/cashier/pob", label: "POB", icon: Package },
  { href: "/cashier/ticket-scan", label: "Scan Tiket", icon: Ticket },
  { href: "/cashier/expenses", label: "Pengeluaran", icon: Receipt },
];

export function CashierNavbar({ cashierName, outletName }: CashierNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { selectedOutletId } = useOutletContext()

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

  const { data } = useQuery({
    queryKey: ['badge-count', selectedOutletId],
    queryFn: async () => (await apiClient.get(`/orders/v2/${selectedOutletId}/badge`)).data.data as {
      orderBadgeCount: number,
      serviceBadgeCount: number
    },
    enabled: !!selectedOutletId
  })

  const navItems = useMemo(() => [
    { href: "/cashier/pos", label: "POS", icon: ShoppingCart },
    { href: "/cashier/orders", badge: data?.orderBadgeCount, label: "Pesanan Barang", icon: ShoppingBag },
    { href: "/cashier/queue", badge: data?.serviceBadgeCount, label: "Antrian", icon: LayoutGrid },
    { href: "/cashier/pob", label: "POB", icon: Package },
    { href: "/cashier/ticket-scan", label: "Scan Tiket", icon: Ticket },
    { href: "/cashier/expenses", label: "Pengeluaran", icon: Receipt },
  ], [data]);

  useEffect(() => {
    console.log('badge data updated', data)
  }, [data])

  return (
    <header className="sticky top-0 z-10 border-b border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between px-4 py-3">
        {/* Left: Logo and outlet info */}
        <div className="flex items-center gap-3">
          <ShoppingBag className="h-6 w-6 text-blue-600" />
          <div>
            <h1 className="text-lg font-semibold">{outletName}</h1>
            <p className="text-xs text-slate-600 dark:text-slate-400">Kasir: {cashierName}</p>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center relative gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                )}>
                <Icon className="h-4 w-4" />
                {!!item.badge && item.badge > 0 && (
                  <Badge className="absolute -top-0 -right-1 w-5 h-5 text-[0.8em] rounded-full flex items-center justify-center">
                    {item.badge > 99 ? 99 + '+' : item.badge}
                  </Badge>
                )}
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          {/* Mobile menu */}
          <nav className="flex items-center gap-1 md:hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center justify-center rounded-lg p-2 transition-colors",
                    isActive
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                  )}
                  title={item.label}>
                  <Icon className="h-5 w-5" />
                </Link>
              );
            })}
          </nav>
          <ReceiptSetting outletId={selectedOutletId!} />
          <ThemeToggle />
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Logout</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
