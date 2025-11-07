import { STORAGE_PROFILE_KEY } from "@/constants";
import api from "@/lib/api";
import { OrderDetail, PaymentMethod } from "@/types";

type CancelOrderPayload = {
    phone: string;
    reason?: string;
};

type ConfirmOrderPayload = {
    phone: string;
};

export class Order {
    static async getPaymentMethodList(): Promise<PaymentMethod[]> {
        return api.getData("/payment-methods")
    }

    static async getOrderDetails(): Promise<OrderDetail[]> {
        const raw = localStorage.getItem(STORAGE_PROFILE_KEY);

        if (!raw) {
            throw new Error("PROFILE_NOT_FOUND");
        }

        let userPref: { phone?: string } | null = null;

        try {
            userPref = JSON.parse(raw);
        } catch (error) {
            throw new Error("PROFILE_NOT_FOUND");
        }

        if (!userPref?.phone) {
            throw new Error("PHONE_NOT_FOUND");
        }

        return api.getData(`/orders/details/${userPref.phone}`);
    }

    static async cancelOrder(orderId: string, payload: CancelOrderPayload) {
        return api.addData(`/orders/${orderId}/customer/cancel`, payload);
    }

    static async confirmOrder(orderId: string, payload: ConfirmOrderPayload) {
        return api.addData(`/orders/${orderId}/customer/confirm`, payload);
    }
}