import { z } from "zod";

export const clockInSchema = z.object({
  outletId: z.string().min(1, "outletId wajib diisi"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});

export const clockOutSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
});

export const queryAttendanceSchema = z.object({
  outletId: z.string().optional(),
  staffId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type QueryAttendanceInput = z.infer<typeof queryAttendanceSchema>;
