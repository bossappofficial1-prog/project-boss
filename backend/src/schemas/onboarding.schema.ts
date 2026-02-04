import { z } from "zod";

export const completeOnboardingSchema = z.object({
    businessName: z.string().min(1, { message: "Nama bisnis tidak boleh kosong" }),
    description: z.string().optional(),
    selectedPlan: z.string().min(1, { message: "Plan harus dipilih" }),
});

export type CompleteOnboardingInput = z.infer<typeof completeOnboardingSchema>;
