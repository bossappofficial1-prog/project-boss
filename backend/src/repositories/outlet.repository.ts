import { Outlet, OutletOperatingHours } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateOutletInput, UpdateOutletInput } from "../schemas/outlet.schema";

export class OutletRepository {
    static async getAll() {
        return db.outlet.findMany()
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
                        orders: true,
                        products: true
                    }
                }
            }
        })
    }
}