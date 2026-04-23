"use client";

import { DataTable } from "@/components/ui/data-table";
import { type Expense } from "@/lib/apis/expense";
import { PenBox, Plus, Trash2 } from "lucide-react";
import ExpensesMobileCards from "./MobileCards";
import { formatCurrency } from "@/lib/utils";

import Image from "next/image";

interface ExpensesDesktopTableProps {
  items: Expense[];
  onEdit?: (exp: Expense) => void;
  onDelete?: (exp: Expense) => void;
  onPreviewImage?: (url: string) => void;
  isLoading?: boolean;
}

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ExpensesDesktopTable({ items, onEdit, onDelete, onPreviewImage, isLoading }: ExpensesDesktopTableProps) {
  return (
    <DataTable
      data={items}
      isLoading={isLoading}
      emptyMessage="Belum ada catatan pengeluaran."
      columns={[
        {
          accessorKey: "date",
          header: "Tanggal",
          cell: (info) => (
            <div className="flex flex-col">
              <span className="font-bold text-foreground/90 text-xs tabular-nums">{new Date(info.getValue() as string).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}</span>
              <span className="text-[10px] text-muted-foreground/60 tabular-nums">{new Date(info.getValue() as string).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}</span>
            </div>
          ),
        },
        {
          accessorKey: "description",
          header: "Deskripsi",
          cell: ({ row }) => (
            <div className="max-w-[300px]">
              <p className="font-bold text-foreground/80 text-xs truncate">{row.original.description}</p>
            </div>
          ),
          enableSorting: false,
        },
        {
          accessorKey: "amount",
          header: "Jumlah",
          cell: (amount) => (
            <span className="font-bold text-rose-600 dark:text-rose-400 tabular-nums text-xs">
              -{formatCurrency(amount.getValue() as number)}
            </span>
          ),
        },
        {
          accessorKey: "receiptUrl",
          header: "Bukti",
          cell: (info: any) => {
            const url = info.getValue() as string;
            if (!url) return <span className="text-[10px] font-bold text-muted-foreground/30 uppercase tracking-widest">No File</span>;
            return (
              <button
                onClick={() => onPreviewImage?.(url)}
                className="group relative block w-10 h-10 rounded-md overflow-hidden border border-border/40 hover:border-primary/40 transition-all focus:outline-none shadow-sm"
              >
                <Image src={url} alt="Bukti" fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="w-5 h-5 rounded-full bg-background/90 flex items-center justify-center shadow-lg">
                      <Plus className="w-3 h-3 text-primary" />
                    </div>
                  </div>
                </div>
              </button>
            );
          },
        },
      ]}
      rowActions={(row: Expense) => [
        {
          label: "Edit",
          onClick: () => onEdit?.(row),
          variant: "ghost",
          icon: PenBox,
        },
        {
          label: "Hapus",
          onClick: () => onDelete?.(row),
          icon: Trash2,
          variant: "destructive",
        }
      ]}
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
