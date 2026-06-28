import { db } from '../config/prisma';
import { OrderStatus, PaymentStatus } from '@prisma/client';
import { getOutletByIdService } from './outlet.service';

export class DailyReportService {
    static async getDailyReport(outletId: string, startDate?: Date, endDate?: Date) {
        // Validate outlet exists
        await getOutletByIdService(outletId);

        // Set default date range to last 7 days if not provided
        const currentDate = new Date();
        const actualEndDate = endDate || new Date();
        const actualStartDate = startDate || new Date(currentDate.setDate(currentDate.getDate() - 7));

        // Get daily transactions with revenue
        // Prisma cannot group directly by DATE(createdAt) across providers; get records and aggregate per-day in JS
        const completedOrders = await db.order.findMany({
            where: {
                outletId,
                orderStatus: OrderStatus.COMPLETED,
                paymentStatus: PaymentStatus.SUCCESS,
                createdAt: {
                    gte: actualStartDate,
                    lte: actualEndDate,
                },
            },
            select: { id: true, totalAmount: true, createdAt: true },
        });
        const dailyRevenue = completedOrders.map(o => ({
            createdAt: o.createdAt,
            _sum: { totalAmount: o.totalAmount },
            _count: { id: 1 },
        }));

        // Get daily expenses
        const expensesRaw = await db.expense.findMany({
            where: {
                outletId,
                date: {
                    gte: actualStartDate,
                    lte: actualEndDate,
                },
            },
            select: { date: true, amount: true },
        });
        const dailyExpenses = expensesRaw.map(e => ({ date: e.date, _sum: { amount: e.amount } }));

        // Create maps for revenue and expense lookups
        const revenueMap = new Map<string, { jumlahTransaksi: number; totalPendapatan: number }>();
        for (const rev of dailyRevenue) {
            const key = rev.createdAt.toISOString().split('T')[0];
            const existing = revenueMap.get(key) || { jumlahTransaksi: 0, totalPendapatan: 0 };
            revenueMap.set(key, {
                jumlahTransaksi: existing.jumlahTransaksi + rev._count.id,
                totalPendapatan: existing.totalPendapatan + (rev._sum.totalAmount || 0),
            });
        }

        const expenseMap = new Map<string, number>();
        for (const exp of dailyExpenses) {
            const key = exp.date.toISOString().split('T')[0];
            const existing = expenseMap.get(key) || 0;
            expenseMap.set(key, existing + (exp._sum.amount || 0));
        }

        // Generate all dates in the range
        const dates: string[] = [];
        const tempDate = new Date(actualStartDate);
        while (tempDate <= actualEndDate) {
            dates.push(tempDate.toISOString().split('T')[0]);
            tempDate.setDate(tempDate.getDate() + 1);
        }

        // Combine and format the data
        const report = dates.map(date => {
            const revenue = revenueMap.get(date) || { jumlahTransaksi: 0, totalPendapatan: 0 };
            const totalPengeluaran = expenseMap.get(date) || 0;

            return {
                tanggal: date,
                jumlahTransaksi: revenue.jumlahTransaksi,
                totalPendapatan: revenue.totalPendapatan,
                totalPengeluaran,
                labaBersih: revenue.totalPendapatan - totalPengeluaran
            };
        });

        // Sort by date
        report.sort((a, b) => a.tanggal.localeCompare(b.tanggal));

        // Calculate totals
        const summary = report.reduce((acc, day) => ({
            totalTransaksi: acc.totalTransaksi + day.jumlahTransaksi,
            totalPendapatan: acc.totalPendapatan + day.totalPendapatan,
            totalPengeluaran: acc.totalPengeluaran + day.totalPengeluaran,
            totalLabaBersih: acc.totalLabaBersih + day.labaBersih
        }), {
            totalTransaksi: 0,
            totalPendapatan: 0,
            totalPengeluaran: 0,
            totalLabaBersih: 0
        });

        return {
            data: report,
            summary
        };
    }
}
