"use client";

import { ColumnDef } from "@tanstack/react-table";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { Transaction } from "@/lib/apis/transaction";

interface GetTransactionColumnsParams {
  onProofPreview: (url: string, transaction: Transaction) => void;
}

function getStatusBadge(transaction: Transaction) {
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
      variant: "default" as const,
    };
    displayLabel = statusInfo.label;
    displayVariant = statusInfo.variant;
  }

  return (
    <Badge variant={displayVariant} className="font-bold text-[10px] uppercase tracking-wider">
      {displayLabel}
    </Badge>
  );
}

export function getTransactionColumns({
  onProofPreview,
}: GetTransactionColumnsParams): ColumnDef<Transaction>[] {
  return [
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
                onClick={() => onProofPreview(transaction.paymentProofUrl!, transaction)}
                className="flex items-center gap-1 text-[9px] font-bold text-primary hover:underline"
              >
                <FileText className="w-2.5 h-2.5" />
                LIHAT BUKTI
              </button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "amount",
      header: "Jumlah",
      cell: ({ row }) => {
        const isIncome = row.original.type === "INCOME";
        return (
          <span
            className={cn(
              "font-bold tabular-nums text-xs",
              isIncome ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"
            )}
          >
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
  ];
}

export function getTransactionExportConfig() {
  return [
    {
      id: "csv",
      label: "Export CSV",
      enabled: true,
      type: "client" as const,
      filename: "transaksi-data",
      customMapping: (row: Transaction) => ({
        ID: row.id,
        Tanggal: format(new Date(row.createdAt), "yyyy-MM-dd HH:mm"),
        Tipe: row.type,
        Outlet: row.outlet?.name || "-",
        Deskripsi: row.description,
        Metode: row.manualMethod || row.paymentMethod || "-",
        Jumlah: row.amount,
        Pajak: row.order?.taxAmount ?? 0,
        Status: row.status,
      }),
    },
  ];
}
