"use client";

import { useCallback, useEffect, useState } from 'react';
import { authApi, productApi } from '@/lib/api';
import { useOutletContext } from '@/components/providers/OutletProvider';

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
  const { selectedOutletId, outlets: contextOutlets, isLoading: contextLoading } = useOutletContext();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalServices, setTotalServices] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
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
        setError('Error mengambil data user. Silakan coba lagi.');
        console.error('Error fetching user data:', e);
      }
    };
    initializeData();
  }, []);

  const fetchServices = useCallback(async () => {
    if (!selectedOutletId) return;
    try {
      setIsFetching(true);
      const data = await productApi.getByOutlet(selectedOutletId, {
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery || undefined,
        type: 'SERVICE',
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });

      const list = data.data as unknown as ServiceItem[];
      const onlyServices = list.filter((item: ServiceItem) => item.type === 'SERVICE');
      setServices(onlyServices);
      setTotalServices(data.pagination?.total ?? onlyServices.length);
      setTotalPages(data.pagination?.totalPages ?? 1);
    } catch (e) {
      setError('Error mengambil data jasa. Silakan coba lagi.');
      console.error('Error fetching services:', e);
      setServices([]);
    } finally {
      setIsFetching(false);
      setIsLoading(false);
    }
  }, [selectedOutletId, currentPage, itemsPerPage, searchQuery, statusFilter]);

  useEffect(() => {
    if (selectedOutletId && !contextLoading) fetchServices();
  }, [selectedOutletId, currentPage, itemsPerPage, searchQuery, statusFilter, fetchServices, contextLoading]);

  const handleSearchClick = () => fetchServices();

  const handlePaginationChange = ({ page, limit }: { page: number; limit: number }) => {
    setCurrentPage(page);
    setItemsPerPage(limit);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery((prev) => {
      if (prev !== value) {
        setCurrentPage(1);
      }
      return value;
    });
  };

  const handleStatusChange = (value: 'ALL' | 'ACTIVE' | 'INACTIVE') => {
    setStatusFilter(value);
    setCurrentPage(1);
  };

  const handleExportServices = async () => {
    if (!selectedOutletId) return;
    try {
      const blob = await productApi.exportData(selectedOutletId, {
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

  return {
    services,
    outlets: contextOutlets,
    selectedOutlet: selectedOutletId,
    searchQuery,
    statusFilter,
    currentPage,
    itemsPerPage,
    totalServices,
    totalPages,
    isLoading,
    isFetching,
    error,
    hasBusinessProfile,
    hasOutlet,
    setSearchQuery: handleSearchChange,
    setStatusFilter: handleStatusChange,
    setError,
    setCurrentPage,
    setItemsPerPage,
    fetchServices,
    handlePaginationChange,
    handleSearchClick,
    handleExportServices,
    formatCurrency,
    formatDuration
  };
}
