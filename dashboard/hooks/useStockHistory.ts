"use client";

import { useCallback, useState } from "react";
import { stockApi } from "@/lib/api";

export interface StockLogItem {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "RETURN";
  quantity: number;
  hppPerUnit: number | null;
  referenceType: string | null;
  referenceId: string | null;
  notes: string | null;
  faktur: string | null;
  createdAt: string;
  runningBalance?: number;
}

export interface ProductGoodsInfo {
  id: string;
  productId: string;
  currentStock: number;
  minStock: number | null;
  unit: string;
  averageHpp: number;
  sellingPrice: number;
  product: {
    id: string;
    name: string;
    description: string | null;
    type: string;
    status: string;
    image: string | null;
  };
}

export function useStockHistory() {
  const [productInfo, setProductInfo] = useState<ProductGoodsInfo | null>(null);
  const [historyLogs, setHistoryLogs] = useState<StockLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = useCallback(async (productGoodsId: string) => {
    if (!productGoodsId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await stockApi.getHistory(productGoodsId, { limit: 100 });

      if (response.success && response.data) {
        setProductInfo(response.data.productGoods);

        // Calculate running balance (newest first, so we start from current stock and work backwards)
        const logs = response.data.logs || [];
        const logsWithBalance: StockLogItem[] = [];
        let balance = response.data.productGoods.currentStock;

        // Logs are already sorted by createdAt DESC from backend
        for (let i = 0; i < logs.length; i++) {
          const log = logs[i];
          logsWithBalance.push({
            ...log,
            runningBalance: balance,
          });
          // Work backwards: undo the effect of this log to get previous balance
          if (log.type === "IN") {
            balance -= log.quantity;
          } else if (log.type === "OUT" || log.type === "RETURN") {
            balance += Math.abs(log.quantity);
          } else if (log.type === "ADJUSTMENT") {
            // For adjustment, quantity is the change amount
            balance -= log.quantity;
          }
        }

        setHistoryLogs(logsWithBalance);
      }
    } catch (e: any) {
      console.error("Error fetching stock history:", e);
      setError(e?.message || "Gagal memuat history stok");
      setHistoryLogs([]);
      setProductInfo(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearHistory = useCallback(() => {
    setProductInfo(null);
    setHistoryLogs([]);
    setError(null);
  }, []);

  const formatCurrency = useCallback((amount: number | null) => {
    if (amount === null || amount === undefined) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateStr));
  }, []);

  return {
    productInfo,
    historyLogs,
    isLoading,
    error,
    fetchHistory,
    clearHistory,
    formatCurrency,
    formatDate,
    setError,
  };
}
