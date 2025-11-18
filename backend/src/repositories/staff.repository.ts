import { Staff } from "@prisma/client";
import { db } from "../config/prisma";
import { CreateStaffInput, UpdateStaffInput } from "../schemas/staff.schema";
import { BcryptUtil } from "../utils";

export class StaffRepository {
    static async create(data: CreateStaffInput): Promise<Staff> {
        const staffData: any = { ...data };
        
        // Hash password jika ada
        if (staffData.password) {
            staffData.password = await BcryptUtil.hash(staffData.password);
        }
        
        return db.staff.create({
            data: staffData,
        });
    }

    static async findById(id: string): Promise<Staff | null> {
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

    static async update(id: string, data: UpdateStaffInput): Promise<Staff> {
        const staffData: any = { ...data };
        
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

    static async findByEmail(email: string): Promise<Staff | null> {
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
