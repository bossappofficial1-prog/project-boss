import { z } from "zod";
import { StockMovementType } from "@prisma/client";

// Schema for recording stock IN (incoming stock from purchases/restocking)
export const stockInSchema = z.object({
  productGoodsId: z.string().nonempty({ message: "Product Goods ID diperlukan" }),
  quantity: z.number().int().positive({ message: "Quantity harus > 0" }),
  hppPerUnit: z.number().positive({ message: "HPP per unit harus > 0" }),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export type StockInInput = z.infer<typeof stockInSchema>;

// Schema for bulk stock IN
export const stockInBulkSchema = z.array(stockInSchema);
export type StockInBulkInput = z.infer<typeof stockInBulkSchema>;

// Schema for recording stock OUT (outgoing stock from sales/orders)
export const stockOutSchema = z.object({
  productGoodsId: z.string().nonempty({ message: "Product Goods ID diperlukan" }),
  quantity: z.number().int().positive({ message: "Quantity harus > 0" }),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export type StockOutInput = z.infer<typeof stockOutSchema>;

// Schema for manual stock adjustments
export const stockAdjustmentSchema = z.object({
  productGoodsId: z.string().nonempty({ message: "Product Goods ID diperlukan" }),
  quantity: z.number().int({ message: "Quantity harus integer" }), // Can be positive or negative
  notes: z.string().nonempty({ message: "Notes diperlukan untuk adjustment manual" }),
});

export type StockAdjustmentInput = z.infer<typeof stockAdjustmentSchema>;

// Schema for stock returns
export const stockReturnSchema = z.object({
  productGoodsId: z.string().nonempty({ message: "Product Goods ID diperlukan" }),
  quantity: z.number().int().positive({ message: "Quantity harus > 0" }),
  referenceType: z.string().optional(),
  referenceId: z.string().optional(),
  notes: z.string().optional(),
});

export type StockReturnInput = z.infer<typeof stockReturnSchema>;

// Schema for stock history query filters
export const stockHistoryQuerySchema = z.object({
  productGoodsId: z.string().nonempty(),
  type: z.nativeEnum(StockMovementType).optional(),
  startDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  endDate: z
    .string()
    .datetime()
    .optional()
    .transform((val) => (val ? new Date(val) : undefined)),
  limit: z.number().int().positive().default(50),
  offset: z.number().int().min(0).default(0),
});

export type StockHistoryQuery = z.infer<typeof stockHistoryQuerySchema>;
