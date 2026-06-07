'use client';

import { ReactNode, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { outletApi } from '@/lib/api';
import type { OutletAnalyticsResponse } from '@/types/outlet';
import { ByType, TopProduct } from '@/types';
import { CreditCard, DollarSign, LucideIcon, ShoppingCart, TrendingUp } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

type UseOutletAnalyticsOptions = {
    enabled?: boolean;
    staleTime?: number;
    gcTime?: number;
    refetchInterval?: number | false;
    refetchOnWindowFocus?: boolean;
};

export function useOutletAnalytics(outletId?: string, options?: UseOutletAnalyticsOptions) {

    const query = useQuery<OutletAnalyticsResponse, Error>({
        queryKey: ['outlet-analytics', outletId],
        queryFn: async () => {
            if (!outletId) {
                throw new Error('Outlet belum dipilih');
            }
            return outletApi.getAnalytics(outletId);
        },
        enabled: !!outletId && (options?.enabled ?? true),
        staleTime: options?.staleTime ?? 60_000,
        gcTime: options?.gcTime ?? 300_000,
        refetchInterval: options?.refetchInterval,
        refetchOnWindowFocus: options?.refetchOnWindowFocus ?? false,
        retry: 2,
    });

    const hasData = useMemo(() => Boolean(query.data), [query.data]);
    const data = query.data

    const topProductsData = useMemo<TopProduct[]>(() => {
        if (!data?.products?.topProducts) return [];
        return data.products.topProducts.map((product) => ({
            id: product.id,
            name: product.name,
            sales: product.quantity,
            quantity: product.quantity,
            revenue: product.revenue,
            type: product.type,
        }));
    }, [data?.products?.topProducts]);

    const lowStockProducts = useMemo(
        () => (data?.products?.lowStock ?? []).slice(0, 5),
        [data?.products?.lowStock],
    );

    const productTypeData = useMemo<ByType[]>(() => {
        if (!data?.products?.byType) return [];
        return data.products.byType.map((item) => ({
            type: item.type,
            count: item.count,
            percentage: item.percentage,
        }));
    }, [data?.products?.byType]);


    const topPaymentMethod = useMemo(() => {
        if (!data?.payments?.byPaymentMethod?.length) return undefined;
        return [...data.payments.byPaymentMethod].sort((a, b) => b.count - a.count)[0];
    }, [data?.payments?.byPaymentMethod]);

    const kpiCards = useMemo(() => {
        if (!data) return [];

        const cards: Array<{
            title: string;
            value: string;
            icon: LucideIcon;
            accentColor: string;
            accentBackground?: string;
            description?: string;
            comparison?: Array<{ label: string; value: string }>;
        }> = [];

        const { revenue } = data;
        const revenueGrowthRaw = revenue.monthOverMonthGrowth;
        let revenueDescription = 'Belum ada data perbandingan';
        if (typeof revenueGrowthRaw === 'number') {
            const rounded = Math.round(revenueGrowthRaw);
            revenueDescription = rounded === 0
                ? 'Stabil dibanding bulan lalu'
                : `${rounded > 0 ? 'Naik' : 'Turun'} ${Math.abs(rounded)}% dibanding bulan lalu`;
        }

        cards.push({
            title: 'Pendapatan Bulan Ini',
            value: formatCurrency(revenue.monthRevenue),
            icon: DollarSign,
            accentColor: 'text-emerald-600 dark:text-emerald-400',
            accentBackground: 'bg-emerald-100/60 dark:bg-emerald-900/30',
            description: revenueDescription,
            comparison: [
                { label: 'Minggu ini', value: formatCurrency(revenue.weekRevenue) },
                { label: 'Hari ini', value: formatCurrency(revenue.todayRevenue) },
            ],
        });

        if (data.orders) {
            const { monthOrders, weekOrders, todayOrders, averageOrderValue } = data.orders;
            const expectedWeekly = monthOrders > 0 ? monthOrders / 4 : 0;
            let ordersDescription = 'Belum ada data perbandingan';
            if (expectedWeekly > 0) {
                const diff = Math.round(((weekOrders - expectedWeekly) / expectedWeekly) * 100);
                ordersDescription = diff === 0
                    ? 'Sesuai rata-rata mingguan'
                    : `${diff > 0 ? 'Di atas' : 'Di bawah'} rata-rata mingguan ${Math.abs(diff)}%`;
            }

            cards.push({
                title: 'Pesanan Bulan Ini',
                value: monthOrders.toLocaleString('id-ID'),
                icon: ShoppingCart,
                accentColor: 'text-blue-600 dark:text-blue-400',
                accentBackground: 'bg-blue-100/60 dark:bg-blue-900/30',
                description: ordersDescription,
                comparison: [
                    { label: 'Minggu ini', value: weekOrders.toLocaleString('id-ID') },
                    { label: 'Hari ini', value: todayOrders.toLocaleString('id-ID') },
                ],
            });

            const todayAverageOrderValue = todayOrders > 0
                ? Math.round(revenue.todayRevenue / todayOrders)
                : null;

            let averageDescription = 'Belum ada pesanan hari ini';
            if (todayAverageOrderValue !== null) {
                if (averageOrderValue > 0) {
                    const diff = Math.round(((todayAverageOrderValue - averageOrderValue) / averageOrderValue) * 100);
                    averageDescription = diff === 0
                        ? `Rata-rata hari ini ${formatCurrency(todayAverageOrderValue)}`
                        : `${diff > 0 ? 'Di atas' : 'Di bawah'} rata-rata bulanan ${Math.abs(diff)}%`;
                } else {
                    averageDescription = `Rata-rata hari ini ${formatCurrency(todayAverageOrderValue)}`;
                }
            }

            cards.push({
                title: 'Nilai Order Rata-rata',
                value: formatCurrency(averageOrderValue),
                icon: TrendingUp,
                accentColor: 'text-purple-600 dark:text-purple-400',
                accentBackground: 'bg-purple-100/60 dark:bg-purple-900/30',
                description: averageDescription,
                comparison: [
                    { label: 'Rata-rata hari ini', value: todayAverageOrderValue !== null ? formatCurrency(todayAverageOrderValue) : '-' },
                    { label: 'Pesanan bulan ini', value: monthOrders.toLocaleString('id-ID') },
                ],
            });
        }

        const manualPayments = data.payments?.manualPayments;
        if (manualPayments) {
            cards.push({
                title: 'Pembayaran Manual',
                value: manualPayments.totalManual.toLocaleString('id-ID'),
                icon: CreditCard,
                accentColor: 'text-amber-700 dark:text-amber-400',
                accentBackground: 'bg-amber-100/60 dark:bg-amber-900/30',
                description: manualPayments.pending
                    ? `${manualPayments.pending} menunggu verifikasi`
                    : 'Tidak ada pembayaran manual yang pending',
                comparison: [
                    { label: 'Diverifikasi', value: manualPayments.verified.toLocaleString('id-ID') },
                    { label: 'Ditolak', value: manualPayments.rejected.toLocaleString('id-ID') },
                ],
            });
        }

        return cards;
    }, [data, productTypeData, lowStockProducts]);

    return {
        ...query,
        topProductsData,
        hasData,
        productTypeData,
        kpiCards,
        topPaymentMethod,
        lowStockProducts
    };
}
