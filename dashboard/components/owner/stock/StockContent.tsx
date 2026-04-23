"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useStockHistory } from "@/hooks/useStockHistory";
import { useStockData } from "@/hooks/useStockData";
import { useStockOverview } from "@/hooks/use-stock-overview";
import { useOutletContext } from "@/components/providers/OutletProvider";
import ProductSummaryCard from "@/components/owner/stock/ProductSummaryCard";
import HistoryTable from "@/components/owner/stock/HistoryTable";
import { stockApi } from "@/lib/apis/stock";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Package,
  History,
  AlertCircle,
  Search,
  ArrowDownCircle,
  ArrowUpCircle,
  Settings,
  RotateCcw,
  TrendingUp,
  Boxes,
  AlertTriangle,
  XCircle,
  DollarSign,
  Download,
  TrendingDown,
} from "lucide-react";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { SectionHeader } from "@/components/ui/section-header";
import { cn } from "@/lib/utils";

function formatCurrency(amount: number | null | undefined) {
  if (amount === null || amount === undefined) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function StockPageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64 bg-muted/30" />
        <Skeleton className="h-4 w-96 bg-muted/20" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-md border border-border/40 p-4 space-y-3 bg-muted/5">
            <Skeleton className="h-10 w-10 rounded-md bg-muted/30" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-16 bg-muted/20" />
              <Skeleton className="h-6 w-24 bg-muted/30" />
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-10 w-full max-w-md bg-muted/20" />
        <div className="rounded-md border border-border/40 p-1 space-y-4">
          <div className="flex items-center justify-between p-4 border-b border-border/40">
            <Skeleton className="h-6 w-32 bg-muted/20" />
            <Skeleton className="h-9 w-64 bg-muted/20" />
          </div>
          <div className="p-4 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full bg-muted/10 rounded-md" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface OverviewCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  description?: string;
  variant?: "default" | "warning" | "danger" | "success" | "purple";
}

