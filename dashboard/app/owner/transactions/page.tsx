"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useOutletStore } from "@/stores/outlet.store";
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
import { Search, TrendingUp, TrendingDown, DollarSign, FileText, FileDown, Loader2, RefreshCw, X, Mail } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { DataTable } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";
import { useExportTransactionReport } from "@/hooks/use-export-transaction-report";
import { SectionHeader } from "@/components/ui/section-header";
import { PageGuide } from "@/features/guides/components/page-guide";
import { ExpensesControls } from "@/features/expenses/components/owner/controls";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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

  const { outlets, selectedOutletId } = useOutletStore();
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

  // Query current user info for email destination
  const { data: meData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
    staleTime: 5 * 60_000,
  });
  const userEmail = meData?.user?.email || "";

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
            description: "Pantau arus kas bisnis Anda. Lihat pemasukan, pengeluaran, filter data, dan ekspor e-statement resmi.",
            target: "body",
            placement: "bottom",
          },
          {
            id: "export",
            title: "E-Statement Resmi",
            description: "Klik E-Statement Resmi untuk mengirim rekening koran transaksi resmi ke email terdaftar Anda.",
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
            disabled={totalTransactions === 0 || isLoading}
            className="font-bold text-xs h-10 shadow-none bg-rose-600 hover:bg-rose-500 text-white"
          >
            <Mail className="w-4 h-4 mr-2" />
            E-Statement Resmi
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

      {/* ══════════ E-Statement Dialog ══════════ */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md gap-0 p-0 border-border/80 shadow-2xl overflow-hidden">
          <DialogHeader className="p-6 border-b border-border/40 bg-muted/30">
            <DialogTitle className="text-sm font-bold uppercase tracking-widest text-foreground">Permintaan E-Statement Resmi</DialogTitle>
            <DialogDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">
              Kirim rekening koran (e-statement) transaksi bisnis langsung ke email terdaftar.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 space-y-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dokumen e-statement resmi (rekening koran) akan dikirimkan ke alamat email terdaftar Anda: <span className="font-bold text-foreground font-mono">{userEmail || "email Anda"}</span>.
            </p>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground ml-1">Rentang Tanggal E-Statement</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-bold text-xs h-12 bg-muted/20 border-border/40 hover:bg-muted/30 transition-all rounded-md pl-4",
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
              <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-emerald-600 opacity-80" />
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-emerald-600/70">Periode Rekening Koran</p>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono">
                      {format(exportDateRange.from, "dd MMMM yyyy", { locale: localeId })} — {format(exportDateRange.to, "dd MMMM yyyy", { locale: localeId })}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="p-4 border-t border-border/40 bg-muted/5 gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              className="h-9 font-bold text-xs uppercase tracking-wider border-border/60 shadow-none"
            >
              Batal
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={!exportDateRange?.from || !exportDateRange?.to || exportReport.isPending}
              className="h-9 font-bold text-xs uppercase tracking-wider bg-rose-600 hover:bg-rose-500 text-white shadow-none min-w-[150px]"
            >
              {exportReport.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Mail className="w-3.5 h-3.5 mr-2" />
                  Kirim E-Statement
                </>
              )}
            </Button>
          </DialogFooter>
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
