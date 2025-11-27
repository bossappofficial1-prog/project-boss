import { PaymentStatus, Prisma } from "@prisma/client";
import { db } from "../config/prisma";

type ListManualPaymentOptions = {
    status?: PaymentStatus[];
    outletId?: string;
    search?: string;
    page?: number;
    limit?: number;
};

export class ManualPaymentRepository {
    static async createManualTransaction(data: Prisma.TransactionCreateInput) {
        return db.transaction.create({ data });
    }

    static async findManualTransactionByOrderId(orderId: string) {
        return db.transaction.findFirst({
            where: { orderId, isManual: true },
            include: {
                order: {
                    include: {
                        outlet: {
                            include: {
                                business: true
                            }
                        },
                        guestCustomer: true
                    }
                }
            }
        });
    }

    static async updateManualTransaction(id: string, data: Prisma.TransactionUncheckedUpdateInput) {
        return db.transaction.update({
            where: { id },
            data
        });
    }

    static async listManualTransactions(options: ListManualPaymentOptions = {}) {
        const { status, outletId, search, page = 1, limit = 20 } = options;
        const take = Math.min(Math.max(limit, 1), 100);
        const skip = (Math.max(page, 1) - 1) * take;

        const where: Prisma.TransactionWhereInput = {
            isManual: true,
            ...(status && status.length > 0 ? { status: { in: status } } : {}),
            ...(outletId ? { order: { outletId } } : {}),
            ...(search
                ? {
                    OR: [
                        { order: { id: { contains: search, mode: "insensitive" } } },
                        { order: { guestCustomer: { phone: { contains: search, mode: "insensitive" } } } }
                    ]
                }
                : {})
        };

        const [total, transactions] = await db.$transaction([
            db.transaction.count({ where }),
            db.transaction.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip,
                take,
                include: {
                    order: {
                        include: {
                            outlet: {
                                include: {
                                    business: true
                                }
                            },
                            guestCustomer: true
                        }
                    }
                }
            })
        ]);

        return {
            data: transactions,
            total,
            page: Math.max(page, 1),
            limit: take,
            totalPages: Math.ceil(total / take)
        };
    }

    static async sumManualTransactions(options: {
        outletId: string;
        paymentMethod?: string;
        status?: PaymentStatus[];
        startTime?: Date;
        endTime?: Date;
    }) {
        const { outletId, paymentMethod, status, startTime, endTime } = options;

        const where: Prisma.TransactionWhereInput = {
            isManual: true,
            order: {
                outletId,
            },
            ...(paymentMethod ? { paymentMethod } : {}),
            ...(status && status.length > 0 ? { status: { in: status } } : {}),
            ...((startTime || endTime) ? {
                createdAt: {
                    ...(startTime ? { gte: startTime } : {}),
                    ...(endTime ? { lt: endTime } : {}),
                },
            } : {}),
        };

        const aggregate = await db.transaction.aggregate({
            where,
            _sum: { amount: true },
            _count: { _all: true },
        });

        return {
            totalAmount: Number(aggregate._sum.amount ?? 0),
            transactionsCount: aggregate._count._all ?? 0,
        };
    }
}
