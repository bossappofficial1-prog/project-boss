import { z } from "zod";

export const sendBroadcastSchema = z.object({
  message: z.string().min(1, "Pesan siaran tidak boleh kosong"),
  outletId: z.string().uuid("ID Outlet tidak valid").optional(),
  tierId: z.string().uuid("ID Tier tidak valid").optional(),
  scheduledAt: z.string().datetime("Format tanggal jadwal tidak valid").optional(),
});

export type SendBroadcastInput = z.infer<typeof sendBroadcastSchema>;
