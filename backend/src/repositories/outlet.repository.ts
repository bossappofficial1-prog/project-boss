import { Outlet, OutletOperatingHours, PaymentStatus, ProductType, ServiceStatus } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateOutletInput, UpdateOutletInput } from "../schemas/outlet.schema";
import { generateOutletId } from "../utils";

export class OutletRepository {
    static async getAll() {
        return db.outlet.findMany({
            include: {
                business: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                operatingHours: true
            }
        });
    }

    static async getOutletIds() {
        return db.outlet.findMany({ select: { id: true } })
    }

    static async create(data: CreateOutletInput): Promise<Outlet> {
        return db.$transaction(async (trx) => {
            const outlet = await trx.outlet.create({
                data: { ...data, id: generateOutletId() },
            });

            await trx.receiptSetting.create({
                data: { outletId: outlet.id }
            })

            return outlet
        })
    }

    static async findById(id: string) {
        return db.outlet.findUnique({
            where: { id },
            include: {
                business: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        accountHolder: true,
                        bankAccount: true,
                        bankName: true
                    }
                },
                operatingHours: true,
            },
        });
    }

    static async findByIdWithProducts(id: string): Promise<any | null> {
        return db.outlet.findUnique({
            where: { id },
            include: {
                business: true,
                products: {
                    where: {
                        status: 'ACTIVE',
                    },
                    orderBy: {
                        name: 'asc',
                    },
                },
            },
        });
    }

    static async findByBusinessId(businessId: string): Promise<Outlet[]> {
        return db.outlet.findMany({
            where: { businessId },
        });
    }

    static async update(id: string, data: UpdateOutletInput): Promise<Outlet> {
        return db.outlet.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string): Promise<Outlet> {
        return db.outlet.delete({
            where: { id },
        });
    }

    static async findManyWithPagination(
        businessId?: string,
        search?: string,
        take?: number,
        skip?: number
    ): Promise<{ outlets: Array<Outlet & { operatingHours: OutletOperatingHours[] }>, total: number }> {
        const whereClause: any = {
            ...(businessId && { businessId }),
            ...(search && {
                OR: [
                    {
                        name: {
                            contains: search,
                            mode: "insensitive"
                        }
                    },
                    {
                        business: {
                            description: {
                                contains: search,
                                mode: "insensitive"
                            },
                            name: {
                                contains: search,
                                mode: "insensitive"
                            }
                        }
                    }
                ]
            })
        };

        const [outlets, total] = await db.$transaction([
            db.outlet.findMany({
                where: whereClause,
                take: take,
                skip: skip,
                include: {
                    business: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    operatingHours: true
                }
            }),
            db.outlet.count({
                where: whereClause,
            }),
        ]);

        return { outlets, total };
    }

    static async findNearby(latitude: number, longitude: number, longDiff: number, latDiff: number) {
        return db.outlet.findMany({
            where: {
                AND: [
                    { latitude: { gte: latitude - latDiff } },
                    { latitude: { lte: latitude + latDiff } },
                    { longitude: { gte: longitude - longDiff } },
                    { longitude: { lte: longitude + longDiff } }
                ]
            },
            include: {
                business: {
                    select: {
                        name: true,
                        description: true
                    }
                },
                operatingHours: true,
                _count: {
                    select: {
                        orders: {
                            where: {
                                OR: [
                                    { orderStatus: "COMPLETED" }
                                ]
                            }
                        },
                        products: true
                    }
                }
            }
        })
    }

    static async findFeaturedOutlets() {
        return db.outlet.findMany({
            include: {
                business: {
                    select: {
                        id: true,
                        name: true
                    }
                },
                operatingHours: true,
                _count: {
                    select: {
                        orders: {
                            where: {
                                OR: [
                                    { orderStatus: "COMPLETED" }
                                ]
                            }
                        },
                    },
                },
            },
            orderBy: {
                orders: {
                    _count: 'desc'
                }
            },
            take: 5
        });
    }

    static async findNearbyWithPagination(
        latitude: number,
        longitude: number,
        latMin: number,
        latMax: number,
        longMin: number,
        longMax: number,
        page: number = 1,
        limit: number = 10,
        search?: string
    ) {
        const skip = (page - 1) * limit;

        let where: any = {
            AND: [
                { latitude: { gte: latMin } },
                { latitude: { lte: latMax } },
                { longitude: { gte: longMin } },
                { longitude: { lte: longMax } }
            ]
        }

        if (search && search !== "") where.AND.push({
            OR: [{ name: { contains: search, mode: "insensitive" } }]
        })

        // Get total count within bounding box
        const total = await db.outlet.count({ where });

        // Get outlets within bounding box with pagination
        const outlets = await db.outlet.findMany({
            where,
            include: {
                business: {
                    select: {
                        name: true,
                        description: true
                    }
                },
                operatingHours: true,
                _count: {
                    select: {
                        orders: {
                            where: {
                                OR: [
                                    { orderStatus: "COMPLETED" }
                                ]
                            }
                        },
                        products: true
                    }
                }
            },
            skip,
            take: limit
        });

        return { outlets, total };
    }

    static async getAllWithPagination(page: number = 1, limit: number = 10) {
        const skip = (page - 1) * limit;

        const [outlets, total] = await db.$transaction([
            db.outlet.findMany({
                include: {
                    business: {
                        select: {
                            id: true,
                            name: true
                        }
                    },
                    operatingHours: true
                },
                skip,
                take: limit
            }),
            db.outlet.count()
        ]);

        return { outlets, total };
    }

    static async getRevenueOrdersWithinRange(outletId: string, startDate: Date, endDate: Date) {
        return db.order.findMany({
            where: {
                outletId,
                paymentStatus: PaymentStatus.SUCCESS,
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
            select: {
                totalAmount: true,
                createdAt: true,
                orderStatus: true,
                paymentStatus: true,
                appFee: true,
                midtransFee: true,
                transaction: {
                    select: {
                        paymentMethod: true,
                        amount: true,
                        isManual: true,
                        manualMethod: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
    }

    static async analytics(outletId: string, startMonth: Date, endMonth: Date, options?: { lowStockThreshold?: number }) {
        const lowStockThreshold = options?.lowStockThreshold ?? 10;

        const [revenueOrders, expenses, productTypeCounts, topProductItems, lowStockProducts, paymentOrders] = await db.$transaction([
            db.order.findMany({
                where: {
                    AND: [
                        { outletId },
                        { createdAt: { gte: endMonth, lte: startMonth } },
                        { paymentStatus: "SUCCESS" }
                    ]
                },

                select: {
                    totalAmount: true,
                    createdAt: true,
                    orderStatus: true,
                    paymentStatus: true,
                    appFee: true,
                    midtransFee: true,

                    transaction: {
                        select: {
                            paymentMethod: true,
                            amount: true,
                            isManual: true,
                            manualMethod: true
                        }
                    }
                },
            }),

            db.expense.findMany({
                where: {
                    AND: [
                        { outletId },
                        { createdAt: { gte: endMonth, lte: startMonth } }
                    ]
                },
                select: {
                    id: true,
                    amount: true,
                    date: true,
                    description: true
                },
            }),

            db.product.groupBy({
                by: ['type'],
                where: {
                    outletId,
                },
                _count: {
                    _all: true,
                },
                orderBy: {
                    type: 'asc',
                },
            }),

            db.orderItem.findMany({
                where: {
                    order: {
                        outletId,
                        createdAt: { gte: endMonth, lte: startMonth },
                        paymentStatus: {
                            in: [PaymentStatus.SUCCESS],
                        },
                    },
                },
                select: {
                    productId: true,
                    quantity: true,
                    priceAtTimeOfOrder: true,
                    product: {
                        select: {
                            name: true,
                            type: true,
                            status: true,
                        },
                    },
                },
            }),

            db.product.findMany({
                where: {
                    outletId,
                    type: ProductType.GOODS,
                    status: ServiceStatus.ACTIVE,
                    goods: {
                        currentStock: { lte: lowStockThreshold },
                    },
                },
                select: {
                    id: true,
                    name: true,
                    goods: true,
                },
                orderBy: {
                    goods: { currentStock: 'asc' },
                },
                take: 10,
            }),

            db.order.findMany({
                where: {
                    outletId,
                    createdAt: { gte: endMonth, lte: startMonth }
                },
                select: {
                    id: true,
                    totalAmount: true,
                    paymentStatus: true,
                    createdAt: true,
                    appFee: true,
                    midtransFee: true,
                    transaction: {
                        select: {
                            amount: true,
                            paymentMethod: true,
                            isManual: true,
                            manualMethod: true,
                            status: true
                        }
                    }
                }
            })
        ])

        return { revenueOrders, expenses, productTypeCounts, topProductItems, lowStockProducts, paymentOrders }
    }
}