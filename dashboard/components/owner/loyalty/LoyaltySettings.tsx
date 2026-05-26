"use client";

import React from "react";
import { useLoyaltyConfig, useUpsertLoyaltyConfig } from "@/hooks/api/use-loyalty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Calculator, Trophy, Gift, Clock, Percent, ShieldCheck, Sparkles } from "lucide-react";
import { ReusableForm, type FormFieldConfig } from "@/components/ui/reuseable-form";
import * as z from "zod";

const settingsSchema = z.object({
    isActive: z.boolean().default(true),
    autoEnroll: z.boolean().default(true),
    pointsEarned: z.coerce.number().min(0, "Poin minimal 0").default(1),
    multiplierAmount: z.coerce.number().min(1, "Kelipatan minimal 1").default(10000),
    minSpending: z.coerce.number().min(0, "Minimal belanja minimal 0").default(0),
    pointValue: z.coerce.number().min(0, "Nilai potongan minimal 0").default(0),
    welcomeBonus: z.coerce.number().min(0, "Bonus minimal 0").default(0),
    maxRedeemPercent: z.coerce.number().min(0, "Minimal 0%").max(100, "Maksimal 100%").default(100),
    minRedeemPoints: z.coerce.number().min(1, "Minimum 1 poin").default(1),
    expiryEnabled: z.boolean().default(false),
    expiryDays: z.coerce.number().min(1, "Minimal 1 hari").nullable().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function LoyaltySettings({ outletId }: { outletId: string }) {
    const { data: config, isLoading } = useLoyaltyConfig(outletId);
    const upsertConfig = useUpsertLoyaltyConfig();

    const [formValues, setFormValues] = React.useState<Partial<SettingsFormValues>>({});

    const fields: FormFieldConfig<SettingsFormValues>[] = [
        // --- SECTION 1: STATUS PROGRAM ---
        {
            name: "isActive",
            label: "Program Loyalty Aktif",
            type: "dual-option-switch",
            description: "Aktifkan untuk mulai mencatat poin pelanggan secara otomatis.",
            colSpan: 1,
            switchOptions: {
                left: { label: "Nonaktif", value: false },
                right: { label: "Aktif", value: true },
            },
        },
        {
            name: "autoEnroll",
            label: "Pendaftaran Otomatis",
            type: "dual-option-switch",
            description: "Otomatis daftarkan pelanggan jadi member saat transaksi pertama selesai.",
            colSpan: 1,
            switchOptions: {
                left: { label: "Manual", value: false },
                right: { label: "Otomatis", value: true },
            },
        },
        // --- SECTION 2: PEROLEHAN POIN ---
        {
            name: "pointsEarned",
            label: "Poin yang Didapat",
            type: "number",
            placeholder: "1",
            description: "Jumlah poin yang didapatkan pelanggan per kelipatan belanja.",
            colSpan: 1,
        },
        {
            name: "multiplierAmount",
            label: "Kelipatan Belanja (Rp)",
            type: "currency",
            placeholder: "10000",
            description: "Nilai nominal belanja kelipatan untuk memicu poin (misal: Rp 10.000).",
            colSpan: 1,
        },
        {
            name: "minSpending",
            label: "Minimal Belanja (Rp)",
            type: "currency",
            placeholder: "0",
            description: "Minimal total belanja dalam satu transaksi untuk berhak mendapatkan poin.",
            colSpan: 1,
        },
        {
            name: "welcomeBonus",
            label: "Bonus Selamat Datang (Poin)",
            type: "number",
            placeholder: "0",
            description: "Poin bonus gratis yang otomatis diberikan kepada member baru.",
            colSpan: 1,
        },
        // --- SECTION 3: KETENTUAN CHECKOUT / KLAIM ---
        {
            name: "maxRedeemPercent",
            label: "Batas Potongan Belanja (%)",
            type: "percentage",
            placeholder: "100",
            description: "Persentase maksimal dari total belanja yang boleh dibayar menggunakan poin.",
            colSpan: 1,
        },
        {
            name: "minRedeemPoints",
            label: "Minimum Sekali Tukar (Poin)",
            type: "number",
            placeholder: "1",
            description: "Minimum poin aktif yang harus dimiliki pelanggan agar bisa ditukar.",
            colSpan: 1,
        },
        {
            name: "pointValue",
            label: "Nilai Potongan Per Poin (Rp) [Legacy]",
            type: "currency",
            placeholder: "0",
            description: "Nilai uang 1 poin jika ingin menggunakan pemotongan langsung tanpa katalog reward.",
            colSpan: 1,
        },
        {
            name: "expiryEnabled",
            label: "Aktifkan Kedaluwarsa Poin",
            type: "dual-option-switch",
            description: "Poin akan otomatis hangus setelah jangka waktu tertentu.",
            colSpan: 1,
            switchOptions: {
                left: { label: "Poin Abadi", value: false },
                right: { label: "Pakai Masa Aktif", value: true },
            },
        },
        {
            name: "expiryDays",
            label: "Masa Berlaku Poin (Hari)",
            type: "number",
            placeholder: "365",
            description: "Lama waktu poin berlaku sejak transaksi diselesaikan.",
            colSpan: 1,
            condition: (values) => values.expiryEnabled === true,
        },
    ];

    const handleSubmit = async (values: SettingsFormValues) => {
        try {
            const payload = {
                ...values,
                expiryDays: values.expiryEnabled ? values.expiryDays : null,
            };
            // @ts-ignore
            delete payload.expiryEnabled;

            await upsertConfig.mutateAsync({ outletId, data: payload as any });
            toast.success("Semua pengaturan loyalty berhasil diperbarui!");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Gagal menyimpan pengaturan");
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-[250px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const currentMultiplier = formValues.multiplierAmount ?? config?.multiplierAmount ?? 10000;
    const currentPoints = formValues.pointsEarned ?? config?.pointsEarned ?? 1;
    const currentWelcomeBonus = formValues.welcomeBonus ?? config?.welcomeBonus ?? 0;
    const currentPointValue = formValues.pointValue ?? config?.pointValue ?? 0;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left/Middle Column: Comprehensive Unified Form */}
            <div className="lg:col-span-2 space-y-6">
                <Card className="rounded-lg border border-border/80 bg-background shadow-sm overflow-hidden">
                    <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-foreground/90 flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            Loyalty & Points Program Settings
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Kelola status keaktifan program, parameter kelipatan poin, bonus pendaftaran, dan batasan klaim poin member.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6">
                        <ReusableForm
                            schema={settingsSchema}
                            fields={fields}
                            defaultValues={{
                                isActive: config?.isActive ?? true,
                                autoEnroll: config?.autoEnroll ?? true,
                                pointsEarned: config?.pointsEarned ?? 1,
                                multiplierAmount: config?.multiplierAmount ?? 10000,
                                minSpending: config?.minSpending ?? 0,
                                pointValue: config?.pointValue ?? 0,
                                welcomeBonus: config?.welcomeBonus ?? 0,
                                maxRedeemPercent: config?.maxRedeemPercent ?? 100,
                                minRedeemPoints: config?.minRedeemPoints ?? 1,
                                expiryEnabled: config?.expiryDays !== null && config?.expiryDays !== undefined && config?.expiryDays > 0,
                                expiryDays: config?.expiryDays ?? 365,
                            }}
                            onSubmit={handleSubmit}
                            submitText="Simpan Semua Pengaturan"
                            loadingText="Menyimpan..."
                            isLoading={upsertConfig.isPending}
                            gridCols={2}
                            onValuesChange={setFormValues}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Right Column: Real-time Live Interactive Simulation Engine */}
            <div className="space-y-6">
                <Card className="rounded-lg border border-border/80 bg-background shadow-sm overflow-hidden sticky top-6">
                    <CardHeader className="p-6 border-b border-border/40 bg-muted/20">
                        <CardTitle className="text-sm font-bold uppercase tracking-widest text-foreground/90 flex items-center gap-2">
                            <Calculator className="h-4 w-4 text-primary" />
                            Live Simulation Engine
                        </CardTitle>
                        <CardDescription className="text-xs text-muted-foreground mt-1">
                            Simulasi real-time perolehan & nilai potongan belanja poin member saat bertransaksi.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        {/* Simulation 1: Poin per Kelipatan */}
                        <div className="rounded-md border border-blue-500/20 bg-blue-500/5 p-4 space-y-3 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                <Calculator className="h-12 w-12 text-blue-500" />
                            </div>
                            <div className="flex items-center gap-2">
                                <Trophy className="h-4 w-4 text-blue-500" />
                                <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Simulasi Transaksi</span>
                            </div>
                            <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                                Jika pelanggan melakukan transaksi senilai <span className="font-bold text-foreground tabular-nums">Rp {(currentMultiplier * 2.5).toLocaleString("id-ID")}</span>:
                            </p>
                            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-500/10 border border-blue-500/30">
                                <Trophy className="h-4 w-4 text-blue-600" />
                                <span className="text-base font-bold text-blue-600 tabular-nums">
                                    +{ (Math.floor((currentMultiplier * 2.5) / currentMultiplier) * currentPoints).toLocaleString("id-ID") } Poin
                                </span>
                            </div>
                            <p className="text-[10px] text-muted-foreground italic leading-tight">
                                *Dihitung dengan rumus: `floor(Total Belanja / {currentMultiplier.toLocaleString("id-ID")}) × {currentPoints}`
                            </p>
                        </div>

                        {/* Simulation 2: Welcome Bonus */}
                        {currentWelcomeBonus > 0 && (
                            <div className="rounded-md border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <Gift className="h-12 w-12 text-emerald-500" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Gift className="h-4 w-4 text-emerald-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Hadiah Pendaftaran</span>
                                </div>
                                <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                                    Pelanggan baru terdaftar otomatis akan langsung mendapatkan bonus awal:
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                                    <Sparkles className="h-4 w-4 text-emerald-600 animate-pulse" />
                                    <span className="text-base font-bold text-emerald-600 tabular-nums">
                                        +{currentWelcomeBonus.toLocaleString("id-ID")} Poin Selamat Datang!
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Simulation 3: Legacy point values */}
                        {currentPointValue > 0 && (
                            <div className="rounded-md border border-purple-500/20 bg-purple-500/5 p-4 space-y-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <Percent className="h-12 w-12 text-purple-500" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Percent className="h-4 w-4 text-purple-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Nilai Konversi Poin [Legacy]</span>
                                </div>
                                <p className="text-sm font-medium text-foreground/80 leading-relaxed">
                                    Tiap poin aktif yang ditukar langsung tanpa katalog reward bernilai potongan:
                                </p>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-purple-500/10 border border-purple-500/30">
                                    <ShieldCheck className="h-4 w-4 text-purple-600" />
                                    <span className="text-base font-bold text-purple-600 tabular-nums">
                                        1 Poin = Rp {currentPointValue.toLocaleString("id-ID")}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Simulation 4: Expiry warning */}
                        {formValues.expiryEnabled && (
                            <div className="rounded-md border border-orange-500/20 bg-orange-500/5 p-4 space-y-2 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 transition-transform">
                                    <Clock className="h-12 w-12 text-orange-500" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-orange-500" />
                                    <span className="text-xs font-bold uppercase tracking-wider text-orange-600">Kebijakan Kedaluwarsa</span>
                                </div>
                                <p className="text-xs font-medium text-orange-800 dark:text-orange-300 leading-relaxed">
                                    Poin yang didapatkan oleh pelanggan akan otomatis hangus jika tidak ditukarkan dalam jangka waktu <span className="font-bold tabular-nums">{formValues.expiryDays ?? 365} hari</span> sejak transaksi dilakukan.
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
