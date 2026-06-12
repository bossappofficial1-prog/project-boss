import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { toast } from 'sonner';

// Types
export interface DashboardAnalytics {
  snapshot: {
    totalBusinesses: number;
    activeBusinesses: number;
    totalUsers: number;
    totalRevenue: number;
    mrr: number;
    arr: number;
  };
  churnRate: {
    monthly: number;
    quarterly: number;
    trend: Array<{ month: string; rate: number }>;
  };
  ltv: {
    average: number;
    byPlan: Array<{ plan: string; ltv: number }>;
    trend: Array<{ month: string; ltv: number }>;
  };
  cohortRetention: Array<{
    cohort: string;
    size: number;
    retention: number[];
  }>;
  mrrGrowth: {
    current: number;
    previous: number;
    growthRate: number;
    expansion: number;
    contraction: number;
    net: number;
    trend: Array<{ month: string; mrr: number }>;
  };
  arpu: {
    current: number;
    byPlan: Array<{ plan: string; arpu: number }>;
    trend: Array<{ month: string; arpu: number }>;
  };
  netRevenueRetention: {
    current: number;
    trend: Array<{ month: string; nrr: number }>;
  };
}

// Hooks
export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'analytics'],
    queryFn: async () => {
      const { data } = await api.get('/admin/dashboard/analytics');
      return data.data as DashboardAnalytics;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useClearAnalyticsCache() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await api.post('/admin/dashboard/analytics/clear-cache');
      return data;
    },
    onSuccess: () => {
      toast.success('Cache berhasil dihapus');
      queryClient.invalidateQueries({ queryKey: ['admin', 'dashboard', 'analytics'] });
    },
    onError: (error: any) => {
      toast.error('Gagal menghapus cache');
    },
  });
}
