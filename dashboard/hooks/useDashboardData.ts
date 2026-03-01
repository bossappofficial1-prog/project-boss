"use client";

import { useEffect, useMemo, useState } from 'react';
import { authApi, dashboardApi } from '@/lib/api';
import { useSocket } from '@/lib/socket';
import { useOutletContext } from '@/components/providers/OutletProvider';
import type { Business, DashboardStats, OrderStatsMap } from '@/types/dashboard';
import { useQueryClient } from '@tanstack/react-query';

export function useDashboardData(initialDate?: string) {
  const { selectedOutlet, outlets, isLoading: outletLoading } = useOutletContext();
  const query = useQueryClient()

  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalServices: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [orderStats, setOrderStats] = useState<OrderStatsMap>({});
  const [business, setBusiness] = useState<Business | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Initialize socket connection - use selectedOutlet.id if available
  const { isConnected, businessEvents } = useSocket(selectedOutlet?.id || '');
  const latestBusinessEvent = useMemo(() => businessEvents[0] ?? null, [businessEvents]);

  // Monitor outlet changes for debugging
  useEffect(() => {
    console.log(`🔄 useDashboardData: selectedOutlet changed to: ${selectedOutlet?.id || 'null'}`);
  }, [selectedOutlet?.id]);

  const fetchDashboardSummary = async (outletId: string) => {
    try {
      const summary = await dashboardApi.getSummary(outletId);
      setStats({
        totalProducts: summary.totalProducts,
        totalServices: summary.totalServices,
        totalOrders: summary.totalOrders,
        totalRevenue: summary.totalRevenue,
      });
    } catch (e) {
      console.error('Error fetching dashboard summary:', e);
      setStats({ totalProducts: 0, totalServices: 0, totalOrders: 0, totalRevenue: 0 });
    }
  };

  const fetchOrderStats = async (outletId: string) => {
    try {
      const s = await dashboardApi.getOrderStats(outletId, 'week');
      setOrderStats(s);
    } catch (e) {
      console.error('Error fetching order stats:', e);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const userData = await authApi.me();
        setBusiness(userData.business);

        if (selectedOutlet?.id) {
          await Promise.all([
            fetchDashboardSummary(selectedOutlet.id),
            fetchOrderStats(selectedOutlet.id),
          ]);
        }
      } catch (e: any) {
        console.error('Error fetching dashboard data:', e);
        setGlobalError(e?.message || 'Gagal memuat data dashboard');
        if (e?.message?.includes('401') || e?.message?.includes('Unauthorized')) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            window.location.href = '/auth/login';
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, selectedOutlet?.id]); // Re-run when outlet changes

  const refetch = () => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const userData = await authApi.me();
        setBusiness(userData.business);
        query.refetchQueries({ queryKey: ["outlets"] })

        // If selectedOutlet is available, fetch dashboard data for it
        if (selectedOutlet?.id) {
          await Promise.all([
            fetchDashboardSummary(selectedOutlet.id),
            fetchOrderStats(selectedOutlet.id),
          ]);
        }
      } catch (e: any) {
        console.error('Error fetching dashboard data:', e);
        setGlobalError(e?.message || 'Gagal memuat data dashboard');
        if (e?.message?.includes('401') || e?.message?.includes('Unauthorized')) {
          localStorage.removeItem('token');
          // Use Next.js router instead of window.location
          if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  };

  useEffect(() => {
    if (latestBusinessEvent && selectedOutlet?.id) {
      fetchDashboardSummary(selectedOutlet.id);
      fetchOrderStats(selectedOutlet.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestBusinessEvent, selectedOutlet?.id]);

  // No need for custom event listener anymore - OutletProvider handles outlet changes

  return {
    // data
    stats,
    orderStats,
    business,
    outlets,
    selectedOutlet,
    selectedDate,
    isConnected,
    isLoading: isLoading || outletLoading, // Combined loading state
    globalError,
    // setters
    setSelectedDate,
    // actions
    refetch,
  } as const;
}
