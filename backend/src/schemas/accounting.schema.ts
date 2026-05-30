import { z } from "zod";

export const createAccountSchema = z.object({
  code: z.string().regex(/^\d{4}$/, { message: "Kode akun harus terdiri dari 4 digit angka" }),
  name: z.string().min(1, "Nama akun wajib diisi"),
  type: z.enum(["ASSET", "LIABILITY", "EQUITY", "REVENUE", "EXPENSE"], {
    errorMap: () => ({ message: "Tipe akun tidak valid" }),
  }),
});

export const updateAccountSchema = z.object({
  name: z.string().min(1, "Nama akun wajib diisi"),
});

const journalItemSchema = z.object({
  accountId: z.string().uuid("ID akun tidak valid"),
  debit: z.coerce.number().min(0, "Nilai debit tidak boleh negatif"),
  credit: z.coerce.number().min(0, "Nilai kredit tidak boleh negatif"),
}).refine(data => data.debit > 0 || data.credit > 0, {
  message: "Setiap baris jurnal harus memiliki salah satu dari nilai debit atau kredit",
});

export const createJournalEntrySchema = z.object({
  date: z.string().transform((val) => new Date(val)),
  reference: z.string().optional().nullable(),
  description: z.string().min(3, "Keterangan jurnal minimal 3 karakter"),
  items: z.array(journalItemSchema).min(2, "Jurnal berpasangan (double-entry) minimal memiliki 2 baris (Debit & Kredit)"),
}).refine((data) => {
  const sumDebits = data.items.reduce((sum, item) => sum + item.debit, 0);
  const sumCredits = data.items.reduce((sum, item) => sum + item.credit, 0);
  // Using tolerance for decimal matching (e.g. 0.01)
  return Math.abs(sumDebits - sumCredits) < 0.01;
}, {
  message: "Jumlah total Debit harus seimbang (sama dengan) jumlah total Kredit",
});

export type CreateAccountInput = z.infer<typeof createAccountSchema>;
export type UpdateAccountInput = z.infer<typeof updateAccountSchema>;
export type CreateJournalEntryInput = z.infer<typeof createJournalEntrySchema>;
