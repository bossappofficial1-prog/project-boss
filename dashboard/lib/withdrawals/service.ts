// Service layer for withdrawal API operations
import { apiClient } from '@/lib/apis/base';
import {
    Withdrawal,
    WithdrawalStats,
    WithdrawalFilters,
    WithdrawalListResponse,
    ProcessWithdrawalRequest,
    BulkProcessWithdrawalRequest,
    BulkProcessWithdrawalResponse,
    ApiResponse
} from './types';

export class WithdrawalService {
    private static readonly BASE_URL = '/withdrawals';

    /**
     * Fetch all withdrawals with pagination and filters
     */
    static async getAllWithdrawals(
        page: number = 1,
        limit: number = 20,
        filters?: WithdrawalFilters
    ): Promise<WithdrawalListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
            ...(filters?.status && { status: filters.status }),
            ...(filters?.businessId && { businessId: filters.businessId }),
            ...(filters?.startDate && { startDate: filters.startDate }),
            ...(filters?.endDate && { endDate: filters.endDate }),
        });

        const response = await apiClient.get(`${this.BASE_URL}/admin/all?${params}`);
        return response.data;
    }

    /**
     * Fetch withdrawal statistics
     */
    static async getWithdrawalStats(
        startDate?: string,
        endDate?: string
    ): Promise<WithdrawalStats> {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const query = params.toString();
        const url = query
            ? `${this.BASE_URL}/admin/stats?${query}`
            : `${this.BASE_URL}/admin/stats`;

        try {
            const response = await apiClient.get(url);
            return response.data.data;
        } catch (error) {
            console.error('getWithdrawalStats - error:', error);
            throw error;
        }
    }

    /**
     * Process individual withdrawal (approve/reject)
     */
    static async processWithdrawal(
        withdrawalId: string,
        request: ProcessWithdrawalRequest
    ): Promise<Withdrawal> {
        const response = await apiClient.patch(
            `${this.BASE_URL}/${withdrawalId}/process`,
            request
        );
        return response.data;
    }

    /**
     * Bulk process multiple withdrawals
     */
    static async bulkProcessWithdrawals(
        request: BulkProcessWithdrawalRequest
    ): Promise<BulkProcessWithdrawalResponse> {
        const response = await apiClient.post(
            `${this.BASE_URL}/admin/bulk-process`,
            request
        );
        return response.data;
    }

    /**
     * Get withdrawal details by ID
     */
    static async getWithdrawalById(withdrawalId: string): Promise<Withdrawal> {
        const response = await apiClient.get(`${this.BASE_URL}/${withdrawalId}`);
        return response.data;
    }

    /**
     * Get withdrawal history for a business
     */
    static async getBusinessWithdrawalHistory(
        businessId: string,
        page: number = 1,
        limit: number = 10
    ): Promise<WithdrawalListResponse> {
        const params = new URLSearchParams({
            page: page.toString(),
            limit: limit.toString(),
        });

        const response = await apiClient.get(
            `${this.BASE_URL}/business/${businessId}/history?${params}`
        );
        return response.data;
    }

    /**
     * Export withdrawals data
     */
    static async exportWithdrawals(
        filters?: WithdrawalFilters,
        format: 'csv' | 'excel' = 'csv'
    ): Promise<Blob> {
        const params = new URLSearchParams({
            format,
            ...(filters?.status && { status: filters.status }),
            ...(filters?.businessId && { businessId: filters.businessId }),
            ...(filters?.startDate && { startDate: filters.startDate }),
            ...(filters?.endDate && { endDate: filters.endDate }),
        });

        const response = await apiClient.get(
            `${this.BASE_URL}/admin/export?${params}`,
            { responseType: 'blob' }
        );

        return response.data;
    }
}

// Utility functions for withdrawal operations
export const withdrawalUtils = {
    /**
     * Calculate total amount from withdrawal list
     */
    calculateTotalAmount(withdrawals: Withdrawal[]): number {
        return withdrawals.reduce((total, withdrawal) => {
            return total + (withdrawal.finalAmount || withdrawal.requestedAmount);
        }, 0);
    },

    /**
     * Filter withdrawals by status
     */
    filterByStatus(withdrawals: Withdrawal[], status: Withdrawal['status']): Withdrawal[] {
        return withdrawals.filter(withdrawal => withdrawal.status === status);
    },

    /**
     * Get pending withdrawals count
     */
    getPendingCount(withdrawals: Withdrawal[]): number {
        return this.filterByStatus(withdrawals, 'PENDING').length;
    },

    /**
     * Check if withdrawal can be processed
     */
    canProcess(withdrawal: Withdrawal): boolean {
        return withdrawal.status === 'PENDING';
    },

    /**
     * Format withdrawal amount for display
     */
    formatAmount(amount: number): string {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
        }).format(amount);
    },

    /**
     * Get status color for UI
     */
    getStatusColor(status: Withdrawal['status']): string {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'PROCESSING':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            case 'COMPLETED':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
    },

    /**
     * Validate bulk process request
     */
    validateBulkRequest(request: BulkProcessWithdrawalRequest): {
        isValid: boolean;
        errors: string[];
    } {
        const errors: string[] = [];

        if (!request.withdrawalIds || request.withdrawalIds.length === 0) {
            errors.push('At least one withdrawal must be selected');
        }

        if (!request.action || !['APPROVE', 'REJECT'].includes(request.action)) {
            errors.push('Invalid action. Must be APPROVE or REJECT');
        }

        return {
            isValid: errors.length === 0,
            errors,
        };
    },
};