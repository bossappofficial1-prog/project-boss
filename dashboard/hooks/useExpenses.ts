"use client";

import { useCallback, useMemo, useState } from "react";
import { type Expense, useExpenseList, useCreateExpense, useUpdateExpense, useDeleteExpense, type ExpenseSummary } from "./api/use-expenses";

export interface UseExpensesResult {
  expenses: Expense[];
  summary: ExpenseSummary;
  loading: boolean;
  error: string | null;
  startISO: string; // ISO start
  endISO: string; // ISO end
  setRange: (startISO: string, endISO: string) => void;
  refetch: () => Promise<any>;
  create: (payload: {
    description: string;
    amount: number;
    date: string;
    outletId: string;
    cashier?: string;
  }) => Promise<void>;
  update: (id: string, payload: Partial<Expense>) => Promise<void>;
  remove: (id: string) => Promise<void>;
}

function toISOStartOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function toISOEndOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

export function useExpenses(outletId?: string | null): UseExpensesResult {
  const today = useMemo(() => new Date(), []);
  const weekAgo = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return d;
  }, []);

  const [startISO, setStartISO] = useState<string>(toISOStartOfDay(weekAgo));
  const [endISO, setEndISO] = useState<string>(toISOEndOfDay(today));

  const { data, isLoading, error: queryError, refetch: refetchQuery } = useExpenseList(
    outletId || undefined,
    startISO,
    endISO
  );

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const setRange = useCallback((start: string, end: string) => {
    setStartISO(start);
    setEndISO(end);
  }, []);

  const create = useCallback(
    async (payload: any) => {
      await createMutation.mutateAsync(payload);
    },
    [createMutation],
  );

  const update = useCallback(
    async (id: string, payload: Partial<Expense>) => {
      await updateMutation.mutateAsync({ id, ...payload });
    },
    [updateMutation],
  );

  const remove = useCallback(
    async (id: string) => {
      await deleteMutation.mutateAsync(id);
    },
    [deleteMutation],
  );

  return {
    expenses: data?.data || [],
    summary: data?.summary || { totalTransaksi: 0, totalPengeluaran: 0 },
    loading: isLoading,
    error: queryError ? (queryError as Error).message : null,
    startISO,
    endISO,
    setRange,
    refetch: refetchQuery as any,
    create,
    update,
    remove,
  };
}
