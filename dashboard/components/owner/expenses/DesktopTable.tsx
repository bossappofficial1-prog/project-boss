"use client";

import { DataTable } from "@/components/ui/data-table";
import { type Expense } from "@/lib/apis/expense";
import { PenBox, Trash2 } from "lucide-react";
import ExpensesMobileCards from "./MobileCards";
import { formatCurrency } from "@/lib/utils";

interface ExpensesDesktopTableProps {
  items: Expense[];
  onEdit?: (exp: Expense) => void;
  onDelete?: (exp: Expense) => void;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ExpensesDesktopTable({ items, onEdit, onDelete }: ExpensesDesktopTableProps) {
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
          cell: (amount) => formatCurrency(amount.getValue() as number),
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
