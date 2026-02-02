"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { authApi, productApi, stockApi } from "@/lib/api";
import { useOutletContext } from "@/components/providers/OutletProvider";

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
    minStock?: number;
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
  } = useOutletContext();
  const [items, setItems] = useState<StockItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [hasOutlet, setHasOutlet] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await authApi.me();
        const hasBusiness = !!user.business?.id;
        const hasBank = !!(user.business?.bankName && user.business?.accountNumber);
        setHasBusinessProfile(hasBusiness && hasBank);
        setHasOutlet(user.outlets.length > 0);
        if (user.outlets.length === 0) setIsLoading(false);
      } catch (e) {
        console.error("Error fetching user data:", e);
        setError("Gagal memuat data pengguna");
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  const fetchStock = useCallback(async () => {
    if (!selectedOutletId) return;
    try {
      setIsFetching(true);
      const response = await stockApi.getByOutlet(selectedOutletId, {
        page: currentPage,
        limit: itemsPerPage,
        type: "GOODS",
        search: searchQuery || undefined,
        status: statusFilter === "ALL" ? undefined : statusFilter,
      });
      const data = Array.isArray(response.data) ? response.data : [];
      // Ensure GOODS only for safety
      const goodsOnly = data.filter((item) => item.type === "GOODS");
      setItems(goodsOnly);
      setTotalItems(response.pagination?.total ?? goodsOnly.length);
      setTotalPages(response.pagination?.totalPages ?? 1);
    } catch (e: any) {
      console.error("Error fetching stock:", e);
      setItems([]);
      setError(e?.message || "Gagal memuat data stok");
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, statusFilter, selectedOutletId]);

  useEffect(() => {
    if (selectedOutletId && !contextLoading) {
      fetchStock();
    }
  }, [
    selectedOutletId,
    currentPage,
    itemsPerPage,
    searchQuery,
    statusFilter,
    fetchStock,
    contextLoading,
  ]);

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
    () => items.filter((i: StockItem) => statusFilter === "ALL" || i.status === statusFilter),
    [items, statusFilter],
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
