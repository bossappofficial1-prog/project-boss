import { z } from "zod";

export const openCashierShiftSchema = z.object({
  outletId: z.string().min(1, "outletId wajib diisi"),
  openingCash: z.number().min(0, "Opening cash tidak boleh negatif").default(0),
  notes: z.string().max(500).optional(),
});

export const closeCashierShiftSchema = z.object({
  closingCash: z.number().min(0, "Closing cash tidak boleh negatif"),
  notes: z.string().max(500).optional(),
});

export const createCashMovementSchema = z.object({
  type: z.enum(["CASH_DROP", "PAID_OUT", "ADJUSTMENT_IN", "ADJUSTMENT_OUT"]),
  amount: z.number().positive("Amount harus lebih dari 0"),
  note: z.string().max(500).optional(),
});

