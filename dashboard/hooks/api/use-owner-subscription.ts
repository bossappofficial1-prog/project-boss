'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  ownerSubscriptionApi,
  type OwnerInvoiceListParams,
  type OwnerInvoiceListResponse,
  type OwnerSubscriptionOverviewResponse,
  type RenewSubscriptionPayload,
  type RenewSubscriptionResponse,
} from '@/lib/apis/owner-subscription';

const OVERVIEW_QUERY_KEY = ['owner-subscription', 'overview'] as const;

const buildInvoiceQueryKey = (params?: OwnerInvoiceListParams) => [
  'owner-subscription',
  'invoices',
  params?.page ?? 1,
  params?.limit ?? 10,
];

export function useOwnerSubscriptionOverview() {
  return useQuery<OwnerSubscriptionOverviewResponse>({
    queryKey: OVERVIEW_QUERY_KEY,
    queryFn: ownerSubscriptionApi.getOverview,
    staleTime: 60_000,
  });
}

export function useOwnerSubscriptionInvoices(params?: OwnerInvoiceListParams) {
  return useQuery<OwnerInvoiceListResponse>({
    queryKey: buildInvoiceQueryKey(params),
    queryFn: () => ownerSubscriptionApi.listInvoices(params),
    staleTime: 30_000,
  });
}

export function useRenewSubscription() {
  const queryClient = useQueryClient();

  return useMutation<RenewSubscriptionResponse, Error, RenewSubscriptionPayload | undefined>({
    mutationFn: (payload) => ownerSubscriptionApi.renew(payload ?? {}),
    onSuccess: async (data) => {
      toast.success(data?.message ?? 'Invoice perpanjangan berhasil dibuat');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: OVERVIEW_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ['owner-subscription', 'invoices'] }),
      ]);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data.message ?? 'Gagal membuat invoice perpanjangan');
    },
  });
}
