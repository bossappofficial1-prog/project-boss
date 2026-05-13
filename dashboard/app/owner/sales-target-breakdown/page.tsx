"use client";

import { useState, useMemo } from "react";
import { Target, Calendar, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Period = "monthly" | "quarterly" | "yearly";

interface OperationalConfig {
  workDaysPerWeek: number;
  operationalHoursPerDay: number;
  weeksPerMonth: number;
}

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function parseNum(val: string): number {
  const clean = val.replace(/[^\d.-]/g, "");
  const parsed = parseFloat(clean);
  return isNaN(parsed) ? 0 : parsed;
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: "monthly", label: "Bulanan" },
  { value: "quarterly", label: "Kuartalan (3 bulan)" },
  { value: "yearly", label: "Tahunan" },
];

function StatCard({
  label,
  value,
  sub,
  highlight,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-lg p-3 space-y-1 ${
        highlight ? "bg-primary/5 border border-primary/20" : "bg-muted"
      }`}
    >
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`text-lg font-semibold tabular-nums tracking-tight ${highlight ? "text-primary" : "text-foreground"}`}
      >
        {value}
      </p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

export default function SalesTargetBreakdown() {
  const [targetAmount, setTargetAmount] = useState<number>(0);
  const [period, setPeriod] = useState<Period>("monthly");
  const [avgTransactionValue, setAvgTransactionValue] = useState<number>(0);
  const [growthRate, setGrowthRate] = useState<number>(0);
  const [ops, setOps] = useState<OperationalConfig>({
    workDaysPerWeek: 6,
    operationalHoursPerDay: 10,
    weeksPerMonth: 4,
  });

  const result = useMemo(() => {
    const monthlyTarget =
      period === "monthly"
        ? targetAmount
        : period === "quarterly"
          ? targetAmount / 3
          : targetAmount / 12;

    const workDaysPerMonth = ops.workDaysPerWeek * ops.weeksPerMonth;
    const workHoursPerMonth = workDaysPerMonth * ops.operationalHoursPerDay;

    const dailyTarget =
      workDaysPerMonth > 0 ? monthlyTarget / workDaysPerMonth : 0;
    const weeklyTarget = monthlyTarget / ops.weeksPerMonth;
    const hourlyTarget =
      workHoursPerMonth > 0 ? monthlyTarget / workHoursPerMonth : 0;

    const transactionsPerDay =
      avgTransactionValue > 0 && dailyTarget > 0
        ? Math.ceil(dailyTarget / avgTransactionValue)
        : 0;
    const transactionsPerHour =
      avgTransactionValue > 0 && hourlyTarget > 0
        ? (hourlyTarget / avgTransactionValue).toFixed(1)
        : "0";

    const monthlyWithGrowth = (month: number) =>
      monthlyTarget * Math.pow(1 + growthRate / 100, month - 1);

    return {
      monthlyTarget,
      weeklyTarget,
      dailyTarget,
      hourlyTarget,
      workDaysPerMonth,
      workHoursPerMonth,
      transactionsPerDay,
      transactionsPerHour,
      monthlyWithGrowth,
    };
  }, [targetAmount, period, avgTransactionValue, growthRate, ops]);

  const isValid = targetAmount > 0;

  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "Mei",
    "Jun",
    "Jul",
    "Agu",
    "Sep",
    "Okt",
    "Nov",
    "Des",
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Sales Target Breakdown
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Pecah target omzet menjadi angka operasional harian
          </p>
        </div>
        {isValid && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            {formatRupiah(result.dailyTarget)} / hari
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input */}
        <div className="lg:col-span-2 space-y-4">
          {/* Target Input */}
          <Card className="py-0 gap-0 shadow-none border-border/50">
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Target Omzet</Label>
                  <Input
                    type="number"
                    min={0}
                    className="rounded-md"
                    placeholder="Contoh: 50000000"
                    value={targetAmount || ""}
                    onChange={(e) => setTargetAmount(parseNum(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Periode</Label>
                  <Select
                    value={period}
                    onValueChange={(v) => setPeriod(v as Period)}
                  >
                    <SelectTrigger className="rounded-md">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PERIOD_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Rata-rata Nilai Transaksi
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    className="rounded-md"
                    placeholder="Contoh: 75000"
                    value={avgTransactionValue || ""}
                    onChange={(e) =>
                      setAvgTransactionValue(parseNum(e.target.value))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Target Pertumbuhan per Bulan (%)
                  </Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    className="rounded-md"
                    placeholder="Contoh: 10"
                    value={growthRate || ""}
                    onChange={(e) => setGrowthRate(parseNum(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Operasional Config */}
          <Card className="py-0 gap-0 shadow-none border-border/50">
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                Konfigurasi Operasional
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Hari kerja/minggu
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={7}
                    className="rounded-md"
                    value={ops.workDaysPerWeek}
                    onChange={(e) =>
                      setOps((prev) => ({
                        ...prev,
                        workDaysPerWeek: parseNum(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">
                    Jam operasi/hari
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={24}
                    className="rounded-md"
                    value={ops.operationalHoursPerDay}
                    onChange={(e) =>
                      setOps((prev) => ({
                        ...prev,
                        operationalHoursPerDay: parseNum(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Minggu/bulan</Label>
                  <Input
                    type="number"
                    min={1}
                    max={5}
                    className="rounded-md"
                    value={ops.weeksPerMonth}
                    onChange={(e) =>
                      setOps((prev) => ({
                        ...prev,
                        weeksPerMonth: parseNum(e.target.value) || 1,
                      }))
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-3">
                Total: {result.workDaysPerMonth} hari kerja/bulan ·{" "}
                {result.workHoursPerMonth} jam operasi/bulan
              </p>
            </CardContent>
          </Card>

          {/* Growth Projection Table */}
          {isValid && growthRate > 0 && (
            <Card className="py-0 gap-0 shadow-none border-border/50">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-medium flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Proyeksi 12 Bulan (growth {growthRate}%/bulan)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {months.map((month, i) => {
                    const val = result.monthlyWithGrowth(i + 1);
                    return (
                      <div
                        key={month}
                        className="flex items-center justify-between text-sm py-1.5 px-2 rounded-md bg-muted"
                      >
                        <span className="text-muted-foreground">{month}</span>
                        <span className="tabular-nums font-medium text-xs">
                          {formatRupiah(val)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-muted-foreground mt-3">
                  Total 12 bulan:{" "}
                  <span className="font-medium text-foreground">
                    {formatRupiah(
                      Array.from({ length: 12 }, (_, i) =>
                        result.monthlyWithGrowth(i + 1),
                      ).reduce((a, b) => a + b, 0),
                    )}
                  </span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Summary */}
        <div>
          <Card className="py-0 gap-0 shadow-none border-border/50 sticky top-6">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-lg font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-primary" />
                Breakdown Target
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 space-y-3">
              {!isValid ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Isi target omzet untuk melihat breakdown
                </p>
              ) : (
                <>
                  <StatCard
                    label="Target Bulanan"
                    value={formatRupiah(result.monthlyTarget)}
                    sub={
                      period !== "monthly"
                        ? `dari ${PERIOD_OPTIONS.find((o) => o.value === period)?.label.toLowerCase()}`
                        : undefined
                    }
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <StatCard
                      label="Per Minggu"
                      value={formatRupiah(result.weeklyTarget)}
                    />
                    <StatCard
                      label="Per Hari"
                      value={formatRupiah(result.dailyTarget)}
                      sub={`${result.workDaysPerMonth} hari kerja`}
                    />
                  </div>

                  <StatCard
                    label="Per Jam Operasional"
                    value={formatRupiah(result.hourlyTarget)}
                    sub={`${result.workHoursPerMonth} jam/bulan`}
                    highlight
                  />

                  {avgTransactionValue > 0 && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-muted-foreground">
                          Berdasarkan rata-rata transaksi{" "}
                          {formatRupiah(avgTransactionValue)}
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                          <StatCard
                            label="Transaksi/hari"
                            value={`${result.transactionsPerDay}x`}
                          />
                          <StatCard
                            label="Transaksi/jam"
                            value={`${result.transactionsPerHour}x`}
                          />
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  {/* Mini checklist */}
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      Target harian terpenuhi jika:
                    </p>
                    {[
                      {
                        label: "Jam buka tepat waktu",
                        desc: `Setiap jam = ${formatRupiah(result.hourlyTarget)}`,
                      },
                      {
                        label: `Min. ${result.transactionsPerDay}x transaksi`,
                        desc:
                          avgTransactionValue > 0
                            ? `@ ${formatRupiah(avgTransactionValue)}`
                            : "Isi rata-rata transaksi",
                      },
                      {
                        label: "Tidak ada downtime",
                        desc: `${ops.operationalHoursPerDay} jam penuh produktif`,
                      },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className="flex gap-2 text-xs py-1 border-b border-border/30 last:border-0"
                      >
                        <span className="text-muted-foreground shrink-0">
                          →
                        </span>
                        <div>
                          <span className="font-medium">{item.label}</span>
                          <span className="text-muted-foreground ml-1">
                            ({item.desc})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
