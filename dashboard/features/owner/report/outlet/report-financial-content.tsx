"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Users,
  Receipt,
  Loader2,
  Package,
  Info,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  useReportOutlet,
  useCompareOutletsReport,
  useReportStaff,
} from "@/hooks/use-report";
import { useOutletStore } from "@/stores/outlet.store";
import { DataTable } from "@/components/ui/data-table";
import { ReportFinancialTable, Totals } from "./report-financial-table";
import { ReportStaffTable } from "../staff/report-staff-table";
import { Sparkline } from "../sparkline";
import { formatCurrency, cn } from "@/lib/utils";
import reportApi from "@/lib/apis/report";
import { format } from "date-fns";
import { ColumnDef } from "@tanstack/react-table";

type FilterType = "daily" | "weekly" | "monthly";
type CompareFilterType = "daily" | "monthly" | "yearly";
type ViewMode = "time" | "compare";

// ── CUSTOM HOOK FOR STATE MANAGEMENT ──
function useReportDashboardState(selectedOutletId?: string) {
  const [activeTab, setActiveTab] = useState<string>("keuangan");
  const [viewMode, setViewMode] = useState<ViewMode>("time");

  // Unified date and period state
  const [period, setPeriod] = useState<string>("daily");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [outletFilter, setOutletFilter] = useState<string>(
    selectedOutletId || "all",
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Sync outlet filter when store changes
  useEffect(() => {
    if (selectedOutletId) {
      setOutletFilter(selectedOutletId);
    }
  }, [selectedOutletId]);

  // Adjust period if it becomes invalid for the current viewMode/tab
  const handleTabChange = useCallback(
    (newTab: string) => {
      setActiveTab(newTab);

      // Yearly is only valid in keuangan + compare mode
      if (newTab !== "keuangan" && period === "yearly") {
        setPeriod("monthly");
      }
    },
    [period],
  );

  const handleViewModeChange = useCallback(
    (newMode: ViewMode) => {
      setViewMode(newMode);

      if (newMode === "compare") {
        if (period === "weekly") {
          setPeriod("monthly"); // Compare mode doesn't support weekly, default to monthly
        }
      } else {
        if (period === "yearly") {
          setPeriod("monthly"); // Time mode doesn't support yearly, default to monthly
        }
      }
    },
    [period],
  );

  const handlePeriodChange = useCallback((newPeriod: string) => {
    setPeriod(newPeriod);
  }, []);

  const adjustDate = useCallback(
    (amount: number) => {
      setCurrentDate((prevDate) => {
        const newDate = new Date(prevDate);
        if (activeTab === "keuangan") {
          if (viewMode === "time") {
            if (period === "daily")
              newDate.setDate(newDate.getDate() + amount * 10);
            else if (period === "weekly")
              newDate.setMonth(newDate.getMonth() + amount);
            else if (period === "monthly")
              newDate.setFullYear(newDate.getFullYear() + amount);
          } else {
            // compare
            if (period === "daily") newDate.setDate(newDate.getDate() + amount);
            else if (period === "monthly")
              newDate.setMonth(newDate.getMonth() + amount);
            else if (period === "yearly")
              newDate.setFullYear(newDate.getFullYear() + amount);
          }
        } else if (activeTab === "staff") {
          if (period === "daily") newDate.setDate(newDate.getDate() + amount);
          else if (period === "weekly")
            newDate.setDate(newDate.getDate() + amount * 7);
          else if (period === "monthly")
            newDate.setMonth(newDate.getMonth() + amount);
        } else if (activeTab === "stok") {
          if (period === "daily")
            newDate.setDate(newDate.getDate() + amount * 10);
          else if (period === "weekly")
            newDate.setMonth(newDate.getMonth() + amount);
          else if (period === "monthly")
            newDate.setFullYear(newDate.getFullYear() + amount);
        }
        return newDate;
      });
    },
    [activeTab, viewMode, period],
  );

  return {
    activeTab,
    setActiveTab: handleTabChange,
    viewMode,
    setViewMode: handleViewModeChange,
    period,
    setPeriod: handlePeriodChange,
    currentDate,
    outletFilter,
    setOutletFilter,
    isExporting,
    setIsExporting,
    adjustDate,
  };
}

// ── MAIN COMPONENT ──
export default function ReportFinancialContent() {
  const { outlets, selectedOutlet } = useOutletStore();
  const state = useReportDashboardState(selectedOutlet?.id);

  // ── Conditional queries for better performance ──
  const isKeuanganTime =
    state.activeTab === "keuangan" && state.viewMode === "time";
  const isKeuanganCompare =
    state.activeTab === "keuangan" && state.viewMode === "compare";
  const isStaff = state.activeTab === "staff";
  const isStok = state.activeTab === "stok";

  // Financial (Laporan Waktu) & Stok share the same API endpoint
  const { data: timeData, isLoading: isLoadingTime } = useReportOutlet(
    state.outletFilter,
    state.period,
    state.currentDate.toISOString(),
  );

  const { data: compareData, isLoading: isLoadingCompare } =
    useCompareOutletsReport(state.period, state.currentDate.toISOString());

  const { data: staffData, isLoading: isLoadingStaff } = useReportStaff(
    state.outletFilter,
    state.period,
    format(state.currentDate, "yyyy-MM-dd"),
  );

  const activeData = state.viewMode === "time" ? timeData : compareData;
  const isLoading =
    (state.activeTab === "keuangan" &&
      (state.viewMode === "time" ? isLoadingTime : isLoadingCompare)) ||
    (state.activeTab === "stok" && isLoadingTime) ||
    (state.activeTab === "staff" && isLoadingStaff);

  // ── Totals for Financial ──
  const totals = useMemo<Totals>(() => {
    return (activeData || []).reduce(
      (acc, curr) => ({
        jumlahTransaksi: acc.jumlahTransaksi + (curr.jumlahTransaksi || 0),
        totalPendapatan: acc.totalPendapatan + (curr.totalPendapatan || 0),
        totalPajak: acc.totalPajak + (curr.totalPajak || 0),
        totalPembelian: acc.totalPembelian + (curr.totalPembelian || 0),
        totalPengeluaran: acc.totalPengeluaran + (curr.totalPengeluaran || 0),
        gajiStaf: acc.gajiStaf + (curr.gajiStaf || 0),
        totalHpp: acc.totalHpp + (curr.totalHpp || 0),
        totalFees: acc.totalFees + (curr.totalFees || 0),
        labaBersih: acc.labaBersih + (curr.labaBersih || 0),
      }),
      {
        jumlahTransaksi: 0,
        totalPendapatan: 0,
        totalPajak: 0,
        totalPembelian: 0,
        totalPengeluaran: 0,
        gajiStaf: 0,
        totalHpp: 0,
        totalFees: 0,
        labaBersih: 0,
      },
    );
  }, [activeData]);

  // ── Totals for Staff ──
  const staffTotals = useMemo(() => {
    return (staffData || []).reduce(
      (acc, curr) => ({
        transactions: acc.transactions + curr.transactionCount,
        revenue: acc.revenue + (curr.type === "CASHIER" ? curr.revenue : 0),
        commission:
          acc.commission + (curr.type === "SERVICE" ? curr.commission : 0),
      }),
      { transactions: 0, revenue: 0, commission: 0 },
    );
  }, [staffData]);

  // ── Totals for Stock (shared data from timeData) ──
  const stokTotals = useMemo(() => {
    return (timeData || []).reduce(
      (acc, curr) => ({
        jumlahTransaksi: acc.jumlahTransaksi + (curr.jumlahTransaksi || 0),
        totalPembelian: acc.totalPembelian + (curr.totalPembelian || 0),
      }),
      { jumlahTransaksi: 0, totalPembelian: 0 },
    );
  }, [timeData]);

  // ── Unified Export Handler ──
  const handleExport = useCallback(async () => {
    state.setIsExporting(true);
    try {
      let blob: Blob;
      if (state.activeTab === "keuangan") {
        blob = await reportApi.exportOutletExcel(state.outletFilter, {
          type: state.period,
          date: state.currentDate.toISOString(),
          viewMode: state.viewMode,
        });
      } else if (state.activeTab === "staff") {
        blob = await reportApi.exportStaffExcel(state.outletFilter, {
          type: state.period,
          date: format(state.currentDate, "yyyy-MM-dd"),
        });
      } else {
        return;
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      const prefix =
        state.activeTab === "keuangan" ? "Laporan_Keuangan" : "Laporan_Staff";
      link.download = `${prefix}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      gooeyToast.success(
        `Berhasil mengunduh ${state.activeTab === "keuangan" ? "laporan keuangan" : "laporan staff"}`,
      );
    } catch {
      gooeyToast.error(
        `Gagal mengunduh ${state.activeTab === "keuangan" ? "laporan keuangan" : "laporan staff"}`,
      );
    } finally {
      state.setIsExporting(false);
    }
  }, [
    state.outletFilter,
    state.period,
    state.currentDate,
    state.viewMode,
    state.activeTab,
  ]);

  // ── Beban Total (HPP + Ops + Gaji + Fees) ──
  const totalBeban =
    totals.totalHpp +
    totals.totalPengeluaran +
    totals.gajiStaf +
    totals.totalFees;

  // ── Available Periods mapping ──
  const getPeriodOptions = useCallback(() => {
    if (state.activeTab === "keuangan" && state.viewMode === "compare") {
      return [
        { value: "daily", label: "Harian" },
        { value: "monthly", label: "Bulanan" },
        { value: "yearly", label: "Tahunan" },
      ];
    }
    return [
      { value: "daily", label: "Harian" },
      { value: "weekly", label: "Mingguan" },
      { value: "monthly", label: "Bulanan" },
    ];
  }, [state.activeTab, state.viewMode]);

  // ── Format unified period label ──
  const dateLabel = useMemo(() => {
    if (state.activeTab === "keuangan") {
      return state.viewMode === "time"
        ? formatPeriodLabel(state.period as FilterType, state.currentDate)
        : formatComparePeriodLabel(
            state.period as CompareFilterType,
            state.currentDate,
          );
    } else if (state.activeTab === "staff") {
      return formatStaffPeriodLabel(
        state.period as FilterType,
        state.currentDate,
      );
    } else if (state.activeTab === "stok") {
      return formatPeriodLabel(state.period as FilterType, state.currentDate);
    }
    return "";
  }, [state.activeTab, state.viewMode, state.period, state.currentDate]);

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <SectionHeader
        title="Laporan Bisnis"
        description="Analisis mendalam performa finansial, operasional outlet, kinerja staff, dan perputaran aset."
        actions={
          <Select
            value={state.outletFilter}
            onValueChange={state.setOutletFilter}
          >
            <SelectTrigger className="w-full sm:w-64 h-10 border-border/80 bg-card hover:bg-muted/30 transition-all rounded-md cursor-pointer">
              <SelectValue placeholder="Pilih outlet" />
            </SelectTrigger>
            <SelectContent className="border-border shadow-2xl">
              <SelectItem value="all">Semua Outlet</SelectItem>
              {outlets.map((outlet) => (
                <SelectItem key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* 2. ADAPTIVE SPLIT GRID LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* LEFT COLUMN: Report Section Switcher */}
        <div className="lg:col-span-1">
          {/* Desktop Sidebar Switcher (hidden on mobile) */}
          <div className="hidden lg:block space-y-3">
            <div className="text-xs font-semibold text-muted-foreground px-1">
              Menu Laporan
            </div>
            <div className="flex flex-col gap-2">
              {/* Keuangan tab card */}
              <button
                onClick={() => state.setActiveTab("keuangan")}
                className={cn(
                  "flex items-center gap-3 w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer shadow-sm",
                  state.activeTab === "keuangan"
                    ? "bg-primary border-primary text-white"
                    : "bg-card hover:bg-muted/40 border-border/80 text-foreground",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-md",
                    state.activeTab === "keuangan" ? "bg-white/10" : "bg-muted",
                  )}
                >
                  <Receipt className="w-5 h-5 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="">Keuangan & Omset</div>
                  <div
                    className={cn(
                      "text-xs truncate mt-0.5",
                      state.activeTab === "keuangan"
                        ? "text-white/70"
                        : "text-muted-foreground",
                    )}
                  >
                    Laba Rugi, HPP & Operasional
                  </div>
                </div>
              </button>

              {/* Staff tab card */}
              <button
                onClick={() => state.setActiveTab("staff")}
                className={cn(
                  "flex items-center gap-3 w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer shadow-sm",
                  state.activeTab === "staff"
                    ? "bg-primary border-primary text-white"
                    : "bg-card hover:bg-muted/40 border-border/80 text-foreground",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-md",
                    state.activeTab === "staff" ? "bg-white/10" : "bg-muted",
                  )}
                >
                  <Users className="w-5 h-5 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="">Kinerja Staff</div>
                  <div
                    className={cn(
                      "text-xs truncate mt-0.5",
                      state.activeTab === "staff"
                        ? "text-white/70"
                        : "text-muted-foreground",
                    )}
                  >
                    Komisi Layanan & Kasir
                  </div>
                </div>
              </button>

              {/* Stok tab card */}
              <button
                onClick={() => state.setActiveTab("stok")}
                className={cn(
                  "flex items-center gap-3 w-full text-left p-3.5 rounded-lg border transition-all cursor-pointer shadow-sm",
                  state.activeTab === "stok"
                    ? "bg-primary border-primary text-white"
                    : "bg-card hover:bg-muted/40 border-border/80 text-foreground",
                )}
              >
                <div
                  className={cn(
                    "p-2 rounded-md",
                    state.activeTab === "stok" ? "bg-white/10" : "bg-muted",
                  )}
                >
                  <Package className="w-5 h-5 shrink-0" />
                </div>
                <div className="flex-1 min-w-0">
                  <div>Stok & Inventaris</div>
                  <div
                    className={cn(
                      "text-xs truncate mt-0.5",
                      state.activeTab === "stok"
                        ? "text-white/70"
                        : "text-muted-foreground",
                    )}
                  >
                    Nilai Pengadaan Stok Masuk
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Segmented Switcher (hidden on desktop) */}
          <div className="lg:hidden flex bg-muted/65 p-1 rounded-lg border border-border/40 w-full mb-1">
            <button
              onClick={() => state.setActiveTab("keuangan")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2  rounded-md transition-all cursor-pointer",
                state.activeTab === "keuangan"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground/85",
              )}
            >
              <Receipt className="w-3.5 h-3.5 shrink-0" />
              <span>Keuangan</span>
            </button>
            <button
              onClick={() => state.setActiveTab("staff")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2  rounded-md transition-all cursor-pointer",
                state.activeTab === "staff"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground/85",
              )}
            >
              <Users className="w-3.5 h-3.5 shrink-0" />
              <span>Staff</span>
            </button>
            <button
              onClick={() => state.setActiveTab("stok")}
              className={cn(
                "flex-1 flex items-center justify-center gap-1.5 py-2  rounded-md transition-all cursor-pointer",
                state.activeTab === "stok"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground/85",
              )}
            >
              <Package className="w-3.5 h-3.5 shrink-0" />
              <span>Stok</span>
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Interactive Control Panel & Dashboard Visualizations */}
        <div className="lg:col-span-3 space-y-6">
          {/* Unified compact control toolbar */}
          <UnifiedControlPanel
            activeTab={state.activeTab}
            viewMode={state.viewMode}
            setViewMode={state.setViewMode}
            period={state.period}
            setPeriod={state.setPeriod}
            adjustDate={state.adjustDate}
            dateLabel={dateLabel}
            isExporting={state.isExporting}
            handleExport={handleExport}
            getPeriodOptions={getPeriodOptions}
          />

          {/* Conditional content rendering */}
          {state.activeTab === "keuangan" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Performance board */}
              <FinancialPerformanceBoard
                totals={totals}
                totalBeban={totalBeban}
                viewMode={state.viewMode}
                activeData={activeData || []}
              />

              {/* Table wrapper that hides the empty settings toolbar of the DataTable */}
              <Card className="rounded-lg border border-border/80 bg-background shadow-sm overflow-hidden relative [&_div.flex.flex-col.gap-4]:hidden">
                {isLoading && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-md z-15 flex flex-col items-center justify-center space-y-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <Receipt className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-foreground/80 animate-pulse">
                      Mengolah Laporan...
                    </span>
                  </div>
                )}
                <ReportFinancialTable
                  data={activeData || []}
                  totals={totals}
                  hideTrend={state.viewMode === "compare"}
                  labelHeader={
                    state.viewMode === "compare" ? "Nama Outlet" : "Tanggal"
                  }
                />
              </Card>
            </div>
          )}

          {state.activeTab === "staff" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Staff metrics */}
              <StaffPerformanceBoard totals={staffTotals} />

              {/* Table wrapper that hides the empty settings toolbar of the DataTable */}
              <Card className="rounded-lg border border-border/80 bg-background shadow-sm overflow-hidden relative [&_div.flex.flex-col.gap-4]:hidden">
                {isLoading && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-md z-15 flex flex-col items-center justify-center space-y-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <Users className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-foreground/80 animate-pulse">
                      Mengolah Laporan Staff...
                    </span>
                  </div>
                )}
                <ReportStaffTable data={staffData || []} totals={staffTotals} />
              </Card>
            </div>
          )}

          {state.activeTab === "stok" && (
            <div className="space-y-6 animate-in fade-in duration-300">
              {/* Stok metrics */}
              <StockAssetBoard totals={stokTotals} />

              {/* Table wrapper that hides the empty settings toolbar of the DataTable */}
              <Card className="rounded-lg border border-border/80 bg-background shadow-sm overflow-hidden relative [&_div.flex.flex-col.gap-4]:hidden">
                {isLoading && (
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-md z-15 flex flex-col items-center justify-center space-y-3">
                    <div className="relative">
                      <div className="h-10 w-10 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
                      <Package className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-foreground/80 animate-pulse">
                      Mengolah Laporan Aset...
                    </span>
                  </div>
                )}
                <StockAssetTable
                  data={timeData || []}
                  totalPembelian={stokTotals.totalPembelian}
                />
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── SUB-COMPONENTS ──

// 1. Unified Control Toolbar
function UnifiedControlPanel({
  activeTab,
  viewMode,
  setViewMode,
  period,
  setPeriod,
  adjustDate,
  dateLabel,
  isExporting,
  handleExport,
  getPeriodOptions,
}: {
  activeTab: string;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  period: string;
  setPeriod: (period: string) => void;
  adjustDate: (amount: number) => void;
  dateLabel: string;
  isExporting: boolean;
  handleExport: () => void;
  getPeriodOptions: () => { value: string; label: string }[];
}) {
  const showModeToggle = activeTab === "keuangan";
  const periodOptions = getPeriodOptions();

  return (
    <Card className="rounded-lg border border-border/80 bg-card p-3.5 shadow-sm select-none">
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        {/* Left side: View Mode & Period Selectors */}
        <div className="flex flex-wrap items-center gap-2">
          {showModeToggle && (
            <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/40 w-full sm:w-auto">
              <button
                onClick={() => setViewMode("time")}
                className={cn(
                  "flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  viewMode === "time"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground/85",
                )}
              >
                Waktu
              </button>
              <button
                onClick={() => setViewMode("compare")}
                className={cn(
                  "flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  viewMode === "compare"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground/85",
                )}
              >
                Bandingkan
              </button>
            </div>
          )}

          <div className="flex bg-muted/65 p-0.5 rounded-lg border border-border/40 w-full sm:w-auto">
            {periodOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setPeriod(opt.value)}
                className={cn(
                  "flex-1 sm:flex-none px-3.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer",
                  period === opt.value
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground/85",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right side: Date Navigator & Export */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex items-center justify-between sm:justify-end gap-1 bg-muted/30 border border-border/50 rounded-lg p-0.5">
            <Button
              onClick={() => adjustDate(-1)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md hover:bg-muted/60 transition-all shrink-0 cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4 text-foreground/80" />
            </Button>

            <div className="flex items-center gap-2 px-3 min-w-[140px] justify-center">
              <CalendarIcon className="w-3.5 h-3.5 text-primary opacity-70 shrink-0" />
              <span className="text-xs font-semibold text-center truncate tabular-nums text-foreground/90">
                {dateLabel}
              </span>
            </div>

            <Button
              onClick={() => adjustDate(1)}
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md hover:bg-muted/60 transition-all shrink-0 cursor-pointer"
            >
              <ChevronRight className="w-4 h-4 text-foreground/80" />
            </Button>
          </div>

          {(activeTab === "keuangan" || activeTab === "staff") && (
            <Button
              onClick={handleExport}
              disabled={isExporting}
              variant="outline"
              className="h-9 font-semibold text-xs border-border/80 bg-background hover:bg-muted/50 transition-all shadow-sm cursor-pointer"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 mr-2 text-emerald-600" />
              )}
              {isExporting ? "Mengexport..." : "Export Excel"}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// 2. Financial performance HERO Board
function FinancialPerformanceBoard({
  totals,
  totalBeban,
  viewMode,
  activeData,
}: {
  totals: Totals;
  totalBeban: number;
  viewMode: ViewMode;
  activeData: any[];
}) {
  const sparklineData = useMemo(() => {
    if (viewMode !== "time" || !activeData || activeData.length === 0)
      return [];
    return activeData.map((item) => item.labaBersih || 0);
  }, [activeData, viewMode]);

  const totalOmset = totals.totalPendapatan;
  const isNetProfitPositive = totals.labaBersih >= 0;

  // Compute percentages relative to total revenue or total outflow + profit
  const totalBase = Math.max(
    totalOmset,
    totalBeban + (isNetProfitPositive ? totals.labaBersih : 0),
    1,
  );

  const hppPct = (totals.totalHpp / totalBase) * 100;
  const opsPct = (totals.totalPengeluaran / totalBase) * 100;
  const staffPct = (totals.gajiStaf / totalBase) * 100;
  const feesPct = (totals.totalFees / totalBase) * 100;
  const labaPct =
    ((isNetProfitPositive ? totals.labaBersih : 0) / totalBase) * 100;

  const fmt = (val: number) => formatCurrency(val);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Hero Card: Laba Bersih */}
      <Card
        className={cn(
          "md:col-span-1 rounded-lg border-l-[4px] border-border/80 shadow-sm p-5 flex flex-col justify-between transition-all",
          isNetProfitPositive
            ? "border-l-emerald-500 bg-emerald-500/5 dark:bg-emerald-950/10 hover:bg-emerald-500/10"
            : "border-l-rose-500 bg-rose-500/5 dark:bg-rose-950/10 hover:bg-rose-500/10",
        )}
      >
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-muted-foreground opacity-85">
              Laba Bersih
            </span>
            <Badge
              className={cn(
                "font-semibold text-[10px] px-2 shadow-none border-none py-0.5",
                isNetProfitPositive
                  ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                  : "bg-rose-500/15 text-rose-600 dark:text-rose-400",
              )}
            >
              {isNetProfitPositive ? "Untung" : "Rugi"}
            </Badge>
          </div>
          <h2
            className={cn(
              "text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums",
              isNetProfitPositive
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-rose-600 dark:text-rose-400",
            )}
          >
            {fmt(totals.labaBersih)}
          </h2>
          <p className="text-xs text-muted-foreground/70 mt-1 leading-normal">
            Laba setelah dikurangi harga pokok penjualan, biaya ops, komisi
            staff, dan bank fees.
          </p>
        </div>

        {viewMode === "time" && sparklineData.length >= 2 && (
          <div className="mt-4 pt-3 border-t border-border/20 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-semibold text-muted-foreground/65 block">
                Tren Laba Bersih
              </span>
              <span className="text-xs font-semibold text-foreground/85">
                {sparklineData.length} Periode Data
              </span>
            </div>
            <div className="bg-background/90 dark:bg-muted/40 p-1 rounded border border-border/20 flex items-center justify-center shrink-0">
              <Sparkline
                data={sparklineData}
                color={isNetProfitPositive ? "#10b981" : "#f43f5e"}
                width={100}
                height={26}
              />
            </div>
          </div>
        )}
      </Card>

      {/* Allocation Breakdown and Cost Distribution */}
      <Card className="md:col-span-2 rounded-lg border-l-[4px] border-l-primary/20 bg-card p-5 shadow-sm flex flex-col justify-between hover:bg-muted/10 transition-all">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground opacity-85">
              Alokasi Pengeluaran & Laba
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground/65">
              Pendapatan Kotor: {fmt(totalOmset)}
            </span>
          </div>

          {/* Ratio bar */}
          <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex shadow-inner">
            {labaPct > 0 && (
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{ width: `${labaPct}%` }}
                title={`Laba Bersih: ${labaPct.toFixed(1)}%`}
              />
            )}
            {hppPct > 0 && (
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${hppPct}%` }}
                title={`HPP (Modal): ${hppPct.toFixed(1)}%`}
              />
            )}
            {opsPct > 0 && (
              <div
                className="bg-rose-500 h-full transition-all duration-300"
                style={{ width: `${opsPct}%` }}
                title={`Beban Ops: ${opsPct.toFixed(1)}%`}
              />
            )}
            {staffPct > 0 && (
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{ width: `${staffPct}%` }}
                title={`Komisi Staff: ${staffPct.toFixed(1)}%`}
              />
            )}
            {feesPct > 0 && (
              <div
                className="bg-slate-400 h-full transition-all duration-300"
                style={{ width: `${feesPct}%` }}
                title={`Biaya Layanan: ${feesPct.toFixed(1)}%`}
              />
            )}
          </div>

          {/* Legends */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1 text-xs">
            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
                <span className="font-semibold text-foreground/80 truncate">
                  Laba Bersih
                </span>
              </div>
              <p className="font-bold pl-3.5 tabular-nums text-emerald-600 dark:text-emerald-400">
                {labaPct.toFixed(1)}%{" "}
                <span className="font-medium text-muted-foreground/60 text-[10px] block sm:inline">
                  ({fmt(totals.labaBersih)})
                </span>
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <span className="font-semibold text-foreground/80 truncate">
                  HPP (Modal)
                </span>
              </div>
              <p className="font-bold pl-3.5 tabular-nums text-amber-600 dark:text-amber-400">
                {hppPct.toFixed(1)}%{" "}
                <span className="font-medium text-muted-foreground/60 text-[10px] block sm:inline">
                  ({fmt(totals.totalHpp)})
                </span>
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                <span className="font-semibold text-foreground/80 truncate">
                  Beban Ops
                </span>
              </div>
              <p className="font-bold pl-3.5 tabular-nums text-rose-600 dark:text-rose-400">
                {opsPct.toFixed(1)}%{" "}
                <span className="font-medium text-muted-foreground/60 text-[10px] block sm:inline">
                  ({fmt(totals.totalPengeluaran)})
                </span>
              </p>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-blue-500 shrink-0" />
                <span className="font-semibold text-foreground/80 truncate">
                  Komisi Staff
                </span>
              </div>
              <p className="font-bold pl-3.5 tabular-nums text-blue-600 dark:text-blue-400">
                {staffPct.toFixed(1)}%{" "}
                <span className="font-medium text-muted-foreground/60 text-[10px] block sm:inline">
                  ({fmt(totals.gajiStaf)})
                </span>
              </p>
            </div>

            <div className="space-y-0.5 col-span-2 sm:col-span-1">
              <div className="flex items-center gap-1.5">
                <div className="h-2 w-2 rounded-full bg-slate-400 shrink-0" />
                <span className="font-semibold text-foreground/80 truncate">
                  Layanan/Bank
                </span>
              </div>
              <p className="font-bold pl-3.5 tabular-nums text-slate-600 dark:text-slate-400">
                {feesPct.toFixed(1)}%{" "}
                <span className="font-medium text-muted-foreground/60 text-[10px] block sm:inline">
                  ({fmt(totals.totalFees)})
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-border/20 grid grid-cols-3 gap-2 text-center">
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground/65 block">
              Omset Penjualan
            </span>
            <span className="text-xs sm:text-sm font-bold text-foreground/90 tabular-nums">
              {fmt(totals.totalPendapatan)}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground/65 block">
              Pajak Terkumpul
            </span>
            <span className="text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {totals.totalPajak > 0 ? fmt(totals.totalPajak) : "—"}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-semibold text-muted-foreground/65 block">
              Akumulasi Beban
            </span>
            <span className="text-xs sm:text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {fmt(totalBeban)}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
}

// 3. Staff performance Board
function StaffPerformanceBoard({
  totals,
}: {
  totals: { transactions: number; revenue: number; commission: number };
}) {
  const fmt = (val: number) => formatCurrency(val);

  return (
    <Card className="rounded-lg border-l-[4px] border-l-primary/20 bg-card p-5 shadow-sm hover:bg-muted/10 transition-all">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-semibold text-muted-foreground opacity-85 block mb-1">
            Ringkasan Kinerja Staff
          </span>
          <p className="text-xs text-muted-foreground max-w-md">
            Komisi untuk staff terapis/layanan, omset kasir, dan volume
            transaksi yang selesai diproses.
          </p>
        </div>

        {/* Responsive wrap layout to prevent column overlap on mobile */}
        <div className="flex flex-row flex-wrap items-center justify-between sm:justify-end gap-x-8 gap-y-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border/20">
          <div className="min-w-[80px]">
            <span className="text-[10px] font-semibold text-muted-foreground/65 block mb-0.5">
              Total Komisi
            </span>
            <span className="text-sm sm:text-base font-bold text-blue-600 dark:text-blue-400 tabular-nums">
              {fmt(totals.commission)}
            </span>
          </div>
          <div className="min-w-[80px]">
            <span className="text-[10px] font-semibold text-muted-foreground/65 block mb-0.5">
              Omset Kasir
            </span>
            <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              {fmt(totals.revenue)}
            </span>
          </div>
          <div className="min-w-[80px]">
            <span className="text-[10px] font-semibold text-muted-foreground/65 block mb-0.5">
              Total Transaksi
            </span>
            <span className="text-sm sm:text-base font-bold text-foreground/90 tabular-nums">
              {totals.transactions} Trx
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// 4. Stock Asset Board
function StockAssetBoard({
  totals,
}: {
  totals: { jumlahTransaksi: number; totalPembelian: number };
}) {
  const fmt = (val: number) => formatCurrency(val);

  return (
    <div className="space-y-4">
      <Card className="rounded-lg border-l-[4px] border-l-primary/20 bg-card p-5 shadow-sm hover:bg-muted/10 transition-all">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold text-muted-foreground opacity-85 block mb-1">
              Ringkasan Pembelian Stok & Aset
            </span>
            <p className="text-xs text-muted-foreground max-w-md">
              Nilai perolehan stok masuk (Stock In) dalam periode berjalan.
              Belum terhitung sebagai HPP.
            </p>
          </div>

          {/* Responsive wrap layout to prevent column overlap on mobile */}
          <div className="flex flex-row flex-wrap items-center justify-between sm:justify-end gap-x-8 gap-y-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-border/20">
            <div className="min-w-[80px]">
              <span className="text-[10px] font-semibold text-muted-foreground/65 block mb-0.5">
                Total Pembelian
              </span>
              <span className="text-sm sm:text-base font-bold text-amber-600 dark:text-amber-400/80 tabular-nums">
                {fmt(totals.totalPembelian)}
              </span>
            </div>
            <div className="min-w-[80px]">
              <span className="text-[10px] font-semibold text-muted-foreground/65 block mb-0.5">
                Transaksi Masuk
              </span>
              <span className="text-sm sm:text-base font-bold text-foreground/90 tabular-nums">
                {totals.jumlahTransaksi} Order
              </span>
            </div>
          </div>
        </div>
      </Card>

      <div className="group rounded-lg border border-blue-500/20 bg-blue-500/5 dark:bg-blue-950/10 p-4 shadow-sm relative overflow-hidden transition-all hover:bg-blue-500/10">
        <div className="absolute top-0 right-0 p-3 opacity-5 group-hover:scale-110 transition-transform">
          <Package className="h-12 w-12 text-blue-600/20" />
        </div>
        <div className="flex items-start gap-3 relative z-10">
          <div className="h-8 w-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
            <Info className="h-4.5 w-4.5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-1">
              Catatan Penting: Pembelian Stok & Aset
            </h3>
            <p className="text-[11px] font-medium text-foreground/70 leading-relaxed max-w-3xl">
              Pembelian stok dicatat sebagai penambahan aset lancar
              (persediaan),{" "}
              <span className="font-bold text-blue-600 dark:text-blue-400">
                bukan pengurang langsung laba bersih
              </span>
              . Keuangan Anda baru berkurang secara finansial sebagai modal
              terpakai ketika barang tersebut terjual (dicatat sebagai HPP di
              tab Keuangan).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 5. Stock Asset Table (renders custom table using DataTable)
function StockAssetTable({
  data,
  totalPembelian,
}: {
  data: any[];
  totalPembelian: number;
}) {
  const columns: ColumnDef<any>[] = [
    {
      accessorKey: "label",
      header: "Periode",
      cell: ({ row }) => (
        <span className="font-bold text-foreground/90 text-xs">
          {row.original.label}
        </span>
      ),
      footer: () => (
        <span className="font-semibold text-xs text-muted-foreground opacity-75">
          Total Periode
        </span>
      ),
    },
    {
      accessorKey: "totalPembelian",
      header: "Pembelian Stok (Aset)",
      cell: (props: any) => (
        <span className="text-amber-600 dark:text-amber-400/80 font-bold tabular-nums text-xs">
          {formatCurrency(props.row.original.totalPembelian || 0)}
        </span>
      ),
      footer: () => (
        <span className="text-amber-600 dark:text-amber-400/80 font-bold tabular-nums text-xs">
          {formatCurrency(totalPembelian)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      data={data}
      pageSize={50}
      globalFilter={false}
      showColumnVisibility={false}
      showTableInfo={false}
      pagination={false}
      showFooter
      tableId="report-stock"
      emptyMessage="Belum ada data pembelian stok untuk periode ini."
      columns={columns}
    />
  );
}

// ── PERIOD LABEL FORMATTER HELPERS ──

const formatPeriodLabel = (type: FilterType, date: Date): string => {
  if (type === "daily") {
    const start = new Date(date);
    start.setDate(date.getDate() - 9);
    return `${start.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} - ${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  if (type === "weekly") {
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }
  if (type === "monthly") {
    return date.toLocaleDateString("id-ID", { year: "numeric" });
  }
  return "";
};

const formatComparePeriodLabel = (
  type: CompareFilterType,
  date: Date,
): string => {
  if (type === "daily") {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (type === "monthly") {
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }
  if (type === "yearly") {
    return date.toLocaleDateString("id-ID", { year: "numeric" });
  }
  return "";
};

const formatStaffPeriodLabel = (type: FilterType, date: Date): string => {
  if (type === "daily") {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }
  if (type === "weekly") {
    const start = new Date(date);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(start.setDate(diff));
    const sunday = new Date(start.setDate(monday.getDate() + 6));
    return `${monday.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} - ${sunday.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  if (type === "monthly") {
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }
  return "";
};
