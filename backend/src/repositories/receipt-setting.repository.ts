import { db } from "../config/prisma";
import { updateReceiptSettingValues } from "../schemas/receipt-setting.schema";

export class ReceiptSettingRepository {
    static async update(outletId: string, data: updateReceiptSettingValues) {
        return db.receiptSetting.update({
            where: { outletId },
            data: {
                ...data,
                outletId, // Ensure outletId doesn't get overwritten
            }
        })
    }

    static async create(outletId: string) {
        return db.receiptSetting.create({
            data: { outletId }
        })
    }

    static async getByOutlet(outletId: string) {
        return db.receiptSetting.findUnique({
            where: { outletId }
        })
    }
}