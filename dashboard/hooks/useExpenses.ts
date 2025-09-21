"use client";

import { useEffect, useMemo, useState } from "react";
import { expenseApi } from "@/lib/apis/expense";

export type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  createdAt: string;
};

export function useExpenses(outletId?: string, range?: { startDate?: string; endDate?: string }) {
  const [data, setData] = useState<ExpenseItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!outletId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    expenseApi
      .getByOutlet(outletId, { startDate: range?.startDate, endDate: range?.endDate })
      .then((res) => {
        if (!cancelled) setData(res as any);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Gagal memuat pengeluaran");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId, range?.startDate, range?.endDate]);

  const totalAmount = useMemo(() => {
    const list = data ?? [];
    return list.reduce((sum, e) => sum + (e.amount || 0), 0);
  }, [data]);

  return { data, loading, error, totalAmount };
}
