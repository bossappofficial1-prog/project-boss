"use client";

import { type Expense } from "@/lib/apis/expense";
import { formatCurrency } from "@/lib/utils";

interface ExpensesMobileCardsProps {
  item: Expense;
  onEdit?: (exp: Expense) => void;
  onDelete?: (exp: Expense) => void;
}

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n);
const fmtDate = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function ExpensesMobileCards({ item, onEdit, onDelete }: ExpensesMobileCardsProps) {
  return (
    <div className="bg-background border border-border/60 rounded-md p-4 transition-all hover:bg-muted/30 shadow-sm relative overflow-hidden group">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="space-y-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
            {new Date(item.date).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" })}
          </p>
          <p className="text-sm font-bold text-foreground/80 leading-tight">
            {item.description}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            -{formatCurrency(item.amount)}
          </p>
          <p className="text-[10px] text-muted-foreground/60 tabular-nums">
            {new Date(item.date).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
          </p>
        </div>
      </div>

      {(onEdit || onDelete) && (
        <div className="flex items-center gap-2 pt-3 border-t border-border/40 justify-end">
          {onEdit && (
            <button
              onClick={() => onEdit(item)}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-blue-600 hover:bg-blue-500/10 rounded-md transition-all"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(item)}
              className="px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-rose-600 hover:bg-rose-500/10 rounded-md transition-all"
            >
              Hapus
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ExpensesMobileCards;
