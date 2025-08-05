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

        // Create a map for easy expense lookup
        const expenseMap = new Map(
            dailyExpenses.map(exp => [
                exp.date.toISOString().split('T')[0],
                exp._sum.amount || 0
            ])
        );

        // Combine and format the data
        const report = dailyRevenue.map(rev => {
            const date = rev.createdAt.toISOString().split('T')[0];
            const totalPendapatan = rev._sum.totalAmount || 0;
            const totalPengeluaran = expenseMap.get(date) || 0;

            return {
                tanggal: date,
                jumlahTransaksi: rev._count.id,
                totalPendapatan,
                totalPengeluaran,
                labaBersih: totalPendapatan - totalPengeluaran
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
