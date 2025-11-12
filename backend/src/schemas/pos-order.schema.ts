import { z } from 'zod';
import { onlinePaymentChannelSchema } from './order.schema';

const posOrderItemSchema = z.object({
    productId: z.string(),
    quantity: z.number()
        .int({ message: 'Quantity harus berupa bilangan bulat' })
        .min(1, { message: 'Quantity minimal 1' })
        .max(1000, { message: 'Quantity maksimal 1000' }),
});

export const createPosOrderSchema = z.object({
    guestCustomer: z.object({
        name: z.string()
            .min(1, { message: 'Nama tidak boleh kosong' })
            .max(100, { message: 'Nama maksimal 100 karakter' }),
        phone: z.string()
            .min(8, { message: 'Nomor telepon minimal 8 digit' })
            .max(15, { message: 'Nomor telepon maksimal 15 digit' })
            .regex(/^[0-9+\-\s()]+$/, { message: 'Format nomor telepon tidak valid' }),
    }),
    outletId: z.string(),
    items: z.array(posOrderItemSchema)
        .min(1, { message: 'Pesanan harus memiliki minimal 1 item' })
        .max(50, { message: 'Pesanan maksimal 50 item berbeda' }),
    bookingDate: z.string().datetime().optional(),
    bookingSlotId: z.string().uuid().optional(),
    staffId: z.string().uuid().optional(),
    paymentMethod: z.enum(['cash', 'qris', 'online'], {
        errorMap: () => ({ message: "Payment method harus 'cash', 'qris', atau 'online'" }),
    }),
    onlinePaymentChannel: onlinePaymentChannelSchema.optional(),
}).refine(
    (data) => {
        if (data.paymentMethod === 'online') {
            return Boolean(data.onlinePaymentChannel);
        }
        return true;
    },
    {
        message: 'Online payment channel wajib diisi untuk pembayaran online',
        path: ['onlinePaymentChannel'],
    },
).refine(
    (data) => {
        if (data.bookingSlotId) {
            return Boolean(data.bookingDate);
        }
        return true;
    },
    {
        message: 'Booking slot harus punya tanggal booking',
        path: ['bookingDate'],
    },
).refine(
    (data) => {
        if (data.bookingSlotId) {
            return Boolean(data.staffId);
        }
        if (data.staffId) {
            return Boolean(data.bookingSlotId);
        }
        return true;
    },
    {
        message: 'Staff wajib dipilih ketika menggunakan slot booking',
        path: ['staffId'],
    },
);

export type CreatePosOrderInput = z.infer<typeof createPosOrderSchema>;
