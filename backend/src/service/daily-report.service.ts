import { db } from '../config/prisma';
import { OrderStatus } from '@prisma/client';
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
        const dailyRevenue = await db.order.groupBy({
            by: ['createdAt'],
            where: {
                outletId,
                orderStatus: OrderStatus.COMPLETED,
                createdAt: {
                    gte: actualStartDate,
                    lte: actualEndDate,
                },
            },
            _sum: {
                totalAmount: true,
            },
            _count: {
                id: true,
            },
        });

        // Get daily expenses
        const dailyExpenses = await db.expense.groupBy({
            by: ['date'],
            where: {
                outletId,
                date: {
                    gte: actualStartDate,
                    lte: actualEndDate,
                },
            },
            _sum: {
                amount: true,
            },
        });

        // Create maps for revenue and expense lookups
        const revenueMap = new Map(
            dailyRevenue.map(rev => [
                rev.createdAt.toISOString().split('T')[0],
                {
                    jumlahTransaksi: rev._count.id,
                    totalPendapatan: rev._sum.totalAmount || 0
                }
            ])
        );

        const expenseMap = new Map(
            dailyExpenses.map(exp => [
                exp.date.toISOString().split('T')[0],
                exp._sum.amount || 0
            ])
        );

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
