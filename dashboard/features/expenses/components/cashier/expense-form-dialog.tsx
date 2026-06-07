"use client";

import { useMemo } from "react";
import { z } from "zod";
import { ReusableForm, type FormFieldConfig } from "@/components/ui/reuseable-form";
import type { Expense } from "@/hooks/api/use-expenses";
import { uploadApi } from "@/lib/api";
import { toast } from "sonner";
import { ACCEPTED_FILE_TYPES } from "@/lib/file-types";

const expenseSchema = z.object({
    description: z.string().min(1, "Deskripsi wajib diisi"),
    amount: z.coerce.number().min(1, "Jumlah harus lebih dari 0"),
    date: z.coerce.date("Tanggal wajib diisi"),
    receiptUrl: z
        .union([
            z.string().url(),
            z.instanceof(File)
        ])
        .optional()
        .nullable(),
});

type ExpenseFormValues = z.infer<typeof expenseSchema>;

const expenseFields: FormFieldConfig<ExpenseFormValues>[] = [
    {
        name: "description",
        label: "Deskripsi",
        type: "text",
        placeholder: "Contoh: Beli pulsa listrik",
    },
    {
        name: "amount",
        label: "Jumlah (Rp)",
        type: "currency",
        placeholder: "50.000",
    },
    {
        name: "date",
        label: "Tanggal & Waktu",
        type: "date",
    },
    {
        name: "receiptUrl",
        label: "Bukti Transaksi",
        type: "file",
        accept: ACCEPTED_FILE_TYPES.IMAGE
    },
];

interface ExpenseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial?: Expense | null;
    isLoading?: boolean;
    onSubmit: (
        data: { description: string; amount: number; date: string; receiptUrl?: string | undefined | null },
        id?: string
    ) => void;
}

export function ExpenseFormDialog({
    open,
    onOpenChange,
    initial,
    isLoading,
    onSubmit,
}: ExpenseFormDialogProps) {
    const isEdit = Boolean(initial);

    const defaultValues = useMemo<Partial<ExpenseFormValues>>(
        () => ({
            description: initial?.description ?? "",
            amount: initial?.amount ?? 0,
            date: initial?.date ? new Date(initial.date) : new Date(),
            receiptUrl: initial?.receiptUrl ?? undefined,
        }),
        [initial]
    );

    const handleSubmit = async (values: ExpenseFormValues | FormData) => {
        const v = values as FormData;
        const file = v.get("receiptUrl") as File;

        if (file) {
            try {
                const response = await uploadApi.uploadImage(file);
                v.set("receiptUrl", response.url);
            } catch (error) {
                toast.error("Gagal mengunggah bukti transaksi");
            }
        }

        onSubmit(
            {
                description: v.get("description")?.toString().trim() ?? "",
                amount: Number(v.get("amount")),
                date: v.get("date")?.toString() ?? "",
                receiptUrl: v.get("receiptUrl")?.toString() ?? "",
            },
            initial?.id
        );
    };

    return (
        <ReusableForm<ExpenseFormValues>
            withDialog
            isDialogOpen={open}
            onDialogOpenChange={onOpenChange}
            dialogTitle={isEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
            dialogDescription={
                isEdit
                    ? "Perbarui detail pengeluaran di bawah ini."
                    : "Isi detail pengeluaran baru."
            }
            schema={expenseSchema}
            defaultValues={defaultValues}
            fields={expenseFields}
            onSubmit={handleSubmit}
            isLoading={isLoading}
            submitText={isEdit ? "Simpan" : "Tambah"}
            cancelText="Batal"
        />
    );
}