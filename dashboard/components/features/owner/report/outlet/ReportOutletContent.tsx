"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  ShoppingCart,
  Users,
  Receipt,
  BarChart3,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useReportOutlet, useCompareOutletsReport } from "@/hooks/useReport";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { ReportOutleTable, Totals } from "./ReportOutletTable";
import { SummaryCard } from "../SummaryCard";
import reportApi from "@/lib/apis/report";

type FilterType = "daily" | "weekly" | "monthly";
type CompareFilterType = "daily" | "monthly" | "yearly";
type ViewMode = "time" | "compare";

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export default function ReportOutlerContent() {
  const { outlets, selectedOutlet } = useOutletContext();
  const [viewMode, setViewMode] = useState<ViewMode>("time");

  // States for Time Report
  const [filterType, setFilterType] = useState<FilterType>("daily");

  // States for Compare Report
  const [compareFilterType, setCompareFilterType] = useState<CompareFilterType>("daily");

  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [outletFilter, setOutletFilter] = useState<string>(selectedOutlet?.id || "all");
  const [isExporting, setIsExporting] = useState(false);

  React.useEffect(() => {
    if (selectedOutlet?.id) {
      setOutletFilter(selectedOutlet.id);
    }
  }, [selectedOutlet?.id]);

  // Fetch Data based on View Mode
  const { data: timeData, isLoading: isLoadingTime } = useReportOutlet(
    outletFilter,
    filterType,
    currentDate.toISOString(),
  );

  const { data: compareData, isLoading: isLoadingCompare } = useCompareOutletsReport(
    compareFilterType,
    currentDate.toISOString(),
  );

  const activeData = viewMode === "time" ? timeData : compareData;
  const isLoading = viewMode === "time" ? isLoadingTime : isLoadingCompare;

  const totals = useMemo<Totals>(() => {
    return (activeData || []).reduce(
      (acc, curr) => ({
        jumlahTransaksi: acc.jumlahTransaksi + curr.jumlahTransaksi,
        totalPendapatan: acc.totalPendapatan + curr.totalPendapatan,
        totalPembelian: acc.totalPembelian + curr.totalPembelian,
        totalPengeluaran: acc.totalPengeluaran + curr.totalPengeluaran,
        gajiStaf: acc.gajiStaf + curr.gajiStaf,
        labaBersih: acc.labaBersih + curr.labaBersih,
      }),
      {
        jumlahTransaksi: 0,
        totalPendapatan: 0,
        totalPembelian: 0,
        totalPengeluaran: 0,
        gajiStaf: 0,
        labaBersih: 0,
      },
    );
  }, [activeData]);

  const adjustDate = (amount: number): void => {
    const newDate = new Date(currentDate);

    if (viewMode === "time") {
      if (filterType === "daily") newDate.setDate(newDate.getDate() + amount * 10);
      if (filterType === "weekly") newDate.setMonth(newDate.getMonth() + amount);
      if (filterType === "monthly") newDate.setFullYear(newDate.getFullYear() + amount);
    } else {
      // Compare Mode
      if (compareFilterType === "daily") newDate.setDate(newDate.getDate() + amount);
      if (compareFilterType === "monthly") newDate.setMonth(newDate.getMonth() + amount);
      if (compareFilterType === "yearly") newDate.setFullYear(newDate.getFullYear() + amount);
    }

    setCurrentDate(newDate);
  };

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const activeType = viewMode === "time" ? filterType : compareFilterType;
      const blob = await reportApi.exportOutletExcel(outletFilter, {
        type: activeType,
        date: currentDate.toISOString(),
        viewMode,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_Outlet_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Berhasil mengexport laporan outlet");
    } catch {
      toast.error("Gagal mengexport laporan outlet");
    } finally {
      setIsExporting(false);
    }
  }, [outletFilter, filterType, compareFilterType, currentDate, viewMode]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-emerald-500 w-7 h-7" />
            Laporan Outlet
          </h1>
          <div className="flex items-center gap-2 mt-2">
            {viewMode === "time" && (
              <select
                value={outletFilter}
                onChange={(e) => setOutletFilter(e.target.value)}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500">
                <option value="all">Semua Outlet</option>
                {outlets.map((outlet) => (
                  <option key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </option>
                ))}
              </select>
            )}
            <p className="text-slate-500 dark:text-slate-400 text-sm">
              {viewMode === "time"
                ? "Pantau Penjualan, Stok & Biaya per Periode."
                : "Bandingkan performa antar outlet."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center">
            <button
              onClick={() => setViewMode("time")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${viewMode === "time" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"}`}>
              Laporan Waktu
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === "compare" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"}`}>
              <BarChart3 className="w-4 h-4" />
              Bandingkan Outlet
            </button>
          </div>

          <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400">
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-md flex items-center gap-2 text-sm transition-all shadow-lg shadow-emerald-900/20">
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
            {isExporting ? "Mengexport..." : "Export Excel"}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <SummaryCard
          title="Pendapatan"
          value={totals.totalPendapatan}
          icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
        />
        <SummaryCard
          title="Pembelian Stok"
          value={totals.totalPembelian}
          icon={<ShoppingCart className="w-4 h-4 text-amber-500" />}
        />
        <SummaryCard
          title="Pengeluaran"
          value={totals.totalPengeluaran}
          icon={<ArrowDownRight className="w-4 h-4 text-rose-500" />}
        />
        <SummaryCard
          title="Gaji/Komisi"
          value={totals.gajiStaf}
          icon={<Users className="w-4 h-4 text-indigo-500" />}
        />
        <SummaryCard
          title="Laba Bersih"
          value={totals.labaBersih}
          icon={<Wallet className="w-4 h-4 text-emerald-500" />}
          highlight
        />
      </div>

      {/* Table Control */}
      <div className="bg-white dark:bg-[#1e293b] p-2 rounded-lg border border-slate-200 dark:border-slate-800 mb-6 flex flex-wrap items-center justify-between gap-4 shadow-md dark:shadow-xl">
        <div className="flex bg-slate-100 dark:bg-[#0f172a] p-1 rounded-md border border-slate-200 dark:border-slate-700">
          {viewMode === "time" ? (
            <>
              <FilterButton active={filterType === "daily"} onClick={() => setFilterType("daily")}>
                Harian
              </FilterButton>
              <FilterButton
                active={filterType === "weekly"}
                onClick={() => setFilterType("weekly")}>
                Mingguan
              </FilterButton>
              <FilterButton
                active={filterType === "monthly"}
                onClick={() => setFilterType("monthly")}>
                Bulanan
              </FilterButton>
            </>
          ) : (
            <>
              <FilterButton
                active={compareFilterType === "daily"}
                onClick={() => setCompareFilterType("daily")}>
                Harian
              </FilterButton>
              <FilterButton
                active={compareFilterType === "monthly"}
                onClick={() => setCompareFilterType("monthly")}>
                Bulanan
              </FilterButton>
              <FilterButton
                active={compareFilterType === "yearly"}
                onClick={() => setCompareFilterType("yearly")}>
                Tahunan
              </FilterButton>
            </>
          )}
        </div>

        <div className="flex items-center gap-6 px-2">
          <button
            onClick={() => adjustDate(-1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-3 font-bold text-slate-900 dark:text-white">
            <CalendarIcon className="w-5 h-5 text-emerald-500" />
            <span className="min-w-[180px] text-center text-lg">
              {viewMode === "time"
                ? formatPeriodLabel(filterType, currentDate)
                : formatComparePeriodLabel(compareFilterType, currentDate)}
            </span>
          </div>
          <button
            onClick={() => adjustDate(1)}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>

        <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 pr-4 uppercase tracking-widest font-bold">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
          Data Terverifikasi
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#1e293b] rounded-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
        {isLoading && (
          <div className="absolute inset-0 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-2"></div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-center">
              Menghitung Laporan...
            </span>
          </div>
        )}
        <ReportOutleTable
          data={activeData || []}
          totals={totals}
          hideTrend={viewMode === "compare"}
          labelHeader={viewMode === "compare" ? "Nama Outlet" : "Tanggal"}
        />
      </div>
    </>
  );
}

const FilterButton: React.FC<FilterButtonProps> = ({ children, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2 text-xs font-bold transition-all rounded-md ${active ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}>
      {children}
    </button>
  );
};

const formatPeriodLabel = (type: FilterType, date: Date): string => {
  if (type === "daily") {
    // Show "10 Days until DD MMM YYYY"
    const start = new Date(date);
    start.setDate(date.getDate() - 9);
    return `${start.toLocaleDateString("id-ID", { day: "2-digit", month: "short" })} - ${date.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}`;
  }
  if (type === "weekly") {
    // Shows Month
    return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
  }
  if (type === "monthly") {
    // Shows Year
    return date.toLocaleDateString("id-ID", { year: "numeric" });
  }
  return "";
};

const formatComparePeriodLabel = (type: CompareFilterType, date: Date): string => {
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
