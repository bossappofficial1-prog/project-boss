"use client";

import React from "react";
import { useLoyaltyConfig, useUpsertLoyaltyConfig } from "@/hooks/api/use-loyalty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Calculator, Trophy } from "lucide-react";
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
            colSpan: 2,
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
        <Card className="w-full gap-0 py-0 rounded-md border border-border/80 bg-background shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-border/40 bg-muted/30">
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-foreground/90 flex items-center gap-2">
                    <Calculator className="h-4 w-4 text-primary" />
                    Aturan Perolehan Poin
                </CardTitle>
                <CardDescription className="text-[10px] font-medium uppercase tracking-tighter opacity-70">
                    Tentukan bagaimana pelanggan mendapatkan poin dari setiap transaksi di outlet ini.
                </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-8">
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

                <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-5 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                        <Calculator className="h-16 w-16" />
                    </div>

                    <div className="flex items-center gap-2 mb-3">
                        <div className="h-5 w-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600/80">Simulasi Perolehan Poin</span>
                    </div>

                    <div className="space-y-3 relative z-10">
                        <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                            Jika pelanggan belanja <span className="font-bold text-foreground tabular-nums">Rp {(multiplier * 2.5).toLocaleString("id-ID")}</span>,
                            maka mereka akan mendapatkan:
                        </p>
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/30">
                            <Trophy className="h-4 w-4 text-blue-600" />
                            <span className="text-lg font-bold text-blue-600 tabular-nums">
                                {Math.floor((multiplier * 2.5) / multiplier) * points} Poin
                            </span>
                        </div>

                        {simulatedValues.pointValue !== undefined && simulatedValues.pointValue > 0 && (
                            <div className="pt-3 border-t border-blue-500/10">
                                <p className="text-[10px] font-medium text-blue-600/70 italic flex items-center gap-1.5">
                                    <span className="h-1 w-1 rounded-full bg-blue-500" />
                                    Tiap 1 poin bernilai <span className="font-bold not-italic tabular-nums">Rp {simulatedValues.pointValue.toLocaleString("id-ID")}</span> untuk potongan belanja.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
