import api from "@/lib/api";
import { CustomerInfo, PaymentMethod, PaymentResponse } from "@/types";

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
}