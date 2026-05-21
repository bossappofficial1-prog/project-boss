"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, TrendingUp, TrendingDown, DollarSign, FileText, FileDown, Loader2, RefreshCw, X } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { DataTable } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/useDebounce";
import { useExportTransactionReport } from "@/hooks/use-export-transaction-report";
import { SectionHeader } from "@/components/ui/section-header";
import { PageGuide } from "@/components/guides/PageGuide";
import { ExpensesControls } from "@/components/owner/expenses/Controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, ShieldAlert, Trash2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useDirectDeleteTransaction } from "@/hooks/api/use-transaction-delete";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export default function TransactionsPage() {
  const pathname = usePathname();
  const isManagerView = pathname?.startsWith("/manager") ?? false;

  const { outlets, selectedOutletId } = useOutletContext();
  const { useTransactionList } = useTransactions();

  // Query cashier auth to check privileges
  const { data: cashierData } = useQuery({
    queryKey: ["cashier-auth"],
    queryFn: () => authApi.cashierMe(),
    enabled: isManagerView,
    staleTime: 5 * 60_000,
  });

  const hasDeletePrivilege = cashierData?.privileges?.some((p: any) => {
    const privName = typeof p === "string" ? p : (p?.privilege || p);
    return privName === "TRANSACTION_DELETE";
  }) ?? false;

  // Direct delete mutation & states
  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const directDeleteMutation = useDirectDeleteTransaction();

  const confirmDirectDelete = () => {
    if (!transactionToDelete) return;
    directDeleteMutation.mutate(
      { transactionId: transactionToDelete.id, reason: deleteReason.trim() || undefined },
      {
        onSuccess: () => {
          toast.success("Transaksi berhasil dihapus secara langsung.");
          setTransactionToDelete(null);
          setDeleteReason("");
          refetch();
        },
        onError: (err: any) => {
          toast.error(err?.response?.data?.message || err?.message || "Gagal menghapus transaksi");
        },
      }
    );
  };

  // Filter states
  const [outletId, setOutletId] = useState<string>(isManagerView ? selectedOutletId || "" : "");
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>(subMonths(new Date(), 1).toISOString());
  const [endDate, setEndDate] = useState<string>(new Date().toISOString());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const searchQuery = useDebounce(searchTerm, 500);

  // Proof preview state
  const [proofPreview, setProofPreview] = useState<{ url: string; transaction: any } | null>(null);

  // Export PDF mutation
  const exportReport = useExportTransactionReport();
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [exportDateRange, setExportDateRange] = useState<DateRange | undefined>({
    from: subMonths(new Date(), 1),
    to: new Date(),
  });

  const handleExportPDF = () => {
    if (!exportDateRange?.from || !exportDateRange?.to) return;

    exportReport.mutate(
      {
        startDate: exportDateRange.from.toISOString(),
        endDate: exportDateRange.to.toISOString(),
      },
      {
        onSuccess: () => {
          setShowExportDialog(false);
        },
      },
    );
  };

  // Fetch transactions
  const { data, isLoading, isFetching, error, refetch } = useTransactionList({
    outletId: outletId || undefined,
    status: status || undefined,
    type: type as "INCOME" | "EXPENSE" | "ALL",
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
    q: searchQuery,
  });

  const handleRangeChange = useCallback((start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
    setPage(1);
  }, []);

  const handleResetFilters = () => {
    setOutletId(isManagerView ? selectedOutletId || "" : "");
    setStatus("");
    setType("ALL");
    setStartDate(subMonths(new Date(), 1).toISOString());
    setEndDate(new Date().toISOString());
    setSearchTerm("");
    setPage(1);
  };

  const getStatusBadge = (transaction: any) => {
    const orderStatus = transaction.order?.orderStatus;
    const transactionStatus = transaction.status;
    let displayLabel = "";
    let displayVariant: "default" | "destructive" | "success" | "warning" | "secondary" = "default";

    if (orderStatus === "AWAITING_PAYMENT" && transaction.isManual) {
      displayLabel = "Menunggu Verifikasi";
      displayVariant = "warning";
    } else {
      const statusMap: Record<
        string,
        { label: string; variant: "default" | "destructive" | "success" | "warning" | "secondary" }
      > = {
        PENDING: { label: "Pending", variant: "warning" },
        SUCCESS: { label: "Berhasil", variant: "success" },
        FAILED: { label: "Gagal", variant: "destructive" },
        CANCELLED: { label: "Dibatalkan", variant: "secondary" },
      };

      const statusInfo = statusMap[transactionStatus] || {
        label: transactionStatus,
        variant: "default",
      };
      displayLabel = statusInfo.label;
      displayVariant = statusInfo.variant;
    }

    return (
      <Badge variant={displayVariant} className="font-bold text-[10px] uppercase tracking-wider">
        {displayLabel}
      </Badge>
    );
  };

  const totalTransactions = data?.pagination?.total ?? 0;
  const pageSizeOptions = useMemo(() => {
    const base = [5, 10, 20, 50, 100];
    if (!base.includes(limit)) {
      base.push(limit);
    }
    return base.sort((a, b) => a - b);
  }, [limit]);

  const totals = data?.data.totals;

  return (
    <div className="space-y-6">
      <PageGuide
        id="owner-transactions"
        runOnceKey="owner-transactions-guide"
        steps={[
          {
            id: "welcome",
            title: "Riwayat Transaksi",
            description: "Pantau arus kas bisnis Anda. Lihat pemasukan, pengeluaran, filter data, dan ekspor laporan.",
            target: "body",
            placement: "bottom",
          },
          {
            id: "export",
            title: "Export Laporan",
            description: "Klik Export PDF untuk mengunduh laporan transaksi dalam rentang tanggal tertentu.",
            target: "[data-guide='transactions-header']",
            placement: "bottom",
            offset: 12,
          },
          {
            id: "summary",
            title: "Ringkasan Keuangan",
            description: "Total pemasukan (hijau), pengeluaran (merah), dan saldo bersih — plus filter rentang tanggal.",
            target: "[data-guide='transactions-summary']",
            placement: "bottom",
            offset: 8,
          },
          {
            id: "search",
            title: "Cari & Filter",
            description: "Cari transaksi berdasarkan ID atau deskripsi. Filter berdasarkan tipe, outlet, atau status.",
            target: "input[placeholder='Cari transaksi (ID, Deskripsi)...']",
            placement: "bottom",
            offset: 8,
          },
          {
            id: "table",
            title: "Tabel Transaksi",
            description: "Kolom: tanggal, tipe, deskripsi, outlet, metode bayar, jumlah, pajak, dan status. Klik header untuk urutkan.",
            target: "[data-guide='transactions-table']",
            placement: "top",
            offset: 8,
          },
          {
            id: "export-csv",
            title: "Export & Paginasi",
            description: "Export data ke CSV, atur jumlah baris per halaman, atau navigasi halaman transaksi.",
            target: "[data-guide='transactions-table'] [role='region']",
            placement: "top",
            offset: 4,
          },
        ]}
      />
      <div data-guide="transactions-header">
      <SectionHeader
        title="Riwayat Transaksi"
        description="Pantau arus kas masuk dan keluar bisnis Anda secara real-time."
        actions={
          <Button
            onClick={() => setShowExportDialog(true)}
            className="font-bold text-xs h-10 shadow-none"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
        }
      />
      </div>

      <Card data-guide="transactions-summary" className="rounded-md border-border/80 bg-background shadow-sm p-1 pl-4 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-8 py-2 overflow-x-auto no-scrollbar">
          {/* Pemasukan */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-1 h-8 rounded-full bg-emerald-500/80" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-0.5">Pemasukan</p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
                {formatCurrency(totals?.total_revenue || 0)}
              </p>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-border/40" />

          {/* Pengeluaran */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-1 h-8 rounded-full bg-rose-500/80" />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-0.5">Pengeluaran</p>
              <p className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums leading-none">
                {formatCurrency(totals?.total_expense || 0)}
              </p>
            </div>
          </div>

          <div className="hidden sm:block h-8 w-px bg-border/40" />

          {/* Saldo Bersih */}
          <div className="flex items-center gap-3 shrink-0">
            <div className={cn("w-1 h-8 rounded-full", (totals?.total_margin_pendapatan || 0) >= 0 ? "bg-blue-500/80" : "bg-orange-500/80")} />
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-0.5">Saldo Bersih</p>
              <p className={cn("text-base font-bold tabular-nums leading-none", (totals?.total_margin_pendapatan || 0) >= 0 ? "text-blue-600" : "text-orange-600")}>
                {formatCurrency(totals?.total_margin_pendapatan || 0)}
              </p>
            </div>
          </div>

          <div className="hidden xl:block h-10 w-px bg-border/40 mx-2" />

          {/* Date Range Controls */}
          <div className="flex-1 min-w-[300px]">
            <ExpensesControls
              startISO={startDate}
              endISO={endDate}
              onRangeChange={handleRangeChange}
              hideAddButton={true}
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => refetch()}
            className="h-9 w-9 rounded-md hover:bg-muted/50 transition-all text-muted-foreground"
          >
            <RefreshCw className={cn("w-4 h-4", isFetching && "animate-spin")} />
          </Button>
        </div>
      </Card>

      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative group flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/50 group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Cari transaksi (ID, Deskripsi)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-10 text-xs font-bold bg-background/50 border-border/40 focus:border-primary/40 focus:ring-primary/10 transition-all"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 hover:text-foreground transition-colors">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-10 w-[140px] text-[10px] font-bold bg-background/50 border-border/40">
              <SelectValue placeholder="Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Semua Tipe</SelectItem>
              <SelectItem value="INCOME">Pemasukan</SelectItem>
              <SelectItem value="EXPENSE">Pengeluaran</SelectItem>
            </SelectContent>
          </Select>

          {!isManagerView && (
            <Select value={outletId || "all"} onValueChange={(v) => setOutletId(v === "all" ? "" : v)}>
              <SelectTrigger className="h-10 w-[180px] text-[10px] font-bold bg-background/50 border-border/40">
                <SelectValue placeholder="Outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Outlet</SelectItem>
                {outlets.map(o => <SelectItem key={o.id} value={o.id}>{o.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Select value={status || "all"} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
            <SelectTrigger className="h-10 w-[140px] text-[10px] font-bold bg-background/50 border-border/40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="SUCCESS">Berhasil</SelectItem>
              <SelectItem value="FAILED">Gagal</SelectItem>
              <SelectItem value="CANCELLED">Dibatalkan</SelectItem>
            </SelectContent>
          </Select>

          {(outletId || status || type !== "ALL" || searchTerm) && (
            <Button variant="ghost" size="icon" onClick={handleResetFilters} className="h-10 w-10 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600 transition-all">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div data-guide="transactions-table">
      <DataTable
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        onRefresh={refetch}
        data={data?.data.items || []}
        emptyMessage="Belum ada transaksi ditemukan."
        columns={[
          {
            accessorKey: "createdAt",
            header: "Tanggal",
            cell: ({ row }) => (
              <div className="flex flex-col">
                <span className="font-bold text-foreground/90 text-xs tabular-nums">
                  {format(new Date(row.original.createdAt), "dd MMM yyyy", { locale: localeId })}
                </span>
                <span className="text-[10px] text-muted-foreground/60 tabular-nums">
                  {format(new Date(row.original.createdAt), "HH:mm", { locale: localeId })}
                </span>
              </div>
            ),
          },
          {
            accessorKey: "type",
            header: "Tipe",
            cell: ({ row }) => {
              const isIncome = row.original.type === "INCOME";
              return (
                <Badge variant={isIncome ? "success" : "destructive"} className="font-bold text-[9px] uppercase tracking-wider">
                  {isIncome ? "Pemasukan" : "Pengeluaran"}
                </Badge>
              );
            },
          },
          {
            accessorKey: "description",
            header: "Deskripsi",
            cell: ({ row }) => (
              <div className="max-w-[250px]">
                <p className="font-bold text-foreground/80 text-xs truncate">{row.original.description}</p>
                <p className="text-[9px] text-muted-foreground/50 tabular-nums mt-0.5">#{row.original.id.slice(-8).toUpperCase()}</p>
              </div>
            ),
          },
          {
            accessorKey: "outlet",
            header: "Outlet",
            cell: ({ row }) => (
              <span className="text-xs font-bold text-foreground/70">{row.original.outlet?.name || "-"}</span>
            ),
          },
          {
            accessorKey: "paymentMethod",
            header: "Metode",
            cell: ({ row }) => {
              const transaction = row.original;
              const method = transaction.manualMethod || transaction.paymentMethod || "Online";
              const hasProof = Boolean(transaction.paymentProofUrl);
              return (
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className="w-fit font-bold text-[9px] uppercase tracking-tighter opacity-70">
                    {method}
                  </Badge>
                  {hasProof && (
                    <button
                      onClick={() => setProofPreview({ url: transaction.paymentProofUrl!, transaction })}
                      className="flex items-center gap-1 text-[9px] font-bold text-primary hover:underline"
                    >
                      <FileText className="w-2.5 h-2.5" />
                      LIHAT BUKTI
                    </button>
                  )}
                </div>
              );
            }
          },
          {
            accessorKey: "amount",
            header: "Jumlah",
            cell: ({ row }) => {
              const isIncome = row.original.type === "INCOME";
              return (
                <span className={cn(
                  "font-bold tabular-nums text-xs",
                  isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
                )}>
                  {isIncome ? "+ " : "- "}
                  {formatCurrency(row.original.amount)}
                </span>
              );
            },
          },
          {
            id: "tax",
            header: "Pajak",
            cell: ({ row }) => {
              const tax = row.original.order?.taxAmount ?? 0;
              return tax > 0 ? (
                <span className="font-bold tabular-nums text-xs text-blue-600 dark:text-blue-400">
                  {formatCurrency(tax)}
                </span>
              ) : (
                <span className="text-muted-foreground/40 text-xs">—</span>
              );
            },
          },
          {
            accessorKey: "status",
            header: "Status",
            cell: ({ row }) => getStatusBadge(row.original),
          },
        ]}
        stickyHeader
        serverSidePagination
        totalItems={totalTransactions}
        serverPage={page}
        serverLimit={limit}
        onPaginationChange={({ page: nextPage, limit: nextLimit }) => {
          setPage(nextPage);
          setLimit(nextLimit);
        }}
        pageSizeOptions={pageSizeOptions}
        globalFilter={false}
        enableExport
        exportFilename={`transaksi-${format(new Date(), "yyyy-MM-dd")}`}
        exportConfig={[
          {
            id: "csv",
            label: "Export CSV",
            enabled: true,
            type: "client",
            filename: "transaksi-data",
            customMapping: (row: any) => ({
              ID: row.id,
              Tanggal: format(new Date(row.createdAt), "yyyy-MM-dd HH:mm"),
              Tipe: row.type,
              Outlet: row.outlet?.name || "-",
              Deskripsi: row.description,
              Metode: row.manualMethod || row.paymentMethod || "-",
              Jumlah: row.amount,
              Pajak: row.order?.taxAmount ?? 0,
              Status: row.status
            }),
          },
        ]}
        rowActions={
          isManagerView && hasDeletePrivilege
            ? (row) => [
                {
                  label: "Hapus Transaksi",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onClick: (row: any) => {
                    setTransactionToDelete(row);
                    setDeleteReason("");
                  },
                },
              ]
            : undefined
        }
        actionViewType="dropdown"
      />
      </div>

      {/* ══════════ Direct Delete Confirm Dialog ══════════ */}
      <ConfirmDialog
        open={Boolean(transactionToDelete)}
        onOpenChange={(open) => {
          if (!open) {
            setTransactionToDelete(null);
            setDeleteReason("");
          }
        }}
        title="Hapus Transaksi Secara Langsung?"
        description="Aksi ini akan menghapus transaksi secara permanen, mengembalikan stok produk, membatalkan loyalty point, dan mencatat riwayat penghapusan langsung untuk audit trail Owner. Tindakan tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus Langsung"
        cancelLabel="Batal"
        onConfirm={confirmDirectDelete}
        confirmDisabled={directDeleteMutation.isPending}
        confirmVariant="destructive"
      >
        {transactionToDelete && (
          <div className="space-y-3 mt-2">
            <div className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-1.5 font-sans">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Deskripsi</span>
                <span className="font-semibold text-foreground truncate max-w-[200px]">{transactionToDelete.description}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Total Pembayaran</span>
                <span className="font-bold text-foreground">Rp {new Intl.NumberFormat("id-ID").format(transactionToDelete.amount)}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground font-medium">Metode</span>
                <span className="font-semibold text-foreground uppercase text-[10px]">{transactionToDelete.manualMethod || transactionToDelete.paymentMethod || "Online"}</span>
              </div>
            </div>
            <div className="space-y-1.5 font-sans">
              <label className="text-xs font-semibold text-foreground">
                Alasan Penghapusan <span className="text-destructive">*</span>
              </label>
              <Textarea
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                placeholder="Masukkan alasan penghapusan transaksi ini..."
                className="text-sm resize-none border-border/60 focus:border-primary/40 focus:ring-primary/10 rounded-md"
                rows={3}
              />
            </div>
          </div>
        )}
      </ConfirmDialog>

      {/* ══════════ Export PDF Dialog ══════════ */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-bold text-lg">Export Laporan PDF</DialogTitle>
            <DialogDescription className="text-xs">
              Pilih rentang tanggal untuk laporan transaksi. Laporan akan diproses secara real-time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground">Rentang Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-bold text-xs h-12 bg-muted/20 border-border/40",
                      !exportDateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 opacity-40" />
                    {exportDateRange?.from ? (
                      exportDateRange.to ? (
                        <>
                          {format(exportDateRange.from, "dd MMM yyyy", { locale: localeId })} —{" "}
                          {format(exportDateRange.to, "dd MMM yyyy", { locale: localeId })}
                        </>
                      ) : (
                        format(exportDateRange.from, "dd MMM yyyy", { locale: localeId })
                      )
                    ) : (
                      <span>Pilih rentang tanggal</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={exportDateRange?.from}
                    selected={exportDateRange}
                    onSelect={setExportDateRange}
                    numberOfMonths={2}
                    disabled={(date) => date > new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>

            {exportDateRange?.from && exportDateRange?.to && (
              <div className="rounded-md bg-muted/50 p-4 border border-border/40">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-primary opacity-60" />
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground">Periode Laporan</p>
                    <p className="text-xs font-bold text-foreground">
                      {format(exportDateRange.from, "dd MMMM yyyy", { locale: localeId })} — {format(exportDateRange.to, "dd MMMM yyyy", { locale: localeId })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowExportDialog(false)}
              className="font-bold text-[10px]"
            >
              Batal
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={!exportDateRange?.from || !exportDateRange?.to || exportReport.isPending}
              className="font-bold text-[10px] min-w-[120px]"
            >
              {exportReport.isPending ? (
                <>
                  <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <FileDown className="w-3 h-3 mr-2" />
                  Export PDF
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ══════════ Proof Preview Dialog ══════════ */}
      <Dialog open={Boolean(proofPreview)} onOpenChange={(open) => !open && setProofPreview(null)}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none bg-transparent shadow-none">
          {proofPreview?.url && (
            <div className="relative group">
              <div className="absolute top-4 right-4 z-10">
                <Button size="icon" variant="secondary" onClick={() => setProofPreview(null)} className="h-8 w-8 rounded-full shadow-lg">
                  <X className="h-4 w-4" />
                </Button>
              </div>
              <div className="rounded-lg overflow-hidden bg-background shadow-2xl border border-border/40">
                <div className="p-4 bg-muted/30 border-b border-border/40">
                  <p className="text-[10px] font-bold text-muted-foreground mb-1">Bukti Pembayaran</p>
                  <p className="text-xs font-bold text-foreground truncate">{proofPreview.transaction?.description}</p>
                </div>
                <img
                  src={proofPreview.url}
                  alt="Bukti Pembayaran"
                  className="w-full h-auto max-h-[70vh] object-contain"
                />
                <div className="p-4 flex justify-center">
                  <Button asChild variant="outline" size="sm" className="font-bold text-[10px]">
                    <a href={proofPreview.url} target="_blank" rel="noreferrer">
                      Buka Gambar Penuh
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
