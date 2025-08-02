import { z } from "zod";

export const createOperatingHoursSchema = z.object({
    outletId: z.string().uuid("ID outlet tidak valid"),
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.coerce.date(),
    closeTime: z.coerce.date(),
    isOpen: z.boolean().default(true),
});

export const updateOperatingHoursSchema = z.object({
    openTime: z.coerce.date().optional(),
    closeTime: z.coerce.date().optional(),
    isOpen: z.boolean().optional(),
});

export type CreateOperatingHoursInput = z.infer<typeof createOperatingHoursSchema>;
export type UpdateOperatingHoursInput = z.infer<typeof updateOperatingHoursSchema>;
