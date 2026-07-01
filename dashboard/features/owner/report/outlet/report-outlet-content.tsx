"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
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
import { gooeyToast } from "goey-toast";
import { useReportOutlet, useCompareOutletsReport } from "@/hooks/use-report";
import { useOutletStore } from "@/stores/outlet.store";
import { ReportOutleTable, Totals } from "./report-outlet-table";
import { SummaryCard } from "../summary-card";
import reportApi from "@/lib/apis/report";
import { PeriodPicker, type PeriodValue } from "@/components/ui/periode-picker";

type FilterType = "daily" | "weekly" | "monthly";
type CompareFilterType = "daily" | "monthly" | "yearly";
type ViewMode = "time" | "compare";

export default function ReportOutlerContent() {
  const { outlets, selectedOutlet } = useOutletStore();
  const [viewMode, setViewMode] = useState<ViewMode>("time");
  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [compareFilterType, setCompareFilterType] = useState<CompareFilterType>("daily");
  const [periodValue, setPeriodValue] = useState<PeriodValue>(() => {
    const now = new Date();
    return { type: "daily", date: now.toISOString().split("T")[0] };
  });
  const [outletFilter, setOutletFilter] = useState<string>(selectedOutlet?.id || "all");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (selectedOutlet?.id) setOutletFilter(selectedOutlet.id);
  }, [selectedOutlet?.id]);

  const { data: timeData, isLoading: isLoadingTime } = useReportOutlet(
    outletFilter,
    periodValue,
  );

  const { data: compareData, isLoading: isLoadingCompare } = useCompareOutletsReport(
    periodValue,
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

  const currentDate = useMemo(() => {
    switch (periodValue.type) {
      case "daily":
        return new Date(periodValue.date);
      case "weekly":
        return new Date(periodValue.startDate);
      case "monthly":
        return new Date(periodValue.year, periodValue.month - 1, 1);
      case "yearly":
        return new Date(periodValue.year, 0, 1);
    }
  }, [periodValue]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await reportApi.exportOutletExcel(outletFilter, periodValue, viewMode);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_Outlet_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      gooeyToast.success("Berhasil mengexport laporan outlet");
    } catch {
      gooeyToast.error("Gagal mengexport laporan outlet");
    } finally {
      setIsExporting(false);
    }
  }, [outletFilter, periodValue, viewMode]);

  return (
    <>
      {/* Header */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between mb-6 lg:mb-8 gap-5">
        <div className="w-full xl:w-auto">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-emerald-500 w-7 h-7 shrink-0" />
            Laporan Outlet
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
            {viewMode === "time" && (
              <select
                value={outletFilter}
                onChange={(e) => setOutletFilter(e.target.value)}
                className="w-full sm:w-auto bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500">
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

        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3 w-full xl:w-auto">
          {/* Toggle View Mode */}
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex items-center w-full md:w-auto shrink-0">
            <button
              onClick={() => setViewMode("time")}
              className={`flex-1 md:flex-none justify-center px-3 py-2 text-sm font-medium rounded-md transition-all ${viewMode === "time" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"}`}>
              Laporan Waktu
            </button>
            <button
              onClick={() => setViewMode("compare")}
              className={`flex-1 md:flex-none justify-center px-3 py-2 text-sm font-medium rounded-md transition-all flex items-center gap-2 ${viewMode === "compare" ? "bg-white dark:bg-slate-700 shadow-sm text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-300"}`}>
              <BarChart3 className="w-4 h-4 shrink-0" />
              Bandingkan Outlet
            </button>
          </div>

          {/* Export Actions */}
          <div className="flex items-center gap-2 w-full md:w-auto">
            <button className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md text-slate-500 dark:text-slate-400 hidden sm:block">
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex-1 md:flex-none justify-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-md flex items-center gap-2 text-sm transition-all shadow-lg shadow-emerald-900/20">
              {isExporting ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <FileSpreadsheet className="w-4 h-4 shrink-0" />}
              {isExporting ? "Mengexport..." : "Export Excel"}
            </button>
          </div>
        </div>
      </div>

      {/* Cards - Menyesuaikan grid agar proporsional di mobile */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-4 mb-8">
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
        <div className="col-span-2 md:col-span-1 lg:col-span-1">
          <SummaryCard
            title="Laba Bersih"
            value={totals.labaBersih}
            icon={<Wallet className="w-4 h-4 text-emerald-500" />}
            highlight
          />
        </div>
      </div>

      {/* Table Control */}
      <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-slate-200 dark:border-slate-800 mb-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm dark:shadow-md">

        {/* Filters Box */}
        <div className="flex w-full lg:w-auto bg-slate-100 dark:bg-[#0f172a] p-1 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar">
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

        {/* Date Selector */}
        <PeriodPicker
          granularity={filterType}
          value={periodValue}
          onValueChange={setPeriodValue}
        />

        {/* Verif Indicator */}
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

const FilterButton: React.FC<{ children: React.ReactNode; active: boolean; onClick: () => void }> = ({ children, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 lg:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-bold transition-all rounded-md whitespace-nowrap ${active ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}>
      {children}
    </button>
  );
};