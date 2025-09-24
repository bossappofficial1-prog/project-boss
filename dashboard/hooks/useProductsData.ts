"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, productApi } from '@/lib/api';
import { useOutletContext } from '@/components/providers/OutletProvider';

export interface ProductItem {
  id: string;
  name: string;
  description?: string;
  costPrice: number;
  price: number;
  type: 'GOODS' | 'SERVICE';
  quantity?: number;
  unit?: string;
  status: 'ACTIVE' | 'INACTIVE';
  serviceDurationMinutes?: number;
  image?: string;
  createdAt?: string;
  updatedAt?: string;
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

      if (Array.isArray(response)) {
        setProducts(response);
        setTotalPages(1);
        setTotalProducts(response.length);
      } else if (response && typeof response === 'object' && 'products' in response && Array.isArray((response as any).products)) {
        const res = response as { products: ProductItem[]; pagination?: { totalPages: number; total: number } };
        setProducts(res.products);
        if (res.pagination) {
          setTotalPages(res.pagination.totalPages);
          setTotalProducts(res.pagination.total);
        } else {
          setTotalPages(1);
          setTotalProducts(res.products.length);
        }
      } else if (response && typeof response === 'object' && 'id' in response) {
        // single product returned
        setProducts([response as ProductItem]);
        setTotalPages(1);
        setTotalProducts(1);
      } else {
        // fallback
        setProducts([]);
        setTotalPages(1);
        setTotalProducts(0);
      }
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
    setSearchQuery(q);
    setCurrentPage(1);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
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

  const formatCurrency = useCallback((amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount), []);
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
    formatCurrency,
    formatDuration,
  };
}
