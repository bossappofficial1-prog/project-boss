"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { expenseApi, type Expense } from "@/lib/apis/expense";

export interface ExpenseSummary {
  totalTransaksi: number;
  totalPengeluaran: number;
}

export interface UseExpensesResult {
  expenses: Expense[];
  summary: ExpenseSummary;
  loading: boolean;
  error: string | null;
  startISO: string; // ISO start
  endISO: string; // ISO end
  setRange: (startISO: string, endISO: string) => void;
  refetch: () => Promise<void>;
  create: (payload: Omit<Expense, "id" | "createdAt" | "updatedAt">) => Promise<void>;
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
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const computeSummary = useCallback((items: Expense[]): ExpenseSummary => {
    return items.reduce(
      (acc, e) => ({
        totalTransaksi: acc.totalTransaksi + 1,
        totalPengeluaran: acc.totalPengeluaran + (e.amount || 0),
      }),
      { totalTransaksi: 0, totalPengeluaran: 0 },
    );
  }, []);

  const fetchData = useCallback(async () => {
    if (!outletId) {
      setExpenses([]);
      setError(null);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      setError(null);
      const list = await expenseApi.listByOutlet(outletId, {
        startDate: startISO,
        endDate: endISO,
      });
      setExpenses(list || []);
    } catch (err: any) {
      console.error("Error fetching expenses:", err);
      setExpenses([]);
      setError(err.message || "Gagal memuat pengeluaran");
    } finally {
      setLoading(false);
    }
  }, [outletId, startISO, endISO]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const summary = useMemo(() => computeSummary(expenses), [expenses, computeSummary]);

  const setRange = useCallback((start: string, end: string) => {
    setStartISO(start);
    setEndISO(end);
  }, []);

  const create = useCallback(
    async (payload: {
      description: string;
      amount: number;
      date: string;
      outletId: string;
      cashier?: string;
    }) => {
      await expenseApi.create(payload);
      await fetchData();
    },
    [fetchData],
  );

  const update = useCallback(
    async (id: string, payload: Partial<Expense>) => {
      await expenseApi.update(id, payload);
      await fetchData();
    },
    [fetchData],
  );

  const remove = useCallback(
    async (id: string) => {
      await expenseApi.remove(id);
      await fetchData();
    },
    [fetchData],
  );

  return {
    expenses,
    summary,
    loading,
    error,
    startISO,
    endISO,
    setRange,
    refetch: fetchData,
    create,
    update,
    remove,
  };
}
