import { z } from "zod";

export const manualTransactionSchema = z.object({
  transactionDate: z.coerce.date({
    errorMap: () => ({ message: "Tanggal transaksi wajib diisi" }),
  }),
  customerName: z.string().max(100).optional(),
  customerPhone: z
    .string()
    .regex(/^[0-9+\-\s()]*$/, "Format nomor telepon tidak valid")
    .optional(),
  amount: z.coerce.number().positive("Jumlah harus lebih dari 0"),
  items: z
    .array(
      z.object({
        productId: z.string().min(1, "Pilih produk/jasa"),
        quantity: z.coerce.number().int().min(1, "Quantity minimal 1"),
        bookingDate: z.string().optional(),
      })
    )
    .min(1, "Minimal 1 item"),
});

export type ManualTransactionFormValues = z.infer<typeof manualTransactionSchema>;

export interface ManualTransactionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  outletId: string;
  onSubmit: (payload: any) => Promise<any>;
  isLoading?: boolean;
}
