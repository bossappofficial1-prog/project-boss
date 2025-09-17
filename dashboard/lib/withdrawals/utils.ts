// Utility functions for withdrawal management
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils';
import { Withdrawal, WithdrawalStatus } from './types';

/**
 * Format withdrawal amount for display
 */
export function formatWithdrawalAmount(amount: number): string {
    return formatCurrency(amount);
}

/**
 * Format withdrawal date for display
 */
export function formatWithdrawalDate(dateString: string): string {
    return formatDateTime(dateString);
}

/**
 * Get status badge variant based on withdrawal status
 */
export const getStatusBadgeColor = (status: string): string => {
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
};

export const formatDateForInput = (date: string | Date): string => {
    const d = new Date(date);
    return d.toISOString().split('T')[0];
};

export const canProcess = (withdrawal: any): boolean => {
    return withdrawal.status === 'PENDING';
};

// Re-export date utilities
export { formatDate, formatDateTime };

/**
 * Get status badge variant based on withdrawal status
 */
export function getStatusBadgeVariant(status: WithdrawalStatus): { className: string } {
    switch (status) {
        case 'PENDING':
            return { className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' };
        case 'PROCESSING':
            return { className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' };
        case 'COMPLETED':
            return { className: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' };
        case 'REJECTED':
            return { className: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' };
        default:
            return { className: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300' };
    }
}

/**
 * Get status display text
 */
export function getStatusDisplayText(status: WithdrawalStatus): string {
    switch (status) {
        case 'PENDING':
            return 'Pending';
        case 'PROCESSING':
            return 'Processing';
        case 'COMPLETED':
            return 'Completed';
        case 'REJECTED':
            return 'Rejected';
        default:
            return status;
    }
}
export function canProcessWithdrawal(withdrawal: Withdrawal): boolean {
    return withdrawal.status === 'PENDING';
}

/**
 * Get withdrawal action button text
 */
export function getActionButtonText(action: 'APPROVE' | 'REJECT'): string {
    return action === 'APPROVE' ? 'Approve' : 'Reject';
}

/**
 * Get confirmation dialog title
 */
export function getConfirmationDialogTitle(
    action: 'APPROVE' | 'REJECT',
    isBulk: boolean = false
): string {
    const actionText = action === 'APPROVE' ? 'Approve' : 'Reject';
    const targetText = isBulk ? 'Withdrawals' : 'Withdrawal';
    return `${actionText} ${targetText}`;
}

/**
 * Get confirmation dialog description
 */
export function getConfirmationDialogDescription(
    action: 'APPROVE' | 'REJECT',
    count: number = 1
): string {
    const actionText = action === 'APPROVE' ? 'approve' : 'reject';
    const targetText = count === 1 ? 'this withdrawal' : `${count} withdrawal${count > 1 ? 's' : ''}`;

    return `Are you sure you want to ${actionText} ${targetText}? This action cannot be undone.`;
}

/**
 * Calculate withdrawal statistics
 */
export function calculateWithdrawalStats(withdrawals: Withdrawal[]) {
    const stats = {
        total: withdrawals.length,
        pending: 0,
        processing: 0,
        completed: 0,
        rejected: 0,
        totalAmount: 0,
        pendingAmount: 0,
        completedAmount: 0,
    };

    withdrawals.forEach(withdrawal => {
        stats.totalAmount += withdrawal.requestedAmount;

        switch (withdrawal.status) {
            case 'PENDING':
                stats.pending++;
                stats.pendingAmount += withdrawal.requestedAmount;
                break;
            case 'PROCESSING':
                stats.processing++;
                break;
            case 'COMPLETED':
                stats.completed++;
                stats.completedAmount += withdrawal.finalAmount || withdrawal.requestedAmount;
                break;
            case 'REJECTED':
                stats.rejected++;
                break;
        }
    });

    return stats;
}

/**
 * Filter withdrawals by search term
 */
export function filterWithdrawalsBySearch(
    withdrawals: Withdrawal[],
    searchTerm: string
): Withdrawal[] {
    if (!searchTerm.trim()) return withdrawals;

    const term = searchTerm.toLowerCase();
    return withdrawals.filter(withdrawal =>
        withdrawal.business.name.toLowerCase().includes(term) ||
        withdrawal.business.owner.name.toLowerCase().includes(term) ||
        withdrawal.business.owner.email.toLowerCase().includes(term) ||
        withdrawal.id.toLowerCase().includes(term)
    );
}

/**
 * Sort withdrawals by field
 */
export function sortWithdrawals(
    withdrawals: Withdrawal[],
    field: keyof Withdrawal,
    direction: 'asc' | 'desc' = 'desc'
): Withdrawal[] {
    return [...withdrawals].sort((a, b) => {
        let aValue: any = a[field];
        let bValue: any = b[field];

        // Handle nested fields
        if (field === 'business') {
            aValue = a.business.name;
            bValue = b.business.name;
        }

        // Handle date fields
        if (typeof aValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(aValue)) {
            aValue = new Date(aValue).getTime();
            bValue = new Date(bValue).getTime();
        }

        // Handle numeric fields
        if (typeof aValue === 'number' && typeof bValue === 'number') {
            return direction === 'asc' ? aValue - bValue : bValue - aValue;
        }

        // Handle string fields
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue);
            return direction === 'asc' ? comparison : -comparison;
        }

        return 0;
    });
}

/**
 * Validate withdrawal process request
 */
export function validateProcessRequest(
    action: 'APPROVE' | 'REJECT',
    notes?: string
): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!action || !['APPROVE', 'REJECT'].includes(action)) {
        errors.push('Invalid action. Must be APPROVE or REJECT.');
    }

    if (notes && notes.length > 1000) {
        errors.push('Notes cannot exceed 1000 characters.');
    }

    return {
        isValid: errors.length === 0,
        errors,
    };
}

/**
 * Generate withdrawal export filename
 */
export function generateExportFilename(
    filters?: { status?: string; startDate?: string; endDate?: string },
    format: 'csv' | 'excel' = 'csv'
): string {
    const timestamp = new Date().toISOString().split('T')[0];
    const status = filters?.status ? `_${filters.status.toLowerCase()}` : '';
    const dateRange = filters?.startDate && filters?.endDate
        ? `_${filters.startDate}_to_${filters.endDate}`
        : '';

    return `withdrawals${status}${dateRange}_${timestamp}.${format}`;
}

/**
 * Get withdrawal priority level
 */
export function getWithdrawalPriority(withdrawal: Withdrawal): 'high' | 'medium' | 'low' {
    const amount = withdrawal.requestedAmount;
    const daysSinceRequest = Math.floor(
        (Date.now() - new Date(withdrawal.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (amount > 10000000 || daysSinceRequest > 7) return 'high';
    if (amount > 1000000 || daysSinceRequest > 3) return 'medium';
    return 'low';
}

/**
 * Get priority color for UI
 */
export function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
    switch (priority) {
        case 'high':
            return 'text-red-600 dark:text-red-400';
        case 'medium':
            return 'text-yellow-600 dark:text-yellow-400';
        case 'low':
            return 'text-green-600 dark:text-green-400';
        default:
            return 'text-gray-600 dark:text-gray-400';
    }
}