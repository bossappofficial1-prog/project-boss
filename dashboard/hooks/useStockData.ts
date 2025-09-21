"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { authApi, productApi, stockApi } from '@/lib/api';

export interface StockItem {
  id: string;
  name: string;
  type: 'GOODS' | 'SERVICE';
  quantity?: number;
  unit?: string;
  price: number;
  status: 'ACTIVE' | 'INACTIVE';
  image?: string;
}

export interface OutletItem {
  id: string;
  name: string;
  address?: string;
}

export function useStockData() {
  const [items, setItems] = useState<StockItem[]>([]);
  const [outlets, setOutlets] = useState<OutletItem[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasBusinessProfile, setHasBusinessProfile] = useState(false);
  const [hasOutlet, setHasOutlet] = useState(false);

  useEffect(() => {
    const initialize = async () => {
      try {
        const user = await authApi.me();
        setOutlets(user.outlets);
        const hasBusiness = !!user.business?.id;
        const hasBank = !!(user.business?.bankName && user.business?.accountNumber);
        setHasBusinessProfile(hasBusiness && hasBank);
        setHasOutlet(user.outlets.length > 0);
        if (user.outlets.length === 0) setIsLoading(false);
        if (user.outlets.length > 0) {
          const saved = typeof window !== 'undefined' ? localStorage.getItem('selectedOutlet') : null;
          const valid = saved && user.outlets.find((o: OutletItem) => o.id === saved);
          if (valid && saved) setSelectedOutlet(saved);
          else {
            const first = user.outlets[0].id;
            setSelectedOutlet(first);
            if (!saved) localStorage.setItem('selectedOutlet', first);
          }
        }
      } catch (e) {
        console.error('Error fetching user data:', e);
        setError('Gagal memuat data pengguna');
        setIsLoading(false);
      }
    };
    initialize();
  }, []);

  useEffect(() => {
    const onOutletChange = (event: any) => {
      setSelectedOutlet(event.detail.outletId);
    };
    window.addEventListener('outletChanged', onOutletChange as EventListener);
    return () => window.removeEventListener('outletChanged', onOutletChange as EventListener);
  }, []);

  const fetchStock = useCallback(async () => {
    if (!selectedOutlet) return;
    try {
      setIsLoading(true);
      const data = await stockApi.getByOutlet(selectedOutlet, {
        type: 'GOODS',
        search: searchQuery || undefined,
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      // Ensure GOODS only
      setItems((data || []).filter((i: any) => i.type === 'GOODS'));
    } catch (e: any) {
      console.error('Error fetching stock:', e);
      setItems([]);
      setError(e?.message || 'Gagal memuat data stok');
    } finally {
      setIsLoading(false);
    }
  }, [selectedOutlet, searchQuery, statusFilter]);

  useEffect(() => {
    if (selectedOutlet) fetchStock();
  }, [selectedOutlet, searchQuery, statusFilter, fetchStock]);

  const handleSearchClick = () => fetchStock();

  const handleExport = async () => {
    if (!selectedOutlet) return;
    try {
      const blob = await productApi.exportData(selectedOutlet, {
        type: 'GOODS',
        search: searchQuery || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_stok_produk_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e: any) {
      console.error('Error exporting stock:', e);
      setError(e?.message || 'Gagal mengekspor data stok. Silakan coba lagi.');
    }
  };

  const formatCurrency = useCallback((amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount), []);
  const getStockStatus = useCallback((quantity?: number) => {
    if (!quantity) return 'Habis';
    if (quantity <= 5) return 'Rendah';
    if (quantity <= 20) return 'Sedang';
    return 'Tinggi';
  }, []);
  const getStockStatusColor = useCallback((quantity?: number) => {
    if (!quantity) return 'bg-red-100 text-red-800';
    if (quantity <= 5) return 'bg-yellow-100 text-yellow-800';
    if (quantity <= 20) return 'bg-blue-100 text-blue-800';
    return 'bg-green-100 text-green-800';
  }, []);

  // Derived visible list (GOODS-only already ensured) - further filter by status client-side for safety
  const visibleItems = useMemo(() => items.filter((i: StockItem) => statusFilter === 'ALL' || i.status === statusFilter), [items, statusFilter]);

  return {
    // data
    stockItems: visibleItems,
    outlets,
    selectedOutlet,
    searchQuery,
    statusFilter,
    isLoading,
    error,
    hasBusinessProfile,
    hasOutlet,
    // setters
    setSearchQuery,
    setStatusFilter,
    setError,
    // actions
    fetchStock,
    handleSearchClick,
    handleExport,
    // formatters
    formatCurrency,
    getStockStatus,
    getStockStatusColor,
  };
}
