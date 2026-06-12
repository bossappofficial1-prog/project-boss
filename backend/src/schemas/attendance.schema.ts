import { z } from "zod";

export const clockInSchema = z.object({
  outletId: z.string().min(1, "outletId wajib diisi"),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  clockInFaceUrl: z.string().optional(),
});

export const clockOutSchema = z.object({
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  clockOutFaceUrl: z.string().optional(),
});

export const queryAttendanceSchema = z.object({
  outletId: z.string().optional(),
  staffId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export const portalClockSchema = z.object({
  staffId: z.string().min(1, "staffId wajib diisi"),
  pin: z.string().min(6, "PIN harus 6 digit").max(6, "PIN harus 6 digit"),
  outletId: z.string().min(1, "outletId wajib diisi"),
  type: z.enum(["in", "out"]),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  notes: z.string().optional(),
  faceImageUrl: z.string().optional(),
  registerFaceDescriptor: z.string().optional(),
});

export const verifyPinSchema = z.object({
  staffId: z.string().min(1, "staffId wajib diisi"),
  pin: z.string().min(6, "PIN harus 6 digit").max(6, "PIN harus 6 digit"),
  outletId: z.string().min(1, "outletId wajib diisi"),
});

export type ClockInInput = z.infer<typeof clockInSchema>;
export type ClockOutInput = z.infer<typeof clockOutSchema>;
export type QueryAttendanceInput = z.infer<typeof queryAttendanceSchema>;
export type PortalClockInput = z.infer<typeof portalClockSchema>;
export type VerifyPinInput = z.infer<typeof verifyPinSchema>;

