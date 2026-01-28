import { Staff } from "@prisma/client";
import { db } from "../config/prisma";
import { BcryptUtil } from "../utils";
import { StaffFormValues, UpdateStaffSchemaValues } from "../schemas/staff.schema";

export class StaffRepository {
    static async create(data: StaffFormValues): Promise<Staff> {
        const staffData = { ...data };
        // Hash password jika ada
        if (staffData.password) {
            staffData.password = await BcryptUtil.hash(staffData.password);
        }

        return db.staff.create({
            data: staffData,
        });
    }

    static async findById(id: string) {
        return db.staff.findUnique({
            where: { id },
            include: {
                outlet: true
            }
        });
    }

    static async findByOutletId(outletId: string): Promise<Staff[]> {
        return db.staff.findMany({
            where: { outletId },
            orderBy: { name: "asc" }
        });
    }

    static async update(id: string, data: UpdateStaffSchemaValues): Promise<Staff> {
        const staffData = { ...data };

        // Hash password jika ada dan diubah
        if (staffData.password) {
            staffData.password = await BcryptUtil.hash(staffData.password);
        }

        return db.staff.update({
            where: { id },
            data: staffData,
        });
    }

    static async delete(id: string): Promise<Staff> {
        return db.staff.delete({
            where: { id }
        });
    }

    static async findByEmail(email: string) {
        return db.staff.findUnique({
            where: { email },
            include: {
                outlet: {
                    include: {
                        business: true
                    }
                }
            }
        });
    }
}
