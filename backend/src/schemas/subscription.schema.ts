import { z } from "zod";

export const renewSubscriptionSchema = z.object({
    planCode: z
        .string({
            invalid_type_error: "Kode paket harus berupa string",
        })
        .trim()
        .min(2, "Kode paket minimal 2 karakter")
        .optional(),
});

export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>;
