import z from "zod";

export const updateReceiptSettingSchema = z.object({
    photoString: z.string().optional().nullable(),
    showLogo: z.boolean().optional(),
    imageThreshold: z.number().optional(),
    endFeed: z.number().optional(),
    autoCut: z.boolean().optional(),
    copies: z.number().optional(),
    printWidth: z.number().optional(),
    headerText: z.string().optional().nullable(),
    footerText: z.string().optional().nullable(),
    showCashier: z.boolean().optional(),
    showCustomer: z.boolean().optional(),
    showQR: z.boolean().optional(),
    qrContent: z.string().optional().nullable(),
});

export type updateReceiptSettingValues = z.infer<typeof updateReceiptSettingSchema>