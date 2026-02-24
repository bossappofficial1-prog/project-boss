import { z } from "zod";

export const subscriptionIncomeQuerySchema = z.object({
    months: z.coerce.number().int().min(1).max(24).default(12)
});

export type SubscriptionIncomeQueryInput = z.infer<typeof subscriptionIncomeQuerySchema>;
