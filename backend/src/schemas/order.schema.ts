import { z } from "zod";
import { OrderStatus } from "@prisma/client";

const orderItemSchema = z.object({
    productId: z.string().nonempty(),
    quantity: z.number().int().positive(),
});

export const createOrderSchema = z.object({
    guestCustomer: z.object({
        name: z.string().nonempty({ message: "Nama tidak boleh kosong" }),
        phone: z.string().nonempty({ message: "Nomor telepon tidak boleh kosong" }),
    }),
    outletId: z.string().nonempty({ message: "ID Outlet tidak boleh kosong" }),
    items: z.array(orderItemSchema).min(1, { message: "Pesanan harus memiliki minimal 1 item" }),
    bookingDate: z.string().datetime().optional(),
    paymentMethod: z.enum(["qris", "online"]).default("online"),
    bookingSlotId: z.string().optional(),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;

export const updateOrderStatusSchema = z.object({
    status: z.nativeEnum(OrderStatus),
});

export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;