"use client";

import { useState, useMemo } from "react";
import { ColumnDef } from "@tanstack/react-table";
import {
  TrendingUp,
  TrendingDown,
  Package,
  BadgeDollarSign,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { DatePickerWithRange } from "@/components/ui/DatePickerWithRange";
import { DateRange } from "react-day-picker";
import { addDays, format } from "date-fns";
import { SummaryCard } from "@/components/features/owner/report/SummaryCard";
import { formatCurrency } from "@/lib/utils";

interface ProductProfitItem {
  productId: string;
  productName: string;
  image: string | null;
  unit: string;
  totalQtySold: number;
  totalRevenue: number;
  totalHppCost: number;
  totalProfit: number;
  marginPercentage: number;
  avgSellingPrice: number;
  avgHpp: number;
  contribution: number;
}

interface ProfitPerProductData {
  period: { startDate: string; endDate: string };
  summary: {
    totalRevenue: number;
    totalHppCost: number;
    totalProfit: number;
    avgMarginPercentage: number;
    totalQtySold: number;
    totalOrders: number;
  };
  products: ProductProfitItem[];
}

const MOCK_DATA: ProfitPerProductData = {
  period: { startDate: "2025-04-01", endDate: "2025-04-30" },
  summary: {
    totalRevenue: 42_500_000,
    totalHppCost: 18_750_000,
    totalProfit: 23_750_000,
    avgMarginPercentage: 55.88,
    totalQtySold: 1_240,
    totalOrders: 387,
  },
  products: [
    {
      productId: "1",
      productName: "Ayam Geprek Spesial",
      image: null,
      unit: "porsi",
      totalQtySold: 312,
      totalRevenue: 11_232_000,
      totalHppCost: 3_744_000,
      totalProfit: 7_488_000,
      marginPercentage: 66.67,
      avgSellingPrice: 36_000,
      avgHpp: 12_000,
      contribution: 31.53,
    },
    {
      productId: "2",
      productName: "Nasi Bakar Ikan",
      image: null,
      unit: "porsi",
      totalQtySold: 198,
      totalRevenue: 8_316_000,
      totalHppCost: 3_960_000,
      totalProfit: 4_356_000,
      marginPercentage: 52.38,
      avgSellingPrice: 42_000,
      avgHpp: 20_000,
      contribution: 18.34,
    },
    {
      productId: "3",
      productName: "Es Teh Susu",
      image: null,
      unit: "gelas",
      totalQtySold: 430,
      totalRevenue: 6_450_000,
      totalHppCost: 1_290_000,
      totalProfit: 5_160_000,
      marginPercentage: 80.0,
      avgSellingPrice: 15_000,
      avgHpp: 3_000,
      contribution: 21.73,
    },
    {
      productId: "4",
      productName: "Sate Kambing",
      image: null,
      unit: "porsi",
      totalQtySold: 87,
      totalRevenue: 7_830_000,
      totalHppCost: 5_481_000,
      totalProfit: 2_349_000,
      marginPercentage: 30.0,
      avgSellingPrice: 90_000,
      avgHpp: 63_000,
      contribution: 9.89,
    },
    {
      productId: "5",
      productName: "Tempe Mendoan",
      image: null,
      unit: "porsi",
      totalQtySold: 213,
      totalRevenue: 4_260_000,
      totalHppCost: 2_130_000,
      totalProfit: 2_130_000,
      marginPercentage: 50.0,
      avgSellingPrice: 20_000,
      avgHpp: 10_000,
      contribution: 8.97,
    },
    {
      productId: "6",
      productName: "Cumi Goreng Tepung",
      image: null,
      unit: "porsi",
      totalQtySold: 54,
      totalRevenue: 4_320_000,
      totalHppCost: 3_240_000,
      totalProfit: 1_080_000,
      marginPercentage: 25.0,
      avgSellingPrice: 80_000,
      avgHpp: 60_000,
      contribution: 4.55,
    },
    {
      productId: "7",
      productName: "Jus Alpukat",
      image: null,
      unit: "gelas",
      totalQtySold: 92,
      totalRevenue: 2_760_000,
      totalHppCost: 1_104_000,
      totalProfit: 1_656_000,
      marginPercentage: 60.0,
      avgSellingPrice: 30_000,
      avgHpp: 12_000,
      contribution: 6.97,
    },
    {
      productId: "8",
      productName: "Lele Goreng Kremes",
      image: null,
      unit: "porsi",
      totalQtySold: 76,
      totalRevenue: 2_280_000,
      totalHppCost: 1_596_000,
      totalProfit: 684_000,
      marginPercentage: 30.0,
      avgSellingPrice: 30_000,
      avgHpp: 21_000,
      contribution: 2.88,
    },
    {
      productId: "9",
      productName: "Bakso Urat Jumbo",
      image: null,
      unit: "mangkuk",
      totalQtySold: 148,
      totalRevenue: 5_920_000,
      totalHppCost: 4_144_000,
      totalProfit: 1_776_000,
      marginPercentage: 30.0,
      avgSellingPrice: 40_000,
      avgHpp: 28_000,
      contribution: 7.48,
    },
    {
      productId: "10",
      productName: "Kentang Goreng",
      image: null,
      unit: "porsi",
      totalQtySold: 189,
      totalRevenue: 2_835_000,
      totalHppCost: 1_701_000,
      totalProfit: 1_134_000,
      marginPercentage: 40.0,
      avgSellingPrice: 15_000,
      avgHpp: 9_000,
      contribution: 4.78,
    },
  ],
};

function getMarginBadge(margin: number) {
  if (margin >= 40)
    return (
      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">
        {margin.toFixed(1)}%
      </Badge>
    );
  if (margin >= 20)
    return (
      <Badge className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">
        {margin.toFixed(1)}%
      </Badge>
    );
  return (
    <Badge className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">
      {margin.toFixed(1)}%
    </Badge>
  );
}

const columns: ColumnDef<ProductProfitItem>[] = [
  {
    accessorKey: "productName",
    header: "Produk",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
          <Package className="h-4 w-4 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium text-sm">{row.original.productName}</p>
          <p className="text-xs text-muted-foreground">{row.original.unit}</p>
        </div>
      </div>
    ),
  },
  {
    accessorKey: "totalQtySold",
    header: "Qty Terjual",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">
        {row.original.totalQtySold.toLocaleString("id-ID")}
      </span>
    ),
  },
  {
    accessorKey: "avgSellingPrice",
    header: "Harga Jual",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm">
        {formatCurrency(row.original.avgSellingPrice)}
      </span>
    ),
  },
  {
    accessorKey: "avgHpp",
    header: "HPP",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm text-muted-foreground">
        {formatCurrency(row.original.avgHpp)}
      </span>
    ),
  },
  {
    accessorKey: "totalRevenue",
    header: "Total Omzet",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm font-medium">
        {formatCurrency(row.original.totalRevenue)}
      </span>
    ),
  },
  {
    accessorKey: "totalProfit",
    header: "Total Profit",
    cell: ({ row }) => (
      <span className="tabular-nums text-sm font-medium text-primary">
        {formatCurrency(row.original.totalProfit)}
      </span>
    ),
  },
  {
    accessorKey: "marginPercentage",
    header: "Margin",
    cell: ({ row }) => getMarginBadge(row.original.marginPercentage),
  },
  {
    accessorKey: "contribution",
    header: "Kontribusi",
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full"
            style={{ width: `${Math.min(row.original.contribution, 100)}%` }}
          />
        </div>
        <span className="text-xs tabular-nums text-muted-foreground">
          {row.original.contribution.toFixed(1)}%
        </span>
      </div>
    ),
  },
];

