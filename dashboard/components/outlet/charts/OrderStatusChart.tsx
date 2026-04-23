"use client";

import React, { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
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
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Package, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderStatusData {
  name: string;
  count: number;
  amount: number;
}

interface OrderStatusChartProps {
  data: OrderStatusData[];
}

const COLORS: Record<string, string> = {
  COMPLETED: "var(--chart-1)",
  PROCESSING: "var(--chart-2)",
  PENDING: "var(--chart-3)",
  CANCELLED: "var(--chart-5)",
  AWAITING_PAYMENT: "var(--chart-4)",
};

const LABELS: Record<string, string> = {
  COMPLETED: "Selesai",
  PROCESSING: "Diproses",
  PENDING: "Menunggu",
  CANCELLED: "Dibatalkan",
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
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Jumlah Pesanan</span>
            <span className="font-bold text-foreground">{data.count}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Total Nominal</span>
            <span className="font-bold text-primary">Rp {data.amount.toLocaleString("id-ID")}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function OrderStatusChart({ data }: OrderStatusChartProps) {
  const totalOrders = data.reduce((sum, item) => sum + item.count, 0);
  const completedOrders = data.find(d => d.name === "COMPLETED")?.count || 0;
  const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;

  const chartConfig = Object.keys(COLORS).reduce((acc: any, key) => {
    acc[key] = { label: LABELS[key] || key, color: COLORS[key] };
    return acc;
  }, {});

  return (
    <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 h-full">
      <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-chart-1/10">
              <Package className="h-4 w-4 text-chart-1" />
            </div>
            Status Pesanan
          </CardTitle>
          <CardDescription className="text-xs">Distribusi volume pesanan berdasarkan status.</CardDescription>
        </div>
        <Badge variant="secondary" className="rounded-md bg-background/50 border-border/50 text-xs font-bold px-3 py-1">
          Total: {totalOrders} Pesanan
        </Badge>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        <div className="h-[280px] w-full">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                dataKey="count"
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
                          <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                            {totalOrders}
                          </tspan>
                          <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 20} className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                            Total Order
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

        <div className="mt-6 flex items-center gap-3 p-3 rounded-lg bg-chart-1/5 border border-chart-1/10">
          <CheckCircle2 className="h-4 w-4 text-chart-1 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Tingkat penyelesaian pesanan berada di angka <span className="font-bold text-foreground">{completionRate.toFixed(1)}%</span>.
            {completionRate > 80 ? " Performa operasional sangat baik." : " Perlu perhatian pada proses antrian."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}