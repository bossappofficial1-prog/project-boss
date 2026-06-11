"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { ExpensesControls } from "@/features/expenses/components/owner/controls";

interface TransactionTotals {
  total_revenue?: number;
  total_expense?: number;
  total_margin_pendapatan?: number;
}

interface TransactionSummaryCardProps {
  totals: TransactionTotals | undefined;
  startDate: string;
  endDate: string;
  isFetching: boolean;
  onRangeChange: (start: string, end: string) => void;
  onRefresh: () => void;
}

export function TransactionSummaryCard({
  totals,
  startDate,
  endDate,
  isFetching,
  onRangeChange,
  onRefresh,
}: TransactionSummaryCardProps) {
  const revenue = totals?.total_revenue || 0;
  const expense = totals?.total_expense || 0;
  const margin = totals?.total_margin_pendapatan || 0;

  return (
    <Card className="rounded-md border-border/80 bg-background shadow-sm p-1 pl-4 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-8 py-2 overflow-x-auto hide-scrollbar">
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-1 h-8 rounded-full bg-emerald-500/80" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-0.5">
              Pemasukan
            </p>
            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums leading-none">
              {formatCurrency(revenue)}
            </p>
          </div>
        </div>

        <div className="hidden sm:block h-8 w-px bg-border/40" />

        <div className="flex items-center gap-3 shrink-0">
          <div className="w-1 h-8 rounded-full bg-rose-500/80" />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-0.5">
              Pengeluaran
            </p>
            <p className="text-base font-bold text-rose-600 dark:text-rose-400 tabular-nums leading-none">
              {formatCurrency(expense)}
            </p>
          </div>
        </div>

        <div className="hidden sm:block h-8 w-px bg-border/40" />

        <div className="flex items-center gap-3 shrink-0">
          <div
            className={cn(
              "w-1 h-8 rounded-full",
              margin >= 0 ? "bg-blue-500/80" : "bg-orange-500/80"
            )}
          />
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground opacity-60 mb-0.5">
              Saldo Bersih
            </p>
            <p
              className={cn(
                "text-base font-bold tabular-nums leading-none",
                margin >= 0 ? "text-blue-600 dark:text-blue-400" : "text-orange-600 dark:text-orange-400"
              )}
            >
              {formatCurrency(margin)}
            </p>
          </div>
        </div>

        <div className="hidden xl:block h-10 w-px bg-border/40 mx-2" />

        <div className="flex-1 min-w-[300px]">
          <ExpensesControls
            startISO={startDate}
            endISO={endDate}
            onRangeChange={onRangeChange}
            hideAddButton
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pr-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onRefresh}
        >
          <RefreshCw
            className={cn("w-4 h-4", isFetching && "animate-spin")}
          />
        </Button>
      </div>
    </Card>
  );
}
