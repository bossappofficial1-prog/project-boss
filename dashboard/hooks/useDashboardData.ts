"use client";

import { useEffect, useMemo, useState } from 'react';
import { authApi, dashboardApi } from '@/lib/api';
import { useSocket } from '@/lib/socket';
import type { Business, DashboardStats, OrderStatsMap, Outlet } from '@/types/dashboard';

export function useDashboardData(initialDate?: string) {
  const [stats, setStats] = useState<DashboardStats>({
    totalProducts: 0,
    totalServices: 0,
    totalOrders: 0,
    totalRevenue: 0,
  });
  const [orderStats, setOrderStats] = useState<OrderStatsMap>({});
  const [business, setBusiness] = useState<Business | null>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [selectedOutlet, setSelectedOutlet] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(
    initialDate || new Date().toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(true);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Initialize socket connection
  const { isConnected, businessEvents } = useSocket(selectedOutlet);

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
        setOutlets(userData.outlets);

        // Use the same logic as Sidebar for default outlet selection
        let currentOutlet = '';

          if (userData.outlets && userData.outlets.length > 0) {
            // Check if there's a previously selected outlet in localStorage
            const savedOutletId = typeof window !== 'undefined' ? localStorage.getItem('selectedOutlet') : null;
            const validOutlet = userData.outlets.find((outlet: Outlet) => outlet.id === savedOutletId);

            if (validOutlet && savedOutletId) {
              currentOutlet = savedOutletId;
            } else {
              // Default to first outlet
              currentOutlet = userData.outlets[0].id;
              if (typeof window !== 'undefined') {
                localStorage.setItem('selectedOutlet', currentOutlet);
              }
            }
          }

        if (currentOutlet && currentOutlet !== selectedOutlet) {
          setSelectedOutlet(currentOutlet);
        }

        if (currentOutlet) {
          await Promise.all([
            fetchDashboardSummary(currentOutlet),
            fetchOrderStats(currentOutlet),
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
  }, [selectedDate]);

  const refetch = () => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const userData = await authApi.me();
        setBusiness(userData.business);
        setOutlets(userData.outlets);

        // Use the same logic as Sidebar for default outlet selection
        let currentOutlet = '';

        if (userData.outlets && userData.outlets.length > 0) {
          // Check if there's a previously selected outlet in localStorage
          const savedOutletId = typeof window !== 'undefined' ? localStorage.getItem('selectedOutlet') : null;
          const validOutlet = userData.outlets.find((outlet: Outlet) => outlet.id === savedOutletId);

          if (validOutlet && savedOutletId) {
            currentOutlet = savedOutletId;
          } else {
            // Default to first outlet
            currentOutlet = userData.outlets[0].id;
            if (typeof window !== 'undefined') {
              localStorage.setItem('selectedOutlet', currentOutlet);
            }
          }
        }

        if (currentOutlet && currentOutlet !== selectedOutlet) {
          setSelectedOutlet(currentOutlet);
        }

        if (currentOutlet) {
          await Promise.all([
            fetchDashboardSummary(currentOutlet),
            fetchOrderStats(currentOutlet),
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
    if (businessEvents.length > 0 && selectedOutlet) {
      fetchDashboardSummary(selectedOutlet);
      fetchOrderStats(selectedOutlet);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessEvents, selectedOutlet]);

  useEffect(() => {
    const handleOutletChange = (event: CustomEvent) => {
      const newOutletId = (event as any).detail.outletId as string;
      setSelectedOutlet(newOutletId);
      if (newOutletId) {
        fetchDashboardSummary(newOutletId);
        fetchOrderStats(newOutletId);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('outletChanged', handleOutletChange as EventListener);
      return () => {
        window.removeEventListener('outletChanged', handleOutletChange as EventListener);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    // data
    stats,
    orderStats,
    business,
    outlets,
    selectedOutlet,
    selectedDate,
    isConnected,
    isLoading,
    globalError,
    // setters
    setSelectedDate,
    setSelectedOutlet,
    // actions
    refetch,
  } as const;
}
