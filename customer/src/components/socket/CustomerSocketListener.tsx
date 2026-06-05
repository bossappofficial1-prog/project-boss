"use client";

import { useCallback, useEffect, useState } from "react";
import { useSocket } from "@/hooks/useSocket-v2";
import { useSnackbar } from "@/context/SnackbarContext";
import { useQueryClient } from "@tanstack/react-query";

type CustomerNotificationPayload = {
    orderId: string;
    amount?: number;
    status?: string;
    transactionStatus?: string;
    paymentMethod?: string;
    type?: string;
    message?: string;
};

const STORAGE_KEYS = {
    USER_PREFERENCES: "user_preferences",
    LAST_PAYMENT: "lastPayment",
    PAYMENT_INFO: "paymentInfo",
} as const;

const parseJSON = (value: string | null) => {
    if (!value) return null;
    try {
        return JSON.parse(value);
    } catch (error) {
        console.warn("Failed to parse JSON from localStorage", error);
        return null;
    }
};

const resolveCustomerIdentifier = (): string | null => {
    if (typeof window === "undefined") return null;

    const preferences = parseJSON(localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES));
    if (preferences?.phone) {
        return String(preferences.phone);
    }

    const lastPayment = parseJSON(localStorage.getItem(STORAGE_KEYS.LAST_PAYMENT));
    if (lastPayment?.customerInfo?.phone) {
        return String(lastPayment.customerInfo.phone);
    }

    const paymentInfo = parseJSON(localStorage.getItem(STORAGE_KEYS.PAYMENT_INFO));
    if (paymentInfo?.customerInfo?.phone) {
        return String(paymentInfo.customerInfo.phone);
    }

    if (paymentInfo?.customer_phone) {
        return String(paymentInfo.customer_phone);
    }

    return null;
};

const mapStatusToTone = (status?: string) => {
    if (!status) return "info" as const;
    const normalised = status.toUpperCase();
    if (["SUCCESS", "SETTLEMENT", "PAID", "COMPLETED"].includes(normalised)) {
        return "success" as const;
    }
    if (["FAILED", "FAILURE", "DENY", "CANCEL", "CANCELLED"].includes(normalised)) {
        return "error" as const;
    }
    if (["PENDING", "AWAITING_VERIFICATION", "PROCESSING"].includes(normalised)) {
        return "warning" as const;
    }
    return "info" as const;
};

const buildNotificationMessage = (payload: CustomerNotificationPayload) => {
    if (payload.message) return payload.message;

    const status = payload.transactionStatus ?? payload.status;
    const paymentMethod = payload.paymentMethod ? ` via ${payload.paymentMethod}` : "";
    if (status) {
        return `Pesanan ${payload.orderId} ${status.toLowerCase()}${paymentMethod}`;
    }
    return `Pesanan ${payload.orderId} memiliki pembaruan${paymentMethod}`;
};

// Patch localStorage in the current window to dispatch custom event when setItem/removeItem is called
if (typeof window !== "undefined" && !(window as any).__local_storage_patched) {
    (window as any).__local_storage_patched = true;
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function (key, value) {
        originalSetItem.apply(this, [key, value]);
        window.dispatchEvent(new CustomEvent("local-storage-update", { detail: { key, value } }));
    };
    const originalRemoveItem = localStorage.removeItem;
    localStorage.removeItem = function (key) {
        originalRemoveItem.apply(this, [key]);
        window.dispatchEvent(new CustomEvent("local-storage-update", { detail: { key, value: null } }));
    };
}

export function CustomerSocketListener() {
    const { isConnected, joinCustomerRoom, onEvent, events } = useSocket();
    const { showSnackbar } = useSnackbar();
    const queryClient = useQueryClient()

    const [customerIdentifier, setCustomerIdentifier] = useState<string | null>(() => {
        if (typeof window === "undefined") return null;
        return resolveCustomerIdentifier();
    });

    const refreshIdentifier = useCallback(() => {
        const nextIdentifier = resolveCustomerIdentifier();
        setCustomerIdentifier((prev) => {
            if (prev === nextIdentifier) return prev;
            return nextIdentifier;
        });
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;

        refreshIdentifier();

        const handleStorage = () => refreshIdentifier();
        const handleFocus = () => refreshIdentifier();

        window.addEventListener("storage", handleStorage);
        window.addEventListener("focus", handleFocus);
        window.addEventListener("local-storage-update", handleStorage);

        return () => {
            window.removeEventListener("storage", handleStorage);
            window.removeEventListener("focus", handleFocus);
            window.removeEventListener("local-storage-update", handleStorage);
        };
    }, [refreshIdentifier]);

    useEffect(() => {
        if (!isConnected || !customerIdentifier) return;
        joinCustomerRoom(customerIdentifier);
    }, [isConnected, customerIdentifier, joinCustomerRoom]);

    useEffect(() => {
        if (!isConnected) return;

        const unsubscribe = onEvent(events.CUSTOMER_NOTIFICATION, (payload: CustomerNotificationPayload) => {
            if (!payload) return;

            const tone = mapStatusToTone(payload.transactionStatus ?? payload.status);
            const message = buildNotificationMessage(payload);

            // Revalidate query dengan key "orders"
            queryClient.invalidateQueries({ queryKey: ['orders'] })

            showSnackbar(message, tone, 5000);
            if (typeof window !== "undefined") {
                window.dispatchEvent(new CustomEvent("customer-notification", { detail: payload }));
            }
        });

        return () => {
            if (typeof unsubscribe === "function") unsubscribe();
        };
    }, [events.CUSTOMER_NOTIFICATION, isConnected, onEvent, showSnackbar]);

    return null;
}
