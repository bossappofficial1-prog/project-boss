"use client";

import React from "react";
import { Minus, Plus, Trash2, ShoppingCart, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import type { POBCartItem } from "@/hooks/api/use-pob-v2";
import { DatePicker } from "@/components/ui/date-picker";

interface CartPanelProps {
  items: POBCartItem[];
  transactionType: "PURCHASE" | "RETURN";
  onUpdateQuantity: (productId: string, quantity: number) => void;
  onUpdateHpp: (productId: string, hpp: number) => void;
  onUpdateExpiry: (productId: string, expiry: string) => void;
  onRemove: (productId: string) => void;
  onClear: () => void;
}

const currencyFmt = new Intl.NumberFormat("id-ID");

export function CartPanel({
  items,
  transactionType,
  onUpdateQuantity,
  onUpdateHpp,
  onUpdateExpiry,
  onRemove,
  onClear,
}: CartPanelProps) {
  const isPurchase = transactionType === "PURCHASE";

  const totalEstimate = React.useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.hppPerUnit, 0),
    [items],
  );

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-md border border-dashed py-12 text-center bg-muted/5">
        <ShoppingCart className="h-10 w-10 text-muted-foreground/30 animate-pulse" />
        <p className="text-sm text-muted-foreground">
          Pilih barang dari katalog
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Header info */}
      <div className="flex items-center justify-between pb-1 border-b">
        <p className="text-xs font-semibold text-muted-foreground">
          {items.length} barang dipilih
        </p>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-xs font-semibold text-destructive hover:text-destructive rounded-md px-2"
          onClick={onClear}
        >
          Hapus Semua
        </Button>
      </div>

      {/* Scrollable list */}
      <div className="space-y-3 overflow-y-scroll mmax-h-70 lg:max-h-87.5 pr-2">
        {items.map((item) => {
          const unit = item.product.goods?.unit ?? "pcs";
          const subtotal = item.quantity * item.hppPerUnit;

          return (
            <div
              key={item.product.id}
              className="rounded-md border bg-card p-3.5 space-y-3 shadow-sm"
            >
              {/* Title & Remove */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-sm font-medium leading-tight truncate"
                    title={item.product.name}
                  >
                    {item.product.name}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Stok: {item.product.goods?.currentStock ?? 0} {unit}
                  </p>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive rounded-md shrink-0 transition-colors"
                  onClick={() => onRemove(item.product.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>

              {/* Controls: Qty & Price */}
              <div className="grid grid-cols-2 gap-2">
                {/* Qty */}
                <div className="space-y-1">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                    Jumlah ({unit})
                  </label>
                  <div className="flex items-center gap-1 bg-background border rounded-md p-0.5">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 rounded-sm hover:bg-destructive/5 hover:text-destructive"
                      onClick={() =>
                        onUpdateQuantity(
                          item.product.id,
                          Math.max(1, item.quantity - 1),
                        )
                      }
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <Input
                      type="number"
                      min={1}
                      className="h-7 border-0 bg-transparent px-0 text-center text-xs font-semibold focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
                      value={item.quantity}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val) && val >= 1)
                          onUpdateQuantity(item.product.id, val);
                      }}
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 shrink-0 rounded-sm hover:bg-primary/5 hover:text-primary"
                      onClick={() =>
                        onUpdateQuantity(item.product.id, item.quantity + 1)
                      }
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                {/* HPP */}
                {isPurchase && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      HPP / {unit}
                    </label>
                    <div className="relative flex items-center bg-background border rounded-md overflow-hidden">
                      <span className="absolute left-2 text-[10px] font-bold text-muted-foreground">
                        Rp
                      </span>
                      <Input
                        type="number"
                        min={0}
                        className="h-8 pl-7 pr-2 border-0 bg-transparent text-right text-xs font-semibold focus-visible:ring-0 [&::-webkit-inner-spin-button]:appearance-none"
                        value={item.hppPerUnit || ""}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onUpdateHpp(item.product.id, isNaN(val) ? 0 : val);
                        }}
                        placeholder="0"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Expiry Date (FEFO) */}
              {isPurchase && (
                <div className="space-y-1.5 mt-2 bg-muted/20 p-2.5 rounded-md border border-border/40">
                  <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary/80" />
                    Kedaluwarsa
                  </label>
                  <div className="flex flex-col gap-2">
                    <div className="flex-1">
                      <DatePicker
                        value={item.expiryDate || ""}
                        onValueChange={(val) =>
                          onUpdateExpiry(item.product.id, val || "")
                        }
                        className="h-8 text-[10px] font-bold w-full py-1 min-h-[32px] justify-start px-2.5 rounded-md border-border bg-background"
                        placeholder="Pilih ExpDate"
                        endYear={new Date().getFullYear() + 20}
                      />
                    </div>

                    {/* Expiry Shortcuts */}
                    <div className="flex items-center gap-1 flex-wrap">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[9px] font-bold h-6 py-0.5 px-2 rounded-md border-border hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + 6);
                          onUpdateExpiry(
                            item.product.id,
                            d.toISOString().split("T")[0],
                          );
                        }}
                      >
                        +6B
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-[9px] font-bold h-6 py-0.5 px-2 rounded-md border-border hover:bg-primary/5 hover:text-primary transition-all"
                        onClick={() => {
                          const d = new Date();
                          d.setMonth(d.getMonth() + 12);
                          onUpdateExpiry(
                            item.product.id,
                            d.toISOString().split("T")[0],
                          );
                        }}
                      >
                        +1T
                      </Button>
                      {item.expiryDate && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-[9px] font-bold h-6 py-0.5 px-1.5 rounded-md text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onUpdateExpiry(item.product.id, "")}
                        >
                          Batal
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Subtotal */}
              {isPurchase && (
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground pt-1 border-t">
                  <span>Subtotal</span>
                  <span className="font-extrabold text-xs text-foreground tabular-nums">
                    Rp {currencyFmt.format(subtotal)}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Total Summary */}
      {isPurchase && (
        <>
          <Separator />
          <div className="flex items-center justify-between text-sm font-semibold p-2.5 bg-muted/20 border rounded-md">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Total Estimasi
            </span>
            <span className="text-sm font-bold tabular-nums">
              Rp {currencyFmt.format(totalEstimate)}
            </span>
          </div>
        </>
      )}
    </div>
  );
}
