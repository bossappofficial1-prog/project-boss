"use client";

import { useEffect, useState } from "react";
import { outletApi } from "@/lib/apis/outlet";

export type DailyRow = {
  tanggal: string;
  jumlahTransaksi: number;
  totalPendapatan: number;
  totalPengeluaran: number;
  labaBersih: number;
};

export type DailyReportResponse = {
  daily: DailyRow[];
  summary: {
    totalTransaksi: number;
    totalPendapatan: number;
    totalPengeluaran: number;
    totalLabaBersih: number;
  };
};

export function useDailyReport(
  outletId?: string,
  params?: { startDate?: string; endDate?: string; productType?: 'GOODS' | 'SERVICE' | 'BOTH' }
) {
  const [data, setData] = useState<DailyReportResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!outletId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    outletApi
      .getDailyReport(outletId, params)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Gagal memuat laporan harian");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId, params?.startDate, params?.endDate, params?.productType]);

  return { data, loading, error };
}
