import { z } from "zod";

export const requestDeleteTransactionSchema = z.object({
  transactionId: z.string().uuid({ message: "Transaction ID tidak valid" }),
  reason: z.string().min(3, { message: "Alasan minimal 3 karakter" }).max(500, { message: "Alasan maksimal 500 karakter" }).optional(),
});

export const approveDeleteRequestSchema = z.object({
  requestId: z.string().uuid({ message: "Request ID tidak valid" }),
});

export const rejectDeleteRequestSchema = z.object({
  requestId: z.string().uuid({ message: "Request ID tidak valid" }),
  rejectionNote: z.string().min(3, { message: "Catatan penolakan minimal 3 karakter" }).max(500, { message: "Catatan penolakan maksimal 500 karakter" }),
});

export type RequestDeleteTransactionInput = z.infer<typeof requestDeleteTransactionSchema>;
export type ApproveDeleteRequestInput = z.infer<typeof approveDeleteRequestSchema>;
export type RejectDeleteRequestInput = z.infer<typeof rejectDeleteRequestSchema>;
