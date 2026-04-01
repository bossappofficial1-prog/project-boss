"use client";

import { useState, useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Search, Filter, TrendingUp, TrendingDown, DollarSign, FileText, FileDown, Loader2, CalendarIcon } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { format, subMonths } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { DateRange } from "react-day-picker";
import { DataTable } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/useDebounce";
import { useExportTransactionReport } from "@/hooks/use-export-transaction-report";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SectionHeader } from "@/components/ui/section-header";

export default function TransactionsPage() {
  const { outlets } = useOutletContext();
  const { useTransactionList } = useTransactions();

  // Filter states
  const [outletId, setOutletId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
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
    type: type as "INCOME" | "EXPENSE" | "ALL", // New: pass type filter
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
    q: searchQuery,
  });

  const getStatusBadge = (transaction: any) => {
    const orderStatus = transaction.order?.orderStatus;
    const transactionStatus = transaction.status;
    let displayStatus = transactionStatus;
    let displayLabel = "";
    let displayVariant: "default" | "destructive" | "success" | "warning" | "secondary" = "default";

    if (orderStatus === "AWAITING_PAYMENT" && transaction.isManual) {
      displayStatus = "PENDING";
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
      <Badge variant={displayVariant} className="font-poppins">
        {displayLabel}
      </Badge>
    );
  };

  // Payment method badge
  const getPaymentMethodBadge = (transaction: any) => {
    const isManual = transaction.isManual;
    const method = transaction.manualMethod || transaction.paymentMethod || "Online";
    const hasProof = Boolean(transaction.paymentProofUrl);

    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-poppins">
            {method}
          </Badge>
          {isManual && transaction.order?.orderStatus === "AWAITING_PAYMENT" && (
            <Badge variant="warning" className="text-[0.65rem] font-poppins">
              Belum Dikonfirmasi
            </Badge>
          )}
        </div>
        {hasProof && (
          <Button
            variant="link"
            size="sm"
            className="h-auto px-0 py-0 text-xs font-medium text-primary justify-start"
            onClick={() => setProofPreview({ url: transaction.paymentProofUrl, transaction })}>
            <FileText className="w-3 h-3 mr-1" />
            Lihat Bukti
          </Button>
        )}
      </div>
    );
  };

  // Reset filters
  const handleResetFilters = () => {
    setOutletId("");
    setStatus("");
    setType("ALL");
    setStartDate("");
    setEndDate("");
    setSearchTerm("");
    setPage(1);
  };

  const totalTransactions = data?.pagination?.total ?? 0;
  const pageSizeOptions = useMemo(() => {
    const base = [5, 10, 20, 50, 100];
    if (!base.includes(limit)) {
      base.push(limit);
    }
    return base.sort((a, b) => a - b);
  }, [limit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <SectionHeader
        title="Riwayat Transaksi"
        description="Lihat dan kelola semua transaksi bisnis Anda"
        actions={
          <Button
            onClick={() => setShowExportDialog(true)}
            className="font-poppins"
          >
            <FileDown className="w-4 h-4 mr-2" />
            Export Laporan PDF
          </Button>
        }
      />

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-poppins">
            <Filter className="w-5 h-5" />
            Filter
          </CardTitle>
          <CardDescription className="font-poppins">
            Filter transaksi berdasarkan tipe, outlet, status, dan tanggal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10 font-poppins"
              />
            </div>

            {/* Type Filter - NEW */}
            <Select
              value={type}
              onValueChange={(value) => {
                setType(value);
                setPage(1);
              }}>
              <SelectTrigger className="font-poppins">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-poppins">
                  Semua Tipe
                </SelectItem>
                <SelectItem value="INCOME" className="font-poppins">
                  Pemasukan
                </SelectItem>
                <SelectItem value="EXPENSE" className="font-poppins">
                  Pengeluaran
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Outlet Filter */}
            <Select
              value={outletId || "all"}
              onValueChange={(value) => {
                setOutletId(value === "all" ? "" : value);
                setPage(1);
              }}>
              <SelectTrigger className="font-poppins">
                <SelectValue placeholder="Semua Outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-poppins">
                  Semua Outlet
                </SelectItem>
                {outlets.map((outlet) => (
                  <SelectItem key={outlet.id} value={outlet.id} className="font-poppins">
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select
              value={status || "all"}
              onValueChange={(value) => {
                setStatus(value === "all" ? "" : value);
                setPage(1);
              }}>
              <SelectTrigger className="font-poppins">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-poppins">
                  Semua Status
                </SelectItem>
                <SelectItem value="PENDING" className="font-poppins">
                  Pending
                </SelectItem>
                <SelectItem value="SUCCESS" className="font-poppins">
                  Berhasil
                </SelectItem>
                <SelectItem value="FAILED" className="font-poppins">
                  Gagal
                </SelectItem>
                <SelectItem value="CANCELLED" className="font-poppins">
                  Dibatalkan
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex gap-2 md:col-span-2 lg:col-span-1">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="font-poppins"
                placeholder="Dari tanggal"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="font-poppins"
                placeholder="Sampai tanggal"
              />
            </div>
          </div>

          {/* Reset Button */}
          {(outletId || status || type !== "ALL" || startDate || endDate || searchTerm) && (
            <div className="mt-4">
              <Button variant="outline" onClick={handleResetFilters} className="font-poppins">
                Reset Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Income */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-poppins">Total Pemasukan</p>
                  <p className="text-2xl font-bold text-green-600 font-poppins mt-2">
                    {formatCurrency(data?.data.totals?.total_revenue || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expense */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-poppins">
                    Total Pengeluaran
                  </p>
                  <p className="text-2xl font-bold text-red-600 font-poppins mt-2">
                    {formatCurrency(data?.data.totals?.total_expense || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Amount */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-poppins">Saldo Bersih</p>
                  <p
                    className={`text-2xl font-bold font-poppins mt-2 ${(data?.data.totals?.total_margin_pendapatan || 0) >= 0 ? "text-blue-600" : "text-orange-600"}`}>
                    {formatCurrency(data?.data.totals?.total_margin_pendapatan || 0)}
                  </p>
                </div>
                <div
                  className={`h-12 w-12 rounded-full flex items-center justify-center ${data?.data.totals?.total_margin_pendapatan || 0 >= 0 ? "bg-blue-100" : "bg-orange-100"}`}>
                  <DollarSign
                    className={`h-6 w-6 ${data?.data.totals?.total_margin_pendapatan || 0 >= 0 ? "text-blue-600" : "text-orange-600"}`}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        onRefresh={refetch}
        data={data?.data.items || []}
        columns={[
          {
            accessorKey: "createdAt",
            header: "Tanggal",
            cell(props) {
              return format(new Date(props.getValue() as Date), "dd MMM yyyy, HH:mm", {
                locale: localeId,
              });
            },
          },
          {
            accessorKey: "type",
            header: "Tipe",
            cell(props) {
              return (
                <Badge
                  variant={(props.getValue() as any) === "INCOME" ? "success" : "destructive"}
                  className="font-poppins">
                  {(props.getValue() as any) === "INCOME" ? "Pemasukan" : "Pengeluaran"}
                </Badge>
              );
            },
          },
          {
            accessorKey: "description",
            enableSorting: true,
            header: "Deskripsi",
          },
          {
            accessorKey: "outlet",
            header: "Outlet",
            enableSorting: true,
            cell: (outlet) => (outlet.getValue() as any).name || "-",
          },
          {
            accessorKey: "cashier",
            header: "Kasir",
            enableSorting: true,
            cell: (props) => props.row.original.cashier || "-",
          },
          {
            accessorKey: "paymentMethod",
            header: "Metode",
            cell: (props) => getPaymentMethodBadge(props.row.original),
          },
          {
            accessorKey: "amount",
            header: "Total",
            cell: (props) => {
              const transaction = props.row.original;
              return (
                <span
                  className={`font-semibold font-poppins ${transaction.type === "EXPENSE" ? "text-red-600" : "text-green-600"}`}>
                  {transaction.type === "EXPENSE" ? "- " : "+ "}
                  {formatCurrency(transaction.amount)}
                </span>
              );
            },
          },
          {
            accessorKey: "status",
            header: "Status",
            enableSorting: false,
            cell: (props) => {
              const transaction = props.row.original;
              return getStatusBadge(transaction);
            },
          },
        ]}
        showColumnVisibility
        enableColumnResizing
        actionViewType="dropdown"
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
        exportFilename="transactions"
        exportConfig={[
          {
            id: "csv",
            label: "Export CSV",
            enabled: true,
            type: "client",
            filename: "TransactionsPage",
            customMapping: (row: any) => {
              return {
                ...row,
                Outlet: row.outlet?.name || "-",
              };
            },
          },
        ]}
      />

      {/* Export PDF Dialog */}
      <Dialog open={showExportDialog} onOpenChange={setShowExportDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-poppins">Export Laporan PDF</DialogTitle>
            <DialogDescription className="font-poppins">
              Pilih rentang tanggal untuk laporan transaksi. Laporan akan dikirim ke email Anda.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground font-poppins">Rentang Tanggal</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal font-poppins",
                      !exportDateRange && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
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
              <div className="rounded-md bg-muted/50 p-3 text-sm font-poppins text-muted-foreground">
                Laporan akan mencakup transaksi dari{" "}
                <strong className="text-foreground">
                  {format(exportDateRange.from, "dd MMMM yyyy", { locale: localeId })}
                </strong>{" "}
                sampai{" "}
                <strong className="text-foreground">
                  {format(exportDateRange.to, "dd MMMM yyyy", { locale: localeId })}
                </strong>
              </div>
            )}
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowExportDialog(false)}
              className="font-poppins"
            >
              Batal
            </Button>
            <Button
              onClick={handleExportPDF}
              disabled={!exportDateRange?.from || !exportDateRange?.to || exportReport.isPending}
              className="font-poppins"
            >
              {exportReport.isPending ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4 mr-2" />
              )}
              {exportReport.isPending ? "Memproses..." : "Export PDF"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Proof Preview Dialog */}
      <Dialog open={Boolean(proofPreview)} onOpenChange={(open) => !open && setProofPreview(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-poppins">Bukti Pembayaran</DialogTitle>
            <DialogDescription className="font-poppins">
              {proofPreview?.transaction?.description || "Detail transaksi"}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            {proofPreview?.url ? (
              <div className="relative w-full bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={proofPreview.url}
                  alt="Bukti Pembayaran"
                  className="w-full h-auto max-h-[60vh] object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = "/placeholder-image.png";
                  }}
                />
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 font-poppins">
                Bukti pembayaran tidak tersedia
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
