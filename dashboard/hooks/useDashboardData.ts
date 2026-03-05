"use client";

import { useState } from 'react';
import { authApi, dashboardApi } from '@/lib/api';
import { useOutletContext } from '@/components/providers/OutletProvider';
import type { Business, DashboardStats, OrderStatsMap } from '@/types/dashboard';
import { useQuery, useQueryClient } from '@tanstack/react-query';

const STALE_TIME = 5 * 60 * 1000; // 5 menit

export function useDashboardData(initialDate?: string) {
  const { selectedOutlet, outlets, isLoading: outletLoading } = useOutletContext();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );

  const {
    data: userData,
    isLoading: userLoading,
    error: userError,
    refetch: refetchUser,
  } = useQuery({
    queryKey: ['dashboard-user'],
    queryFn: () => authApi.me(),
    staleTime: STALE_TIME,
  });

  const {
    data: summaryData,
    isLoading: summaryLoading,
    refetch: refetchSummary,
  } = useQuery({
    queryKey: ['dashboard-summary', selectedOutlet?.id],
    queryFn: () => dashboardApi.getSummary(selectedOutlet!.id),
    enabled: !!selectedOutlet?.id,
    staleTime: STALE_TIME,
  });

  const {
    data: orderStatsData,
    isLoading: orderStatsLoading,
    refetch: refetchOrderStats,
  } = useQuery({
    queryKey: ['dashboard-order-stats', selectedOutlet?.id, selectedDate],
    queryFn: () => dashboardApi.getOrderStats(selectedOutlet!.id, 'week'),
    enabled: !!selectedOutlet?.id,
    staleTime: STALE_TIME,
  });

  const business: Business | null = userData?.business ?? null;

  const stats: DashboardStats = summaryData ?? {
    totalProducts: 0,
    totalServices: 0,
    totalOrders: 0,
    totalRevenue: 0,
  };

  const orderStats: OrderStatsMap = orderStatsData ?? {};

  const globalError = userError ? (userError as any)?.message || 'Gagal memuat data dashboard' : null;

  const isLoading = outletLoading || userLoading || summaryLoading || orderStatsLoading;

  const refetch = () => {
    refetchUser();
    refetchSummary();
    refetchOrderStats();
    queryClient.invalidateQueries({ queryKey: ['outlets'] });
  };

  return {
    stats,
    orderStats,
    business,
    outlets,
    selectedOutlet,
    selectedDate,
    isLoading,
    globalError,
    setSelectedDate,
    refetch,
  } as const;
}

