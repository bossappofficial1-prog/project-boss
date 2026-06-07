"use client";

import { useState, useMemo, useCallback } from "react";
import { useTransactions } from "@/hooks/use-transactions";
import { useOutletStore } from "@/stores/outlet.store";
import { Button } from "@/components/ui/button";
import { SectionHeader } from "@/components/ui/section-header";
import { PageGuide } from "@/features/guides/components/page-guide";
import { DataTable } from "@/components/ui/data-table";
import { useDebounce } from "@/hooks/use-debounce";
import { useExportTransactionReport } from "@/hooks/use-export-transaction-report";
import { useQuery } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useDirectDeleteTransaction } from "@/hooks/api/use-transaction-delete";
import { toast } from "sonner";
import { Plus, Mail, Trash2 } from "lucide-react";
import { format, subMonths } from "date-fns";
import { usePathname } from "next/navigation";
import {
  TransactionSummaryCard,
  TransactionFilterBar,
  getTransactionColumns,
  getTransactionExportConfig,
  EStatementDialog,
  ProofPreviewDialog,
  DeleteTransactionDialog,
  ManualTransactionModal,
} from "@/features/transactions";

export default function TransactionsPage() {
  const pathname = usePathname();
  const isManagerView = pathname?.startsWith("/manager") ?? false;

  const { outlets, selectedOutletId } = useOutletStore();
  const { useTransactionList, useCreateManualTransaction } = useTransactions();

  const { data: cashierData } = useQuery({
    queryKey: ["cashier-auth"],
    queryFn: () => authApi.cashierMe(),
    enabled: isManagerView,
    staleTime: 5 * 60_000,
  });

  const hasDeletePrivilege =
    cashierData?.privileges?.some((p: any) => {
      const privName = typeof p === "string" ? p : p?.privilege || p;
      return privName === "TRANSACTION_DELETE";
    }) ?? false;

  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(null);
  const directDeleteMutation = useDirectDeleteTransaction();

  const [showManualModal, setShowManualModal] = useState(false);
  const createManualTransactionMutation = useCreateManualTransaction();

  const [outletId, setOutletId] = useState<string>(
    isManagerView ? selectedOutletId || "" : ""
  );
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>(
    subMonths(new Date(), 1).toISOString()
  );
  const [endDate, setEndDate] = useState<string>(new Date().toISOString());
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const searchQuery = useDebounce(searchTerm, 500);

  const [proofPreview, setProofPreview] = useState<{
    url: string;
    transaction: any;
  } | null>(null);

  const { data: meData } = useQuery({
    queryKey: ["auth-me"],
    queryFn: () => authApi.me(),
    staleTime: 5 * 60_000,
  });
  const userEmail = meData?.user?.email || "";

  const exportReport = useExportTransactionReport();
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { data, isLoading, isFetching, refetch } = useTransactionList({
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

  const handleManualTransactionSubmit = async (payload: any) => {
    try {
      await createManualTransactionMutation.mutateAsync(payload);
      setShowManualModal(false);
      refetch();
    } catch (err: any) {
      console.error("Failed to create manual transaction:", err);
    }
  };

  const handleDeleteConfirm = (reason: string) => {
    if (!transactionToDelete) return;
    directDeleteMutation.mutate(
      { transactionId: transactionToDelete.id, reason: reason || undefined },
      {
        onSuccess: () => {
          toast.success("Transaksi berhasil dihapus secara langsung.");
          setTransactionToDelete(null);
          refetch();
        },
        onError: (err: any) => {
          toast.error(
            err?.response?.data?.message ||
              err?.message ||
              "Gagal menghapus transaksi"
          );
        },
      }
    );
  };

  const handleExportPDF = (start: string, end: string) => {
    exportReport.mutate(
      { startDate: start, endDate: end },
      { onSuccess: () => setShowExportDialog(false) }
    );
  };

  const totalTransactions = data?.pagination?.total ?? 0;
  const pageSizeOptions = useMemo(() => {
    const base = [5, 10, 20, 50, 100];
    if (!base.includes(limit)) base.push(limit);
    return base.sort((a, b) => a - b);
  }, [limit]);

  const columns = useMemo(
    () =>
      getTransactionColumns({
        onProofPreview: (url, txn) => setProofPreview({ url, transaction: txn }),
      }),
    []
  );

  const hasActiveFilters = Boolean(
    outletId || status || type !== "ALL" || searchTerm
  );

  return (
    <div className="space-y-6">
      <PageGuide
        id="owner-transactions"
        runOnceKey="owner-transactions-guide"
        steps={[
          {
            id: "welcome",
            title: "Riwayat Transaksi",
            description:
              "Pantau arus kas bisnis Anda. Lihat pemasukan, pengeluaran, filter data, dan ekspor e-statement resmi.",
            target: "body",
            placement: "bottom",
          },
          {
            id: "export",
            title: "E-Statement Resmi",
            description:
              "Klik E-Statement Resmi untuk mengirim rekening koran transaksi resmi ke email terdaftar Anda.",
            target: "[data-guide='transactions-header']",
            placement: "bottom",
            offset: 12,
          },
          {
            id: "summary",
            title: "Ringkasan Keuangan",
            description:
              "Total pemasukan (hijau), pengeluaran (merah), dan saldo bersih — plus filter rentang tanggal.",
            target: "[data-guide='transactions-summary']",
            placement: "bottom",
            offset: 8,
          },
          {
            id: "search",
            title: "Cari & Filter",
            description:
              "Cari transaksi berdasarkan ID atau deskripsi. Filter berdasarkan tipe, outlet, atau status.",
            target: "input[placeholder='Cari transaksi (ID, Deskripsi)...']",
            placement: "bottom",
            offset: 8,
          },
          {
            id: "table",
            title: "Tabel Transaksi",
            description:
              "Kolom: tanggal, tipe, deskripsi, outlet, metode bayar, jumlah, pajak, dan status. Klik header untuk urutkan.",
            target: "[data-guide='transactions-table']",
            placement: "top",
            offset: 8,
          },
          {
            id: "export-csv",
            title: "Export & Paginasi",
            description:
              "Export data ke CSV, atur jumlah baris per halaman, atau navigasi halaman transaksi.",
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
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowManualModal(true)}
                className="font-bold text-xs h-10 shadow-none bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Tambah Transaksi
              </Button>
              <Button
                onClick={() => setShowExportDialog(true)}
                disabled={totalTransactions === 0 || isLoading}
                className="font-bold text-xs h-10 shadow-none bg-rose-600 hover:bg-rose-500 text-white"
              >
                <Mail className="w-4 h-4 mr-2" />
                E-Statement Resmi
              </Button>
            </div>
          }
        />
      </div>

      <div data-guide="transactions-summary">
        <TransactionSummaryCard
          totals={data?.data.totals}
          startDate={startDate}
          endDate={endDate}
          isFetching={isFetching}
          onRangeChange={handleRangeChange}
          onRefresh={refetch}
        />
      </div>

      <TransactionFilterBar
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        type={type}
        onTypeChange={setType}
        outletId={outletId}
        onOutletIdChange={setOutletId}
        status={status}
        onStatusChange={setStatus}
        outlets={outlets}
        isManagerView={isManagerView}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      <div data-guide="transactions-table">
        <DataTable
          isLoading={isLoading}
          isRefreshing={isFetching && !isLoading}
          onRefresh={refetch}
          data={data?.data.items || []}
          emptyMessage="Belum ada transaksi ditemukan."
          columns={columns}
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
          exportConfig={getTransactionExportConfig()}
          rowActions={
            isManagerView && hasDeletePrivilege
              ? (row) => [
                  {
                    label: "Hapus Transaksi",
                    icon: Trash2,
                    variant: "destructive" as const,
                    onClick: (row: any) => {
                      setTransactionToDelete(row);
                    },
                  },
                ]
              : undefined
          }
          actionViewType="dropdown"
        />
      </div>

      <DeleteTransactionDialog
        transaction={transactionToDelete}
        onOpenChange={(open) => !open && setTransactionToDelete(null)}
        onConfirm={handleDeleteConfirm}
        isPending={directDeleteMutation.isPending}
      />

      <EStatementDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        userEmail={userEmail}
        onExport={handleExportPDF}
        isPending={exportReport.isPending}
      />

      <ProofPreviewDialog
        proofUrl={proofPreview?.url || null}
        transaction={proofPreview?.transaction || null}
        onOpenChange={(open) => !open && setProofPreview(null)}
      />

      <ManualTransactionModal
        open={showManualModal}
        onOpenChange={setShowManualModal}
        outletId={outletId || selectedOutletId || ""}
        onSubmit={handleManualTransactionSubmit}
        isLoading={createManualTransactionMutation.isPending}
      />
    </div>
  );
}
