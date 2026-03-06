"use client";

import React, { useState, useMemo, useCallback } from "react";
import {
  Calendar as CalendarIcon,
  FileSpreadsheet,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Wallet,
  Users,
  Receipt,
  BarChart3,
  Loader2,
  Package,
  TrendingDown,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useReportOutlet, useCompareOutletsReport, useReportStaff } from "@/hooks/useReport";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { DataTable } from "@/components/ui/data-table";
import { ReportFinancialTable, Totals } from "./ReportFinancialTable";
import { ReportStaffTable } from "../staff/ReportStaffTable";
import { SummaryCard } from "../SummaryCard";
import { formatCurrency } from "@/lib/utils";
import reportApi from "@/lib/apis/report";
import { format } from "date-fns";

type FilterType = "daily" | "weekly" | "monthly";
type CompareFilterType = "daily" | "monthly" | "yearly";
type ViewMode = "time" | "compare";

interface FilterButtonProps {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}

export default function ReportFinancialContent() {
  const { outlets, selectedOutlet } = useOutletContext();
  const [activeTab, setActiveTab] = useState("keuangan");

  // ── Shared state ──
  const [viewMode, setViewMode] = useState<ViewMode>("time");
  const [filterType, setFilterType] = useState<FilterType>("daily");
  const [compareFilterType, setCompareFilterType] = useState<CompareFilterType>("daily");
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [outletFilter, setOutletFilter] = useState<string>(selectedOutlet?.id || "all");
  const [isExporting, setIsExporting] = useState(false);

  // ── Staff-specific state ──
  const [staffFilterType, setStaffFilterType] = useState<FilterType>("daily");
  const [staffDate, setStaffDate] = useState<Date>(new Date());

  React.useEffect(() => {
    if (selectedOutlet?.id) {
      setOutletFilter(selectedOutlet.id);
    }
  }, [selectedOutlet?.id]);

  // ── Data Fetching ──
  const { data: timeData, isLoading: isLoadingTime } = useReportOutlet(
    outletFilter,
    filterType,
    currentDate.toISOString(),
  );

  const { data: compareData, isLoading: isLoadingCompare } = useCompareOutletsReport(
    compareFilterType,
    currentDate.toISOString(),
  );

  const { data: staffData, isLoading: isLoadingStaff } = useReportStaff(
    outletFilter,
    staffFilterType,
    format(staffDate, "yyyy-MM-dd"),
  );

  const activeData = viewMode === "time" ? timeData : compareData;
  const isLoading = viewMode === "time" ? isLoadingTime : isLoadingCompare;

  // ── Totals for Financial ──
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

  // ── Totals for Staff ──
  const staffTotals = useMemo(() => {
    return (staffData || []).reduce(
      (acc, curr) => ({
        transactions: acc.transactions + curr.transactionCount,
        revenue: acc.revenue + (curr.type === "CASHIER" ? curr.revenue : 0),
        commission: acc.commission + (curr.type === "SERVICE" ? curr.commission : 0),
      }),
      { transactions: 0, revenue: 0, commission: 0 },
    );
  }, [staffData]);

  // ── Date Navigation ──
  const adjustDate = (amount: number): void => {
    const newDate = new Date(currentDate);

    if (viewMode === "time") {
      if (filterType === "daily") newDate.setDate(newDate.getDate() + amount * 10);
      if (filterType === "weekly") newDate.setMonth(newDate.getMonth() + amount);
      if (filterType === "monthly") newDate.setFullYear(newDate.getFullYear() + amount);
    } else {
      if (compareFilterType === "daily") newDate.setDate(newDate.getDate() + amount);
      if (compareFilterType === "monthly") newDate.setMonth(newDate.getMonth() + amount);
      if (compareFilterType === "yearly") newDate.setFullYear(newDate.getFullYear() + amount);
    }

    setCurrentDate(newDate);
  };

  const adjustStaffDate = (amount: number): void => {
    const newDate = new Date(staffDate);
    if (staffFilterType === "daily") newDate.setDate(newDate.getDate() + amount);
    if (staffFilterType === "weekly") newDate.setDate(newDate.getDate() + amount * 7);
    if (staffFilterType === "monthly") newDate.setMonth(newDate.getMonth() + amount);
    setStaffDate(newDate);
  };

  // ── Export ──
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
      link.download = `Laporan_Keuangan_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Berhasil mengexport laporan keuangan");
    } catch {
      toast.error("Gagal mengexport laporan keuangan");
    } finally {
      setIsExporting(false);
    }
  }, [outletFilter, filterType, compareFilterType, currentDate, viewMode]);

  const handleExportStaff = useCallback(async () => {
    setIsExporting(true);
    try {
      const blob = await reportApi.exportStaffExcel(outletFilter, {
        type: staffFilterType,
        date: format(staffDate, "yyyy-MM-dd"),
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_Staff_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Berhasil mengexport laporan staff");
    } catch {
      toast.error("Gagal mengexport laporan staff");
    } finally {
      setIsExporting(false);
    }
  }, [outletFilter, staffFilterType, staffDate]);

  // ── Beban Operasional (sum of Pengeluaran + Gaji) ──
  const totalBeban = totals.totalPengeluaran + totals.gajiStaf;

  return (
    <>
      {/* ══════════ Page Header ══════════ */}
      <div className="flex flex-col xl:flex-row xl:items-start justify-between mb-6 lg:mb-8 gap-5">
        <div className="w-full xl:w-auto">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Receipt className="text-emerald-500 w-7 h-7 shrink-0" />
            Laporan Keuangan
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
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
          </div>
        </div>
      </div>

      {/* ══════════ 3 Tabs ══════════ */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:inline-grid">
          <TabsTrigger value="keuangan" className="gap-2">
            <Receipt className="w-4 h-4 hidden sm:block" />
            Laporan Keuangan
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2">
            <Users className="w-4 h-4 hidden sm:block" />
            Laporan Staff
          </TabsTrigger>
          <TabsTrigger value="stok" className="gap-2">
            <Package className="w-4 h-4 hidden sm:block" />
            Stok & Aset
          </TabsTrigger>
        </TabsList>

        {/* ═══════ TAB 1: Laporan Keuangan (P&L) ═══════ */}
        <TabsContent value="keuangan" className="space-y-6">
          {/* P&L Summary Cards */}
          <div className="space-y-4">
            {/* (+) Pendapatan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SummaryCard
                title="(+) Pendapatan"
                value={totals.totalPendapatan}
                icon={<ArrowUpRight className="w-4 h-4 text-emerald-500" />}
                description="dari order completed"
              />
              <SummaryCard
                title="(-) Beban Operasional"
                value={totalBeban}
                icon={<TrendingDown className="w-4 h-4 text-rose-500" />}
                description={`Pengeluaran ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totals.totalPengeluaran)} + Komisi ${new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(totals.gajiStaf)}`}
              />
              <SummaryCard
                title="= Laba Bersih"
                value={totals.labaBersih}
                icon={<Wallet className="w-4 h-4 text-emerald-500" />}
                highlight
              />
            </div>
          </div>

          {/* View Mode Toggle + Export */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
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

            <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
              <button
                onClick={handleExport}
                disabled={isExporting}
                className="flex-1 md:flex-none justify-center bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-md flex items-center gap-2 text-sm transition-all shadow-lg shadow-emerald-900/20">
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                )}
                {isExporting ? "Mengexport..." : "Export Excel"}
              </button>
            </div>
          </div>

          {/* Filter & Date Navigation */}
          <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm dark:shadow-md">
            {/* Filter Buttons */}
            <div className="flex w-full lg:w-auto bg-slate-100 dark:bg-[#0f172a] p-1 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar">
              {viewMode === "time" ? (
                <>
                  <FilterButton
                    active={filterType === "daily"}
                    onClick={() => setFilterType("daily")}>
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
            <div className="flex items-center justify-between lg:justify-center w-full lg:w-auto gap-2 lg:gap-6 px-1 lg:px-2">
              <button
                onClick={() => adjustDate(-1)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center justify-center gap-2 lg:gap-3 font-bold text-slate-900 dark:text-white flex-1 lg:flex-none min-w-0">
                <CalendarIcon className="w-5 h-5 text-emerald-500 hidden sm:block shrink-0" />
                <span className="text-sm sm:text-base lg:text-lg text-center truncate px-2">
                  {viewMode === "time"
                    ? formatPeriodLabel(filterType, currentDate)
                    : formatComparePeriodLabel(compareFilterType, currentDate)}
                </span>
              </div>
              <button
                onClick={() => adjustDate(1)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 pr-4 uppercase tracking-widest font-bold">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
              Data Terverifikasi
            </div>
          </div>

          {/* Financial Table */}
          <div className="bg-white dark:bg-[#1e293b] rounded-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-2"></div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-center">
                  Menghitung Laporan...
                </span>
              </div>
            )}
            <ReportFinancialTable
              data={activeData || []}
              totals={totals}
              hideTrend={viewMode === "compare"}
              labelHeader={viewMode === "compare" ? "Nama Outlet" : "Tanggal"}
            />
          </div>
        </TabsContent>

        {/* ═══════ TAB 2: Laporan Staff ═══════ */}
        <TabsContent value="staff" className="space-y-6">
          {/* Staff Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <SummaryCard
              title="Total Transaksi"
              isCurrency={false}
              value={staffTotals.transactions}
              icon={<Receipt className="w-4 h-4 text-slate-500" />}
            />
            <SummaryCard
              title="Total Penjualan (Kasir)"
              value={staffTotals.revenue}
              icon={<Wallet className="w-4 h-4 text-emerald-500" />}
            />
            <SummaryCard
              title="Total Komisi (Layanan)"
              value={staffTotals.commission}
              icon={<Users className="w-4 h-4 text-indigo-500" />}
            />
          </div>

          {/* Staff Date Filter */}
          <div className="bg-white dark:bg-[#1e293b] p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 shadow-sm dark:shadow-md">
            <div className="flex w-full lg:w-auto bg-slate-100 dark:bg-[#0f172a] p-1 rounded-lg border border-slate-200 dark:border-slate-700 overflow-x-auto hide-scrollbar">
              <FilterButton
                active={staffFilterType === "daily"}
                onClick={() => setStaffFilterType("daily")}>
                Harian
              </FilterButton>
              <FilterButton
                active={staffFilterType === "weekly"}
                onClick={() => setStaffFilterType("weekly")}>
                Mingguan
              </FilterButton>
              <FilterButton
                active={staffFilterType === "monthly"}
                onClick={() => setStaffFilterType("monthly")}>
                Bulanan
              </FilterButton>
            </div>
            <div className="flex items-center justify-between lg:justify-center w-full lg:w-auto gap-2 lg:gap-6 px-1 lg:px-2">
              <button
                onClick={() => adjustStaffDate(-1)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0">
                <ChevronLeft className="w-6 h-6" />
              </button>
              <div className="flex items-center justify-center gap-2 lg:gap-3 font-bold text-slate-900 dark:text-white flex-1 lg:flex-none min-w-0">
                <CalendarIcon className="w-5 h-5 text-emerald-500 hidden sm:block shrink-0" />
                <span className="text-sm sm:text-base lg:text-lg text-center truncate px-2">
                  {formatStaffPeriodLabel(staffFilterType, staffDate)}
                </span>
              </div>
              <button
                onClick={() => adjustStaffDate(1)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors shrink-0">
                <ChevronRight className="w-6 h-6" />
              </button>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                onClick={handleExportStaff}
                disabled={isExporting}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold py-2.5 px-5 rounded-md flex items-center gap-2 text-sm transition-all shadow-lg shadow-emerald-900/20">
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                )}
                {isExporting ? "Mengexport..." : "Export Excel"}
              </button>
            </div>
          </div>

          {/* Staff Table */}
          <div className="bg-white dark:bg-[#1e293b] rounded-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
            {isLoadingStaff && (
              <div className="absolute inset-0 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-2"></div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-center">
                  Memuat Data Staff...
                </span>
              </div>
            )}
            <ReportStaffTable data={staffData || []} totals={staffTotals} />
          </div>
        </TabsContent>

        {/* ═══════ TAB 3: Stok & Aset ═══════ */}
        <TabsContent value="stok" className="space-y-6">
          {/* Stok Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SummaryCard
              title="📦 Total Pembelian Stok (Aset)"
              value={totals.totalPembelian}
              icon={<Package className="w-4 h-4 text-amber-500" />}
              description="Tidak mempengaruhi perhitungan laba bersih"
            />
            <SummaryCard
              title="Jumlah Transaksi (Periode)"
              value={totals.jumlahTransaksi}
              isCurrency={false}
              icon={<Receipt className="w-4 h-4 text-slate-500" />}
              description="Jumlah order completed dalam periode ini"
            />
          </div>

          {/* Info Card */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-5">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-amber-800 dark:text-amber-300 text-sm">
                  Pembelian Stok adalah Aset
                </h3>
                <p className="text-amber-700 dark:text-amber-400/80 text-sm mt-1">
                  Pembelian stok dicatat sebagai penambahan aset (inventory), bukan sebagai
                  pengurang laba operasional. Data ini ditarik dari log stok masuk (Stock IN) dan
                  dihitung berdasarkan HPP per unit × jumlah unit.
                </p>
              </div>
            </div>
          </div>

          {/* Stok Purchase Table — reuse financial data but only show stok column */}
          <div className="bg-white dark:bg-[#1e293b] rounded-md border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-[#0f172a]/60 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-2"></div>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-500 uppercase tracking-widest text-center">
                  Memuat Data Stok...
                </span>
              </div>
            )}
            <StockAssetTable data={activeData || []} totalPembelian={totals.totalPembelian} />
          </div>
        </TabsContent>
      </Tabs>
    </>
  );
}

// ── Sub Components ──

function StockAssetTable({ data, totalPembelian }: { data: any[]; totalPembelian: number }) {
  return (
    <DataTable
      data={data}
      pageSize={50}
      globalFilter={false}
      showColumnVisibility={false}
      showTableInfo={false}
      pagination={false}
      showFooter
      columns={[
        {
          accessorKey: "label",
          header: "Periode",
          footer: () => "Total",
        },
        {
          accessorKey: "totalPembelian",
          header: "Pembelian Stok (Aset)",
          cell: (props: any) => (
            <span className="text-amber-600 dark:text-amber-400/80 font-semibold">
              {formatCurrency(props.row.original.totalPembelian)}
            </span>
          ),
          footer: () => (
            <span className="text-amber-600 dark:text-amber-400/80 font-bold">
              {formatCurrency(totalPembelian)}
            </span>
          ),
        },
      ]}
    />
  );
}

const FilterButton: React.FC<FilterButtonProps> = ({ children, active, onClick }) => {
  return (
    <button
      onClick={onClick}
      className={`flex-1 lg:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-bold transition-all rounded-md whitespace-nowrap ${active ? "bg-emerald-600 text-white shadow-md" : "text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300"}`}>
      {children}
    </button>
  );
};

// ── Period Label Formatters ──

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
