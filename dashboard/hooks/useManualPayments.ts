"use client";

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import {
  manualPaymentApi,
  type ManualPaymentListParams,
  type ManualPaymentListResponse,
  type ManualPaymentStatus,
  type ManualPaymentTransaction
} from '@/lib/apis/manual-payment';
import { useOutletContext } from '@/components/providers/OutletProvider';

export type ManualPaymentStatusFilter =
  | 'all'
  | 'pending'
  | 'awaiting'
  | 'approved'
  | 'rejected'
  | 'expired';

const STATUS_PRESETS: Record<Exclude<ManualPaymentStatusFilter, 'all'>, ManualPaymentStatus[]> = {
  pending: ['PENDING'],
  awaiting: ['PROOF_SUBMITTED', 'AWAITING_VERIFICATION'],
  approved: ['SUCCESS'],
  rejected: ['REJECTED_MANUAL'],
  expired: ['EXPIRED']
};

export interface ManualPaymentsState {
  items: ManualPaymentTransaction[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
  limit: number;
  statusFilter: ManualPaymentStatusFilter;
  setStatusFilter: (filter: ManualPaymentStatusFilter) => void;
  outletFilter: string | 'all';
  setOutletFilter: (outletId: string | 'all') => void;
  search: string;
  setSearch: (value: string) => void;
  setPage: (page: number) => void;
  refetch: () => Promise<void>;
  verifyPayment: (orderId: string) => Promise<void>;
  rejectPayment: (orderId: string, reason: string) => Promise<void>;
  isProcessing: (orderId: string) => boolean;
  setLimit: (limit: number) => void;
}

export function useManualPayments(): ManualPaymentsState {
  const { selectedOutletId, outlets } = useOutletContext();

  const [items, setItems] = useState<ManualPaymentTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<ManualPaymentStatusFilter>('awaiting');
  const [search, setSearch] = useState('');
  const [outletFilter, internalSetOutletFilter] = useState<string | 'all'>(() => selectedOutletId ?? 'all');
  const [manualOutletSelection, setManualOutletSelection] = useState(false);
  const [processingMap, setProcessingMap] = useState<Record<string, 'verify' | 'reject'>>({});

  // Keep outlet filter in sync with context unless user already changed it manually
  useEffect(() => {
    if (!manualOutletSelection && selectedOutletId) {
      internalSetOutletFilter(selectedOutletId);
    }
  }, [selectedOutletId, manualOutletSelection]);

  // Ensure outlet filter remains valid if outlet list changes
  useEffect(() => {
    if (outletFilter === 'all') return;
    const exists = outlets.some(outlet => outlet.id === outletFilter);
    if (!exists) {
      internalSetOutletFilter(selectedOutletId ?? 'all');
      setManualOutletSelection(false);
    }
  }, [outletFilter, outlets, selectedOutletId]);

  const buildParams = useCallback((): ManualPaymentListParams => {
    const params: ManualPaymentListParams = {
      page,
      limit
    };

    if (statusFilter !== 'all') {
      params.status = STATUS_PRESETS[statusFilter];
    }

    const trimmedSearch = search.trim();
    if (trimmedSearch) {
      params.search = trimmedSearch;
    }

    if (outletFilter !== 'all') {
      params.outletId = outletFilter;
    }

    return params;
  }, [statusFilter, search, outletFilter, page, limit]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = buildParams();
      const result: ManualPaymentListResponse = await manualPaymentApi.list(params);
      setItems(result.data || []);
      setTotal(result.total || 0);
      setTotalPages(result.totalPages || 1);
    } catch (err) {
      console.error('Failed to fetch manual payments:', err);
      const message = err instanceof Error ? err.message : 'Gagal memuat pembayaran manual';
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [buildParams]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const setOutletFilter = useCallback((value: string | 'all') => {
    internalSetOutletFilter(value);
    setManualOutletSelection(true);
    setPage(1);
  }, []);

  const handleSetStatusFilter = useCallback((value: ManualPaymentStatusFilter) => {
    setStatusFilter(value);
    setPage(1);
  }, []);

  const handleSetSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const refetch = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const handleSetLimit = useCallback((value: number) => {
    setLimit(value);
    setPage(1);
  }, []);

  const markProcessing = useCallback((orderId: string, action: 'verify' | 'reject' | null) => {
    setProcessingMap(prev => {
      const next = { ...prev };
      if (action) {
        next[orderId] = action;
      } else {
        delete next[orderId];
      }
      return next;
    });
  }, []);

  const verifyPayment = useCallback(async (orderId: string) => {
    markProcessing(orderId, 'verify');
    try {
      await manualPaymentApi.verify(orderId);
      toast.success('Pembayaran manual berhasil diverifikasi.');
      await fetchData();
    } catch (err) {
      console.error('Failed to verify manual payment:', err);
      const message = err instanceof Error ? err.message : 'Gagal memverifikasi pembayaran manual.';
      toast.error(message);
    } finally {
      markProcessing(orderId, null);
    }
  }, [fetchData, markProcessing]);

  const rejectPayment = useCallback(async (orderId: string, reason: string) => {
    markProcessing(orderId, 'reject');
    try {
      await manualPaymentApi.reject(orderId, reason);
      toast.warning('Pembayaran manual ditolak.');
      await fetchData();
    } catch (err) {
      console.error('Failed to reject manual payment:', err);
      const message = err instanceof Error ? err.message : 'Gagal menolak pembayaran manual.';
      toast.error(message);
    } finally {
      markProcessing(orderId, null);
    }
  }, [fetchData, markProcessing]);

  const isProcessing = useCallback((orderId: string) => {
    return Boolean(processingMap[orderId]);
  }, [processingMap]);

  return useMemo(() => ({
    items,
    loading,
    error,
    page,
    totalPages,
    total,
    limit,
    statusFilter,
    setStatusFilter: handleSetStatusFilter,
    outletFilter,
    setOutletFilter,
    search,
    setSearch: handleSetSearch,
    setPage,
    refetch,
    verifyPayment,
    rejectPayment,
    isProcessing,
    setLimit: handleSetLimit
  }), [
    items,
    loading,
    error,
    page,
    totalPages,
    total,
    limit,
    statusFilter,
    handleSetStatusFilter,
    outletFilter,
    setOutletFilter,
    search,
    handleSetSearch,
    refetch,
    verifyPayment,
    rejectPayment,
    isProcessing,
    handleSetLimit
  ]);
}
