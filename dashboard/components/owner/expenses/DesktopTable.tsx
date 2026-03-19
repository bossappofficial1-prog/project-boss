"use client";

import { DataTable } from "@/components/ui/data-table";
import { type Expense } from "@/lib/apis/expense";
import { PenBox, Trash2 } from "lucide-react";
import ExpensesMobileCards from "./MobileCards";
import { formatCurrency } from "@/lib/utils";

import Image from "next/image";

interface ExpensesDesktopTableProps {
  items: Expense[];
  onEdit?: (exp: Expense) => void;
  onDelete?: (exp: Expense) => void;
  onPreviewImage?: (url: string) => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ExpensesDesktopTable({ items, onEdit, onDelete, onPreviewImage }: ExpensesDesktopTableProps) {
  return (
    <DataTable
      data={items}
      columns={[
        {
          accessorKey: "date",
          header: "Tanggal",
          cell: (info) => fmtDate(info.getValue() as string),
        },
        {
          accessorKey: "description",
          header: "Deskripsi",
          enableSorting: false,
        },
        {
          accessorKey: "amount",
          header: "Jumlah",
          cell: (amount) => (
            <span className="font-semibold text-red-600 dark:text-red-400">
              -{formatCurrency(amount.getValue() as number)}
            </span>
          ),
        },
        {
          accessorKey: "receiptUrl",
          header: "Bukti Transaksi",
          cell: (info: any) => {
            const url = info.getValue() as string;
            if (!url) return <span className="text-xs text-muted-foreground">—</span>;
            return (
              <button
                onClick={() => onPreviewImage?.(url)}
                className="relative block w-12 h-12 rounded overflow-hidden border border-slate-200 dark:border-slate-800 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                <Image src={url} alt="Bukti Transaksi" fill className="object-cover" />
              </button>
            );
          },
        },
      ]}
      rowActions={() => {
        const actions = [];
        if (onEdit) {
          actions.push({
            label: "Edit",
            onClick: (row: Expense) => onEdit(row),
            variant: "ghost" as const,
            icon: PenBox,
          });
        }
        if (onDelete) {
          actions.push({
            label: "Hapus",
            onClick: (row: Expense) => onDelete(row),
            icon: Trash2,
            variant: "destructive" as const,
          });
        }
        return actions;
      }}
      stickyHeader
      enableExport
      exportFilename="data-pengeluaran"
      labelAction="Aksi"
      mobileCardRender={(exp) => (
        <ExpensesMobileCards item={exp} onDelete={onDelete} onEdit={onEdit} />
      )}
    />
  );
}

export default ExpensesDesktopTable;
