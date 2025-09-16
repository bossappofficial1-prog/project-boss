"use client";

import { useEffect, useMemo, useState } from "react";
import { orderApi, GoodsOrder, QueueEntry } from "@/lib/apis/order";

type UseOrdersParams = {
  outletId?: string;
  status?: string;
  limit?: number;
};

export function useGoodsOrders({ outletId, status, limit }: UseOrdersParams) {
  const [data, setData] = useState<GoodsOrder[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!outletId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    orderApi
      .getByOutlet(outletId, { status, limit })
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Gagal memuat pesanan");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId, status, limit]);

  return { data, loading, error };
}

export function useOutletQueue(outletId?: string) {
  const [data, setData] = useState<QueueEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!outletId) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    orderApi
      .getQueue(outletId)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Gagal memuat antrian");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [outletId]);

  return { data, loading, error };
}
