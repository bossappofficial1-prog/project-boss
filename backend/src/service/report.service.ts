import { db } from '../config/prisma';
import { OrderStatus } from '@prisma/client';
import { getOutletByIdService } from './outlet.service';

export class ReportService {
    static async getFinancialSummary(outletId: string, startDate: Date, endDate: Date) {
        // 1. Dapatkan detail outlet
        const outlet = await getOutletByIdService(outletId);

        // 2. Hitung Total Pendapatan dari pesanan yang selesai
        const revenueData = await db.order.aggregate({
            _sum: {
                totalAmount: true,
            },
            _count: {
                id: true,
            },
            where: {
                outletId: outletId,
                orderStatus: OrderStatus.COMPLETED,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        // 3. Hitung Total Pengeluaran
        const expenseData = await db.expense.aggregate({
            _sum: {
                amount: true,
            },
            _count: {
                id: true,
            },
            where: {
                outletId: outletId,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const totalRevenue = revenueData._sum.totalAmount || 0;
        const totalExpense = expenseData._sum.amount || 0;

        // 4. Hitung Laba Bersih
        const netProfit = totalRevenue - totalExpense;

        // 5. Dapatkan Ringkasan Penjualan
        const completedOrders = await db.order.findMany({
            where: {
                outletId: outletId,
                orderStatus: OrderStatus.COMPLETED,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
            },
        });

        const productSales = completedOrders
            .flatMap(order => order.items)
            .reduce((acc, item) => {
                const existing = acc[item.productId];
                if (existing) {
                    existing.quantitySold += item.quantity;
                    existing.totalRevenue += item.priceAtTimeOfOrder * item.quantity;
                } else {
                    acc[item.productId] = {
                        productId: item.productId,
                        name: item.product.name,
                        quantitySold: item.quantity,
                        totalRevenue: item.priceAtTimeOfOrder * item.quantity,
                    };
                }
                return acc;
            }, {} as Record<string, { productId: string; name: string; quantitySold: number; totalRevenue: number }>);

        const topSellingProducts = Object.values(productSales)
            .sort((a, b) => b.quantitySold - a.quantitySold)
            .slice(0, 5); // Ambil 5 produk terlaris

        // 6. Susun Laporan
        return {
            outletName: outlet.name,
            period: {
                start: startDate.toISOString(),
                end: endDate.toISOString(),
            },
            incomeStatement: {
                totalRevenue: {
                    amount: totalRevenue,
                    transactionCount: revenueData._count.id,
                },
                totalExpense: {
                    amount: totalExpense,
                    transactionCount: expenseData._count.id,
                },
                netProfit,
            },
            salesSummary: {
                totalProductsSold: topSellingProducts.reduce((sum, p) => sum + p.quantitySold, 0),
                topSellingProducts,
            },
        };
    }
}
