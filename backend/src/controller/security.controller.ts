import { Request, Response } from "express";
import { asyncHandler } from "../middleware/error.middleware";
import { ResponseUtil } from "../utils/response";
import { db } from "../config/prisma";

/**
 * Security monitoring controller for guest orders
 */
export const getGuestOrderSecurityReport = asyncHandler(async (req: Request, res: Response) => {
    const { timeframe = '24h' } = req.query;
    
    let timeAgo: Date;
    switch (timeframe) {
        case '1h':
            timeAgo = new Date(Date.now() - 60 * 60 * 1000);
            break;
        case '24h':
            timeAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
            break;
        case '7d':
            timeAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
            break;
        default:
            timeAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    }

    // Get high-value orders
    const highValueOrders = await db.order.findMany({
        where: {
            totalAmount: { gte: 1000000 }, // Above 1 million
            createdAt: { gte: timeAgo }
        },
        include: {
            guestCustomer: {
                select: {
                    phone: true,
                    name: true
                }
            },
            outlet: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            totalAmount: 'desc'
        },
        take: 20
    });

    // Get frequent guest customers
    const frequentGuests = await db.guestCustomer.findMany({
        where: {
            orders: {
                some: {
                    createdAt: { gte: timeAgo }
                }
            }
        },
        include: {
            _count: {
                select: {
                    orders: {
                        where: {
                            createdAt: { gte: timeAgo }
                        }
                    }
                }
            }
        },
        orderBy: {
            orders: {
                _count: 'desc'
            }
        },
        take: 10
    });

    // Get cancelled orders (potentially suspicious)
    const cancelledOrders = await db.order.count({
        where: {
            orderStatus: 'CANCELLED',
            createdAt: { gte: timeAgo }
        }
    });

    // Get orders with suspicious patterns
    const suspiciousOrders = await db.order.findMany({
        where: {
            OR: [
                { totalAmount: { gte: 10000000 } }, // Very high value
                { 
                    guestCustomer: {
                        phone: {
                            in: ['1111111111', '0000000000', '1234567890'] // Common fake numbers
                        }
                    }
                }
            ],
            createdAt: { gte: timeAgo }
        },
        include: {
            guestCustomer: {
                select: {
                    phone: true,
                    name: true
                }
            }
        }
    });

    return ResponseUtil.success(res, {
        timeframe,
        summary: {
            totalOrders: await db.order.count({
                where: { createdAt: { gte: timeAgo } }
            }),
            highValueCount: highValueOrders.length,
            cancelledOrdersCount: cancelledOrders,
            suspiciousOrdersCount: suspiciousOrders.length,
            frequentGuestsCount: frequentGuests.filter(g => g._count.orders > 3).length
        },
        highValueOrders: highValueOrders.map(order => ({
            orderId: order.id,
            amount: order.totalAmount,
            customerPhone: order.guestCustomer?.phone?.slice(-4) + '***',
            customerName: order.guestCustomer?.name || 'Unknown',
            outletName: order.outlet.name,
            createdAt: order.createdAt
        })),
        frequentGuests: frequentGuests.map(guest => ({
            name: guest.name,
            phone: guest.phone?.slice(-4) + '***',
            orderCount: guest._count.orders,
            suspicious: guest._count.orders > 5
        })),
        suspiciousOrders: suspiciousOrders.map(order => ({
            orderId: order.id,
            amount: order.totalAmount,
            customerPhone: order.guestCustomer?.phone?.slice(-4) + '***',
            reason: order.totalAmount >= 10000000 ? 'High value' : 'Suspicious phone pattern'
        }))
    });
});

/**
 * Block suspicious guest customer
 */
export const blockGuestCustomer = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;
    
    // Add to blocklist (you might want to create a separate table for this)
    // For now, we'll add a flag to the guest customer
    const updatedCustomer = await db.guestCustomer.updateMany({
        where: { phone },
        data: { 
            // You might need to add a 'blocked' field to your schema
            name: `[BLOCKED] ${new Date().toISOString()}`
        }
    });

    return ResponseUtil.success(res, {
        message: `Guest customer with phone ending ${phone.slice(-4)} has been flagged`,
        affectedRecords: updatedCustomer.count
    });
});
