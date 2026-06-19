"use client";

import { useState } from "react";
import { useLoyaltyConfig, useUpsertLoyaltyConfig } from "@/hooks/api/use-loyalty";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { gooeyToast } from "goey-toast";
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
  maxRedeemPercent: z.coerce.number().min(0).max(100).default(100),
  minRedeemPoints: z.coerce.number().min(1, "Minimum 1 poin").default(1),
  expiryEnabled: z.boolean().default(false),
  expiryDays: z.coerce.number().min(1).nullable().optional(),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

export function LoyaltySettings({ outletId }: { outletId: string }) {
  const { data: config, isLoading } = useLoyaltyConfig(outletId);
  const upsertConfig = useUpsertLoyaltyConfig();
  const [formValues, setFormValues] = useState<Partial<SettingsFormValues>>({});

  const fields: FormFieldConfig<SettingsFormValues>[] = [
    {
      name: "isActive",
      label: "Program Aktif",
      type: "dual-option-switch",
      description: "Aktifkan untuk mencatat poin pelanggan otomatis.",
      colSpan: 1,
      switchOptions: {
        left: { label: "Nonaktif", value: false },
        right: { label: "Aktif", value: true },
      },
    },
    {
      name: "autoEnroll",
      label: "Auto Daftar",
      type: "dual-option-switch",
      description: "Otomatis daftarkan pelanggan jadi member.",
      colSpan: 1,
      switchOptions: {
        left: { label: "Manual", value: false },
        right: { label: "Otomatis", value: true },
      },
    },
    {
      name: "pointsEarned",
      label: "Poin per Kelipatan",
      type: "number",
      placeholder: "1",
      colSpan: 1,
    },
    {
      name: "multiplierAmount",
      label: "Kelipatan (Rp)",
      type: "currency",
      placeholder: "10000",
      colSpan: 1,
    },
    {
      name: "minSpending",
      label: "Min. Belanja (Rp)",
      type: "currency",
      placeholder: "0",
      colSpan: 1,
    },
    {
      name: "welcomeBonus",
      label: "Bonus Welcome (Poin)",
      type: "number",
      placeholder: "0",
      colSpan: 1,
    },
    {
      name: "maxRedeemPercent",
      label: "Batas Potongan (%)",
      type: "percentage",
      placeholder: "100",
      colSpan: 1,
    },
    {
      name: "minRedeemPoints",
      label: "Min. Tukar (Poin)",
      type: "number",
      placeholder: "1",
      colSpan: 1,
    },
    {
      name: "pointValue",
      label: "Nilai/Poin (Rp) [Legacy]",
      type: "currency",
      placeholder: "0",
      colSpan: 1,
    },
    {
      name: "expiryEnabled",
      label: "Poin Kedaluwarsa",
      type: "dual-option-switch",
      description: "Poin otomatis hangus setelah jangka waktu tertentu.",
      colSpan: 1,
      switchOptions: {
        left: { label: "Abadi", value: false },
        right: { label: "Ada Masa", value: true },
      },
    },
    {
      name: "expiryDays",
      label: "Masa Berlaku (Hari)",
      type: "number",
      placeholder: "365",
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
      delete (payload as any).expiryEnabled;
      await upsertConfig.mutateAsync({ outletId, data: payload as any });
      gooeyToast.success("Pengaturan loyalty berhasil disimpan!");
    } catch (err: any) {
      gooeyToast.error(err?.response?.data?.message || "Gagal menyimpan");
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-48 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const currentMultiplier = formValues.multiplierAmount ?? config?.multiplierAmount ?? 10000;
  const currentPoints = formValues.pointsEarned ?? config?.pointsEarned ?? 1;
  const currentWelcomeBonus = formValues.welcomeBonus ?? config?.welcomeBonus ?? 0;
  const currentPointValue = formValues.pointValue ?? config?.pointValue ?? 0;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Form */}
      <div className="lg:col-span-2">
        <Card className="shadow-sm border-border/60 gap-0 py-0">
          <CardHeader className="p-4 border-b border-border/40 bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              Pengaturan Loyalty
            </CardTitle>
            <CardDescription className="text-xs">
              Atur program poin dan reward member.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4">
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
                expiryEnabled: config?.expiryDays != null && config?.expiryDays > 0,
                expiryDays: config?.expiryDays ?? 365,
              }}
              onSubmit={handleSubmit}
              submitText="Simpan Pengaturan"
              loadingText="Menyimpan..."
              isLoading={upsertConfig.isPending}
              gridCols={2}
              onValuesChange={setFormValues}
            />
          </CardContent>
        </Card>
      </div>

      {/* Simulation Sidebar */}
      <div>
        <Card className="shadow-sm border-border/60 gap-0 py-0 sticky top-4">
          <CardHeader className="p-4 border-b border-border/40 bg-muted/10">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Calculator className="h-4 w-4 text-primary" />
              Simulasi
            </CardTitle>
            <CardDescription className="text-xs">
              Preview perolehan poin secara real-time.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-3 space-y-3">
            {/* Points simulation */}
            <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <Trophy className="h-3.5 w-3.5 text-blue-500" />
                <span className="text-[10px] font-bold uppercase text-blue-600">
                  Transaksi
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Belanja{" "}
                <span className="font-bold text-foreground">
                  Rp {(currentMultiplier * 2.5).toLocaleString("id-ID")}
                </span>
                :
              </p>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-500/10 border border-blue-500/30">
                <Trophy className="h-3.5 w-3.5 text-blue-600" />
                <span className="text-sm font-bold text-blue-600 tabular-nums">
                  +
                  {(
                    Math.floor((currentMultiplier * 2.5) / currentMultiplier) *
                    currentPoints
                  ).toLocaleString("id-ID")}{" "}
                  Poin
                </span>
              </div>
              <p className="text-[10px] text-muted-foreground italic">
                floor(belanja / {currentMultiplier.toLocaleString("id-ID")}) x{" "}
                {currentPoints}
              </p>
            </div>

            {/* Welcome bonus */}
            {currentWelcomeBonus > 0 && (
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Gift className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-[10px] font-bold uppercase text-emerald-600">
                    Welcome Bonus
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-sm font-bold text-emerald-600 tabular-nums">
                    +{currentWelcomeBonus.toLocaleString("id-ID")} Poin
                  </span>
                </div>
              </div>
            )}

            {/* Legacy point value */}
            {currentPointValue > 0 && (
              <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 space-y-2">
                <div className="flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-[10px] font-bold uppercase text-purple-600">
                    Konversi [Legacy]
                  </span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-500/10 border border-purple-500/30">
                  <ShieldCheck className="h-3.5 w-3.5 text-purple-600" />
                  <span className="text-sm font-bold text-purple-600 tabular-nums">
                    1 Poin = Rp {currentPointValue.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            )}

            {/* Expiry warning */}
            {formValues.expiryEnabled && (
              <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-3 space-y-1">
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-orange-500" />
                  <span className="text-[10px] font-bold uppercase text-orange-600">
                    Kedaluwarsa
                  </span>
                </div>
                <p className="text-[11px] text-orange-700 dark:text-orange-300">
                  Poin hangus setelah{" "}
                  <span className="font-bold tabular-nums">
                    {formValues.expiryDays ?? 365} hari
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
