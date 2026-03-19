import { z } from "zod";

const hoursSchema = z.object({
    dayOfWeek: z.number().min(0).max(6),
    openTime: z.coerce.date(),
    closeTime: z.coerce.date(),
    isOpen: z.boolean().default(true),
    isRestEnabled: z.boolean().default(false),
    restStartTime: z.coerce.date().nullable().optional(),
    restEndTime: z.coerce.date().nullable().optional(),
})

export const createOperatingHoursSchema = z.object({
    hours: z.array(hoursSchema),
});

export const updateOperatingHoursSchema = z.object({
    openTime: z.coerce.date().optional(),
    closeTime: z.coerce.date().optional(),
    isOpen: z.boolean().optional(),
    isRestEnabled: z.boolean().optional(),
    restStartTime: z.coerce.date().nullable().optional(),
    restEndTime: z.coerce.date().nullable().optional(),
});

export type CreateOperatingHoursInput = z.infer<typeof createOperatingHoursSchema>;
export type UpdateOperatingHoursInput = z.infer<typeof updateOperatingHoursSchema>;
