import { z } from 'zod';

const WebPushSubObjectSchema = z.object({
  endpoint: z.string().url({ message: "Endpoint harus berupa URL yang valid" }),
  expirationTime: z.number().nullable().optional(),
  keys: z.object({
    p256dh: z.string().min(1, { message: "Key p256dh tidak boleh kosong" }),
    auth: z.string().min(1, { message: "Key auth tidak boleh kosong" }),
  }),
});

const ExpoPushPayloadSchema = z.object({
  expoPushToken: z.string().min(1, { message: "Expo push token tidak boleh kosong" }),
  type: z.literal("expo"),
});

const WebPushPayloadSchema = z.object({
  subscription: WebPushSubObjectSchema,
  type: z.literal("web").optional().default("web"),
});

const OwnerInfoSchema = z.object({
  guestPhone: z.string().min(10, { message: "Nomor HP minimal 10 digit" }).optional(),
  guestName: z.string().optional(),
  userId: z.string().uuid({ message: "Format ID User (Owner) tidak valid" }).optional(),
  staffId: z.string().uuid({ message: "Format ID Staff (Kasir) tidak valid" }).optional(),
});

export const PushSubscriptionPayloadSchema = z.discriminatedUnion("type", [
  WebPushPayloadSchema.merge(OwnerInfoSchema),
  ExpoPushPayloadSchema.merge(OwnerInfoSchema),
]).refine((data) => {
  return data.guestPhone || data.userId || data.staffId;
}, {
  message: "Harus menyertakan setidaknya satu ID pengenal (guestPhone, userId, atau staffId)",
  path: ["guestPhone"],
});

export type PushSubscriptionPayload = z.infer<typeof PushSubscriptionPayloadSchema>;
