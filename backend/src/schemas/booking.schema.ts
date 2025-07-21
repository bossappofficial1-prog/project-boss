import { z } from "zod";
import { BookingSlotStatus } from "@prisma/client";

export const createBookingSlotSchema = z.object({
    productId: z.string().nonempty({ message: "ID Produk tidak boleh kosong" }),
    date: z.string().datetime({ message: "Format tanggal tidak valid" }),
    startTime: z.string().datetime({ message: "Format waktu mulai tidak valid" }),
    endTime: z.string().datetime({ message: "Format waktu selesai tidak valid" }),
});

export type CreateBookingSlotInput = z.infer<typeof createBookingSlotSchema>;

export const updateBookingSlotSchema = z.object({
    status: z.nativeEnum(BookingSlotStatus),
});

export type UpdateBookingSlotInput = z.infer<typeof updateBookingSlotSchema>;