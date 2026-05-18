import { z } from "zod";

export const createReservationSchema = z.object({
  customerName: z.string().min(1, "Nama pelanggan wajib diisi"),
  customerPhone: z.string().min(10, "Nomor telepon minimal 10 digit"),
  bookingDate: z.string().datetime("Format tanggal tidak valid"),
  durationMinutes: z.number().min(30, "Durasi minimal 30 menit").max(480, "Durasi maksimal 8 jam"),
  guestCount: z.number().min(1, "Minimal 1 tamu").max(20, "Maksimal 20 tamu"),
  tableId: z.string().min(1, "Meja wajib dipilih"),
  notes: z.string().optional(),
  outletId: z.string().uuid("ID Outlet tidak valid"),
});

export type CreateReservationInput = z.infer<typeof createReservationSchema>;

export const getReservationsQuerySchema = z.object({
  outletId: z.string().uuid("ID Outlet tidak valid"),
  date: z.string().optional(), // YYYY-MM-DD
  status: z.enum(["RESERVED", "OCCUPIED", "COMPLETED", "CANCELLED"]).optional(),
});

export type GetReservationsQuery = z.infer<typeof getReservationsQuerySchema>;

export const updateReservationStatusSchema = z.object({
  status: z.enum(["RESERVED", "ON_GOING", "COMPLETED", "CANCELLED"]),
});

export type UpdateReservationStatusInput = z.infer<typeof updateReservationStatusSchema>;