function OverviewCard({ icon, label, value, description, variant = "default" }: OverviewCardProps) {
  const styles = {
    default: 'bg-muted text-muted-foreground border-border',
    warning: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    danger: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    purple: 'bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20',
  }

  return (
    <Card className="rounded-md gap-0 py-0 border-border/80 bg-background shadow-sm transition-all hover:shadow-md">
      <CardContent className="flex flex-col items-start gap-3 p-4">
        <div className={`flex h-10 w-10 items-center justify-center rounded-md border shadow-sm ${styles[variant]}`}>
          {icon}
        </div>
        <div className="space-y-0.5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
          <p className="text-2xl font-bold tracking-tighter text-foreground/90 tabular-nums">{value}</p>
          {description && (
            <p className="text-[10px] font-semibold text-muted-foreground italic opacity-70">
              {description}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default function StockContent() {
  const { selectedOutletId, outlets, isLoading: outletLoading } = useOutletContext();

  const [selectedProductGoodsId, setSelectedProductGoodsId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [isExporting, setIsExporting] = useState(false);
  const router = useRouter()

  const {
    stockItems,
    isLoading: isLoadingProducts,
    error: productsError,
    hasBusinessProfile,
    hasOutlet,
    setError: setProductsError,
  } = useStockData();

  const {
    productInfo,
    historyLogs,
    isLoading: isLoadingHistory,
    error: historyError,
    fetchHistory,
    formatCurrency: formatCurrencyHistory,
    formatDate,
    setError: setHistoryError,
  } = useStockHistory();

  const { data: overview, isLoading: isLoadingOverview } = useStockOverview(selectedOutletId);

  useEffect(() => {
    if (selectedProductGoodsId) {
      fetchHistory(selectedProductGoodsId);
    }
  }, [selectedProductGoodsId, fetchHistory]);

  const handleProductChange = useCallback((productGoodsId: string) => {
    setSelectedProductGoodsId(productGoodsId);
    setActiveTab("history");
  }, []);

  const currentOutletName = outlets.find((o) => o.id === selectedOutletId)?.name;

  const handleExport = useCallback(async () => {
    if (!selectedOutletId) return;
    setIsExporting(true);
    try {
      const blob = await stockApi.exportExcel(selectedOutletId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Laporan_Stok_${currentOutletName || "outlet"}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Berhasil mengexport data stok");
    } catch {
      toast.error("Gagal mengexport data stok");
    } finally {
      setIsExporting(false);
    }
  }, [selectedOutletId, currentOutletName]);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return stockItems;
    const q = searchQuery.toLowerCase();
    return stockItems.filter((item) => item.name.toLowerCase().includes(q));
  }, [stockItems, searchQuery]);

  const lowStockItems = useMemo(
    () =>
      stockItems.filter((item) => {
        if (!item.goods) return false;
        if (item.goods.currentStock === 0) return true;
        if (item.goods.minStock != null && item.goods.currentStock <= item.goods.minStock)
          return true;
        return false;
      }),
    [stockItems],
  );

  const highStockItems = useMemo(
    () =>
      stockItems.filter((item) => {
        if (!item.goods) return false;
        if (item.goods.maxStock == null) return false;
        return item.goods.currentStock >= item.goods.maxStock;
      }),
    [stockItems],
  );

  const alertItems = useMemo(
    () => [
      ...lowStockItems,
      ...highStockItems.filter((h) => !lowStockItems.some((l) => l.id === h.id)),
    ],
    [lowStockItems, highStockItems],
  );

  if (isLoadingProducts || outletLoading) return <StockPageSkeleton />;

  if (!hasBusinessProfile && !hasOutlet) {
    return (
      <EmptyOutletState onAddOutlet={() => router.push(`/owner/dashboard#add-outlet`)} />
    );
  }

  const errorMessage = productsError || historyError;

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Manajemen Stok"
        description={`Pantau dan kelola ketersediaan barang inventaris untuk ${currentOutletName}`}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={isExporting || stockItems.length === 0}
            className="h-9 px-4 font-bold text-xs uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-all shadow-none"
          >
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? "Mengexport..." : "Export Excel"}
          </Button>
        }
      />

      {/* Error Banner */}
      {errorMessage && (
        <div className="flex items-center gap-3 rounded-md border border-rose-200 bg-rose-500/10 p-4 text-rose-700 dark:text-rose-400 shadow-sm animate-shake">
          <div className="p-1.5 rounded-md bg-background border border-rose-200">
            <AlertCircle className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-bold uppercase tracking-tight">Gagal Memuat Data</p>
            <p className="text-[10px] font-medium opacity-80">{errorMessage}</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-rose-500/10"
            onClick={() => {
              setProductsError(null);
              setHistoryError(null);
            }}>
            ✕
          </Button>
        </div>
      )}

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {isLoadingOverview ? (
          Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-md" />)
        ) : (
          <>
            <OverviewCard
              icon={<Boxes className="h-5 w-5" />}
              label="Total Produk"
              value={overview?.totalProducts ?? stockItems.length}
              description="Produk aktif (barang)"
            />
            <OverviewCard
              icon={<DollarSign className="h-5 w-5" />}
              label="Nilai Stok"
              value={formatCurrency(overview?.totalStockValue ?? 0)}
              description="Berdasarkan HPP rata-rata"
              variant="success"
            />
            <OverviewCard
              icon={<AlertTriangle className="h-5 w-5" />}
              label="Stok Rendah"
              value={overview?.lowStockCount ?? lowStockItems.length}
              description="Perlu segera restock"
              variant="warning"
            />
            <OverviewCard
              icon={<XCircle className="h-5 w-5" />}
              label="Habis"
              value={overview?.outOfStockCount ?? 0}
              description="Produk habis stok"
              variant="danger"
            />
            <OverviewCard
              icon={<TrendingDown className="h-5 w-5" />}
              label="Stok Berlebih"
              value={highStockItems.length}
              description="Melebihi batas maksimum"
              variant="purple"
            />
          </>
        )}
      </div>

      {/* Movement Summary Badges */}
      {overview?.recentMovements && Object.keys(overview.recentMovements).length > 0 && (
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-md border border-border/60 bg-muted/5">
          <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Pergerakan 30 hari:</span>
          {overview.recentMovements.IN && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1.5 py-1 px-2 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] uppercase tracking-wider">
                  <ArrowDownCircle className="h-3 w-3" />
                  Masuk: {overview.recentMovements.IN.totalQty} unit
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Total barang masuk dalam 30 hari terakhir</TooltipContent>
            </Tooltip>
          )}
          {overview.recentMovements.OUT && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="outline" className="gap-1.5 py-1 px-2 border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400 font-bold text-[10px] uppercase tracking-wider">
                  <ArrowUpCircle className="h-3 w-3" />
                  Keluar: {overview.recentMovements.OUT.totalQty} unit
                </Badge>
              </TooltipTrigger>
              <TooltipContent>Total barang keluar dalam 30 hari terakhir</TooltipContent>
            </Tooltip>
          )}
          {overview.recentMovements.ADJUSTMENT && (
            <Badge variant="outline" className="gap-1.5 py-1 px-2 border-blue-500/20 bg-blue-500/5 text-blue-600 dark:text-blue-400 font-bold text-[10px] uppercase tracking-wider">
              <Settings className="h-3 w-3" />
              Penyesuaian: {overview.recentMovements.ADJUSTMENT.count}x
            </Badge>
          )}
          {overview.recentMovements.RETURN && (
            <Badge variant="outline" className="gap-1.5 py-1 px-2 border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400 font-bold text-[10px] uppercase tracking-wider">
              <RotateCcw className="h-3 w-3" />
              Retur: {overview.recentMovements.RETURN.count}x
            </Badge>
          )}
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="bg-muted/50 border border-border/40 p-1 rounded-md h-auto gap-1">
          <TabsTrigger value="overview" className="gap-2 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
            <Package className="h-3.5 w-3.5" />
            Daftar Produk
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
            <History className="h-3.5 w-3.5" />
            Riwayat Stok
          </TabsTrigger>
          {alertItems.length > 0 && (
            <TabsTrigger value="alerts" className="gap-2 px-4 py-1.5 font-bold uppercase tracking-widest text-[10px]">
              <AlertTriangle className="h-3.5 w-3.5" />
              Peringatan
              <Badge variant="destructive" className="ml-0.5 text-[8px] font-bold h-4 min-w-[16px] px-1 rounded-full flex items-center justify-center">
                {alertItems.length}
              </Badge>
            </TabsTrigger>
          )}
        </TabsList>

        {/* Products List Tab */}
        <TabsContent value="overview" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm overflow-hidden">
            <CardHeader className="p-4 border-b border-border/40 bg-muted/30">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle className="text-sm font-bold uppercase tracking-widest text-foreground/90">Produk Barang</CardTitle>
                  <CardDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">Kelola kuota dan ketersediaan barang</CardDescription>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/60" />
                  <Input
                    placeholder="Cari nama produk..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-10 border-border/60 bg-background/50 focus:bg-background transition-all rounded-md text-sm font-medium"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filteredItems.length === 0 ? (
                <div className="py-20 text-center flex flex-col items-center justify-center">
                  <div className="h-16 w-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Package className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                  <p className="text-sm font-bold text-foreground/70 uppercase tracking-widest">
                    {searchQuery ? "Produk tidak ditemukan" : "Belum ada produk barang"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-[240px]">
                    {searchQuery ? "Coba gunakan kata kunci pencarian yang berbeda" : "Tambahkan produk barang di menu Produk & Jasa"}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {filteredItems.map((item) => {
                    const goods = item.goods;
                    const isLow =
                      goods && goods.minStock != null && goods.currentStock <= goods.minStock;
                    const isHigh =
                      goods && goods.maxStock != null && goods.currentStock >= goods.maxStock;
                    const isEmpty = goods && goods.currentStock === 0;

                    return (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-4 transition-all hover:bg-muted/30">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-border/60 bg-muted/50 overflow-hidden group-hover:scale-105 transition-transform">
                            {item.image ? (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package className="h-6 w-6 text-muted-foreground/60" />
                            )}
                          </div>
                          <div className="min-w-0 space-y-1">
                            <p className="text-sm font-bold tracking-tight text-foreground/90 truncate">{item.name}</p>
                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                              {goods && (
                                <>
                                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                    HPP: {formatCurrency(goods.averageHpp)}
                                  </span>
                                  <span className="text-[10px] font-bold text-muted-foreground opacity-30">·</span>
                                  <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                    Jual: {formatCurrency(goods.sellingPrice)}
                                  </span>
                                  {(goods.minStock != null || goods.maxStock != null) && (
                                    <>
                                      <span className="text-[10px] font-bold text-muted-foreground opacity-30">·</span>
                                      <span className="text-[10px] font-semibold text-muted-foreground/60 italic">
                                        Limit: {goods.minStock ?? 0} - {goods.maxStock ?? '∞'}
                                      </span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right flex flex-col items-end gap-1">
                            <div className="flex items-center gap-1.5">
                              {isEmpty ? (
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 border-rose-500/20 bg-rose-500/5 text-rose-600 dark:text-rose-400">
                                  Habis
                                </Badge>
                              ) : isLow ? (
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 border-amber-500/20 bg-amber-500/5 text-amber-600 dark:text-amber-400">
                                  Rendah
                                </Badge>
                              ) : isHigh ? (
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 border-violet-500/20 bg-violet-500/5 text-violet-600 dark:text-violet-400">
                                  Berlebih
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest px-1.5 py-0 border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400">
                                  Tersedia
                                </Badge>
                              )}
                            </div>
                            {goods && (
                              <p className={cn(
                                "text-sm font-bold tabular-nums tracking-tight",
                                isEmpty ? "text-rose-600" : isLow ? "text-amber-600" : "text-foreground/90"
                              )}>
                                {goods.currentStock} <span className="text-[10px] font-medium text-muted-foreground uppercase ml-0.5">{goods.unit}</span>
                              </p>
                            )}
                          </div>
                          {goods && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleProductChange(goods.id)}
                              className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary transition-all opacity-0 group-hover:opacity-100 hidden sm:flex">
                              <History className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
          {/* Product Selector */}
          <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm overflow-hidden">
            <CardContent className="p-4 bg-muted/30 border-b border-border/40">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">
                  <Package className="h-3.5 w-3.5" />
                  Pilih Produk:
                </div>
                <Select value={selectedProductGoodsId} onValueChange={handleProductChange}>
                  <SelectTrigger className="w-full sm:w-96 h-10 border-border/60 bg-background/80 focus:bg-background transition-all font-medium">
                    <SelectValue placeholder="Pilih produk untuk melihat riwayat pergerakan stok" />
                  </SelectTrigger>
                  <SelectContent className="max-h-[300px]">
                    {stockItems
                      .filter((item) => item.goods?.id)
                      .map((item) => (
                        <SelectItem key={item.goods!.id} value={item.goods!.id} className="text-sm">
                          <div className="flex items-center justify-between w-full gap-8">
                            <span className="font-medium">{item.name}</span>
                            <span className="text-[10px] font-bold text-muted-foreground tabular-nums bg-muted px-1.5 py-0.5 rounded border border-border/40">
                              {item.goods!.currentStock} {item.goods!.unit || "pcs"}
                            </span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {!selectedProductGoodsId ? (
            <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm border-dashed">
              <CardContent className="py-24">
                <div className="text-center flex flex-col items-center">
                  <div className="h-20 w-20 rounded-full bg-muted/50 flex items-center justify-center mb-6">
                    <History className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-base font-bold text-foreground/80 uppercase tracking-widest">Pilih Produk Terlebih Dahulu</h3>
                  <p className="mx-auto mt-2 max-w-sm text-xs text-muted-foreground font-medium">
                    Gunakan dropdown di atas untuk melihat riwayat masuk, keluar, dan penyesuaian stok secara mendetail.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4 animate-in fade-in duration-500">
              {productInfo && (
                <ProductSummaryCard
                  productInfo={productInfo}
                  formatCurrency={formatCurrencyHistory}
                />
              )}
              <HistoryTable
                logs={historyLogs}
                isLoading={isLoadingHistory}
                formatCurrency={formatCurrencyHistory}
                formatDate={formatDate}
                unit={productInfo?.unit}
              />
            </div>
          )}
        </TabsContent>

        {/* Alerts Tab */}
        {alertItems.length > 0 && (
          <TabsContent value="alerts" className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Low Stock / Out of Stock */}
            {lowStockItems.length > 0 && (
              <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm overflow-hidden">
                <CardHeader className="p-4 border-b border-border/40 bg-rose-500/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-rose-500/10 border border-rose-200 shadow-sm">
                      <AlertTriangle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-rose-700 dark:text-rose-400">Stok Rendah / Habis</CardTitle>
                      <CardDescription className="text-[10px] font-medium uppercase tracking-tighter text-rose-600/70">Produk yang memerlukan perhatian segera</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/40">
                  {lowStockItems.map((item) => {
                    const goods = item.goods!;
                    const isEmpty = goods.currentStock === 0;

                    return (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-4 transition-all hover:bg-rose-500/[0.02]">
                        <div className="flex items-center gap-4">
                          <div
                            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-md border ${isEmpty
                              ? "bg-rose-500/10 border-rose-200 text-rose-600 shadow-sm"
                              : "bg-amber-500/10 border-amber-200 text-amber-600 shadow-sm"
                              }`}>
                            {isEmpty ? (
                              <XCircle className="h-6 w-6" />
                            ) : (
                              <AlertTriangle className="h-6 w-6" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold tracking-tight text-foreground/90">{item.name}</p>
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                isEmpty ? "bg-rose-500/10 border-rose-200 text-rose-600" : "bg-amber-500/10 border-amber-200 text-amber-600"
                              )}>
                                {isEmpty ? "Habis" : "Rendah"}
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                {goods.currentStock} {goods.unit} (Min: {goods.minStock})
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProductChange(goods.id)}
                          className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-all shadow-none"
                        >
                          <History className="mr-1.5 h-3.5 w-3.5" />
                          Riwayat
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            {/* High Stock / Overstocked */}
            {highStockItems.length > 0 && (
              <Card className="rounded-md gap-0 py-0 border border-border/80 bg-background shadow-sm overflow-hidden">
                <CardHeader className="p-4 border-b border-border/40 bg-violet-500/5">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-violet-500/10 border border-violet-200 shadow-sm">
                      <TrendingDown className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-bold uppercase tracking-widest text-violet-700 dark:text-violet-400">Stok Berlebih</CardTitle>
                      <CardDescription className="text-[10px] font-medium uppercase tracking-tighter text-violet-600/70">Produk yang melebihi batas inventaris</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0 divide-y divide-border/40">
                  {highStockItems.map((item) => {
                    const goods = item.goods!;

                    return (
                      <div
                        key={item.id}
                        className="group flex items-center justify-between p-4 transition-all hover:bg-violet-500/[0.02]">
                        <div className="flex items-center gap-4">
                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md border border-violet-200 bg-violet-500/10 text-violet-600 shadow-sm">
                            <TrendingDown className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <p className="text-sm font-bold tracking-tight text-foreground/90">{item.name}</p>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded border bg-violet-500/10 border-violet-200 text-violet-600">
                                Berlebih
                              </span>
                              <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                {goods.currentStock} {goods.unit} (Max: {goods.maxStock})
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleProductChange(goods.id)}
                          className="h-8 px-3 font-bold text-[10px] uppercase tracking-wider border-border/60 hover:bg-muted/50 transition-all shadow-none"
                        >
                          <History className="mr-1.5 h-3.5 w-3.5" />
                          Riwayat
                        </Button>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
