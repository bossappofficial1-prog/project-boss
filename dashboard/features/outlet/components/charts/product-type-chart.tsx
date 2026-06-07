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
import { Layers, Info, CheckCircle2 } from "lucide-react";
import { formatNumberCompactID } from "@/lib/utils";

interface ProductTypeData {
  type: string;
  count: number;
  percentage: number;
}

interface ProductTypeChartProps {
  data: ProductTypeData[];
}

const COLORS: Record<string, string> = {
  GOODS: "var(--chart-1)",
  SERVICE: "var(--chart-2)",
  TICKET: "var(--chart-3)"
};

const LABELS: Record<string, string> = {
  GOODS: "Produk Fisik",
  SERVICE: "Layanan",
  TICKET: "Tiket",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="rounded-lg border border-border/50 bg-background/95 p-3 shadow-xl backdrop-blur-sm">
        <p className="mb-2 text-xs font-bold text-foreground uppercase tracking-tight border-b border-border/40 pb-1">
          {LABELS[data.type] || data.type}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Jumlah Item</span>
            <span className="font-bold text-foreground">{data.count}</span>
          </div>
          <div className="flex items-center justify-between gap-8">
            <span className="text-[10px] text-muted-foreground uppercase font-medium">Kontribusi</span>
            <span className="font-bold text-primary">{data.percentage}%</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function ProductTypeChart({ data }: ProductTypeChartProps) {
  const totalItems = data.reduce((sum, item) => sum + item.count, 0);
  const topType = [...data].sort((a, b) => b.count - a.count)[0];

  const chartConfig = Object.keys(COLORS).reduce((acc: any, key) => {
    acc[key] = { label: LABELS[key] || key, color: COLORS[key] };
    return acc;
  }, {}) satisfies ChartConfig;

  return (
    <Card className="rounded-md gap-0 py-0 border-border/60 shadow-md overflow-hidden bg-gradient-to-b from-background to-muted/5 h-full">
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b border-border/40 bg-muted/20 p-4">
        <div className="space-y-1">
          <CardTitle className="text-lg flex items-center gap-2">
            <div className="p-1.5 rounded-md bg-chart-1/10">
              <Layers className="h-4 w-4 text-chart-1" />
            </div>
            Tipe Produk
          </CardTitle>
          <CardDescription className="text-xs">Proporsi inventaris berdasarkan tipe.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-6">
        <div className="h-[280px] w-full">
          <ChartContainer config={chartConfig} className="mx-auto aspect-square max-h-[250px]">
            <PieChart>
              <Tooltip content={<CustomTooltip />} />
              <Pie
                data={data}
                dataKey="count"
                nameKey="type"
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
                    fill={COLORS[entry.type] || "var(--muted)"}
                    className="transition-opacity hover:opacity-80"
                  />
                ))}
                <Label
                  content={({ viewBox }) => {
                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                      return (
                        <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                          <tspan x={viewBox.cx} y={viewBox.cy! - 10} className="fill-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                            Total Item
                          </tspan>
                          <tspan x={viewBox.cx} y={viewBox.cy! + 15} className="fill-foreground text-2xl font-bold">
                            {totalItems}
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

        {topType && (
          <div className="mt-6 flex items-center gap-3 p-3 rounded-lg bg-chart-1/5 border border-chart-1/10">
            <CheckCircle2 className="h-4 w-4 text-chart-1 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Inventaris Anda didominasi oleh <span className="font-bold text-foreground">{LABELS[topType.type] || topType.type}</span> ({topType.percentage}%).
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
