import { z } from "zod";

export const renewSubscriptionSchema = z.object({
    planCode: z
        .string({
            invalid_type_error: "Kode paket harus berupa string",
        })
        .trim()
        .min(2, "Kode paket minimal 2 karakter")
        .optional(),
    billingCycle: z
        .number({
            invalid_type_error: "Billing cycle harus berupa angka",
        })
        .int({
            message: "Billing cycle harus berupa bilangan bulat",
        })
        .refine((val) => val === 30 || val === 365, {
            message: "Billing cycle harus 30 (monthly) atau 365 (yearly)",
        })
        .default(30),
});

export type RenewSubscriptionInput = z.infer<typeof renewSubscriptionSchema>;

export const switchBillingCycleSchema = z.object({
    billingCycle: z
        .number({
            required_error: "Billing cycle wajib diisi",
            invalid_type_error: "Billing cycle harus berupa angka",
        })
        .int({
            message: "Billing cycle harus berupa bilangan bulat",
        })
        .refine((val) => val === 30 || val === 365, {
            message: "Billing cycle harus 30 (monthly) atau 365 (yearly)",
        }),
});

export type SwitchBillingCycleInput = z.infer<typeof switchBillingCycleSchema>;
