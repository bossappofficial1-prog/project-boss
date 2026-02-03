"use client";

import { type Expense } from "@/lib/apis/expense";

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
    <div className="space-y-3">
      <div
        key={item.id}
        className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {item.description}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">{fmtDate(item.date)}</div>
          </div>
          <div className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {fmtCurrency(item.amount)}
          </div>
        </div>
        {(onEdit || onDelete) && (
          <div className="mt-3 flex items-center gap-3 justify-end">
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 text-sm">
                Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item)}
                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 text-sm">
                Hapus
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default ExpensesMobileCards;
