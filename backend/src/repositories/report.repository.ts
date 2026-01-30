import { endOfDay, endOfMonth, endOfWeek, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { db } from "../config/prisma";

export class ReportRepository {
    static async getOutletReport(outletId: string, date: string, startDate: Date, endDate: Date, type: 'daily' | 'weekly' | 'monthly') {

        const [orders, expenses, stockLogs] = await Promise.all([
            db.order.findMany({
                where: {
                    outletId,
                    orderStatus: 'COMPLETED',
                    createdAt: { gte: startDate, lte: endDate }
                },
                include: {
                    items: {
                        include: {
                            product: {
                                include: { service: true, goods: true }
                            }
                        }
                    }
                }
            }),
            db.expense.findMany({
                where: {
                    outletId,
                    date: { gte: startDate, lte: endDate }
                }
            }),
            db.stockLog.findMany({
                where: {
                    type: 'IN',
                    productGoods: { product: { outletId } },
                    createdAt: { gte: startDate, lte: endDate }
                }
            })
        ]);

        return { orders, expenses, stockLogs }
    }
}