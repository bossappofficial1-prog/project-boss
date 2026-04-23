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
import { ChartContainer, type ChartConfig } from "@/components/ui/chart";
import { Wallet, Info, ArrowUpRight } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface PaymentMethodData {
  method: string;
  count: number;
  amount: number;
}

interface PaymentMethodChartProps {
  data: PaymentMethodData[];
}

const COLORS = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-2 text-xs font-bold text-foreground uppercase tracking-tight border-b border-border/40 pb-1">
          {data.method}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Transaksi</span>
            <span className="font-bold text-foreground">{data.count}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Nominal</span>
            <span className="font-bold text-primary">{formatCurrency(data.amount)}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PaymentMethodChart({ data }: PaymentMethodChartProps) {
  const totalAmount = data.reduce((sum, item) => sum + item.amount, 0);
  const topMethod = [...data].sort((a, b) => b.amount - a.amount)[0];

  const chartConfig = data.reduce((acc: any, item, idx) => {
    acc[item.method] = { label: item.method, color: COLORS[idx % COLORS.length] };
    return acc;
  }, {}) satisfies ChartConfig;

  return (
    <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 h-full">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-primary/10 text-primary">
              <Wallet className="h-4 w-4" />
            </div>
            Metode Pembayaran
          </CardTitle>
          <CardDescription className="text-xs">Distribusi penggunaan kanal pembayaran.</CardDescription>
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
                nameKey="method"
                innerRadius={70}
                outerRadius={100}
                strokeWidth={4}
                stroke="var(--card)"
                paddingAngle={2}
                cornerRadius={6}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
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
                          <tspan x={viewBox.cx} y={viewBox.cy! + 15} className="fill-foreground text-lg font-bold tabular-nums">
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
                          {entry.value}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              />
            </PieChart>
          </ChartContainer>
        </div>

        {topMethod && (
          <div className="mt-6 flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/10">
            <ArrowUpRight className="h-4 w-4 text-primary shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Metode <span className="font-bold text-foreground">{topMethod.method}</span> menjadi pilihan utama dengan kontribusi <span className="font-bold text-primary">{((topMethod.amount / totalAmount) * 100).toFixed(1)}%</span> dari total dana.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
