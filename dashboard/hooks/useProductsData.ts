"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, productApi } from '@/lib/api';
import { useOutletContext } from '@/components/providers/OutletProvider';

export interface ProductItem {
  id: string
  name: string
  description: string
  image?: string
  type: "SERVICE" | "GOODS"
  status: 'ACTIVE' | 'INACTIVE'
  createdAt: string
  updatedAt: string
  goods?: Goods
  service?: Service
}

export interface Goods {
  id: string
  productId: string
  currentStock: number
  minStock?: number
  unit: string
  averageHpp: number
  sellingPrice: number
  createdAt: string
  updatedAt: string
}

export interface Service {
  id: string
  productId: string
  durationMinutes: number
  sellingPrice: number
  providerName: string
  providerPhone: string
  providerEmail: string
  commissionType: "PERCENTAGE" | "FIXED"
  commissionValue: number
  maxParallel: number
  createdAt: string
  updatedAt: string
}

export interface OutletItem {
  id: string;
  name: string;
  address?: string;
}

export function useProductsData() {
  const { selectedOutletId, outlets: contextOutlets, isLoading: contextLoading } = useOutletContext();
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasBusinessProfile, setHasBusinessProfile] = useState<boolean>(false);
  const [hasOutlet, setHasOutlet] = useState<boolean>(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userData = await authApi.me();

        const hasBusiness = !!userData.business?.id;
        const hasBank = !!(userData.business?.bankName && userData.business?.accountNumber);
        setHasBusinessProfile(hasBusiness && hasBank);
        setHasOutlet(userData.outlets.length > 0);
        if (userData.outlets.length === 0) setIsLoading(false);
      } catch (e) {
        console.error('Error fetching user data:', e);
        setError('Gagal memuat data pengguna');
        setIsLoading(false);
      }
    };

    initializeData();
  }, []);

  // Reset to page 1 when outlet changes
  useEffect(() => {
    if (selectedOutletId) {
      setCurrentPage(1);
    }
  }, [selectedOutletId]);

  const fetchProducts = useCallback(async () => {
    if (!selectedOutletId) return;
    try {
      setIsLoading(true);
      const response = await productApi.getByOutlet(selectedOutletId, {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
      });

      const data = response.data;
      const paginated = response.pagination;

      setProducts(data)
      setTotalPages(paginated.totalPages)
      setTotalProducts(paginated.total)
    } catch (e: any) {
      console.error('Error fetching products:', e);
      setProducts([]);
      setError(e?.message || 'Gagal memuat produk');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, itemsPerPage, searchQuery, selectedOutletId]);

  useEffect(() => {
    if (selectedOutletId && !contextLoading) fetchProducts();
  }, [selectedOutletId, currentPage, itemsPerPage, searchQuery, fetchProducts, contextLoading]);

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
      await fetchProducts();
    } catch (e: any) {
      console.error('Error deleting product:', e);
      setError(e?.message || 'Gagal menghapus produk. Silakan coba lagi.');
    }
  };

  const handleToggleStatus = async (product: ProductItem) => {
    try {
      const newStatus = product.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      await productApi.update(product.id, { status: newStatus });
      await fetchProducts();
    } catch (e: any) {
      console.error('Error updating product status:', e);
      setError(e?.message || 'Gagal mengubah status produk. Silakan coba lagi.');
    }
  };

  const handleExportProducts = async () => {
    if (!selectedOutletId) return;
    try {
      const blob = await productApi.exportData(selectedOutletId, {
        search: searchQuery || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_produk_dan_jasa_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Error exporting products:', e);
      setError(e?.message || 'Gagal mengekspor data produk. Silakan coba lagi.');
    }
  };

  const handleRefreshData = () => fetchProducts();

  const formatDuration = useCallback((minutes?: number) => {
    if (!minutes) return '-';
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
