"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building2,
  LayoutGrid,
  List,
  RefreshCw,
  Search,
  Table2,
  X,
  Users,
  ReceiptText,
  CircleDollarSign,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/EmptyState";
import { LoadingState } from "@/components/shared/LoadingState";
import { DataTable } from "@/components/ui/data-table";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableCard } from "./table-card";
import { TableDetailSheet } from "./table-detail-sheet";
import { tableApi, type OutletTable } from "@/lib/apis/table";
import { billApi, type Bill } from "@/lib/apis/bill";
import { type ColumnDef } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

type TablesContentProps = {
  outletId: string;
  outletName: string;
};

type ViewMode = "grid" | "list";
type StatusFilter =
  | "ALL"
  | "AVAILABLE"
  | "OCCUPIED"
  | "RESERVED"
  | "BILLED";

const statusBadgeClass: Record<
  string,
  { label: string; className: string }
> = {
  AVAILABLE: {
    label: "Available",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  OCCUPIED: {
    label: "Occupied",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  RESERVED: {
    label: "Reserved",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  BILLED: {
    label: "Billed",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
};

const FILTER_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: "ALL", label: "Semua" },
  { key: "AVAILABLE", label: "Available" },
  { key: "OCCUPIED", label: "Occupied" },
  { key: "RESERVED", label: "Reserved" },
  { key: "BILLED", label: "Billed" },
];

export function TablesContent({
  outletId,
  outletName,
}: TablesContentProps) {
  const queryClient = useQueryClient();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(
    null,
  );
  const [billToPay, setBillToPay] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [detailOpen, setDetailOpen] = useState(false);

  const tablesQuery = useQuery({
    queryKey: ["cashier-tables", outletId],
    queryFn: () => tableApi.getTables(outletId),
    enabled: !!outletId,
  });

  const billsQuery = useQuery({
    queryKey: ["cashier-bills", outletId],
    queryFn: () => billApi.getBills(outletId),
    enabled: !!outletId,
  });

  const createBillMutation = useMutation({
    mutationFn: (tableId: string) =>
      billApi.createBill({ outletId, tableId }),
    onSuccess: () => {
      toast.success("Bill berhasil dibuat");
      queryClient.invalidateQueries({
        queryKey: ["cashier-tables", outletId],
      });
      queryClient.invalidateQueries({
        queryKey: ["cashier-bills", outletId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Gagal membuat bill");
    },
  });

  const payBillMutation = useMutation({
    mutationFn: (billId: string) => billApi.payBill(billId),
    onSuccess: () => {
      toast.success("Bill berhasil dibayar");
      setDetailOpen(false);
      setSelectedTableId(null);
      queryClient.invalidateQueries({
        queryKey: ["cashier-tables", outletId],
      });
      queryClient.invalidateQueries({
        queryKey: ["cashier-bills", outletId],
      });
    },
    onError: (error: any) => {
      toast.error(error?.message ?? "Gagal memproses pembayaran");
    },
  });

  const tables = (tablesQuery.data ?? []) as OutletTable[];
  const bills = (billsQuery.data ?? []) as Bill[];

  const filterCounts = useMemo(() => {
    const counts: Record<string, number> = { ALL: tables.length };
    for (const t of tables) {
      counts[t.status] = (counts[t.status] ?? 0) + 1;
    }
    return counts;
  }, [tables]);

  const filteredTables = useMemo(() => {
    let result = tables;
    if (statusFilter !== "ALL") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(q),
      );
    }
    return result;
  }, [tables, statusFilter, searchQuery]);

  const selectedTable = useMemo(
    () => tables.find((t) => t.id === selectedTableId) ?? null,
    [selectedTableId, tables],
  );

  const selectedBill = useMemo(() => {
    if (!selectedTableId) return null;
    return (
      bills.find(
        (b) =>
          b.tableId === selectedTableId && b.status !== "PAID",
      ) ?? null
    );
  }, [bills, selectedTableId]);

  const handleSelectTable = (tableId: string) => {
    setSelectedTableId(tableId);
    setDetailOpen(true);
  };

  const handleGenerateBill = (tableId: string) => {
    createBillMutation.mutate(tableId);
  };

  const handlePayBill = (billId: string) => {
    setBillToPay(billId);
  };

  const columns: ColumnDef<OutletTable>[] = useMemo(
    () => [
      {
        accessorKey: "name",
        header: "Meja",
        cell: ({ row }) => (
          <span className="font-medium">{row.original.name}</span>
        ),
      },
      {
        accessorKey: "capacity",
        header: "Kapasitas",
        cell: ({ row }) => (
          <span className="flex items-center gap-1 text-sm">
            <Users className="h-3.5 w-3.5 text-muted-foreground" />
            {row.original.capacity}
          </span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
          const s =
            statusBadgeClass[row.original.status] ??
            statusBadgeClass.AVAILABLE;
          return (
            <Badge
              className={cn("rounded-md border-0 text-xs", s.className)}
            >
              {s.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: "_count.orders",
        header: "Orders",
        cell: ({ row }) => (
          <span>{row.original._count?.orders ?? 0}</span>
        ),
      },
      {
        id: "bill",
        header: "Bill",
        cell: ({ row }) => {
          const bill = bills.find(
            (b) =>
              b.tableId === row.original.id && b.status !== "PAID",
          );
          if (!bill)
            return (
              <span className="text-xs text-muted-foreground">
                &mdash;
              </span>
            );
          return (
            <span className="font-mono text-xs">
              Rp {bill.total.toLocaleString("id-ID")}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => {
          const bill = bills.find(
            (b) =>
              b.tableId === row.original.id && b.status !== "PAID",
          );
          return (
            <div className="flex gap-1">
              {row.original.status === "OCCUPIED" && !bill && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateBill(row.original.id);
                  }}
                  disabled={createBillMutation.isPending}
                >
                  <ReceiptText className="h-3 w-3 mr-1" />
                  Bill
                </Button>
              )}
              {bill && bill.status !== "PAID" && (
                <Button
                  size="sm"
                  className="h-7 text-xs rounded-md"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePayBill(bill.id);
                  }}
                  disabled={payBillMutation.isPending}
                >
                  <CircleDollarSign className="h-3 w-3 mr-1" />
                  Bayar
                </Button>
              )}
            </div>
          );
        },
      },
    ],
    [
      bills,
      createBillMutation.isPending,
      payBillMutation.isPending,
    ],
  );

  if (tablesQuery.isLoading || billsQuery.isLoading) {
    return <LoadingState message="Memuat data meja..." />;
  }

  if (tablesQuery.isError) {
    return (
      <EmptyState
        title="Gagal memuat meja"
        description="Coba muat ulang halaman untuk mengambil data meja terbaru."
        icon={<Table2 className="w-8 h-8 text-muted-foreground" />}
      />
    );
  }

  return (
    <div className="space-y-4 p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Building2 className="h-4 w-4" />
          <span>{outletName}</span>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Meja & Bill
            </h1>
            <p className="text-sm text-muted-foreground">
              Pantau meja aktif, buat bill, dan proses pembayaran.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-md shrink-0"
            onClick={() => {
              queryClient.invalidateQueries({
                queryKey: ["cashier-tables", outletId],
              });
              queryClient.invalidateQueries({
                queryKey: ["cashier-bills", outletId],
              });
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="flex items-center gap-1 flex-wrap">
          {FILTER_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                statusFilter === opt.key
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80",
              )}
            >
              {opt.label}
              <span className="ml-1.5 opacity-70">
                ({filterCounts[opt.key] ?? 0})
              </span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
          <div className="relative flex-1 sm:w-48">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari meja..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-9 text-sm rounded-md"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          <div className="flex items-center border rounded-md overflow-hidden shrink-0">
            <button
              onClick={() => setViewMode("grid")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "grid"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
              aria-label="Tampilan grid"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "p-2 transition-colors",
                viewMode === "list"
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
              aria-label="Tampilan daftar"
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {filteredTables.length === 0 ? (
        <EmptyState
          title={
            searchQuery
              ? "Meja tidak ditemukan"
              : "Belum ada meja"
          }
          description={
            searchQuery
              ? `Tidak ada meja dengan nama "${searchQuery}"`
              : "Outlet ini belum memiliki meja terdaftar."
          }
          icon={
            <Table2 className="w-8 h-8 text-muted-foreground" />
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredTables.map((table) => {
            const bill = bills.find(
              (b) =>
                b.tableId === table.id && b.status !== "PAID",
            );
            return (
              <TableCard
                key={table.id}
                table={table}
                bill={bill ?? null}
                onSelect={handleSelectTable}
                onGenerateBill={handleGenerateBill}
                onPayBill={(billId) => setBillToPay(billId)}
                isCreatingBill={createBillMutation.isPending}
                isPayingBill={payBillMutation.isPending}
              />
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredTables}
          tableId="cashier-tables-list"
          emptyMessage="Tidak ada meja untuk filter ini."
          pagination
          pageSize={20}
          density="compact"
          onRowClick={(row) =>
            handleSelectTable(row.id)
          }
        />
      )}

      {/* Detail Sheet */}
      <TableDetailSheet
        table={selectedTable}
        bill={selectedBill}
        open={detailOpen}
        onOpenChange={(v) => {
          setDetailOpen(v);
          if (!v) setSelectedTableId(null);
        }}
        onGenerateBill={handleGenerateBill}
        onPayBill={(billId) => setBillToPay(billId)}
        isCreatingBill={createBillMutation.isPending}
        isPayingBill={payBillMutation.isPending}
      />

      {/* Payment Confirm Dialog */}
      <ConfirmDialog
        open={!!billToPay}
        onOpenChange={(v) => !v && setBillToPay(null)}
        title="Konfirmasi Pembayaran"
        description="Apakah Anda yakin ingin memproses pembayaran bill ini? Tindakan ini akan menutup bill dan mengosongkan meja."
        confirmLabel="Ya, Bayar Sekarang"
        onConfirm={() => {
          if (billToPay) {
            payBillMutation.mutate(billToPay);
            setBillToPay(null);
          }
        }}
      />
    </div>
  );
}
