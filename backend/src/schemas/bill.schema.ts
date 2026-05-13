import { z } from "zod";
import { BillStatus } from "@prisma/client";

export const createBillSchema = z.object({
  outletId: z.string().min(1, { message: "Outlet ID wajib diisi" }),
  tableId: z.string().uuid({ message: "Table ID tidak valid" }),
});

export const listBillsQuerySchema = z.object({
  outletId: z.string().min(1, { message: "Outlet ID wajib diisi" }),
  status: z.nativeEnum(BillStatus).optional(),
});

export type CreateBillInput = z.infer<typeof createBillSchema>;
export type ListBillsQuery = z.infer<typeof listBillsQuerySchema>;