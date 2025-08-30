import api from "@/lib/api";
import { PaymentMethod } from "@/types";

export class Order {
    static async getPaymentMethodList(): Promise<PaymentMethod[]> {
        return api.getData("/payment-methods")
    }
}