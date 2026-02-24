import { apiClient } from "@/lib/apis/base"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"

export const paymentStatus = [
    "PENDING",
    "PROOF_SUBMITTED",
    "AWAITING_VERIFICATION",
    "SUCCESS",
    "FAILED",
    "REFUNDED",
    "EXPIRED",
    "CANCELLED",
    "REJECTED_MANUAL"
] as const

export type PaymentStatusType = typeof paymentStatus[number]

interface Invoice {
    id: string
    invoiceNumber: string
    amount: number
    status: PaymentStatusType
    businessId: string
    subscriptionId: string
    createdAt: string
    rejectionReason?: string | null
    proofImage?: string | null
}

interface SubscriptionPlan {
    id: string
    name: string
    code: string
    price: number
    durationDays: number
}

interface InvoiceDetail extends Invoice {
    plan: SubscriptionPlan
}

export const useInvoice = (invoiceId: string) => {
    return useQuery({
        queryKey: ['invoice', invoiceId],
        queryFn: async () => (await apiClient.get(`/subscription/invoice/${invoiceId}`)).data.data as InvoiceDetail,
        enabled: !!invoiceId
    })
}

interface UploadInvoicePayload {
    invoiceId: string
    file: File
}

export const useUploadInvoiceProof = () => {
    const qc = useQueryClient()
    return useMutation<void, unknown, UploadInvoicePayload>({
        mutationFn: async ({ invoiceId, file }) => {
            const formData = new FormData()
            formData.append('proof', file)
            formData.append('invoiceId', invoiceId)
            await apiClient.post('/subscription/upload-proof', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
        },
        onSuccess: (_data, variables) => qc.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] })
    })
}