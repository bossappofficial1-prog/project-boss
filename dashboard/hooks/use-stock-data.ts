"use client";

import { useCallback, useMemo, useState } from "react";
import { productApi, stockApi } from "@/lib/api";
import { useOutletStore } from "@/stores/outlet.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface StockItem {
  id: string;
  name: string;
  type: "GOODS" | "SERVICE";
  quantity?: number;
  unit?: string;
  price: number;
  status: "ACTIVE" | "INACTIVE";
  image?: string;
  goods?: {
    id: string;
    currentStock: number;
    minStock?: number | null;
    maxStock?: number | null;
    unit: string;
    averageHpp: number;
    sellingPrice: number;
  };
}

export interface OutletItem {
  id: string;
  name: string;
  address?: string;
}

export function useStockData() {
  const {
    selectedOutletId,
    outlets: contextOutlets,
    isLoading: contextLoading,
  } = useOutletStore();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [error, setError] = useState<string | null>(null);

  const stockQueryKey = useMemo(
    () => ['stock-data', selectedOutletId, currentPage, itemsPerPage, searchQuery, statusFilter],
    [selectedOutletId, currentPage, itemsPerPage, searchQuery, statusFilter],
  );

  const {
    data: stockResponse,
    isLoading: isQueryLoading,
    isFetching,
  } = useQuery({
    queryKey: stockQueryKey,
    queryFn: async () => {
      const response = await stockApi.getByOutlet(selectedOutletId!, {
        page: currentPage,
        limit: itemsPerPage,
        type: "GOODS",
        search: searchQuery || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      return response;
    },
    enabled: !!selectedOutletId && !contextLoading,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const rawItems = useMemo(() => {
    const data = Array.isArray(stockResponse?.data) ? stockResponse.data : [];
    return data.filter((item: StockItem) => item.type === "GOODS");
  }, [stockResponse]);

  const totalItems = stockResponse?.pagination?.total ?? rawItems.length;
  const totalPages = stockResponse?.pagination?.totalPages ?? 1;
  const isLoading = contextLoading || isQueryLoading;
  const hasOutlet = contextOutlets.length > 0;
  const hasBusinessProfile = hasOutlet;

  const fetchStock = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['stock-data', selectedOutletId] });
  }, [queryClient, selectedOutletId]);

  const handleSearchClick = () => fetchStock();

  const handlePaginationChange = useCallback(({ page, limit }: { page: number; limit: number }) => {
    setCurrentPage(page);
    setItemsPerPage(limit);
  }, []);

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  }, []);

  const handleStatusChange = useCallback((value: "ALL" | "ACTIVE" | "INACTIVE") => {
    setStatusFilter(value);
    setCurrentPage(1);
  }, []);

  const handleExport = async () => {
    if (!selectedOutletId) return;
    try {
      const blob = await productApi.exportData(selectedOutletId, {
        type: "GOODS",
        search: searchQuery || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `data_stok_produk_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("Error exporting stock:", e);
      setError(e?.message || "Gagal mengekspor data stok. Silakan coba lagi.");
    }
  };

  const formatCurrency = useCallback(
    (amount: number) =>
      new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        minimumFractionDigits: 0,
      }).format(amount),
    [],
  );
  const getStockStatus = useCallback((quantity?: number) => {
    if (!quantity) return "Habis";
    if (quantity <= 5) return "Rendah";
    if (quantity <= 20) return "Sedang";
    return "Tinggi";
  }, []);
  const getStockStatusColor = useCallback((quantity?: number) => {
    if (!quantity) return "bg-red-100 text-red-800";
    if (quantity <= 5) return "bg-yellow-100 text-yellow-800";
    if (quantity <= 20) return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  }, []);

  // Derived visible list (GOODS-only already ensured) - further filter by status client-side for safety
  const visibleItems = useMemo(
    () => rawItems.filter((i: StockItem) => statusFilter === "ALL" || i.status === statusFilter),
    [rawItems, statusFilter],
  );

  return {
    // data
    stockItems: visibleItems,
    outlets: contextOutlets,
    selectedOutlet: selectedOutletId,
    currentPage,
    itemsPerPage,
    totalItems,
    totalPages,
    searchQuery,
    statusFilter,
    isLoading,
    isFetching,
    error,
    hasBusinessProfile,
    hasOutlet,
    // setters
    setSearchQuery: handleSearchChange,
    setStatusFilter: handleStatusChange,
    setError,
    setCurrentPage,
    setItemsPerPage,
    // actions
    fetchStock,
    handlePaginationChange,
    handleSearchClick,
    handleExport,
    // formatters
    formatCurrency,
    getStockStatus,
    getStockStatusColor,
  };
}
