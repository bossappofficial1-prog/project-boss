// withdrawal.service.ts
import { apiClient } from '@/lib/apis/base';
import { Withdrawal, WithdrawalStats } from './withdrawal.types';

export const fetchWithdrawals = async (params: Record<string, any>): Promise<{ withdrawals: Withdrawal[]; pagination: any }> => {
    const searchParams = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/withdrawals/admin/all?${searchParams}`);
    return response.data.data;
};

export const fetchWithdrawalStats = async (): Promise<WithdrawalStats> => {
    const response = await apiClient.get('/withdrawals/admin/stats');
    return response.data.data;
};

export const processWithdrawal = async (
    withdrawalId: string,
    action: 'APPROVE' | 'REJECT',
    notes?: string
): Promise<any> => {
    const response = await apiClient.patch(`/withdrawals/${withdrawalId}/process`, {
        action,
        notes,
    });
    return response.data.data;
};

export const bulkProcessWithdrawals = async (
    withdrawalIds: string[],
    action: 'APPROVE' | 'REJECT',
    notes?: string
): Promise<any> => {
    const response = await apiClient.post('/withdrawals/admin/bulk-process', {
        withdrawalIds,
        action,
        notes,
    });
    return response.data.data;
};
