import { db } from '../config/prisma';
import { OrderStatus } from '@prisma/client';
import { getOutletByIdService } from './outlet.service';
import { ReportRepository } from '../repositories/report.repository';
import { eachDayOfInterval, endOfDay, endOfMonth, endOfWeek, format, isSameDay, startOfDay, startOfMonth, startOfWeek } from 'date-fns';

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

    static async getOutletReport(outletId: string, date: string, type: 'daily' | 'weekly' | 'monthly') {
        const refDate = date ? new Date(date as string) : new Date();
        let start: Date, end: Date;

        if (type === 'weekly') {
            start = startOfWeek(refDate, { weekStartsOn: 1 }); // Senin - Minggu
            end = endOfWeek(refDate, { weekStartsOn: 1 });
        } else if (type === 'monthly') {
            start = startOfMonth(refDate);
            end = endOfMonth(refDate);
        } else {
            start = startOfDay(refDate);
            end = endOfDay(refDate);
        }

        const { expenses, orders, stockLogs } = await ReportRepository.getOutletReport(outletId, date, start, end, type)

        let finalReport = [];

        if (type === 'monthly') {
            // Breakdown per Minggu untuk tampilan Bulanan
            for (let i = 0; i < 4; i++) {
                const weekStart = new Date(start);
                weekStart.setDate(start.getDate() + (i * 7));
                const weekEnd = i === 3 ? end : new Date(weekStart);
                if (i !== 3) weekEnd.setDate(weekStart.getDate() + 6);

                const wOrders = orders.filter(o => o.createdAt >= weekStart && o.createdAt <= weekEnd);
                const wExpenses = expenses.filter(e => e.date >= weekStart && e.date <= weekEnd);
                const wLogs = stockLogs.filter(l => l.createdAt >= weekStart && l.createdAt <= weekEnd);

                const stats = this.calculateStats(wOrders, wExpenses, wLogs);

                // Tren: Pendapatan harian di dalam minggu tersebut (7 titik)
                const trend = Array.from({ length: 7 }).map((_, dIdx) => {
                    const day = new Date(weekStart); day.setDate(weekStart.getDate() + dIdx);
                    return wOrders.filter(o => isSameDay(o.createdAt, day))
                        .reduce((sum, curr) => sum + curr.totalAmount, 0);
                });

                finalReport.push({
                    label: `Minggu ${i + 1}`,
                    jumlahTransaksi: stats.count,
                    totalPendapatan: stats.revenue,
                    totalPembelian: stats.pembelian,
                    totalPengeluaran: stats.pengeluaran,
                    gajiStaf: stats.gaji,
                    labaBersih: stats.labaBersih,
                    trend
                });
            }
        } else {
            // Breakdown per Hari untuk tampilan Harian/Mingguan
            const days = eachDayOfInterval({ start, end });
            finalReport = days.map(day => {
                const dayStr = format(day, 'yyyy-MM-dd');
                const dOrders = orders.filter(o => format(o.createdAt, 'yyyy-MM-dd') === dayStr);
                const dExpenses = expenses.filter(e => format(e.date, 'yyyy-MM-dd') === dayStr);
                const dLogs = stockLogs.filter(l => format(l.createdAt, 'yyyy-MM-dd') === dayStr);

                const stats = this.calculateStats(dOrders, dExpenses, dLogs);

                const trend = dOrders.length > 0
                    ? Array.from({ length: 8 }).map((_, h) => {
                        const hourOrders = dOrders.filter(o => o.createdAt.getHours() >= h * 3 && o.createdAt.getHours() < (h + 1) * 3);
                        return hourOrders.reduce((sum, curr) => sum + curr.totalAmount, 0);
                    })
                    : [0, 0, 0, 0, 0, 0, 0, 0];

                return {
                    label: dayStr,
                    jumlahTransaksi: stats.count,
                    totalPendapatan: stats.revenue,
                    totalPembelian: stats.pembelian,
                    totalPengeluaran: stats.pengeluaran,
                    gajiStaf: stats.gaji,
                    labaBersih: stats.labaBersih,
                    trend
                };
            });
        }

        return finalReport
    }

    private static calculateStats(filteredOrders: any[], filteredExpenses: any[], filteredLogs: any[]) {
        let revenue = 0;
        let gaji = 0;
        // Pembelian dihitung dari log stok masuk (IN)
        let pembelian = filteredLogs.reduce((acc, log) => acc + ((log.hppPerUnit || 0) * log.quantity), 0);
        let pengeluaran = filteredExpenses.reduce((acc, e) => acc + e.amount, 0);

        filteredOrders.forEach(order => {
            revenue += order.totalAmount;
            order.items.forEach((item: any) => {
                if (item.product.service) {
                    const s = item.product.service;
                    gaji += s.commissionType === 'PERCENTAGE'
                        ? (item.priceAtTimeOfOrder * (s.commissionValue / 100))
                        : s.commissionValue;
                }
            });
        });

        return {
            revenue,
            pembelian,
            pengeluaran,
            gaji,
            labaBersih: revenue - pembelian - pengeluaran - gaji,
            count: filteredOrders.length
        };
    };
}
