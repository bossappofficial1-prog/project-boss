import { STORAGE_PROFILE_KEY } from "@/constants";
import api from "@/lib/api";
import { OrderDetail, PaymentMethod } from "@/types";

export class Order {
    static async getPaymentMethodList(): Promise<PaymentMethod[]> {
        return api.getData("/payment-methods")
    }

    static async getOrderDetails(): Promise<OrderDetail[]> {
        const raw = localStorage.getItem(STORAGE_PROFILE_KEY)
        const userPref = JSON.parse(raw!)
        return api.getData(`/orders/details/${userPref.phone}`)
    }
}