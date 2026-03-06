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

export const rescheduleQueueSchema = z.object({
    newSlotId: z.string().min(1, { message: "Slot baru wajib dipilih" }),
    newDate: z.string().datetime({ message: "Format tanggal tidak valid (ISO 8601)" }),
    newStartTime: z.string().datetime({ message: "Format waktu mulai tidak valid (ISO 8601)" }),
    newEndTime: z.string().datetime({ message: "Format waktu selesai tidak valid (ISO 8601)" }),
}).refine((data) => new Date(data.newEndTime) > new Date(data.newStartTime), {
    message: "Waktu selesai harus setelah waktu mulai",
    path: ["newEndTime"],
});

export type RescheduleQueueInput = z.infer<typeof rescheduleQueueSchema>;
