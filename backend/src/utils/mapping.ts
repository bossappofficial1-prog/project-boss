import { PaymentStatus } from "@prisma/client";

export const mappingTransactionStatusForMidtrans = (status: string): PaymentStatus => {
    switch (status) {
        case "pending":
        case "authorize":
            return PaymentStatus.PENDING;
        case "settlement":
        case "capture":
            return PaymentStatus.SUCCESS;
        case "deny":
        case "cancel":
        case "failure":
        case "chargeback":
        case "partial_chargeback":
            return PaymentStatus.FAILED;
        case "expire":
            return PaymentStatus.EXPIRED;
        case "refund":
        case "partial_refund":
            return PaymentStatus.REFUNDED;
        default:
            return PaymentStatus.FAILED;
    }
};

export const midtransStatuses = [
    "pending",
    "settlement",
    "capture",
    "deny",
    "expire",
    "cancel",
    "authorize",
    "failure",
    "refund",
    "partial_refund",
    "chargeback",
    "partial_chargeback"
] as const