"use client";

import { useCallback, useMemo, useState } from "react";
import { productApi } from "@/lib/api";
import { useOutletContext } from "@/components/providers/OutletProvider";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  image?: string;
  type: "SERVICE" | "GOODS" | "TICKET";
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
  goods?: Goods;
  service?: Service;
  ticket?: Ticket;
}

export interface Goods {
  id: string;
  productId: string;
  currentStock: number;
  minStock?: number | null;
  maxStock?: number | null;
  unit: string;
  averageHpp: number;
  sellingPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface Service {
  id: string;
  productId: string;
  durationMinutes: number;
  sellingPrice: number;
  providerName: string;
  providerPhone: string;
  providerEmail: string;
  commissionType: "PERCENTAGE" | "FIXED";
  commissionValue: number;
  maxParallel: number;
  bookingInWorkHours: boolean;
  createdAt: string;
  updatedAt: string;

  // Operating hours (nullable)
  mondayOpen?: Date | string | null;
  mondayClose?: Date | string | null;
  tuesdayOpen?: Date | string | null;
  tuesdayClose?: Date | string | null;
  wednesdayOpen?: Date | string | null;
  wednesdayClose?: Date | string | null;
  thursdayOpen?: Date | string | null;
  thursdayClose?: Date | string | null;
  fridayOpen?: Date | string | null;
  fridayClose?: Date | string | null;
  saturdayOpen?: Date | string | null;
  saturdayClose?: Date | string | null;
  sundayOpen?: Date | string | null;
  sundayClose?: Date | string | null;
}

export interface Ticket {
  id: string;
  productId: string;
  sellingPrice: number;
  eventDate: string;
  eventEndDate?: string | null;
  venue: string;
  venueAddress?: string | null;
  mapUrl?: string | null;
  totalQuota: number;
  soldCount: number;
  maxPerOrder: number;
  saleStartDate?: string | null;
  saleEndDate?: string | null;
  terms?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OutletItem {
  id: string;
  name: string;
  address?: string;
}

export function useProductsData() {
  const {
    selectedOutletId,
    outlets: contextOutlets,
    isLoading: contextLoading,
  } = useOutletContext();
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);

  const productsQueryKey = useMemo(
    () => ['products', selectedOutletId, currentPage, itemsPerPage, searchQuery],
    [selectedOutletId, currentPage, itemsPerPage, searchQuery],
  );

  const {
    data: productsResponse,
    isLoading: isQueryLoading,
    isFetching,
  } = useQuery({
    queryKey: productsQueryKey,
    queryFn: async () => {
      const response = await productApi.getByOutlet(selectedOutletId!, {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
      });
      return response;
    },
    enabled: !!selectedOutletId && !contextLoading,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
  });

  const products = productsResponse?.data ?? [];
  const totalPages = productsResponse?.pagination?.totalPages ?? 1;
  const totalProducts = productsResponse?.pagination?.total ?? 0;
  const isLoading = contextLoading || isQueryLoading;
  const hasOutlet = contextOutlets.length > 0;
  const hasBusinessProfile = hasOutlet; // If outlets exist, business profile is set up

  const fetchProducts = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['products', selectedOutletId] });
  }, [queryClient, selectedOutletId]);

  const handleSearch = (q: string) => {
    setSearchQuery((prev) => {
      if (prev !== q) {
        setCurrentPage(1);
      }
      return q;
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await productApi.delete(productId);
      await queryClient.invalidateQueries({ queryKey: ['products', selectedOutletId] });
    } catch (e: any) {
      console.error("Error deleting product:", e);
      setError(e?.message || "Gagal menghapus produk. Silakan coba lagi.");
    }
  };

  const handleToggleStatus = async (product: ProductItem) => {
    try {
      const newStatus = product.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
      await productApi.update(product.id, { status: newStatus });
      await queryClient.invalidateQueries({ queryKey: ['products', selectedOutletId] });
    } catch (e: any) {
      console.error("Error updating product status:", e);
      setError(e?.message || "Gagal mengubah status produk. Silakan coba lagi.");
    }
  };

  const handleExportProducts = async () => {
    if (!selectedOutletId) return;
    try {
      const blob = await productApi.exportData(selectedOutletId, {
        search: searchQuery || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `data_produk_dan_jasa_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error("Error exporting products:", e);
      setError(e?.message || "Gagal mengekspor data produk. Silakan coba lagi.");
    }
  };

  const handleRefreshData = () => fetchProducts();

  const formatDuration = useCallback((minutes?: number) => {
    if (!minutes) return "-";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
  }, []);

  return {
    // data
    products,
    outlets: contextOutlets,
    selectedOutlet: selectedOutletId,
    currentPage,
    itemsPerPage,
    totalPages,
    totalProducts,
    searchQuery,
    isLoading,
    error,
    hasBusinessProfile,
    hasOutlet,
    // setters
    setCurrentPage,
    setItemsPerPage,
    setSearchQuery,
    setError,
    // actions
    fetchProducts,
    handleSearch,
    handleDeleteProduct,
    handleToggleStatus,
    handleExportProducts,
    handleRefreshData,
    // formatters
    formatDuration,
  };
}
