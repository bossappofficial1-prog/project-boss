import { Request, Response } from "express"
import { AppError, handlerAnyError } from "../errors/api_errors"
import { ResponseUtil } from "../utils/response.util"
import { validateMidtransSignature } from "../configs/midtrans"
import { updateTransactionService } from "../services/transaction.service"

export const VALID_MIDTRANS_STATUSES = [
    "AUTHORIZE",
    "CAPTURE",
    "SETTLEMENT",
    "DENY",
    "PENDING",
    "CANCEL",
    "REFUND",
    "PARTIAL_REFUND",
    "CHARGEBACK",
    "PARTIAL_CHARGEBACK",
    "EXPIRE",
    "FAILURE"
] as const

export type MidtransStatus = typeof VALID_MIDTRANS_STATUSES[number]

export interface MidtransNotifikasi {
    transaction_type: string
    transaction_time: string
    transaction_status: MidtransStatus
    transaction_id: string
    status_message: string
    status_code: string
    signature_key: string
    payment_type: string
    order_id: string
    merchant_id: string
    gross_amount: string
    fraud_status: string
    expiry_time: string
    currency: string
}

/**
 * Converts a Midtrans transaction status string to its standardized uppercase form.
 * Returns "UNKNOWN" if the status is not recognized in the predefined list.
 *
 * @param status The transaction status string from Midtrans (e.g., 'expire', 'settlement').
 * @returns The standardized uppercase status string or "UNKNOWN".
 */
export function standardizeMidtransStatus(status: string) {
    const uppercaseStatus = status.toUpperCase()

    return (VALID_MIDTRANS_STATUSES as readonly string[]).includes(uppercaseStatus) ? uppercaseStatus : "UNKNOWN"
}

export async function MidtransNotifikasiController(req: Request, res: Response) {
    try {
        const midtransReqBody = req.body as MidtransNotifikasi

        const is_valid = validateMidtransSignature(midtransReqBody)

        if (!is_valid) throw new AppError("Signature not valid", 400);

        await updateTransactionService(midtransReqBody.order_id, {
            externalId: midtransReqBody.transaction_id,
            paymentMethod: midtransReqBody.payment_type,
            status: standardizeMidtransStatus(midtransReqBody.transaction_status) as any,
        })

        return ResponseUtil.success(res, null, "success", 200)
    } catch (error) {
        return handlerAnyError(error, res)
    }
}