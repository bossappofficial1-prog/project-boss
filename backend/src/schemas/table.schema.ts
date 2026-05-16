import { z } from "zod";
import { TableStatus } from "@prisma/client";

export const createTableSchema = z.object({
  name: z.string().min(1, "Nama meja wajib diisi"),
  capacity: z.number().int().min(1, "Kapasitas minimal 1 person").default(2),
  note: z.string().optional(),
  outletId: z.string(),
});

export const updateTableSchema = z.object({
  name: z.string().min(1).optional(),
  capacity: z.number().int().min(1).optional(),
  status: z.nativeEnum(TableStatus).optional(),
  note: z.string().optional(),
});

export type CreateTableInput = z.infer<typeof createTableSchema>;
export type UpdateTableInput = z.infer<typeof updateTableSchema>;
