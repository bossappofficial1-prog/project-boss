import { z } from "zod";

export const createSupplierSchema = z.object({
  name: z.string().min(1, { message: "Nama supplier wajib diisi" }),
  phone: z.string().optional(),
  email: z
    .string()
    .email({ message: "Format email tidak valid" })
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  outletId: z.string().min(1, { message: "Outlet ID wajib diisi" }),
  productGoodsIds: z.array(z.string()).optional(),
});

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>;

export const updateSupplierSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  email: z
    .string()
    .email({ message: "Format email tidak valid" })
    .optional()
    .or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
  productGoodsIds: z.array(z.string()).optional(),
});

export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>;

export const supplierQuerySchema = z.object({
  outletId: z.string().min(1),
  search: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(20),
});

export type SupplierQuery = z.infer<typeof supplierQuerySchema>;
