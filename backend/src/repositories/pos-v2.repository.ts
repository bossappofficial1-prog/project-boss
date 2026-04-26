import { db } from "../config/prisma";
import { LoyaltyPointHistoryType, PaymentStatus, ManualPaymentType, OrderStatus, ServiceStatus } from "@prisma/client";
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
        discountAmount: number;
        pointsRedeemed: number;
        cashierId: string | null;
        bookingDate: Date | null;
        hasService: boolean;
        paymentMethod: string;
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
        tableId?: string;
        tableNumber?: string;
        isOpenBill?: boolean;
        bookingSlotId?: string;
    }) {
        const {
            orderId, customerId, outletId, totalAmount, discountAmount,
            pointsRedeemed, cashierId, bookingDate, hasService,
            paymentMethod, items, stockUpdates, ticketUpdates,
            bookingSlotId, tableId, tableNumber, isOpenBill
        } = params;

        return db.$transaction(async (tx) => {
            const isPaid = !isOpenBill && (paymentMethod === "cash" || paymentMethod === "qris");

            // Check if order exists (for update/resume bill)
            const existingOrder = await tx.order.findUnique({
                where: { id: orderId },
                include: { items: true }
            });

            let order;
            if (existingOrder) {
                // Refund old points if any before re-deducting below
                if (existingOrder.pointsRedeemed > 0) {
                    await tx.outletMembership.update({
                        where: {
                            guestCustomerId_outletId: {
                                guestCustomerId: existingOrder.guestCustomerId,
                                outletId: existingOrder.outletId,
                            },
                        },
                        data: {
                            totalPoints: { increment: existingOrder.pointsRedeemed },
                        },
                    });
                }

                // Delete old items (and related ticket codes will be handled by cascade or manual cleanup)
                await tx.orderItem.deleteMany({ where: { orderId } });

                order = await tx.order.update({
                    where: { id: orderId },
                    data: {
                        guestCustomerId: customerId,
                        totalAmount,
                        discountAmount,
                        pointsRedeemed,
                        paymentStatus: isPaid ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
                        orderStatus: isPaid
                            ? (hasService ? OrderStatus.PROCESSING : OrderStatus.COMPLETED)
                            : OrderStatus.AWAITING_PAYMENT,
                        handledByStaffId: cashierId,
                        bookingDate,
                        tableId,
                        tableNumber: tableNumber || null,
                    },
                });
            } else {
                order = await tx.order.create({
                    data: {
                        id: orderId,
                        guestCustomerId: customerId,
                        outletId,
                        totalAmount,
                        discountAmount,
                        pointsRedeemed,
                        midtransFee: 0,
                        appFee: 0,
                        paymentStatus: isPaid ? PaymentStatus.SUCCESS : PaymentStatus.PENDING,
                        orderStatus: isPaid
                            ? (hasService ? OrderStatus.PROCESSING : OrderStatus.COMPLETED)
                            : OrderStatus.AWAITING_PAYMENT,
                        handledByStaffId: cashierId,
                        bookingDate,
                        tableId,
                        tableNumber: tableNumber || null,
                    },
                });
            }

            // Update Table Status if tableId is provided
            if (tableId) {
                await tx.outletTable.update({
                    where: { id: tableId },
                    data: { status: isPaid ? "AVAILABLE" : "OCCUPIED" }
                });
            }

            // Point Redemption: deduct points if any
            if (pointsRedeemed > 0) {
                await tx.outletMembership.update({
                    where: {
                        guestCustomerId_outletId: {
                            guestCustomerId: customerId,
                            outletId,
                        },
                    },
                    data: {
                        totalPoints: {
                            decrement: pointsRedeemed,
                        },
                    },
                });

                await tx.loyaltyPointHistory.create({
                    data: {
                        outletId,
                        guestCustomerId: customerId,
                        orderId: order.id,
                        type: LoyaltyPointHistoryType.REDEEM,
                        points: pointsRedeemed,
                        note: "Penukaran poin pada transaksi POS",
                    },
                });
            }

            const createdItems = await Promise.all(
                items.map(async (item) => {
                    const product = await tx.product.findUnique({
                        where: { id: item.productId },
                        include: { goods: true, service: true },
                    });

                    const hpp = product?.goods?.averageHpp || 0;
                    let commission = 0;
                    if (product?.service) {
                        const s = product.service;
                        commission = s.commissionType === "PERCENTAGE"
                            ? item.priceAtTimeOfOrder * (s.commissionValue / 100)
                            : s.commissionValue;
                    }

                    return tx.orderItem.create({
                        data: {
                            orderId: order.id,
                            productId: item.productId,
                            quantity: item.quantity,
                            priceAtTimeOfOrder: item.priceAtTimeOfOrder,
                            hppAtTimeOfOrder: hpp,
                            commissionAtTimeOfOrder: commission,
                        },
                    });
                }),
            );


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

            if (isPaid) {
                await tx.transaction.create({
                    data: {
                        amount: totalAmount,
                        paymentMethod: paymentMethod === "qris" ? "qris" : "cash",
                        status: PaymentStatus.SUCCESS,
                        isManual: true,
                        manualMethod: paymentMethod === "qris" ? ManualPaymentType.QRIS_OFFLINE : ManualPaymentType.CASH,
                        orderId: order.id,
                    },
                });
            }

            return { order };
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

    static async getOpenOrders(outletId: string, limit: number = 20) {
        return db.order.findMany({
            where: {
                outletId,
                paymentStatus: PaymentStatus.PENDING,
            },
            include: {
                guestCustomer: { select: { name: true, phone: true } },
                items: {
                    include: {
                        product: {
                            include: {
                                goods: { select: { sellingPrice: true } },
                                service: { select: { sellingPrice: true } },
                                ticket: { select: { sellingPrice: true } },
                            },
                        },
                    },
                },
                handledByStaff: { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
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
