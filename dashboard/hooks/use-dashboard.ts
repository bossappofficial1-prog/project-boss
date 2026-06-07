import { useState, useEffect, useCallback } from 'react';

export interface DashboardFilters {
    period: 'daily' | 'weekly' | 'monthly';
    dateRange?: {
        start: Date;
        end: Date;
    };
    category?: string;
    status?: string;
}

export function useDashboardFilters(initialFilters: Partial<DashboardFilters> = {}) {
    const [filters, setFilters] = useState<DashboardFilters>({
        period: 'monthly',
        ...initialFilters,
    });

    const updateFilter = useCallback(<K extends keyof DashboardFilters>(
        key: K,
        value: DashboardFilters[K]
    ) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({ period: 'monthly' });
    }, []);

    const clearDateRange = useCallback(() => {
        setFilters(prev => ({ ...prev, dateRange: undefined }));
    }, []);

    return {
        filters,
        setFilters,
        updateFilter,
        resetFilters,
        clearDateRange,
    };
}

export function useAutoRefresh(
    refreshFn: () => Promise<void>,
    interval: number = 5 * 60 * 1000, // 5 minutes default
    enabled: boolean = true
) {
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

    const manualRefresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await refreshFn();
            setLastRefresh(new Date());
        } finally {
            setIsRefreshing(false);
        }
    }, [refreshFn, isRefreshing]);

    useEffect(() => {
        if (!enabled) return;

        const intervalId = setInterval(async () => {
            if (!isRefreshing) {
                await manualRefresh();
            }
        }, interval);

        return () => clearInterval(intervalId);
    }, [enabled, interval, manualRefresh, isRefreshing]);

    return {
        isRefreshing,
        lastRefresh,
        manualRefresh,
    };
}

export function useDashboardMetrics() {
    const formatCurrency = useCallback((amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    }, []);

    const formatNumber = useCallback((num: number) => {
        return new Intl.NumberFormat('id-ID').format(num);
    }, []);

    const formatPercentage = useCallback((value: number, decimals: number = 1) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(decimals)}%`;
    }, []);

    const getChangeIndicator = useCallback((change: number) => {
        if (change > 0) return { type: 'increase', color: 'text-green-600' };
        if (change < 0) return { type: 'decrease', color: 'text-red-600' };
        return { type: 'neutral', color: 'text-gray-600' };
    }, []);

    return {
        formatCurrency,
        formatNumber,
        formatPercentage,
        getChangeIndicator,
    };
}