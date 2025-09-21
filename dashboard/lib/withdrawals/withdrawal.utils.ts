// withdrawal.utils.ts

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

export const formatWithdrawalAmount = (amount: number): string => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(amount);
};
