"use client";

import { useState } from "react";
import { useCashierContext } from "@/app/cashier/layout";
import { useExpenses } from "@/hooks/useExpenses";
import { ExpensesHeader } from "@/components/owner/expenses/Header";
import { ExpensesControls } from "@/components/owner/expenses/Controls";
import { ExpensesDesktopTable } from "@/components/owner/expenses/DesktopTable";
import { ExpensesEmptyState } from "@/components/owner/expenses/EmptyState";
import { ExpensesSkeleton } from "@/components/owner/expenses/Skeleton";
import ExpenseModal from "@/components/modals/ExpenseModal";
import { type Expense } from "@/lib/apis/expense";

export default function CashierExpensesPage() {
  const { outletData } = useCashierContext();
  const outletId = outletData?.id;

  const { expenses, summary, loading, error, startISO, endISO, setRange, refetch, create, update } =
    useExpenses(outletId);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleSubmitModal = async (
    payload: { description: string; amount: number; date: string; outletId: string },
    id?: string,
  ) => {
    if (id) await update(id, payload);
    else await create(payload);
    setModalOpen(false);
  };

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-[1500px] mx-auto">
      <ExpensesHeader saldo={summary.totalPengeluaran} onRefresh={refetch} />

      <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl border border-gray-200/70 dark:border-gray-700/70 p-4 sm:p-6">
        <ExpensesControls
          startISO={startISO}
          endISO={endISO}
          onRangeChange={setRange}
          onAdd={handleAdd}
        />
      </div>

      {loading ? (
        <ExpensesSkeleton />
      ) : error ? (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      ) : expenses.length === 0 ? (
        <ExpensesEmptyState />
      ) : (
        <>
          <ExpensesDesktopTable items={expenses} />
        </>
      )}

      <ExpenseModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        outletId={outletId || ""}
        initial={editing}
        onSubmit={handleSubmitModal}
      />
    </div>
  );
}
