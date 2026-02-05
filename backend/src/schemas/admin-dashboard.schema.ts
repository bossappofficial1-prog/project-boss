import { z } from "zod";

const intervalEnum = z.enum(["day", "week", "month"]);

export const adminDashboardInsightsQuerySchema = z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    interval: intervalEnum.default("day"),
});

export const adminDashboardRiskQuerySchema = z.object({
    limit: z.coerce.number().int().min(3).max(50).default(8),
});

export const adminDashboardActivityQuerySchema = z.object({
    limit: z.coerce.number().int().min(5).max(50).default(12),
});

export type AdminDashboardInterval = z.infer<typeof intervalEnum>;
export type AdminDashboardInsightsQuery = z.infer<typeof adminDashboardInsightsQuerySchema>;
export type AdminDashboardRiskQuery = z.infer<typeof adminDashboardRiskQuerySchema>;
export type AdminDashboardActivityQuery = z.infer<typeof adminDashboardActivityQuerySchema>;
