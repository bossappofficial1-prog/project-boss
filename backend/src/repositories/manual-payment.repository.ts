import { Business, GuestCustomer, Order, OrderItem, Outlet, PaymentStatus, Prisma, Product, Transaction } from "@prisma/client";
import { db } from "../config/prisma";
import { parseAndForceIsoUtc } from "./helper";
import { DeepIsoDate } from "./queue-v2.repository";

type ListManualPaymentOptions = {
    status?: PaymentStatus[];
    outletId?: string;
    search?: string;
    page?: number;
    limit?: number;
};

export type ManualTransactionWithRelationsRaw = Transaction & {
    order: Order & {
        outlet: Outlet & {
            business: Business;
        };
        guestCustomer: GuestCustomer | null;
        items: (OrderItem & {
            product: Product;
        })[];
    };
};

export type ManualTransactionWithRelations = DeepIsoDate<ManualTransactionWithRelationsRaw>;

export class ManualPaymentRepository {
    static async createManualTransaction(data: Prisma.TransactionCreateInput) {
        return db.transaction.create({ data });
    }

    static async findManualTransactionByOrderId(orderId: string): Promise<ManualTransactionWithRelations> {
        const rawTransaction = await db.$queryRaw<ManualTransactionWithRelationsRaw[]>`
            SELECT 
                t.*,
                (
                    SELECT to_jsonb(o) || jsonb_build_object(
                        'outlet', (
                            SELECT to_jsonb(out) || jsonb_build_object(
                                'business', (
                                    SELECT to_jsonb(b) 
                                    FROM "Business" b 
                                    WHERE b.id = out."businessId"
                                )
                            )
                            FROM "Outlet" out 
                            WHERE out.id = o."outletId"
                        ),
                        'guestCustomer', (
                            SELECT to_jsonb(gc) 
                            FROM "GuestCustomer" gc 
                            WHERE gc.id = o."guestCustomerId"
                        ),
                        'items', (
                            SELECT COALESCE(jsonb_agg(
                                to_jsonb(oi) || jsonb_build_object(
                                    'product', (
                                        SELECT to_jsonb(p) 
                                        FROM "Product" p 
                                        WHERE p.id = oi."productId"
                                    )
                                )
                            ), '[]'::jsonb)
                            FROM "OrderItem" oi 
                            WHERE oi."orderId" = o.id
                        )
                    )
                    FROM "Order" o 
                    WHERE o.id = t."orderId"
                ) AS order
            FROM "Transaction" t
            WHERE t."orderId" = ${orderId} 
              AND t."isManual" = true
            LIMIT 1
        `;

        return parseAndForceIsoUtc(rawTransaction[0]);
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
