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
  ArrowDownRight,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SectionHeader } from "@/components/ui/section-header";
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
import { formatCurrency, cn } from "@/lib/utils";
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

  // ── Beban Total (HPP + Ops + Gaji + Fees) ──
  const totalBeban = totals.totalHpp + totals.totalPengeluaran + totals.gajiStaf + totals.totalFees;

  return (
    <>
      <SectionHeader
        title="Laporan Keuangan"
        description="Analisis mendalam performa bisnis, laba rugi, dan kinerja operasional outlet Anda."
        actions={
          <Select value={outletFilter} onValueChange={setOutletFilter}>
            <SelectTrigger className="w-full sm:w-64 h-10 border-border/60 bg-background/50 focus:bg-background transition-all rounded-md font-bold text-xs uppercase tracking-widest shadow-none">
              <SelectValue placeholder="Pilih outlet" />
            </SelectTrigger>
            <SelectContent className="border-border/80 shadow-2xl">
              <SelectItem value="all" className="text-xs font-bold uppercase tracking-widest">Semua Outlet</SelectItem>
              {outlets.map((outlet) => (
                <SelectItem key={outlet.id} value={outlet.id} className="text-xs font-bold uppercase tracking-widest">
                  {outlet.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4 space-y-4">
        <TabsList >
          <TabsTrigger value="keuangan" className="gap-2 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
            Laporan Keuangan
          </TabsTrigger>
          <TabsTrigger value="staff" className="gap-2 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
            Laporan Staff
          </TabsTrigger>
          <TabsTrigger value="stok" className="gap-2 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
            Stok & Aset
          </TabsTrigger>
        </TabsList>

        <TabsContent value="keuangan" className="space-y-6">
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* P&L Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <SummaryCard
                title="(+) Pendapatan"
                value={totals.totalPendapatan}
                variant="success"
                highlight={true}
                icon={<ArrowUpRight className="w-4 h-4" />}
                description="Total omset dari pesanan selesai"
              />
              <SummaryCard
                title="(+) PPN"
                value={totals.totalPajak}
                variant="info"
                highlight={true}
                icon={<Receipt className="w-4 h-4" />}
                description="Total pajak dari penjualan"
              />
              <SummaryCard
                title="(-) Beban & HPP"
                value={totalBeban}
                variant="destructive"
                highlight={true}
                icon={<ArrowDownRight className="h-4 w-4" />}
                description={`Total akumulasi beban modal & operasional`}
                tooltip={
                  <div className="space-y-3 p-1">
                    <div>
                      <p className="font-bold text-foreground mb-1 uppercase tracking-widest text-[10px]">Daftar Beban & Modal:</p>
                      <p className="text-muted-foreground opacity-80">Total biaya yang mengurangi pendapatan kotor untuk menghasilkan laba bersih.</p>
                    </div>
                    <div className="space-y-3 pt-3 border-t border-border/40">
                      <div className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 mt-1 shrink-0" />
                        <div>
                          <span className="font-bold block text-[10px] uppercase tracking-wider text-amber-600">1. Modal (HPP)</span>
                          <p className="opacity-70">Harga Pokok Penjualan dari barang terjual.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-rose-500 mt-1 shrink-0" />
                        <div>
                          <span className="font-bold block text-[10px] uppercase tracking-wider text-rose-600">2. Beban Ops</span>
                          <p className="opacity-70">Biaya operasional harian / bulanan.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1 shrink-0" />
                        <div>
                          <span className="font-bold block text-[10px] uppercase tracking-wider text-blue-600">3. Komisi/Gaji</span>
                          <p className="opacity-70">Bonus staf per transaksi atau layanan.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                        <div>
                          <span className="font-bold block text-[10px] uppercase tracking-wider text-slate-500">4. Biaya Layanan</span>
                          <p className="opacity-70">Potongan platform atau biaya bank.</p>
                        </div>
                      </div>
                    </div>
                    <p className="border-t border-border/40 pt-2 italic text-[9px] font-bold text-center opacity-60">Laba Bersih = Penjualan - Total Beban</p>
                  </div>
                }
              />
              <SummaryCard
                title="= Laba Bersih"
                value={totals.labaBersih}
                variant={totals.labaBersih >= 0 ? "success" : "destructive"}
                highlight={true}
                icon={<TrendingDown className="w-4 h-4" />}
                description="Keuntungan bersih yang dapat ditarik"
                tooltip={
                  <div className="space-y-2 p-1">
                    <p className="font-bold text-foreground uppercase tracking-widest text-[10px]">Laba Bersih (Net Profit):</p>
                    <p className="text-muted-foreground opacity-80">Keuntungan bersih setelah dikurangi semua modal (HPP), biaya operasional, gaji, dan biaya layanan.</p>
                    <div className="bg-muted/50 border border-border/40 p-2 rounded text-[10px] font-bold tabular-nums mt-2 text-center">
                      LABA = OMSET - BEBAN
                    </div>
                  </div>
                }
              />
            </div>
          </div>

          {/* View Mode Toggle + Export */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
            <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)}>
              <TabsList className="bg-muted/50 border border-border/40 p-1 rounded-md h-auto gap-1 w-full md:w-auto">
                <TabsTrigger value="time" className="px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
                  Laporan Waktu
                </TabsTrigger>
                <TabsTrigger value="compare" className="px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
                  Bandingkan Outlet
                </TabsTrigger>
              </TabsList>
            </Tabs>

            <div className="flex items-center gap-2 w-full md:w-auto ml-auto">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                variant="outline"
                className="h-10 w-full md:w-auto font-bold text-[10px] uppercase tracking-widest border-border/60 hover:bg-muted/50 transition-all shadow-none"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <FileSpreadsheet className="w-4 h-4 mr-2 text-emerald-500" />
                )}
                {isExporting ? "Mengexport..." : "Export Excel"}
              </Button>
            </div>
          </div>

          {/* Filter & Date Navigation */}
          <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm overflow-hidden">
            <CardContent className="p-4 bg-muted/30 border-b border-border/40 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
              {/* Filter Buttons */}
              <div className="flex w-full lg:w-auto bg-muted/50 p-1 rounded-md border border-border/40 overflow-x-auto hide-scrollbar gap-1">
                {viewMode === "time" ? (
                  <>
                    <FilterButton active={filterType === "daily"} onClick={() => setFilterType("daily")}>Harian</FilterButton>
                    <FilterButton active={filterType === "weekly"} onClick={() => setFilterType("weekly")}>Mingguan</FilterButton>
                    <FilterButton active={filterType === "monthly"} onClick={() => setFilterType("monthly")}>Bulanan</FilterButton>
                  </>
                ) : (
                  <>
                    <FilterButton active={compareFilterType === "daily"} onClick={() => setCompareFilterType("daily")}>Harian</FilterButton>
                    <FilterButton active={compareFilterType === "monthly"} onClick={() => setCompareFilterType("monthly")}>Bulanan</FilterButton>
                    <FilterButton active={compareFilterType === "yearly"} onClick={() => setCompareFilterType("yearly")}>Tahunan</FilterButton>
                  </>
                )}
              </div>

              {/* Date Selector */}
              <div className="flex items-center justify-between lg:justify-center w-full lg:w-auto gap-2 lg:gap-6 px-1 lg:px-2 bg-background/50 border border-border/40 rounded-md p-1">
                <Button
                  onClick={() => adjustDate(-1)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all">
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <div className="text-foreground flex flex-1 items-center justify-center gap-3 font-bold lg:flex-none min-w-0">
                  <CalendarIcon className="w-4 h-4 text-emerald-500 opacity-60 shrink-0" />
                  <span className="text-xs sm:text-sm uppercase tracking-widest text-center truncate px-2 font-bold opacity-90 tabular-nums">
                    {viewMode === "time"
                      ? formatPeriodLabel(filterType, currentDate)
                      : formatComparePeriodLabel(compareFilterType, currentDate)}
                  </span>
                </div>
                <Button
                  onClick={() => adjustDate(1)}
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full hover:bg-muted/50 transition-all">
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>

              <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/5 border border-emerald-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70">Verified Data</span>
              </div>
            </CardContent>
          </Card>

          {/* Financial Table */}
          <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm overflow-hidden relative">
            {isLoading && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-md z-10 flex flex-col items-center justify-center space-y-3">
                <div className="relative">
                  <div className="h-10 w-10 rounded-full border-2 border-emerald-500/20 border-t-emerald-500 animate-spin" />
                  <Receipt className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
                </div>
                <span className="text-[10px] font-bold text-foreground/70 uppercase tracking-[0.2em] animate-pulse">
                  Mengolah Laporan...
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
              tooltip={
                <div className="space-y-3">
                  <div>
                    <p className="font-bold text-foreground mb-1">Total Pembelian Stok:</p>
                    <p>Akumulasi biaya yang Anda keluarkan untuk membeli persediaan barang (Stock In) dalam periode ini.</p>
                  </div>
                  <div className="space-y-2 text-rose-500 bg-rose-500/5 p-2 rounded border border-rose-500/20">
                    <p className="font-semibold text-xs uppercase">Penting:</p>
                    <p>Pembelian stok **bukanlah pengurang laba bersih** (bukan HPP). Ini adalah aset dalam bentuk barang.</p>
                    <p className="mt-1">Laba Anda hanya berkurang saat barang tersebut **terjual** (dicatat sebagai HPP di tab Keuangan).</p>
                  </div>
                </div>
              }
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
          <div className="group rounded-md border border-blue-500/20 bg-blue-500/5 p-5 shadow-sm relative overflow-hidden transition-all hover:bg-blue-500/10">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
              <Package className="h-16 w-16" />
            </div>
            <div className="flex items-start gap-4 relative z-10">
              <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0">
                <HelpCircle className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1.5">
                  Catatan Penting: Pembelian Stok & Aset
                </h3>
                <p className="text-[11px] font-medium text-foreground/70 leading-relaxed max-w-2xl">
                  Pembelian stok dicatat sebagai penambahan aset (inventory), <span className="font-bold text-blue-600">bukanlah pengurang laba operasional (HPP)</span>.
                  Data ini ditarik dari log stok masuk dan dihitung berdasarkan nilai perolehan. Laba Anda hanya berkurang secara finansial saat barang tersebut <span className="underline decoration-blue-500/30">terjual</span>.
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
      className={cn(
        "flex-1 lg:flex-none px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all rounded-md whitespace-nowrap shadow-none",
        active
          ? "bg-background text-foreground border border-border/60 shadow-sm"
          : "text-muted-foreground hover:text-foreground/80 hover:bg-muted/30"
      )}>
      {children}
    </button>
  );
};

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
