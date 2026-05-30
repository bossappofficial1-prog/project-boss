import { z } from "zod";
import { StockTransferStatus } from "@prisma/client";

export const stockTransferItemSchema = z.object({
  productId: z.string().nonempty({ message: "Product ID diperlukan" }),
  quantity: z.number().int().positive({ message: "Quantity harus > 0" }),
});

export const createStockTransferSchema = z.object({
  senderOutletId: z.string().nonempty({ message: "Outlet pengirim diperlukan" }),
  receiverOutletId: z.string().nonempty({ message: "Outlet penerima diperlukan" }),
  shippingDate: z
    .string()
    .nonempty({ message: "Tanggal pengiriman diperlukan" })
    .transform((val) => new Date(val)),
  note: z.string().optional(),
  items: z
    .array(stockTransferItemSchema)
    .min(1, { message: "Harus ada minimal satu produk yang dikirim" }),
});

export type CreateStockTransferInput = z.infer<typeof createStockTransferSchema>;

export const updateStockTransferStatusSchema = z.object({
  status: z.nativeEnum(StockTransferStatus, {
    errorMap: () => ({ message: "Status tidak valid" }),
  }),
});

export type UpdateStockTransferStatusInput = z.infer<typeof updateStockTransferStatusSchema>;
