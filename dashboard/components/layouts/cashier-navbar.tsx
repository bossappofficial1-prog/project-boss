"use client";

import React, { useEffect, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LogOut,
  ShoppingBag,
  ShoppingCart,
  Package,
  Receipt,
  LayoutGrid,
  Ticket,
  Store,
  Table2,
  ChefHat,
  CalendarClock,
  UserPlus,
  ScanLine,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/theme-toggle";
import { apiClient } from "@/lib/apis/base";
import { cn } from "@/lib/utils";
import { PrinterSettings } from "@/components/printer-settings";
import { useOutletStore } from "@/stores/outlet.store";
import { OutletType } from "@/types";
import {
  useActiveCashierShift,
  useCloseCashierShift,
} from "@/hooks/api/use-cashier-shifts";
import { useCashierContext } from "@/components/layouts";
import { ReusableForm } from "@/components/ui/reuseable-form";
import { NotificationToggle } from "./notification-toggle";
import {
  closeShiftSchema,
  type CloseShiftValues,
} from "@/lib/validations/cashier-shift.schema";
import { SwitchAccountDialog } from "./switch-account-dialog";
import { QuickStockInDialog } from "./quick-stock-in-dialog";

interface CashierNavbarProps {
  cashierName: string;
  cashierUsername: string;
  outletName: string;
  outletType?: OutletType;
}

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  requiredTypes?: OutletType[];
  onClick?: () => void;
  requirePro?: boolean;
}

