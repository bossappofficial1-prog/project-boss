import { db } from "../config/prisma";
import { updateReceiptSettingValues } from "../schemas/receipt-setting.schema";

export class ReceiptSettingRepository {
    static async update(outletId: string, data: updateReceiptSettingValues) {
        return db.receiptSetting.update({
            where: { outletId },
            data: {
                outletId,
                photoString: data.photoString,
                printHeight: data.printHeight,
                printWidth: data.printWidth,
                showLogo: data.showLogo,
            }
        })
    }

    static async getByOutlet(outletId: string) {
        return db.receiptSetting.findUnique({
            where: { outletId }
        })
    }
}