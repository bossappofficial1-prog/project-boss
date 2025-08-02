import { Staff } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateStaffInput, UpdateStaffInput } from "../schemas/staff.schema";

export class StaffRepository {
    static async create(data: CreateStaffInput): Promise<Staff> {
        return db.staff.create({
            data,
        });
    }

    static async findById(id: string): Promise<Staff | null> {
        return db.staff.findUnique({
            where: { id }
        });
    }

    static async findByOutletId(outletId: string): Promise<Staff[]> {
        return db.staff.findMany({
            where: { outletId }
        });
    }

    static async update(id: string, data: UpdateStaffInput): Promise<Staff> {
        return db.staff.update({
            where: { id },
            data,
        });
    }

    static async delete(id: string): Promise<Staff> {
        return db.staff.delete({
            where: { id }
        });
    }
}
