import { z } from "zod";

export const exportTransactionReportSchema = z.object({
    startDate: z.string().min(1, "Tanggal awal wajib diisi"),
    endDate: z.string().min(1, "Tanggal akhir wajib diisi"),
}).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
}, {
    message: "Tanggal awal harus sebelum atau sama dengan tanggal akhir",
    path: ["endDate"],
});

export type ExportTransactionReportInput = z.infer<typeof exportTransactionReportSchema>;
