import { z } from "zod";
import { BookingSlotStatus } from "@prisma/client";

export const createBookingSlotSchema = z.object({
    productId: z.string().nonempty({ message: "ID Produk tidak boleh kosong" }),
    date: z.date(),
    startTime: z.date(),
    endTime: z.date(),
});

export type CreateBookingSlotInput = z.infer<typeof createBookingSlotSchema>;

export const updateBookingSlotSchema = z.object({
    status: z.nativeEnum(BookingSlotStatus).optional(),
    staffId: z.string().uuid().nullable().optional(),
}).refine(
    (payload) => Object.keys(payload).length > 0,
    { message: "Minimal satu field harus diupdate" }
);

export type UpdateBookingSlotInput = z.infer<typeof updateBookingSlotSchema>;