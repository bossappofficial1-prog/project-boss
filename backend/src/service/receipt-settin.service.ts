import { ReceiptSettingRepository } from "../repositories/receipt-setting.repository";
import { updateReceiptSettingValues } from "../schemas/receipt-setting.schema";

export class ReceiptSettingService {
    static async update(outletId: string, data: updateReceiptSettingValues) {
        const updated = await ReceiptSettingRepository.update(outletId, data)

        return updated
    }

    static async getByOutlet(outletId: string) {
        const receiptSetting = await ReceiptSettingRepository.getByOutlet(outletId)

        return receiptSetting
    }
}