import { PaymentStatus } from "@prisma/client";
import { z } from "zod";

export const adminManualPaymentQuerySchema = z.object({
    status: z.string().optional(),
    outletId: z.string().uuid("outletId harus berupa UUID").optional(),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
});

export const adminManualPaymentRejectSchema = z.object({
    reason: z
        .string({ required_error: "Alasan penolakan wajib diisi" })
        .trim()
        .min(5, "Minimal 5 karakter"),
});

export type AdminManualPaymentQuery = z.infer<typeof adminManualPaymentQuerySchema>;
export type AdminManualPaymentRejectPayload = z.infer<typeof adminManualPaymentRejectSchema>;

export const parsePaymentStatuses = (value?: string): PaymentStatus[] | undefined => {
    if (!value) {
        return undefined;
    }

    const requested = value
        .split(",")
        .map((s) => s.trim().toUpperCase())
        .filter(Boolean);

    const valid = requested.filter((status): status is PaymentStatus =>
        Object.values(PaymentStatus).includes(status as PaymentStatus)
    );

    return valid.length > 0 ? valid : undefined;
};
