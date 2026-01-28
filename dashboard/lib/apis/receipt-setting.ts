import { apiClient } from "./base";

export interface ReceiptSettingType {
    "id": string,
    "outletId": string,
    "photoString": string | null,
    "showLogo": boolean,
    "printHeight": number | null,
    "printWidth": number | null
}

export class ReceiptSettingService {
    static async getByOutlet(outletId: string): Promise<ReceiptSettingType> {
        return (await apiClient.get(`/receipt-setting/${outletId}`)).data.data
    }

    static async update(outletId: string, data: any) {
        return (await apiClient.patch(`/receipt-setting/${outletId}`, data)).data.data
    }
}