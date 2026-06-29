"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import {
  Calendar as CalendarIcon,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Receipt,
  Users,
  Package,
  Loader2,
  Info,
} from "lucide-react";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { ReportFinancialTable, Totals } from "./report-financial-table";
import { ReportStaffTable } from "../staff/report-staff-table";
import { cn } from "@/lib/utils";
import reportApi from "@/lib/apis/report";
import { format } from "date-fns";
import { SelectOption } from "@/components/shared/select-option";
import {
  formatComparePeriodLabel,
  formatPeriodLabel,
  formatStaffPeriodLabel,
} from "./utils";
import { StockAssetTable } from "./stock-asset-table";
import {
  FinancialMetricStrip,
  StaffMetricStrip,
  StokMetricStrip,
} from "./metric-card";

type FilterType = "daily" | "weekly" | "monthly";
type CompareFilterType = "daily" | "monthly" | "yearly";
type ViewMode = "time" | "compare";

const TABS = [
  { id: "keuangan", label: "Keuangan", icon: Receipt },
  { id: "staff", label: "Staff", icon: Users },
  { id: "stok", label: "Stok", icon: Package },
] as const;

function useReportDashboardState(selectedOutletId?: string) {
  const [activeTab, setActiveTab] = useState<string>("keuangan");
  const [viewMode, setViewMode] = useState<ViewMode>("time");
  const [period, setPeriod] = useState<string>("daily");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [outletFilter, setOutletFilter] = useState<string>(
    selectedOutletId || "all",
  );
  const [isExporting, setIsExporting] = useState<boolean>(false);

  useEffect(() => {
    if (selectedOutletId) setOutletFilter(selectedOutletId);
  }, [selectedOutletId]);

  const handleTabChange = useCallback(
    (newTab: string) => {
      setActiveTab(newTab);
      if (newTab !== "keuangan" && period === "yearly") setPeriod("monthly");
    },
    [period],
  );

  const handleViewModeChange = useCallback(
    (newMode: ViewMode) => {
      setViewMode(newMode);
      if (newMode === "compare" && period === "weekly") setPeriod("monthly");
      if (newMode === "time" && period === "yearly") setPeriod("monthly");
    },
    [period],
  );

  const adjustDate = useCallback(
    (amount: number) => {
      setCurrentDate((prev) => {
        const d = new Date(prev);
        if (activeTab === "keuangan") {
          if (viewMode === "time") {
            if (period === "daily") d.setDate(d.getDate() + amount * 10);
            else if (period === "weekly") d.setMonth(d.getMonth() + amount);
            else if (period === "monthly")
              d.setFullYear(d.getFullYear() + amount);
          } else {
            if (period === "daily") d.setDate(d.getDate() + amount);
            else if (period === "monthly") d.setMonth(d.getMonth() + amount);
            else if (period === "yearly")
              d.setFullYear(d.getFullYear() + amount);
          }
        } else if (activeTab === "staff") {
          if (period === "daily") d.setDate(d.getDate() + amount);
          else if (period === "weekly") d.setDate(d.getDate() + amount * 7);
          else if (period === "monthly") d.setMonth(d.getMonth() + amount);
        } else if (activeTab === "stok") {
          if (period === "daily") d.setDate(d.getDate() + amount * 10);
          else if (period === "weekly") d.setMonth(d.getMonth() + amount);
          else if (period === "monthly")
            d.setFullYear(d.getFullYear() + amount);
        }
        return d;
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
    setPeriod,
    currentDate,
    outletFilter,
    setOutletFilter,
    isExporting,
    setIsExporting,
    adjustDate,
  };
}

export default function ReportFinancialContent() {
  const { outlets, selectedOutlet } = useOutletStore();
  const state = useReportDashboardState(selectedOutlet?.id);

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

  const stokTotals = useMemo(() => {
    return (timeData || []).reduce(
      (acc, curr) => ({
        jumlahTransaksi: acc.jumlahTransaksi + (curr.jumlahTransaksi || 0),
        totalPembelian: acc.totalPembelian + (curr.totalPembelian || 0),
      }),
      { jumlahTransaksi: 0, totalPembelian: 0 },
    );
  }, [timeData]);

  const totalBeban =
    totals.totalHpp +
    totals.totalPengeluaran +
    totals.gajiStaf +
    totals.totalFees;

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

  const dateLabel = useMemo(() => {
    if (state.activeTab === "keuangan") {
      return state.viewMode === "time"
        ? formatPeriodLabel(state.period as FilterType, state.currentDate)
        : formatComparePeriodLabel(
            state.period as CompareFilterType,
            state.currentDate,
          );
    }
    if (state.activeTab === "staff")
      return formatStaffPeriodLabel(
        state.period as FilterType,
        state.currentDate,
      );
    return formatPeriodLabel(state.period as FilterType, state.currentDate);
  }, [state.activeTab, state.viewMode, state.period, state.currentDate]);

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
      } else return;

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${state.activeTab === "keuangan" ? "Laporan_Keuangan" : "Laporan_Staff"}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      gooeyToast.success("Berhasil mengunduh laporan");
    } catch {
      gooeyToast.error("Gagal mengunduh laporan");
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

  return (
    <div className="space-y-5">
      {/* Header */}
      <SectionHeader
        title="Laporan Bisnis"
        description="Analisis keuangan, kinerja staff, dan inventaris outlet."
        actions={
          <Select
            value={state.outletFilter}
            onValueChange={state.setOutletFilter}
          >
            <SelectTrigger className="w-full sm:w-52 h-9 text-sm">
              <SelectValue placeholder="Pilih outlet" />
            </SelectTrigger>
            <SelectContent>
              {outlets.map((outlet) => (
                <SelectItem key={outlet.id} value={outlet.id}>
                  {outlet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      {/* Tab + Control Bar — all in one row */}
      <div className="flex flex-col lg:flex-row gap-2 lg:items-center lg:justify-between">
        {/* Tabs */}
        <div className="flex items-center bg-muted/60 rounded-lg border border-border/40 p-0.5 gap-0.5 w-full lg:w-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => state.setActiveTab(id)}
              className={cn(
                "flex-1 lg:flex-none flex items-center justify-center gap-1.5 px-4 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                state.activeTab === id
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              {label}
            </button>
          ))}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle — only keuangan */}
          {state.activeTab === "keuangan" && (
            <div className="flex items-center bg-muted/60 rounded-lg border border-border/40 p-0.5 gap-0.5">
              {(["time", "compare"] as const).map((mode) => (
                <button
                  key={mode}
                  onClick={() => state.setViewMode(mode)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold transition-colors cursor-pointer",
                    state.viewMode === mode
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {mode === "time" ? "Waktu" : "Bandingkan"}
                </button>
              ))}
            </div>
          )}

          {/* Period selector */}
          <SelectOption
            value={state.period}
            onValueChange={state.setPeriod}
            className={cn(
              "px-3 py-1.5 bg-muted/60 rounded-lg h-8.5 text-xs font-semibold border border-border/40 p-0.5 gap-0.5 transition-colors cursor-pointer",
              "text-muted-foreground hover:text-foreground w-fit",
            )}
            options={getPeriodOptions().map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
          />

          {/* Date navigator */}
          <div className="flex items-center border border-border/60 rounded-lg bg-card overflow-hidden">
            <button
              onClick={() => state.adjustDate(-1)}
              className="px-2 py-1.5 hover:bg-muted/60 transition-colors cursor-pointer border-r border-border/40"
            >
              <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-1.5 px-3 min-w-32.5 justify-center">
              <CalendarIcon className="w-3 h-3 text-primary shrink-0" />
              <span className="text-xs font-semibold tabular-nums text-foreground/90 truncate">
                {dateLabel}
              </span>
            </div>
            <button
              onClick={() => state.adjustDate(1)}
              className="px-2 py-1.5 hover:bg-muted/60 transition-colors cursor-pointer border-l border-border/40"
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
          </div>

          {/* Export */}
          {(state.activeTab === "keuangan" || state.activeTab === "staff") && (
            <Button
              onClick={handleExport}
              disabled={state.isExporting}
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold cursor-pointer"
            >
              {state.isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5 text-emerald-600" />
              )}
              {state.isExporting ? "Mengexport..." : "Export"}
            </Button>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="space-y-4 animate-in fade-in duration-200">
        {state.activeTab === "keuangan" && (
          <>
            <FinancialMetricStrip
              totals={totals}
              totalBeban={totalBeban}
              activeData={activeData || []}
              viewMode={state.viewMode}
            />
            <ReportTableCard
              isLoading={isLoading}
              icon={<Receipt className="w-4 h-4 text-primary" />}
              loadingText="Mengolah Laporan..."
            >
              <ReportFinancialTable
                data={activeData || []}
                totals={totals}
                hideTrend={state.viewMode === "compare"}
                labelHeader={
                  state.viewMode === "compare" ? "Nama Outlet" : "Tanggal"
                }
              />
            </ReportTableCard>
          </>
        )}

        {state.activeTab === "staff" && (
          <>
            <StaffMetricStrip totals={staffTotals} />
            <ReportTableCard
              isLoading={isLoading}
              icon={<Users className="w-4 h-4 text-primary" />}
              loadingText="Mengolah Laporan Staff..."
            >
              <ReportStaffTable data={staffData || []} totals={staffTotals} />
            </ReportTableCard>
          </>
        )}

        {state.activeTab === "stok" && (
          <>
            <StokMetricStrip totals={stokTotals} />
            <StokInfoBanner />
            <ReportTableCard
              isLoading={isLoading}
              icon={<Package className="w-4 h-4 text-primary" />}
              loadingText="Mengolah Laporan Aset..."
            >
              <StockAssetTable
                data={timeData || []}
                totalPembelian={stokTotals.totalPembelian}
              />
            </ReportTableCard>
          </>
        )}
      </div>
    </div>
  );
}

function ReportTableCard({
  children,
  isLoading,
  icon,
  loadingText,
}: {
  children: React.ReactNode;
  isLoading: boolean;
  icon: React.ReactNode;
  loadingText: string;
}) {
  return (
    <Card className="rounded-lg border border-border/80 bg-background shadow-sm overflow-hidden relative py-0 [&_div.flex.flex-col.gap-4]:hidden">
      {isLoading && (
        <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center gap-2">
          <div className="relative">
            <div className="h-9 w-9 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              {icon}
            </div>
          </div>
          <span className="text-xs font-semibold text-foreground/70 animate-pulse">
            {loadingText}
          </span>
        </div>
      )}
      {children}
    </Card>
  );
}

function StokInfoBanner() {
  return (
    <div className="flex items-start gap-3 rounded-lg border border-blue-500/25 bg-blue-500/5 p-3.5">
      <div className="h-6 w-6 rounded-full bg-blue-500/15 flex items-center justify-center shrink-0 mt-0.5">
        <Info className="h-3.5 w-3.5 text-blue-600" />
      </div>
      <div>
        <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mb-0.5">
          Pembelian Stok ≠ Pengurang Laba
        </p>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Pembelian dicatat sebagai penambahan aset (persediaan). Baru tercatat
          sebagai beban ketika barang terjual (HPP di tab Keuangan).
        </p>
      </div>
    </div>
  );
}
