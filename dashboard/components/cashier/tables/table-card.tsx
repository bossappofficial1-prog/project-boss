"use client";

import { type OutletTable } from "@/lib/apis/table";
import { type Bill } from "@/lib/apis/bill";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  ClipboardList,
  ReceiptText,
  CircleDollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableCardProps {
  table: OutletTable;
  bill: Bill | null;
  onSelect: (tableId: string) => void;
  onGenerateBill: (tableId: string) => void;
  onPayBill: (billId: string) => void;
  isCreatingBill: boolean;
  isPayingBill: boolean;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  AVAILABLE: {
    label: "Available",
    className:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  },
  OCCUPIED: {
    label: "Occupied",
    className:
      "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  },
  RESERVED: {
    label: "Reserved",
    className:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  },
  BILLED: {
    label: "Billed",
    className:
      "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
  },
};

export function TableCard({
  table,
  bill,
  onSelect,
  onGenerateBill,
  onPayBill,
  isCreatingBill,
  isPayingBill,
}: TableCardProps) {
  const status = statusConfig[table.status] ?? statusConfig.AVAILABLE;

  return (
    <Card
      className="group cursor-pointer py-0 rounded-lg border bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5"
      onClick={() => onSelect(table.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onSelect(table.id);
      }}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-base font-semibold">{table.name}</h3>
          <Badge
            className={cn(
              "shrink-0 rounded-md text-[11px] font-medium px-2 py-0.5 border-0",
              status.className,
            )}
          >
            {status.label}
          </Badge>
        </div>

        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {table.capacity}
          </span>
          <span className="flex items-center gap-1">
            <ClipboardList className="h-3.5 w-3.5" />
            {table._count?.orders ?? 0} orders
          </span>
        </div>

        {bill ? (
          <div className="rounded-md bg-muted/40 border border-border/50 p-2.5 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Bill</span>
              <Badge
                variant="secondary"
                className="rounded-md text-[10px] h-5 px-1.5"
              >
                {bill.status}
              </Badge>
            </div>
            <div className="font-mono text-sm font-medium">
              Rp {bill.total.toLocaleString("id-ID")}
            </div>
            <Button
              size="sm"
              className="w-full rounded-md h-8 text-xs"
              onClick={(e) => {
                e.stopPropagation();
                onPayBill(bill.id);
              }}
              disabled={isPayingBill}
            >
              <CircleDollarSign className="mr-1.5 h-3.5 w-3.5" />
              {isPayingBill ? "Memproses..." : "Proses Pembayaran"}
            </Button>
          </div>
        ) : table.status === "OCCUPIED" ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full rounded-md h-8 text-xs"
            onClick={(e) => {
              e.stopPropagation();
              onGenerateBill(table.id);
            }}
            disabled={isCreatingBill}
          >
            <ReceiptText className="mr-1.5 h-3.5 w-3.5" />
            {isCreatingBill ? "Membuat..." : "Generate Bill"}
          </Button>
        ) : (
          <div className="text-[11px] text-muted-foreground text-center py-1.5 border border-dashed border-border rounded-md">
            {table.status === "AVAILABLE"
              ? "Meja tersedia"
              : "Meja telah dipesan"}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
