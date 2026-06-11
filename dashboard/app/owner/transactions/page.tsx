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
import { Plus, Mail, Trash2, Pencil, Eye } from "lucide-react";
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
  ManualTransactionFormModal,
  TransactionDetailSheet,
} from "@/features/transactions";

export default function TransactionsPage() {
  const pathname = usePathname();
  const isManagerView = pathname?.startsWith("/manager") ?? false;

  const { outlets, selectedOutletId } = useOutletStore();
  const {
    useTransactionList,
    useCreateManualTransaction,
    useUpdateManualTransaction,
    useDeleteManualTransaction,
  } = useTransactions();

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

  const [transactionToDelete, setTransactionToDelete] = useState<any | null>(
    null,
  );
  const directDeleteMutation = useDirectDeleteTransaction();

  const [showManualModal, setShowManualModal] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const createManualTransactionMutation = useCreateManualTransaction();

  const [editingTransaction, setEditingTransaction] = useState<any | null>(
    null,
  );
  const updateManualTransactionMutation = useUpdateManualTransaction();

  const [detailTransaction, setDetailTransaction] = useState<any | null>(null);

  const [showDeleteManualConfirm, setShowDeleteManualConfirm] = useState(false);
  const [deletingManualTransaction, setDeletingManualTransaction] = useState<
    any | null
  >(null);
  const deleteManualTransactionMutation = useDeleteManualTransaction();

  const [outletId, setOutletId] = useState<string>(
    isManagerView ? selectedOutletId || "" : "",
  );
  const [status, setStatus] = useState<string>("");
  const [type, setType] = useState<string>("ALL");
  const [startDate, setStartDate] = useState<string>(
    subMonths(new Date(), 1).toISOString(),
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

  const handleEditManualTransactionSubmit = async ({
    transactionId,
    payload,
  }: {
    transactionId: string;
    payload: any;
  }) => {
    try {
      await updateManualTransactionMutation.mutateAsync({
        transactionId,
        payload,
      });
      setShowManualModal(false);
      setEditingTransaction(null);
      refetch();
    } catch (err: any) {
      console.error("Failed to update manual transaction:", err);
    }
  };

  const handleFormSubmit = async (payload: any) => {
    if (formMode === "edit" && payload.transactionId) {
      await handleEditManualTransactionSubmit(payload);
    } else {
      await handleManualTransactionSubmit(payload);
    }
  };

  const openCreateModal = () => {
    setFormMode("create");
    setEditingTransaction(null);
    setShowManualModal(true);
  };

  const openEditModal = (transaction: any) => {
    setFormMode("edit");
    setEditingTransaction(transaction);
    setShowManualModal(true);
  };

  const handleDeleteManualConfirm = () => {
    if (!deletingManualTransaction) return;
    deleteManualTransactionMutation.mutate(deletingManualTransaction.id, {
      onSuccess: () => {
        toast.success("Transaksi manual berhasil dihapus.");
        setShowDeleteManualConfirm(false);
        setDeletingManualTransaction(null);
        refetch();
      },
      onError: (err: any) => {
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Gagal menghapus transaksi manual",
        );
      },
    });
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
              "Gagal menghapus transaksi",
          );
        },
      },
    );
  };

  const handleExportPDF = (start: string, end: string) => {
    exportReport.mutate(
      { startDate: start, endDate: end },
      { onSuccess: () => setShowExportDialog(false) },
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
        onProofPreview: (url, txn) =>
          setProofPreview({ url, transaction: txn }),
      }),
    [],
  );

  const hasActiveFilters = Boolean(
    outletId || status || type !== "ALL" || searchTerm,
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
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar">
              <Button onClick={openCreateModal} size="sm">
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah Transaksi</span>
                <span className="sm:hidden">Tambah</span>
              </Button>
              <Button
                onClick={() => setShowExportDialog(true)}
                disabled={totalTransactions === 0 || isLoading}
                variant="outline"
                size="sm"
              >
                <Mail className="w-4 h-4" />
                <span className="hidden sm:inline">E-Statement Resmi</span>
                <span className="sm:hidden">E-Statement</span>
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
          rowActions={(row: any) => {
            const actions: Array<{
              label: string;
              icon: any;
              variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
              onClick: (row: any) => void;
            }> = [];

            actions.push({
              label: "Detail",
              icon: Eye,
              onClick: (r: any) => setDetailTransaction(r),
            });

            if (row.isManual && !isManagerView) {
              actions.push({
                label: "Edit Transaksi",
                icon: Pencil,
                onClick: (r: any) => openEditModal(r),
              });
              actions.push({
                label: "Hapus Transaksi",
                icon: Trash2,
                variant: "destructive",
                onClick: (r: any) => {
                  setDeletingManualTransaction(r);
                  setShowDeleteManualConfirm(true);
                },
              });
            }

            if (isManagerView && hasDeletePrivilege) {
              actions.push({
                label: "Hapus Transaksi",
                icon: Trash2,
                variant: "destructive",
                onClick: (r: any) => {
                  setTransactionToDelete(r);
                },
              });
            }

            return actions;
          }}
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

      <ManualTransactionFormModal
        open={showManualModal}
        onOpenChange={(open) => {
          setShowManualModal(open);
          if (!open) setEditingTransaction(null);
        }}
        outletId={outletId || selectedOutletId || ""}
        mode={formMode}
        transaction={editingTransaction}
        onSubmit={handleFormSubmit}
        isLoading={
          formMode === "edit"
            ? updateManualTransactionMutation.isPending
            : createManualTransactionMutation.isPending
        }
      />

      <TransactionDetailSheet
        transaction={detailTransaction}
        open={Boolean(detailTransaction)}
        onOpenChange={(open) => {
          if (!open) setDetailTransaction(null);
        }}
      />

      <DeleteTransactionDialog
        transaction={deletingManualTransaction}
        onOpenChange={(open) => {
          if (!open) {
            setShowDeleteManualConfirm(false);
            setDeletingManualTransaction(null);
          }
        }}
        onConfirm={handleDeleteManualConfirm}
        isPending={deleteManualTransactionMutation.isPending}
      />
    </div>
  );
}
