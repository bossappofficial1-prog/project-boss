"use client";

import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  Label,
} from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChartContainer } from "@/components/ui/chart";
import { CreditCard, TrendingUp, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentStatusData {
  name: string;
  count: number;
  amount: number;
}

interface PaymentStatusChartProps {
  data: PaymentStatusData[];
  successRate: number;
}

const COLORS: Record<string, string> = {
  PAID: "var(--chart-1)",
  SUCCESS: "var(--chart-2)",
  PENDING: "var(--chart-3)",
  FAILED: "var(--chart-5)",
  AWAITING_PAYMENT: "var(--chart-4)",
};

const LABELS: Record<string, string> = {
  PAID: "Berhasil",
  SUCCESS: "Sukses",
  PENDING: "Menunggu",
  FAILED: "Gagal",
  AWAITING_PAYMENT: "Belum Bayar",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-2 text-xs font-bold text-foreground uppercase tracking-tight border-b border-border/40 pb-1">
          {LABELS[data.name] || data.name}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Transaksi</span>
            <span className="font-bold text-foreground">{data.count}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Nominal</span>
            <span className="font-bold text-emerald-600">{formatCurrency(data.amount)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PaymentStatusChart({ data, successRate }: PaymentStatusChartProps) {
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);

  const chartConfig = Object.keys(COLORS).reduce((acc: any, key) => {
    acc[key] = { label: LABELS[key] || key, color: COLORS[key] };
    return acc;
  }, {});

  return (
    <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 h-full">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600">
              <CreditCard className="h-4 w-4" />
            </div>
            Status Pembayaran
          </CardTitle>
          <CardDescription className="text-xs">Ringkasan aliran dana berdasarkan status transaksi.</CardDescription>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Badge variant="outline" className="rounded-md border-emerald-200 bg-emerald-100/60 text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/20 text-[10px] font-bold">
            {successRate.toFixed(1)}% Sukses
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        <div className="h-[280px] w-full">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                dataKey="amount"
                nameKey="name"
                innerRadius={70}
                outerRadius={100}
                strokeWidth={4}
                stroke="var(--card)"
                paddingAngle={2}
                cornerRadius={6}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[entry.name] || "var(--muted)"}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy! - 10} className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                            Total Dana
                          </tspan>
                          <tspan x={viewBox.cx} y={viewBox.cy! + 15} className="fill-foreground text-xl font-bold">
                            {formatCurrency(totalAmount).replace("Rp", "").trim()}
                          </tspan>
                        </text>
                      );
                    }
                  }}
                />
              </Pie>
              <Legend
                verticalAlign="bottom"
                align="center"
                content={({ payload }) => (
                  <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 mt-4">
                    {payload?.map((entry: any, index) => (
                      <div key={index} className="flex items-center gap-1.5">
                        <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                        <span className="text-[10px] font-medium text-muted-foreground uppercase">
                          {LABELS[entry.value] || entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />
            </PieChart>
          </ChartContainer>
        </div>

        <div className="mt-6 flex items-center gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mayoritas transaksi Anda <span className="font-bold text-emerald-600">berhasil terbayar</span>. Gunakan data ini untuk rekonsiliasi harian lebih cepat.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
