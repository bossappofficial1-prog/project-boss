"use client";

import React from "react";
import { useLoyaltyConfig, useUpsertLoyaltyConfig } from "@/hooks/api/use-loyalty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Calculator } from "lucide-react";
import { ReusableForm, type FormFieldConfig } from "@/components/ui/reuseable-form";
import * as z from "zod";

const loyaltySchema = z.object({
    isActive: z.boolean(),
    pointsEarned: z.number().min(0, "Poin minimal 0"),
    multiplierAmount: z.number().min(1, "Kelipatan minimal 1"),
    minSpending: z.number().min(0, "Minimal belanja minimal 0"),
    pointValue: z.number().min(0, "Nilai poin minimal 0"),
});

type LoyaltyFormValues = z.infer<typeof loyaltySchema>;

export function LoyaltySettings({ outletId }: { outletId: string }) {
    const { data: config, isLoading } = useLoyaltyConfig(outletId);
    const upsertConfig = useUpsertLoyaltyConfig();

    const [simulatedValues, setSimulatedValues] = React.useState<Partial<LoyaltyFormValues>>({});

    const fields: FormFieldConfig<LoyaltyFormValues>[] = [
        {
            name: "isActive",
            label: "Program Loyalty Aktif",
            type: "dual-option-switch",
            description: "Aktifkan untuk mulai mencatat poin pelanggan secara otomatis.",
            className: "w-max",
            switchOptions: {
                left: { label: "Nonaktif", value: false },
                right: { label: "Aktif", value: true },
            },
        },
        {
            name: "pointsEarned",
            label: "Poin yang Didapat",
            type: "number",
            description: "Jumlah poin yang diberikan per kelipatan belanja.",
            colSpan: 1,
        },
        {
            name: "multiplierAmount",
            label: "Kelipatan Belanja (Rp)",
            type: "currency",
            description: "Contoh: Isi 10000 jika 1 poin didapat tiap Rp 10.000.",
            colSpan: 1,
        },
        {
            name: "minSpending",
            label: "Minimal Belanja Pertama (Rp)",
            type: "currency",
            description: "Minimal total belanja untuk otomatis menjadi member.",
            colSpan: 1,
        },
        {
            name: "pointValue",
            label: "Nilai Tukar 1 Poin (Rp)",
            type: "currency",
            description: "Contoh: Isi 100 jika 1 poin bernilai Rp 100 saat belanja.",
            colSpan: 1,
        },
    ];

    const handleSubmit = async (values: LoyaltyFormValues) => {
        try {
            await upsertConfig.mutateAsync({ outletId, data: values });
            toast.success("Pengaturan loyalty berhasil disimpan!");
        } catch (err: any) {
            console.log(err);
            toast.error(err?.response?.data?.message || "Gagal menyimpan pengaturan");
        }
    };

    if (isLoading && !config) {
        return (
            <div className="flex h-[200px] items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
            </div>
        );
    }

    const multiplier = simulatedValues.multiplierAmount ?? config?.multiplierAmount ?? 10000;
    const points = simulatedValues.pointsEarned ?? config?.pointsEarned ?? 1;

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    Aturan Perolehan Poin
                </CardTitle>
                <CardDescription>
                    Tentukan bagaimana pelanggan mendapatkan poin dari setiap transaksi di outlet ini.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <ReusableForm
                    schema={loyaltySchema}
                    fields={fields}
                    defaultValues={{
                        isActive: config?.isActive ?? true,
                        pointsEarned: config?.pointsEarned ?? 1,
                        multiplierAmount: config?.multiplierAmount ?? 10000,
                        minSpending: config?.minSpending ?? 0,
                        pointValue: config?.pointValue ?? 0,
                    }}
                    onSubmit={handleSubmit}
                    submitText="Simpan Perubahan"
                    loadingText="Menyimpan..."
                    isLoading={upsertConfig.isPending}
                    gridCols={2}
                    onValuesChange={setSimulatedValues}
                />

                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/30 dark:bg-blue-900/10">
                    <div className="flex items-center gap-2 mb-2 text-blue-800 dark:text-blue-300">
                        <Calculator className="h-4 w-4" />
                        <span className="text-sm font-bold">Simulasi Perolehan:</span>
                    </div>
                    <p className="text-sm text-blue-700 dark:text-blue-400 leading-relaxed">
                        Jika pelanggan belanja <strong>Rp {(multiplier * 2.5).toLocaleString("id-ID")}</strong>,
                        maka mereka akan mendapatkan
                        <strong className="mx-1 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-900 dark:text-blue-200">
                            {Math.floor((multiplier * 2.5) / multiplier) * points} Poin
                        </strong>.
                    </p>
                    {simulatedValues.pointValue !== undefined && simulatedValues.pointValue > 0 && (
                        <p className="text-sm text-blue-700 dark:text-blue-400 mt-2 leading-relaxed italic">
                            * Tiap 1 poin dapat ditukar dengan potongan belanja senilai <strong>Rp {simulatedValues.pointValue.toLocaleString("id-ID")}</strong>.
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
