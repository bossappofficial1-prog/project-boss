import z from "zod";

export const updateReceiptSettingSchema = z.object({
    photoString: z.string().optional().nullable(),
    showLogo: z.boolean().optional(),
    printHeight: z.string().optional(),
    printWidth: z.string().optional(),
});

export type updateReceiptSettingValues = z.infer<typeof updateReceiptSettingSchema>