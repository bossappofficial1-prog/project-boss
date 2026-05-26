import { z } from "zod";
import { PurchaseOrderStatus } from "@prisma/client";

export const purchaseOrderQuerySchema = z.object({
  outletId: z.string().min(1, { message: "Outlet ID wajib diisi" }),
  status: z.nativeEnum(PurchaseOrderStatus).optional(),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export type PurchaseOrderQueryInput = z.infer<typeof purchaseOrderQuerySchema>;

export const updatePOItemsSchema = z.object({
  notes: z.string().optional(),
  items: z.array(
    z.object({
      productGoodsId: z.string().optional(),
      ingredientId: z.string().optional(),
      quantity: z.number().positive({ message: "Jumlah pemesanan harus lebih besar dari 0" }),
      priceAtOrder: z.number().nonnegative({ message: "Harga pemesanan tidak boleh negatif" }),
    })
  ).min(1, { message: "Purchase Order minimal harus memiliki 1 barang" }),
});

export type UpdatePOItemsInput = z.infer<typeof updatePOItemsSchema>;
