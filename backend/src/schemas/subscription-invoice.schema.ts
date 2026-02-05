import { z } from "zod";
export { parsePaymentStatuses } from "./manual-payment.schema";

export const adminSubscriptionInvoiceQuerySchema = z.object({
    status: z.string().optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export const adminSubscriptionInvoiceRejectSchema = z.object({
    reason: z
        .string({ required_error: "Alasan penolakan wajib diisi" })
        .trim()
        .min(5, "Minimal 5 karakter"),
});

export type AdminSubscriptionInvoiceQuery = z.infer<typeof adminSubscriptionInvoiceQuerySchema>;
export type AdminSubscriptionInvoiceRejectPayload = z.infer<typeof adminSubscriptionInvoiceRejectSchema>;
