import { db } from "../config/prisma";
import { PaymentStatus, ManualPaymentType, OrderStatus, ServiceStatus } from "@prisma/client";
import { generateTicketCode } from "../utils";

export class PosV2Repository {
    static async getProductsByOutlet(
        outletId: string,
        search?: string,
        type?: "GOODS" | "SERVICE" | "TICKET",
        page: number = 1,
        limit: number = 50
    ) {
        const whereClause = {
            outletId,
            status: ServiceStatus.ACTIVE,
            ...(type ? { type } : {}),
            ...(search ? { name: { contains: search, mode: "insensitive" as const } } : {}),
        };

        const [total, data] = await db.$transaction([
            db.product.count({ where: whereClause }),
            db.product.findMany({
                where: whereClause,
                skip: (page - 1) * limit,
                take: limit,
                include: {
                    goods: {
                        select: {
                            id: true,
                            sellingPrice: true,
                            currentStock: true,
                            unit: true,
                            averageHpp: true,
                        },
                    },
                    service: {
                        select: {
                            id: true,
                            sellingPrice: true,
                            durationMinutes: true,
                            providerName: true,
                            maxParallel: true,
                        },
                    },
                    ticket: {
                        select: {
                            id: true,
                            sellingPrice: true,
                            totalQuota: true,
                            soldCount: true,
                            eventDate: true,
                            eventEndDate: true,
                            venue: true,
                        },
                    },
                },
                orderBy: { name: "asc" },
            }),
        ]);

        return { data, total };
    }

    static async getProductsByIds(productIds: string[], outletId: string) {
        return db.product.findMany({
            where: {
                id: { in: productIds },
                outletId,
                status: "ACTIVE",
            },
            include: {
                goods: true,
                service: true,
                ticket: true,
            },
        });
    }

    static async createCashOrder(params: {
        orderId: string;
        customerId: string;
        outletId: string;
        totalAmount: number;
        cashierId: string | null;
        bookingDate: Date | null;
        hasService: boolean;
        items: Array<{
            productId: string;
            quantity: number;
            priceAtTimeOfOrder: number;
        }>;
        stockUpdates: Array<{
            productGoodsId: string;
            quantity: number;
            orderId: string;
        }>;
        ticketUpdates: Array<{
            productTicketId: string;
            productId: string;
            quantity: number;
        }>;
        bookingSlotId?: string;
    }) {
        const { orderId, customerId, outletId, totalAmount, cashierId, bookingDate, hasService, items, stockUpdates, ticketUpdates, bookingSlotId } = params;

        return db.$transaction(async (tx) => {
            const order = await tx.order.create({
                data: {
                    id: orderId,
                    guestCustomerId: customerId,
                    outletId,
                    totalAmount,
                    midtransFee: 0,
                    appFee: 0,
                    paymentStatus: PaymentStatus.SUCCESS,
                    orderStatus: hasService ? OrderStatus.PROCESSING : OrderStatus.COMPLETED,
                    handledByStaffId: cashierId,
                    bookingDate,
                },
            });

            const createdItems = await Promise.all(
                items.map((item) =>
                    tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            productId: item.productId,
                            quantity: item.quantity,
                            priceAtTimeOfOrder: item.priceAtTimeOfOrder,
                        },
                    }),
                ),
            );

            for (const stock of stockUpdates) {
                await tx.stockLog.create({
                    data: {
                        productGoodsId: stock.productGoodsId,
                        type: "OUT",
                        quantity: stock.quantity,
                        referenceType: "ORDER",
                        referenceId: stock.orderId,
                        notes: `POS v2 cash order ${stock.orderId}`,
                    },
                });
                await tx.productGoods.update({
                    where: { id: stock.productGoodsId },
                    data: { currentStock: { decrement: stock.quantity } },
                });
            }

            // Ticket: increment soldCount + generate TicketCode
            for (const ticket of ticketUpdates) {
                await tx.productTicket.update({
                    where: { id: ticket.productTicketId },
                    data: { soldCount: { increment: ticket.quantity } },
                });
            }

            // Generate ticket codes for ticket items
            for (const createdItem of createdItems) {
                const ticketUpdate = ticketUpdates.find((tu) => tu.productId === createdItem.productId);
                if (ticketUpdate) {
                    const ticketCodes = Array.from({ length: createdItem.quantity }, () => ({
                        code: generateTicketCode(),
                        orderItemId: createdItem.id,
                    }));
                    await tx.ticketCode.createMany({ data: ticketCodes });
                }
            }

            // Link booking slot to service order item
            if (bookingSlotId) {
                for (const createdItem of createdItems) {
                    const product = await tx.product.findUnique({
                        where: { id: createdItem.productId },
                        select: { type: true },
                    });
                    if (product?.type === "SERVICE") {
                        await tx.bookingSlot.update({
                            where: { id: bookingSlotId },
                            data: {
                                status: "BOOKED",
                                orderItemId: createdItem.id,
                            },
                        });
                        break;
                    }
                }
            }

            const transaction = await tx.transaction.create({
                data: {
                    amount: totalAmount,
                    paymentMethod: "cash",
                    status: PaymentStatus.SUCCESS,
                    isManual: true,
                    manualMethod: ManualPaymentType.CASH,
                    orderId: order.id,
                },
            });

            return { order, transaction };
        });
    }

    static async findOrderWithDetails(orderId: string) {
        return db.order.findUnique({
            where: { id: orderId },
            include: {
                guestCustomer: true,
                outlet: {
                    include: {
                        receiptSettings: true,
                    },
                },
                items: {
                    include: {
                        product: {
                            include: { goods: true },
                        },
                    },
                },
                transaction: true,
                handledByStaff: {
                    select: { id: true, name: true },
                },
            },
        });
    }

    static async findOrCreateCustomer(name: string, phone: string) {
        const cleaned = phone.replace(/[^\d+]/g, "");
        const existing = await db.guestCustomer.findFirst({
            where: { phone: cleaned },
        });

        if (existing) {
            return existing;
        }

        return db.guestCustomer.create({
            data: {
                name: name.trim(),
                phone: cleaned,
            },
        });
    }

    static async getCashSummaryToday(outletId: string) {
        const now = new Date();
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startOfDay);
        endOfDay.setDate(endOfDay.getDate() + 1);

        const result = await db.transaction.aggregate({
            _sum: { amount: true },
            _count: { id: true },
            where: {
                order: { outletId },
                paymentMethod: "cash",
                status: PaymentStatus.SUCCESS,
                createdAt: { gte: startOfDay, lt: endOfDay },
            },
        });

        return {
            totalAmount: result._sum.amount ?? 0,
            transactionsCount: result._count.id ?? 0,
            date: startOfDay.toISOString().split("T")[0],
        };
    }

    static async getRecentOrders(outletId: string, limit: number = 10) {
        return db.order.findMany({
            where: {
                outletId,
                paymentStatus: PaymentStatus.SUCCESS,
            },
            include: {
                guestCustomer: { select: { name: true, phone: true } },
                items: {
                    include: {
                        product: { select: { name: true, type: true } },
                    },
                },
                handledByStaff: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }
}
