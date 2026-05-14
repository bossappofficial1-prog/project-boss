"use client";

import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import { BadgeDollarSign, TrendingDown, TrendingUp } from "lucide-react";
import { ProfitPerProductData } from "./types";

type HighlightCardProps = {
  topProduct: ProfitPerProductData["products"][0];
  lowMarginCount: number;
};

export function HighlightCard({
  topProduct,
  lowMarginCount,
}: HighlightCardProps) {
  return (
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
  );
}
