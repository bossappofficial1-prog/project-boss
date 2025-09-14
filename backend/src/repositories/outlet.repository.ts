import { Outlet, OutletOperatingHours } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateOutletInput, UpdateOutletInput } from "../schemas/outlet.schema";

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

    static async create(data: CreateOutletInput): Promise<Outlet> {
        return db.outlet.create({
            data,
        });
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
                        defaultTransactionFeeBearer: true
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
}