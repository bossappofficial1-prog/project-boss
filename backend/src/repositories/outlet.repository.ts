import { Outlet } from "@prisma/client";
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

    static async findById(id: string): Promise<any | null> {
        return db.outlet.findUnique({
            where: { id },
            include: {
                business: true,
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
    ): Promise<{ outlets: Outlet[], total: number }> {
        const whereClause: any = {
            ...(businessId && { businessId }), // Conditionally add businessId
            ...(search && {
                name: {
                    contains: search,
                    mode: 'insensitive',
                },
            }),
        };

        const [outlets, total] = await db.$transaction([
            db.outlet.findMany({
                where: whereClause,
                take: take,
                skip: skip,
            }),
            db.outlet.count({
                where: whereClause,
            }),
        ]);

        return { outlets, total };
    }
}