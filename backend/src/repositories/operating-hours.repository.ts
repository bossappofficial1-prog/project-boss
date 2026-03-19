import { OutletOperatingHours } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateOperatingHoursInput, UpdateOperatingHoursInput } from "../schemas/operating-hours.schema";

export class OperatingHoursRepository {
    // static async create(data: CreateOperatingHoursInput): Promise<OutletOperatingHours> {
    //     return db.outletOperatingHours.create({
    //         data,
    //     });
    // }

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

    static async upsertOperatingHours(outletId: string, data: CreateOperatingHoursInput) {
        const transactionOperations = data.hours.map((schedule) => {
            return db.outletOperatingHours.upsert({
                where: {
                    outletId_dayOfWeek: {
                        outletId,
                        dayOfWeek: schedule.dayOfWeek
                    }
                },
                update: {
                    openTime: schedule.openTime,
                    closeTime: schedule.closeTime,
                    isOpen: schedule.isOpen,
                    isRestEnabled: schedule.isRestEnabled ?? false,
                    restStartTime: schedule.restStartTime ?? null,
                    restEndTime: schedule.restEndTime ?? null,
                },
                create: {
                    outletId,
                    closeTime: schedule.closeTime,
                    openTime: schedule.openTime,
                    dayOfWeek: schedule.dayOfWeek,
                    isOpen: schedule.isOpen,
                    isRestEnabled: schedule.isRestEnabled ?? false,
                    restStartTime: schedule.restStartTime ?? null,
                    restEndTime: schedule.restEndTime ?? null,
                }
            })
        })
        return db.$transaction(transactionOperations);
    }
}
