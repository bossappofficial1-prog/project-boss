import { z } from "zod";

export const transitionQueueStatusSchema = z
    .object({
        status: z.enum([
            "AWAITING_PAYMENT",
            "CONFIRMED",
            "PROCESSING",
            "READY",
            "ON_GOING",
            "COMPLETED",
            "CANCELLED",
        ]),
        reason: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.status === "CANCELLED" && !data.reason) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Alasan pembatalan wajib diisi",
                path: ["reason"],
            });
        }
    });

export type TransitionQueueStatusInput = z.infer<typeof transitionQueueStatusSchema>;
