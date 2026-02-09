"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogOut, ShoppingBag, ShoppingCart, Users, Package, Receipt, Zap, LayoutGrid } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import ThemeToggle from "@/components/ThemeToggle";
import { apiClient } from "@/lib/apis/base";
import { cn } from "@/lib/utils";

interface CashierNavbarProps {
  cashierName: string;
  outletName: string;
}

const navItems = [
  { href: "/cashier/pos-v2", label: "POS", icon: Zap },
  { href: "/cashier/pos", label: "POS Lama", icon: ShoppingCart },
  { href: "/cashier/orders-v2", label: "Pesanan Barang", icon: ShoppingBag },
  { href: "/cashier/orders", label: "Pesanan Lama", icon: ShoppingBag },
  { href: "/cashier/queue-v2", label: "Antrian", icon: LayoutGrid },
  { href: "/cashier/queue", label: "Antrian Lama", icon: Users },
  { href: "/cashier/pob-v2", label: "POB", icon: Package },
  { href: "/cashier/pob", label: "POB Lama", icon: Package },
  { href: "/cashier/expenses", label: "Pengeluaran", icon: Receipt },
];

export function CashierNavbar({ cashierName, outletName }: CashierNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();

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
                  "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800",
                )}>
                <Icon className="h-4 w-4" />
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
