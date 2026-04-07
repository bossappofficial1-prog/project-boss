import { z } from "zod";

export const upsertLoyaltyConfigSchema = z.object({
  pointsEarned: z.number().int().min(1).default(1),
  multiplierAmount: z.number().positive().default(10000),
  minSpending: z.number().min(0).default(0),
  pointValue: z.number().min(0).default(0),
  isActive: z.boolean().default(true),
});

export const registerMembershipSchema = z.object({
  guestCustomerId: z.string().uuid().optional(),
  outletId: z.string(),
  name: z.string().optional(),
  phone: z.string().optional(),
});

export const getMembersByOutletQuerySchema = z.object({
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type UpsertLoyaltyConfigInput = z.infer<typeof upsertLoyaltyConfigSchema>;
export type RegisterMembershipInput = z.infer<typeof registerMembershipSchema>;
export type GetMembersByOutletQuery = z.infer<typeof getMembersByOutletQuerySchema>;

export const adjustPointsSchema = z.object({
  points: z.number().int(),
});

export type AdjustPointsInput = z.infer<typeof adjustPointsSchema>;
