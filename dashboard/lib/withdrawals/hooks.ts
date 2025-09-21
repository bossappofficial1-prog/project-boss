// Custom hooks for withdrawal management
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    WithdrawalService,
    withdrawalUtils
} from './service';
import { BulkProcessWithdrawalRequest, ProcessWithdrawalRequest, WithdrawalFilters, Withdrawal } from './types';

export interface UseWithdrawalsOptions {
    page?: number;
    limit?: number;
    filters?: WithdrawalFilters;
    enabled?: boolean;
}

/**
 * Comprehensive hook for withdrawal management page
 */
export function useWithdrawals() {
    const [filters, setFilters] = useState<WithdrawalFilters>({
        page: 1,
        limit: 20,
        sortBy: 'createdAt',
        sortOrder: 'desc',
    });

    const { data: withdrawalsData, isLoading: isLoadingWithdrawals, refetch } = useQuery({
        queryKey: ['withdrawals', filters],
        queryFn: () => WithdrawalService.getAllWithdrawals(
            filters.page || 1,
            filters.limit || 20,
            filters
        ),
        staleTime: 5 * 60 * 1000,
    });

    const { data: statsData, isLoading: isLoadingStats } = useQuery({
        queryKey: ['withdrawal-stats'],
        queryFn: () => WithdrawalService.getWithdrawalStats(),
        staleTime: 2 * 60 * 1000,
    });

    const withdrawals = withdrawalsData?.withdrawals || [];
    const pagination = withdrawalsData?.pagination;
    const stats = statsData;
    const isLoading = isLoadingWithdrawals || isLoadingStats;

    return {
        withdrawals,
        stats,
        filters,
        pagination,
        isLoading,
        setFilters,
        refetch,
    };
}

/**
 * Hook for fetching withdrawal statistics
 */
export function useWithdrawalStats(startDate?: string, endDate?: string) {
    return useQuery({
        queryKey: ['withdrawal-stats', startDate, endDate],
        queryFn: () => WithdrawalService.getWithdrawalStats(startDate, endDate),
        staleTime: 2 * 60 * 1000, // 2 minutes
    });
}

/**
 * Hook for processing individual withdrawal
 */
export function useProcessWithdrawal() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({ withdrawalId, action, notes }: {
            withdrawalId: string;
            action: 'approve' | 'reject';
            notes?: string;
        }) => WithdrawalService.processWithdrawal(withdrawalId, {
            action: action.toUpperCase() as 'APPROVE' | 'REJECT',
            notes
        }),

        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['withdrawal-stats'] });
            toast.success('Withdrawal processed successfully');
        },

        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to process withdrawal');
        },
    });

    return {
        processWithdrawal: mutation.mutateAsync,
        isProcessing: mutation.isPending,
    };
}

/**
 * Hook for bulk processing withdrawals
 */
export function useBulkProcessWithdrawals() {
    const queryClient = useQueryClient();

    const mutation = useMutation({
        mutationFn: ({ withdrawalIds, action, notes }: {
            withdrawalIds: string[];
            action: 'approve' | 'reject';
            notes?: string;
        }) => WithdrawalService.bulkProcessWithdrawals({
            withdrawalIds,
            action: action.toUpperCase() as 'APPROVE' | 'REJECT',
            notes
        }),

        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['withdrawals'] });
            queryClient.invalidateQueries({ queryKey: ['withdrawal-stats'] });

            const successCount = data.results?.length || 0;
            if (successCount > 0) {
                toast.success(`Successfully processed ${successCount} withdrawals`);
            }
        },

        onError: (error: any) => {
            toast.error(error.response?.data?.message || 'Failed to process withdrawals');
        },
    });

    return {
        bulkProcessWithdrawals: mutation.mutateAsync,
        isBulkProcessing: mutation.isPending,
    };
}

/**
 * Hook for managing withdrawal selection state
 */
export function useWithdrawalSelection(withdrawals: Withdrawal[] = []) {
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const selectAll = useCallback((checked: boolean) => {
        if (checked) {
            const pendingIds = withdrawals
                .filter(w => withdrawalUtils.canProcess(w))
                .map(w => w.id);
            setSelectedIds(pendingIds);
        } else {
            setSelectedIds([]);
        }
    }, [withdrawals]);

    const selectWithdrawal = useCallback((id: string, checked: boolean) => {
        if (checked) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds([]);
    }, []);

    const isAllSelected = withdrawals.length > 0 &&
        selectedIds.length === withdrawals.filter(w => withdrawalUtils.canProcess(w)).length;

    const isPartiallySelected = selectedIds.length > 0 && !isAllSelected;

    return {
        selectedIds,
        selectAll,
        selectWithdrawal,
        clearSelection,
        isAllSelected,
        isPartiallySelected,
    };
}

/**
 * Hook for managing withdrawal filters
 */
export function useWithdrawalFilters() {
    const [filters, setFilters] = useState<WithdrawalFilters>({});

    const updateFilter = useCallback((key: keyof WithdrawalFilters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [key]: value || undefined,
        }));
    }, []);

    const clearFilters = useCallback(() => {
        setFilters({});
    }, []);

    const hasActiveFilters = Object.values(filters).some(value => value !== undefined);

    return {
        filters,
        updateFilter,
        clearFilters,
        hasActiveFilters,
    };
}

/**
 * Hook for managing withdrawal pagination
 */
export function useWithdrawalPagination(
    totalPages: number,
    initialPage: number = 1
) {
    const [currentPage, setCurrentPage] = useState(initialPage);

    const goToPage = useCallback((page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    }, [totalPages]);

    const goToNextPage = useCallback(() => {
        goToPage(currentPage + 1);
    }, [currentPage, goToPage]);

    const goToPreviousPage = useCallback(() => {
        goToPage(currentPage - 1);
    }, [currentPage, goToPage]);

    const goToFirstPage = useCallback(() => {
        setCurrentPage(1);
    }, []);

    const goToLastPage = useCallback(() => {
        setCurrentPage(totalPages);
    }, [totalPages]);

    return {
        currentPage,
        goToPage,
        goToNextPage,
        goToPreviousPage,
        goToFirstPage,
        goToLastPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1,
    };
}

/**
 * Hook for managing withdrawal search
 */
export function useWithdrawalSearch(debounceMs: number = 500) {
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

    // Debounce search term
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
        }, debounceMs);

        return () => clearTimeout(timer);
    }, [searchTerm, debounceMs]);

    const clearSearch = useCallback(() => {
        setSearchTerm('');
    }, []);

    return {
        searchTerm,
        setSearchTerm,
        debouncedSearchTerm,
        clearSearch,
        isSearching: searchTerm !== debouncedSearchTerm,
    };
}