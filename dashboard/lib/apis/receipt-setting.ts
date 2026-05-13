import { apiClient } from "./base";

export interface ReceiptSettingType {
    "id": string,
    "outletId": string,
    "printWidth": number,
    "endFeed": number,
    "autoCut": boolean,
    "copies": number,
    "showLogo": boolean,
    "photoString": string | null,
    "imageThreshold": number,
    "headerText": string | null,
    "footerText": string | null,
    "showCashier": boolean,
    "showCustomer": boolean,
    "showQR": boolean,
    "qrContent": string | null
}

export class ReceiptSettingService {
    static async getByOutlet(outletId: string): Promise<ReceiptSettingType> {
        return (await apiClient.get(`/receipt-setting/${outletId}`)).data.data
    }

    static async update(outletId: string, data: any) {
        return (await apiClient.patch(`/receipt-setting/${outletId}`, data)).data.data
    }
}