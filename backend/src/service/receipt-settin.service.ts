import { ReceiptSettingRepository } from "../repositories/receipt-setting.repository";
import { updateReceiptSettingValues } from "../schemas/receipt-setting.schema";

export class ReceiptSettingService {
    static async update(outletId: string, data: updateReceiptSettingValues) {
        const updated = await ReceiptSettingRepository.update(outletId, data)

        return updated
    }

    static async getByOutlet(outletId: string) {
        let receiptSetting = await ReceiptSettingRepository.getByOutlet(outletId)

        if (!receiptSetting) {
            receiptSetting = await ReceiptSettingRepository.create(outletId)
        }
        return receiptSetting
    }
}