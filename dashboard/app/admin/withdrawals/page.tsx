'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

// Import modular withdrawal components and utilities
import {
    WithdrawalStatsCards,
    WithdrawalFiltersComponent,
    WithdrawalTable,
    WithdrawalDetailsDialog,
    WithdrawalBulkActions,
    WithdrawalPagination
} from '@/components/withdrawals';
import { Withdrawal, WithdrawalFilters, WithdrawalStats } from '@/lib/withdrawals/types';
import { useWithdrawals, useProcessWithdrawal, useBulkProcessWithdrawals } from '@/lib/withdrawals/hooks';

export default function AdminWithdrawalsPage() {
    const [selectedWithdrawals, setSelectedWithdrawals] = useState<string[]>([]);
    const [detailsDialog, setDetailsDialog] = useState<{
        open: boolean;
        withdrawal: Withdrawal | null;
    }>({ open: false, withdrawal: null });

    // Use modular hooks
    const {
        withdrawals,
        stats,
        filters,
        pagination,
        isLoading,
        setFilters,
        refetch
    } = useWithdrawals();

    const { processWithdrawal, isProcessing } = useProcessWithdrawal();
    const { bulkProcessWithdrawals, isBulkProcessing } = useBulkProcessWithdrawals();

    const handleViewDetails = (withdrawal: Withdrawal) => {
        setDetailsDialog({ open: true, withdrawal });
    };

    const handleProcessWithdrawal = async (withdrawal: Withdrawal, action: 'approve' | 'reject') => {
        try {
            await processWithdrawal({
                withdrawalId: withdrawal.id,
                action,
            });
            setDetailsDialog({ open: false, withdrawal: null });
        } catch (error) {
            // Error is handled by the hook
        }
    };

    const handleBulkProcess = async (action: 'approve' | 'reject') => {
        if (selectedWithdrawals.length === 0) {
            toast.error('Please select withdrawals to process');
            return;
        }

        try {
            await bulkProcessWithdrawals({
                withdrawalIds: selectedWithdrawals,
                action,
            });
            setSelectedWithdrawals([]);
        } catch (error) {
            // Error is handled by the hook
        }
    };

    const handleFiltersChange = (newFilters: WithdrawalFilters) => {
        setFilters(newFilters);
    };

    const handleSelectionChange = (selectedIds: string[]) => {
        setSelectedWithdrawals(selectedIds);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Withdrawal Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage and process business withdrawal requests
                    </p>
                </div>
                <Button
                    variant="outline"
                    onClick={() => refetch()}
                    disabled={isLoading}
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                </Button>
            </div>

            {/* Statistics Cards */}
            <WithdrawalStatsCards stats={stats || null} isLoading={isLoading} />

            {/* Filters */}
            <WithdrawalFiltersComponent
                filters={filters}
                onFiltersChange={handleFiltersChange}
                isLoading={isLoading}
            />

            {/* Bulk Actions */}
            {selectedWithdrawals.length > 0 && (
                <WithdrawalBulkActions
                    selectedCount={selectedWithdrawals.length}
                    onBulkApprove={() => handleBulkProcess('approve')}
                    onBulkReject={() => handleBulkProcess('reject')}
                    onClearSelection={() => setSelectedWithdrawals([])}
                    isProcessing={isBulkProcessing}
                />
            )}

            {/* Withdrawals Table */}
            <WithdrawalTable
                withdrawals={withdrawals}
                selectedWithdrawals={selectedWithdrawals}
                onSelectionChange={handleSelectionChange}
                onViewDetails={handleViewDetails}
                onProcessWithdrawal={handleProcessWithdrawal}
                isLoading={isLoading}
            />

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <WithdrawalPagination
                    currentPage={pagination.page}
                    totalPages={pagination.totalPages}
                    totalItems={pagination.total}
                    pageSize={pagination.limit}
                    onPageChange={(page) => setFilters({ ...filters, page })}
                    onPageSizeChange={(pageSize) => setFilters({ ...filters, limit: pageSize })}
                    isLoading={isLoading}
                />
            )}

            {/* Details Dialog */}
            <WithdrawalDetailsDialog
                withdrawal={detailsDialog.withdrawal}
                isOpen={detailsDialog.open}
                onClose={() => setDetailsDialog({ open: false, withdrawal: null })}
                onProcess={(action, notes) => {
                    if (detailsDialog.withdrawal) {
                        handleProcessWithdrawal(detailsDialog.withdrawal, action);
                    }
                }}
                isProcessing={isProcessing}
            />
        </div>
    );
}