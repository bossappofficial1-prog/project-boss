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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

  // ── Stock-specific state ──
  const [stockFilterType, setStockFilterType] = useState<FilterType>("daily");
  const [stockDate, setStockDate] = useState<Date>(new Date());

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

  const { data: timeDataStok, isLoading: isLoadingStok } = useReportOutlet(
    outletFilter,
    stockFilterType,
    stockDate.toISOString(),
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

  // ── Totals for Stock ──
  const stokTotals = useMemo(() => {
    return (timeDataStok || []).reduce(
      (acc, curr) => ({
        jumlahTransaksi: acc.jumlahTransaksi + curr.jumlahTransaksi,
        totalPembelian: acc.totalPembelian + curr.totalPembelian,
      }),
      { jumlahTransaksi: 0, totalPembelian: 0 },
    );
  }, [timeDataStok]);

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

  const adjustStockDate = (amount: number): void => {
    const newDate = new Date(stockDate);
    if (stockFilterType === "daily") newDate.setDate(newDate.getDate() + amount * 10);
    if (stockFilterType === "weekly") newDate.setMonth(newDate.getMonth() + amount);
    if (stockFilterType === "monthly") newDate.setFullYear(newDate.getFullYear() + amount);
    setStockDate(newDate);
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
          <h1 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Receipt className="text-emerald-500 w-7 h-7 shrink-0" />
            Laporan Keuangan
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-3">
            <Select value={outletFilter} onValueChange={setOutletFilter}>
              <SelectTrigger className="w-full sm:w-55">
                <SelectValue placeholder="Pilih outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Outlet</SelectItem>
                {outlets.map((outlet) => (
                  <SelectItem key={outlet.id} value={outlet.id}>
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList className="h-auto w-full md:w-auto">
                <TabsTrigger value="time" className="px-3 py-2 text-sm">
                  Laporan Waktu
                </TabsTrigger>
                <TabsTrigger value="compare" className="px-3 py-2 text-sm">
                  <BarChart3 className="w-4 h-4 shrink-0" />
                  Bandingkan Outlet
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="h-10 w-full md:w-auto">
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 shrink-0" />
                )}
                {isExporting ? "Mengexport..." : "Export Excel"}
              </Button>
            </div>
          </div>

          {/* Filter & Date Navigation */}
          <Card className="rounded-md py-3">
            <CardContent className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Filter Buttons */}
              <div className="flex w-full lg:w-auto bg-muted p-1 rounded-md border border-border overflow-x-auto hide-scrollbar">
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
                <Button
                  onClick={() => adjustDate(-1)}
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full shrink-0">
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="text-foreground flex flex-1 items-center justify-center gap-2 lg:gap-3 font-bold lg:flex-none min-w-0">
                  <CalendarIcon className="w-5 h-5 text-emerald-500 hidden sm:block shrink-0" />
                  <span className="text-sm sm:text-base lg:text-lg text-center truncate px-2">
                    {viewMode === "time"
                      ? formatPeriodLabel(filterType, currentDate)
                      : formatComparePeriodLabel(compareFilterType, currentDate)}
                  </span>
                </div>
                <Button
                  onClick={() => adjustDate(1)}
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full shrink-0">
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              <Badge variant="outline" className="hidden lg:flex items-center gap-2 text-[10px] text-muted-foreground pr-4 uppercase tracking-widest font-bold">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Data Terverifikasi
              </Badge>
            </CardContent>
          </Card>

          {/* Financial Table */}
          <Card className="rounded-md py-0 overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-2"></div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest text-center">
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
          </Card>
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
          <Card className="rounded-md py-3">
            <CardContent className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex w-full lg:w-auto bg-muted p-1 rounded-md border border-border overflow-x-auto hide-scrollbar">
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
                <Button
                  onClick={() => adjustStaffDate(-1)}
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full shrink-0">
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="text-foreground flex items-center justify-center gap-2 lg:gap-3 font-bold flex-1 lg:flex-none min-w-0">
                  <CalendarIcon className="w-5 h-5 text-emerald-500 hidden sm:block shrink-0" />
                  <span className="text-sm sm:text-base lg:text-lg text-center truncate px-2">
                    {formatStaffPeriodLabel(staffFilterType, staffDate)}
                  </span>
                </div>
                <Button
                  onClick={() => adjustStaffDate(1)}
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full shrink-0">
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <Button
                  onClick={handleExportStaff}
                  disabled={isExporting}
                  className="h-10">
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 shrink-0" />
                  )}
                  {isExporting ? "Mengexport..." : "Export Excel"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Staff Table */}
          <Card className="rounded-md py-0 overflow-hidden relative">
            {isLoadingStaff && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-2"></div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest text-center">
                  Memuat Data Staff...
                </span>
              </div>
            )}
            <ReportStaffTable data={staffData || []} totals={staffTotals} />
          </Card>
        </TabsContent>

        {/* ═══════ TAB 3: Stok & Aset ═══════ */}
        <TabsContent value="stok" className="space-y-6">
          {/* Stok Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <SummaryCard
              title="📦 Total Pembelian Stok (Aset)"
              value={stokTotals.totalPembelian}
              icon={<Package className="w-4 h-4 text-amber-500" />}
              description="Tidak mempengaruhi perhitungan laba bersih"
            />
            <SummaryCard
              title="Jumlah Transaksi (Periode)"
              value={stokTotals.jumlahTransaksi}
              isCurrency={false}
              icon={<Receipt className="w-4 h-4 text-slate-500" />}
              description="Jumlah order completed dalam periode ini"
            />
          </div>

          {/* Stok Date Filter */}
          <Card className="rounded-md py-3">
            <CardContent className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              <div className="flex w-full lg:w-auto bg-muted p-1 rounded-md border border-border overflow-x-auto hide-scrollbar">
                <FilterButton
                  active={stockFilterType === "daily"}
                  onClick={() => setStockFilterType("daily")}>
                  Harian
                </FilterButton>
                <FilterButton
                  active={stockFilterType === "weekly"}
                  onClick={() => setStockFilterType("weekly")}>
                  Mingguan
                </FilterButton>
                <FilterButton
                  active={stockFilterType === "monthly"}
                  onClick={() => setStockFilterType("monthly")}>
                  Bulanan
                </FilterButton>
              </div>
              <div className="flex items-center justify-between lg:justify-center w-full lg:w-auto gap-2 lg:gap-6 px-1 lg:px-2">
                <Button
                  onClick={() => adjustStockDate(-1)}
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full shrink-0">
                  <ChevronLeft className="w-6 h-6" />
                </Button>
                <div className="text-foreground flex items-center justify-center gap-2 lg:gap-3 font-bold flex-1 lg:flex-none min-w-0">
                  <CalendarIcon className="w-5 h-5 text-emerald-500 hidden sm:block shrink-0" />
                  <span className="text-sm sm:text-base lg:text-lg text-center truncate px-2">
                    {formatPeriodLabel(stockFilterType, stockDate)}
                  </span>
                </div>
                <Button
                  onClick={() => adjustStockDate(1)}
                  variant="ghost"
                  size="icon-sm"
                  className="rounded-full shrink-0">
                  <ChevronRight className="w-6 h-6" />
                </Button>
              </div>
            </CardContent>
          </Card>

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

          {/* Stok Purchase Table */}
          <Card className="rounded-md py-0 overflow-hidden relative">
            {isLoadingStok && (
              <div className="absolute inset-0 bg-background/70 backdrop-blur-sm z-10 flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-500 mb-2"></div>
                <span className="text-xs font-bold text-primary uppercase tracking-widest text-center">
                  Memuat Data Stok...
                </span>
              </div>
            )}
            <StockAssetTable data={timeDataStok || []} totalPembelian={stokTotals.totalPembelian} />
          </Card>
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
      className={`flex-1 lg:flex-none px-3 sm:px-5 py-2 text-xs sm:text-sm font-semibold transition-all rounded-md whitespace-nowrap ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
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
