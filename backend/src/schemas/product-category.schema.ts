import { z } from "zod";

export const createProductCategorySchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(50, "Nama kategori maksimal 50 karakter"),
  outletId: z.string(),
});

export const updateProductCategorySchema = createProductCategorySchema.partial();

export type CreateProductCategoryInput = z.infer<typeof createProductCategorySchema>;
export type UpdateProductCategoryInput = z.infer<typeof updateProductCategorySchema>;
