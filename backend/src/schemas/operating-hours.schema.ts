import { z } from "zod";

const hoursSchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.coerce.date(),
    closeTime: z.coerce.date(),
    breakStart: z.coerce.date().nullable().optional(),
    breakEnd: z.coerce.date().nullable().optional(),
    isOpen: z.boolean().default(true),
})

export const createOperatingHoursSchema = z.object({
    hours: z.array(hoursSchema),
});

export const updateOperatingHoursSchema = z.object({
    openTime: z.coerce.date().optional(),
    closeTime: z.coerce.date().optional(),
    breakStart: z.coerce.date().nullable().optional(),
    breakEnd: z.coerce.date().nullable().optional(),
    isOpen: z.boolean().optional(),
});

export type CreateOperatingHoursInput = z.infer<typeof createOperatingHoursSchema>;
export type UpdateOperatingHoursInput = z.infer<typeof updateOperatingHoursSchema>;
