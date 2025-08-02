import { OutletOperatingHours } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateOperatingHoursInput, UpdateOperatingHoursInput } from "../schemas/operating-hours.schema";

export class OperatingHoursRepository {
    static async create(data: CreateOperatingHoursInput): Promise<OutletOperatingHours> {
        return db.outletOperatingHours.create({
            data,
        });
    }

    static async findById(id: string): Promise<OutletOperatingHours | null> {
        return db.outletOperatingHours.findUnique({
            where: { id }
        });
    }

    static async findByOutletId(outletId: string): Promise<OutletOperatingHours[]> {
        return db.outletOperatingHours.findMany({
            where: { outletId },
            orderBy: {
                dayOfWeek: 'asc'
            }
        });
    }

    static async update(id: string, data: UpdateOperatingHoursInput): Promise<OutletOperatingHours> {
        return db.outletOperatingHours.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string): Promise<OutletOperatingHours> {
        return db.outletOperatingHours.delete({
            where: { id }
        });
    }

    static async upsertOperatingHours(outletId: string, dayOfWeek: number, data: CreateOperatingHoursInput): Promise<OutletOperatingHours> {
        return db.outletOperatingHours.upsert({
            where: {
                outletId_dayOfWeek: {
                    outletId,
                    dayOfWeek
                }
            },
            update: {
                openTime: data.openTime,
                closeTime: data.closeTime,
                isOpen: data.isOpen
            },
            create: data
        });
    }
}
