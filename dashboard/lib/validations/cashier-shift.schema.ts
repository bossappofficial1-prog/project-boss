import { z } from "zod";

export const openShiftSchema = z.object({
  openingCash: z.number().min(0, "Opening cash tidak boleh negatif").default(0),
  notes: z.string().max(500).optional(),
});

export const closeShiftSchema = z.object({
  closingCash: z.number().min(0, "Closing cash tidak boleh negatif"),
  notes: z.string().max(500).optional(),
});

export type OpenShiftValues = z.infer<typeof openShiftSchema>;
export type CloseShiftValues = z.infer<typeof closeShiftSchema>;

