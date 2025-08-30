import { MidtransTransactionStatus } from "@/types";

export const redirectMap: Record<MidtransTransactionStatus, string | undefined> = {
    capture: undefined,
    pending: "/payment/processing",
    settlement: "/payment/success",
    deny: "/payment/failed",
    cancel: "/payment/cancelled",
    expire: "/payment/expired",
    failure: "/payment/failed",
};