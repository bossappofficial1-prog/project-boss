"use client";

import { useMemo } from "react";
import { type OutletTable } from "@/lib/apis/table";
import { type Bill } from "@/lib/apis/bill";
import { ReusableSheet } from "@/components/ui/reuseable-sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/EmptyState";
import {
  Users,
  ClipboardList,
  ReceiptText,
  CircleDollarSign,
  Clock,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TableDetailSheetProps {
  table: OutletTable | null;
  bill: Bill | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function TableDetailSheet({
  table,
  bill,
  open,
  onOpenChange,
  onGenerateBill,
  onPayBill,
  isCreatingBill,
  isPayingBill,
}: TableDetailSheetProps) {
  const status = table ? statusConfig[table.status] : null;

  const activeOrders = useMemo(() => {
    if (!bill?.orders) return [];
    return bill.orders.filter(
      (o) =>
        o.orderStatus !== "COMPLETED" && o.orderStatus !== "CANCELLED",
    );
  }, [bill]);

  return (
    <ReusableSheet
      isOpen={open}
      onOpenChange={onOpenChange}
      title={table ? `Meja ${table.name}` : "Detail Meja"}
      description={table ? `Kapasitas ${table.capacity} orang` : undefined}
      size="md"
      showFooter={!!table}
      footer={
        table ? (
          <div className="flex w-full gap-2">
            {table.status === "OCCUPIED" && !bill && (
              <Button
                className="flex-1 rounded-md"
                onClick={() => onGenerateBill(table.id)}
                disabled={isCreatingBill}
              >
                <ReceiptText className="mr-2 h-4 w-4" />
                {isCreatingBill ? "Membuat Bill..." : "Generate Bill"}
              </Button>
            )}
            {bill && bill.status !== "PAID" && (
              <Button
                className="flex-1 rounded-md"
                onClick={() => onPayBill(bill.id)}
                disabled={isPayingBill}
              >
                <CircleDollarSign className="mr-2 h-4 w-4" />
                {isPayingBill ? "Memproses..." : "Proses Pembayaran"}
              </Button>
            )}
            {table.status === "AVAILABLE" && (
              <p className="text-sm text-muted-foreground text-center w-full py-2">
                Meja tersedia — belum ada pesanan aktif.
              </p>
            )}
          </div>
        ) : null
      }
    >
      {!table ? (
        <EmptyState
          title="Pilih meja"
          description="Klik kartu meja untuk melihat detail."
          icon={<ShoppingBag className="w-8 h-8 text-muted-foreground" />}
        />
      ) : (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            {status && (
              <Badge
                className={cn("rounded-md border-0", status.className)}
              >
                {status.label}
              </Badge>
            )}
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {table.capacity} orang
            </span>
          </div>

          {bill && (
            <div className="rounded-lg border bg-card p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  Bill #{bill.id.slice(0, 8)}
                </span>
                <Badge
                  variant="secondary"
                  className="rounded-md text-xs"
                >
                  {bill.status}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total</span>
                <span className="font-mono text-lg font-semibold">
                  Rp {bill.total.toLocaleString("id-ID")}
                </span>
              </div>
              {bill.createdAt && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  Dibuat{" "}
                  {new Date(bill.createdAt).toLocaleString("id-ID", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </div>
              )}
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ClipboardList className="h-4 w-4" />
              Order Aktif ({activeOrders.length})
            </h4>
            {activeOrders.length === 0 ? (
              <p className="text-xs text-muted-foreground py-4 text-center border border-dashed rounded-md">
                Belum ada order aktif untuk meja ini.
              </p>
            ) : (
              activeOrders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-lg border bg-card p-3 text-sm space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-medium">
                        {order.guestCustomer?.name ?? "Walk-in"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(order.createdAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </p>
                    </div>
                    <span className="font-mono text-sm font-medium shrink-0">
                      Rp{" "}
                      {Number(order.totalAmount).toLocaleString("id-ID")}
                    </span>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <div className="border-t pt-2 space-y-1">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between text-xs text-muted-foreground"
                        >
                          <span>
                            {item.quantity}x {item.product.name}
                          </span>
                          <span className="font-mono">
                            Rp{" "}
                            {Number(item.priceAtTimeOfOrder).toLocaleString(
                              "id-ID",
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
                    <span>Status: {order.orderStatus}</span>
                    <span>&bull;</span>
                    <span>Payment: {order.paymentStatus}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </ReusableSheet>
  );
}
