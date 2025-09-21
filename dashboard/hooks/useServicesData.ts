"use client";

import { useCallback, useEffect, useState } from 'react';
import { authApi, productApi } from '@/lib/api';

export interface ServiceItem {
  id: string;
  name: string;
  description?: string;
  costPrice: number;
  price: number;
  type: 'GOODS' | 'SERVICE';
  status: 'ACTIVE' | 'INACTIVE';
  serviceDurationMinutes?: number;
  image?: string;
}

export interface OutletItem {
  id: string;
  name: string;
  address?: string;
}

export function useServicesData() {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [outlets, setOutlets] = useState<OutletItem[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasBusinessProfile, setHasBusinessProfile] = useState<boolean>(false);
  const [hasOutlet, setHasOutlet] = useState<boolean>(false);

  useEffect(() => {
    const initializeData = async () => {
      try {
        const userData = await authApi.me();
        setOutlets(userData.outlets);
        const hasBusiness = !!userData.business?.id;
        const hasBank = !!(userData.business?.bankName && userData.business?.accountNumber);
        setHasBusinessProfile(hasBusiness && hasBank);
        setHasOutlet(userData.outlets.length > 0);
        if (userData.outlets.length === 0) setIsLoading(false);
        if (userData.outlets.length > 0) {
          const savedOutletId = typeof window !== 'undefined' ? localStorage.getItem('selectedOutlet') : null;
          const validSaved = savedOutletId && userData.outlets.find((o: OutletItem) => o.id === savedOutletId);
          if (validSaved && savedOutletId) setSelectedOutlet(savedOutletId);
          else {
            const firstOutletId = userData.outlets[0].id;
            setSelectedOutlet(firstOutletId);
            if (!savedOutletId) localStorage.setItem('selectedOutlet', firstOutletId);
          }
        }
      } catch (e) {
        setError('Error mengambil data user. Silakan coba lagi.');
        console.error('Error fetching user data:', e);
      }
    };
    initializeData();
  }, []);

  useEffect(() => {
    const handleOutletChange = (event: any) => {
      setSelectedOutlet(event.detail.outletId);
    };
    window.addEventListener('outletChanged', handleOutletChange as EventListener);
    return () => window.removeEventListener('outletChanged', handleOutletChange as EventListener);
  }, []);

  const fetchServices = useCallback(async () => {
    if (!selectedOutlet) return;
    try {
      setIsLoading(true);
      const data: any = await productApi.getByOutlet(selectedOutlet, {
        search: searchQuery || undefined,
      });
      const list: ServiceItem[] = Array.isArray(data)
        ? (data as ServiceItem[])
        : (Array.isArray(data?.products) ? data.products : []);
      const onlyServices = list.filter((item: any) => item.type === 'SERVICE');
      setServices(onlyServices);
    } catch (e) {
      setError('Error mengambil data jasa. Silakan coba lagi.');
      console.error('Error fetching services:', e);
      setServices([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedOutlet, searchQuery]);

  useEffect(() => {
    if (selectedOutlet) fetchServices();
  }, [selectedOutlet, searchQuery, statusFilter, fetchServices]);

  const handleSearchClick = () => fetchServices();

  const handleExportServices = async () => {
    if (!selectedOutlet) return;
    try {
      const blob = await productApi.exportData(selectedOutlet, {
        type: 'SERVICE',
        search: searchQuery || undefined,
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `data_jasa_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      setError('Gagal mengekspor data jasa. Silakan coba lagi.');
      console.error('Error exporting services:', e);
    }
  };

  const formatCurrency = (amount: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
  const formatDuration = (minutes?: number) => {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}j ${mins}m` : `${mins}m`;
  };

  // Derived client-side filtered list by status
  const visibleServices = services.filter((s) => statusFilter === 'ALL' || s.status === statusFilter);

  return {
    services: visibleServices,
    outlets,
    selectedOutlet,
    searchQuery,
    statusFilter,
    isLoading,
    error,
    hasBusinessProfile,
    hasOutlet,
    setSearchQuery,
    setStatusFilter,
    setError,
    fetchServices,
    handleSearchClick,
    handleExportServices,
    formatCurrency,
    formatDuration,
  };
}
