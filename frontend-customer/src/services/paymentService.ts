import api from "@/lib/api";
import { CustomerInfo, PaymentMethod, PaymentResponse } from "@/types";
import { PaymentDetailData } from "@/types/payment-detail";

export class PaymentService {
    static getPaymentInformation(): PaymentResponse & { customerInfo: CustomerInfo; selectedPaymentMethod: PaymentMethod } {
        const paymentInfo = JSON.parse(localStorage.getItem("paymentInfo")!)
        const lastPaymentInfo = JSON.parse(localStorage.getItem("lastPayment")!)

        return {
            ...paymentInfo,
            customerInfo: lastPaymentInfo.customerInfo,
            selectedPaymentMethod: lastPaymentInfo.selectedPaymentMethod
        }
    }

    static updatePaymentInformation(data: PaymentResponse) {
        const stringifyData = JSON.stringify(data)
        localStorage.setItem("paymentInfo", stringifyData)
    }

    static async cancelPayment(orderId: string) {
        const response = await api.post(`/payments/${orderId}/cancel`)

        return response.data
    }

    static async uploadManualPaymentProof(orderId: string, file: File) {
        const formData = new FormData();
        formData.append('proof', file);

        const response = await api.addData(`/payments/${orderId}/manual/proof`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });

        return response;
    }

    static async getPaymentDetail(orderId: string): Promise<PaymentDetailData> {
        return api.getData<PaymentDetailData>(`/payments/${orderId}`);
    }
}