"use client";

import { useMemo } from "react";
import { z } from "zod";
import { ReusableForm, type FormFieldConfig } from "@/components/ui/reuseable-form";
import { Input } from "@/components/ui/input";
import type { Expense } from "@/hooks/api/use-expenses";

const expenseSchema = z.object({
    description: z.string().min(1, "Deskripsi wajib diisi"),
    amount: z.number().min(1, "Jumlah harus lebih dari 0"),
    date: z.string().min(1, "Tanggal wajib diisi"),
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
        renderCustom: ({ field }) => (
            <Input
                type="datetime-local"
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value)}
                onBlur={field.onBlur}
                name={field.name}
            />
        ),
    },
];

function toLocalDatetime(isoStr?: string): string {
    const d = isoStr ? new Date(isoStr) : new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

interface ExpenseFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    initial?: Expense | null;
    isLoading?: boolean;
    onSubmit: (data: { description: string; amount: number; date: string }, id?: string) => void;
}

export function ExpenseFormDialog({
    open,
    onOpenChange,
    initial,
    isLoading,
    onSubmit,
}: ExpenseFormDialogProps) {
    const isEdit = Boolean(initial);

    const defaultValues = useMemo<Partial<ExpenseFormValues>>(() => ({
        description: initial?.description ?? "",
        amount: initial?.amount ?? 0,
        date: toLocalDatetime(initial?.date),
    }), [initial]);

    const handleSubmit = async (values: ExpenseFormValues | FormData) => {
        const v = values as ExpenseFormValues;
        const isoDate = new Date(v.date).toISOString();
        onSubmit({ description: v.description.trim(), amount: v.amount, date: isoDate }, initial?.id);
    };

    return (
        <ReusableForm<ExpenseFormValues>
            withDialog
            isDialogOpen={open}
            onDialogOpenChange={onOpenChange}
            dialogTitle={isEdit ? "Edit Pengeluaran" : "Tambah Pengeluaran"}
            dialogDescription={isEdit ? "Perbarui detail pengeluaran di bawah ini." : "Isi detail pengeluaran baru."}
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