export default function ProfitPerProduct() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: addDays(new Date(), -30),
    to: new Date(),
  });

  const data = MOCK_DATA;

  const topProduct = useMemo(
    () => [...data.products].sort((a, b) => b.totalProfit - a.totalProfit)[0],
    [data.products],
  );

  const lowMarginCount = data.products.filter(
    (p) => p.marginPercentage < 20,
  ).length;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Profit per Produk
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Analisis profitabilitas tiap produk berdasarkan transaksi selesai
          </p>
        </div>
        <DatePickerWithRange date={dateRange} onDateChange={setDateRange} />
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          title="Total Omzet"
          value={formatCurrency(data.summary.totalRevenue)}
          description={`${data.summary.totalOrders} transaksi`}
        />
        <SummaryCard
          title="Total HPP"
          value={formatCurrency(data.summary.totalHppCost)}
          description={`${data.summary.totalQtySold.toLocaleString("id-ID")} unit terjual`}
        />
        <SummaryCard
          title="Total Profit"
          value={formatCurrency(data.summary.totalProfit)}
          highlight
          description="Gross profit periode ini"
        />
        <SummaryCard
          title="Rata-rata Margin"
          value={`${data.summary.avgMarginPercentage.toFixed(1)}%`}
          description={
            lowMarginCount > 0
              ? `${lowMarginCount} produk margin rendah`
              : "Semua produk sehat"
          }
        />
      </div>

      {/* Highlight Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="shadow-none gap-0 py-0 border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Produk paling profitable
              </p>
              <p className="font-medium">{topProduct.productName}</p>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(topProduct.totalProfit)} profit · margin{" "}
                {topProduct.marginPercentage.toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-0 gap-0 shadow-none border-border/50">
          <CardContent className="p-4 flex items-center gap-4">
            <div
              className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${lowMarginCount > 0 ? "bg-red-50" : "bg-emerald-50"}`}
            >
              {lowMarginCount > 0 ? (
                <TrendingDown className="h-5 w-5 text-red-500" />
              ) : (
                <BadgeDollarSign className="h-5 w-5 text-emerald-600" />
              )}
            </div>
            <div>
              <p className="text-xs text-muted-foreground">
                Produk margin rendah (&lt;20%)
              </p>
              <p className="font-medium">{lowMarginCount} produk</p>
              <p className="text-xs text-muted-foreground">
                {lowMarginCount > 0
                  ? "Perlu evaluasi harga atau HPP"
                  : "Semua produk dalam kondisi baik"}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data.products}
        title="Detail Profit per Produk"
        emptyMessage="Belum ada produk yang terjual di periode ini."
        tableId="profit-per-product"
        density="comfortable"
      />
    </div>
  );
}