function NavBadge({ count, active }: { count: number; active: boolean }) {
  if (!count || count <= 0) return null;
  return (
    <span
      className={cn(
        "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none",
        active
          ? "bg-primary-foreground text-primary"
          : "bg-destructive text-destructive-foreground",
      )}
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function CashierNavbar({
  cashierName,
  cashierUsername,
  outletName,
  outletType = OutletType.CUSTOM,
}: CashierNavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { selectedOutletId, selectedOutlet } = useOutletStore();
  const [shiftDialogOpen, setShiftDialogOpen] = React.useState(false);
  const [switchDialogOpen, setSwitchDialogOpen] = React.useState(false);
  const [stockInOpen, setStockInOpen] = React.useState(false);

  const { cashierData } = useCashierContext();
  const cashierId = cashierData?.id as string | undefined;
  const outletIdForShift = selectedOutletId ?? undefined;
  const { data: activeShift } = useActiveCashierShift(outletIdForShift);
  const closeShift = useCloseCashierShift(outletIdForShift);

  const { data: badgeData } = useQuery({
    queryKey: ["badge-count", selectedOutletId],
    queryFn: async () => {
      const res = await apiClient.get(`/orders/v2/${selectedOutletId}/badge`);
      return res.data.data as {
        orderBadgeCount: number;
        serviceBadgeCount: number;
      };
    },
    enabled: !!selectedOutletId,
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    placeholderData: (prev) => prev,
  });

  const hasProAccess = ["TRIAL", "PRO", "ENTERPRISE"].includes(
    (selectedOutlet as any)?.business?.subscriptionPlan?.toUpperCase() || "BASIC"
  );

  const navItems = React.useMemo<NavItem[]>(() => {
    const items: NavItem[] = [
      { href: "/cashier/pos", label: "POS", icon: ShoppingCart },
      {
        href: "/cashier/orders",
        label: "Pesanan",
        icon: ShoppingBag,
        badge: badgeData?.orderBadgeCount,
        requiredTypes: [OutletType.RETAIL, OutletType.EVENT, OutletType.FNB, OutletType.CUSTOM],
      },
      {
        href: "/cashier/tables",
        label: "Meja",
        icon: Table2,
        requiredTypes: [OutletType.FNB],
        requirePro: true,
      },
      {
        href: "/cashier/reservations",
        label: "Reservasi",
        icon: CalendarClock,
        requiredTypes: [OutletType.FNB],
        requirePro: true,
      },
      {
        href: "/cashier/queue",
        label: "Antrian",
        icon: LayoutGrid,
        badge: badgeData?.serviceBadgeCount,
        requiredTypes: [OutletType.SERVICE, OutletType.CUSTOM],
      },
      {
        href: `/kitchen/${selectedOutletId}`,
        label: "KDS",
        icon: ChefHat,
        requiredTypes: [OutletType.FNB, OutletType.CUSTOM],
      },
      {
        href: "/cashier/pob",
        label: "POB",
        icon: Package,
        requiredTypes: [OutletType.RETAIL, OutletType.CUSTOM],
      },
      {
        href: "#",
        label: "Stok Masuk",
        icon: ScanLine,
        requiredTypes: [OutletType.RETAIL, OutletType.CUSTOM],
        onClick: () => setStockInOpen(true),
      },
      {
        href: "/cashier/ticket-scan",
        label: "Tiket",
        icon: Ticket,
        requiredTypes: [OutletType.EVENT, OutletType.CUSTOM],
      },
      { href: "/cashier/expenses", label: "Pengeluaran", icon: Receipt },
    ];
    return items.filter(
      (item) =>
        (!item.requiredTypes || item.requiredTypes.includes(outletType)) &&
        (!item.requirePro || hasProAccess),
    );
  }, [badgeData, outletType, selectedOutletId, hasProAccess]);

  useEffect(() => {
    navItems.forEach((item) => router.prefetch(item.href));
  }, [router, navItems]);

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem("cashier-auth-cache-v1");
      }
      queryClient.removeQueries({ queryKey: ["cashier-auth"] });
      toast.success("Logout berhasil");
      router.push("/auth/login/cashier");
    } catch {
      toast.error("Gagal logout");
    }
  };

  const isRetailWithShift = outletType === OutletType.RETAIL && activeShift;

  return (
    <>
      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="mx-auto flex h-14 w-full max-w-400 items-center justify-between gap-4 px-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Store className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold tracking-tight text-foreground truncate max-w-[75px] xs:max-w-[120px] sm:max-w-[200px]">
                  {outletName}
                </span>
                <Badge
                  variant="secondary"
                  className="shrink-0 h-4 px-1.5 text-[9px] font-bold bg-primary/10 text-primary border-none rounded-sm"
                >
                  {outletType}
                </Badge>
              </div>
              <p className="text-[10px] text-muted-foreground truncate max-w-30 sm:max-w-50">
                {cashierName}
              </p>
            </div>
          </div>

          {/* Desktop Nav — center */}
          <nav className="hidden lg:flex flex-1 items-center justify-center gap-0.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              if (item.onClick) {
                return (
                  <button
                    key={item.href}
                    onClick={item.onClick}
                    type="button"
                    className={cn(
                      "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                      "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              }
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{item.label}</span>
                  <NavBadge count={item.badge ?? 0} active={isActive} />
                </Link>
              );
            })}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {isRetailWithShift && (
              <>
                <Badge
                  variant="secondary"
                  className="hidden md:inline-flex h-6 px-2 text-[10px] font-bold bg-emerald-500/10 text-emerald-600 border-none rounded-sm"
                >
                  Shift Open
                </Badge>
                <Button
                  onClick={() => setShiftDialogOpen(true)}
                  variant="outline"
                  size="sm"
                  className="hidden sm:flex h-8 rounded-md text-xs"
                >
                  Tutup Shift
                </Button>
                <ReusableForm<CloseShiftValues>
                  withDialog
                  isDialogOpen={shiftDialogOpen}
                  onDialogOpenChange={setShiftDialogOpen}
                  dialogTitle="Tutup Shift"
                  dialogDescription="Masukkan cash akhir untuk menutup shift."
                  schema={closeShiftSchema}
                  defaultValues={{ closingCash: 0, notes: "" }}
                  onSubmit={async (values) => {
                    await closeShift.mutateAsync({
                      shiftId: activeShift.id,
                      closingCash: values.closingCash,
                      notes: values.notes,
                    });
                    toast.success("Shift berhasil ditutup");
                    setShiftDialogOpen(false);
                  }}
                  fields={[
                    {
                      name: "closingCash",
                      label: "Closing Cash",
                      type: "currency",
                      colSpan: "full",
                    },
                    {
                      name: "notes",
                      label: "Catatan (opsional)",
                      type: "textarea",
                      colSpan: "full",
                    },
                  ]}
                  submitText="Tutup Shift"
                  loadingText="Menutup..."
                  isLoading={closeShift.isPending}
                  errorSummary
                />
              </>
            )}
            <NotificationToggle staffId={cashierId} />
            <PrinterSettings outletId={selectedOutletId!} />
            <Button
              variant="ghost"
              size="icon"
              asChild
              className="text-primary hover:bg-primary/10 hover:text-primary rounded-md h-8 w-8"
            >
              <Link href="/help?portal=cashier" target="_blank" title="Panduan Penggunaan">
                <HelpCircle className="h-4 w-4" />
                <span className="sr-only">Panduan Penggunaan</span>
              </Link>
            </Button>
            <ThemeToggle />
            <Button
              onClick={() => setSwitchDialogOpen(true)}
              variant="ghost"
              size="sm"
              className="hidden sm:flex h-8 gap-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground"
            >
              <UserPlus className="h-3.5 w-3.5" />
              Ganti Akun
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="sm"
              className="hidden sm:flex h-8 gap-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground"
            >
              <LogOut className="h-3.5 w-3.5" />
              Logout
            </Button>
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="flex sm:hidden h-8 w-8 rounded-md text-muted-foreground"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <SwitchAccountDialog
        open={switchDialogOpen}
        onOpenChange={setSwitchDialogOpen}
        currentUsername={cashierUsername}
      />

      <QuickStockInDialog
        open={stockInOpen}
        onOpenChange={setStockInOpen}
        outletId={selectedOutletId || ""}
      />

      {/* ── Mobile Bottom Nav ── */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border/50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
        <div className="flex items-center overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            if (item.onClick) {
              return (
                <button
                  key={item.href}
                  onClick={item.onClick}
                  type="button"
                  className={cn(
                    "relative flex flex-1 shrink-0 flex-col items-center justify-center gap-1 py-2.5 px-2 min-w-16 transition-colors",
                    "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium leading-none">
                    {item.label}
                  </span>
                </button>
              );
            }
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-1 shrink-0 flex-col items-center justify-center gap-1 py-2.5 px-2 min-w-16 transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <div className="relative">
                  <Icon className="h-5 w-5" />
                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[9px] font-bold text-destructive-foreground">
                      {item.badge > 99 ? "99+" : item.badge}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium leading-none">
                  {item.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-6 rounded-full bg-primary" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
