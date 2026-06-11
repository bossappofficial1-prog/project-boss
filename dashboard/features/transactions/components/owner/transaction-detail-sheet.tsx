"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  User,
  Phone,
  CreditCard,
  Calendar,
  ShoppingBag,
  Receipt,
  Store,
  FileText,
  Hash,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Transaction } from "@/lib/apis/transaction";
import { formatCurrency, cn } from "@/lib/utils";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface TransactionDetailSheetProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const STATUS_MAP: Record<
  string,
  {
    label: string;
    variant:
      | "default"
      | "destructive"
      | "success"
      | "warning"
      | "secondary"
      | "outline";
  }
> = {
  PENDING: { label: "Pending", variant: "warning" },
  SUCCESS: { label: "Berhasil", variant: "success" },
  FAILED: { label: "Gagal", variant: "destructive" },
  CANCELLED: { label: "Dibatalkan", variant: "secondary" },
  PROOF_SUBMITTED: { label: "Bukti Dikirim", variant: "default" },
  AWAITING_VERIFICATION: { label: "Menunggu Verifikasi", variant: "warning" },
  REFUNDED: { label: "Dikembalikan", variant: "secondary" },
  EXPIRED: { label: "Kedaluwarsa", variant: "outline" },
  REJECTED_MANUAL: { label: "Ditolak", variant: "destructive" },
};

const PAYMENT_LABELS: Record<string, string> = {
  manual_transfer: "Transfer Manual",
  owner_transfer: "Transfer Pemilik",
  manual: "Manual",
  cash: "Tunai",
  qris: "QRIS",
  qris_dynamic: "QRIS Dynamic",
  online: "Online",
  midtrans: "Midtrans",
};

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "-";
  return format(d, "dd MMM yyyy, HH:mm", { locale: localeId });
}

function getPaymentLabel(method: string | null | undefined): string {
  if (!method) return "Online";
  return (
    PAYMENT_LABELS[method.toLowerCase()] ??
    method.replace(/[_-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
  );
}

function InfoRow({
  label,
  value,
  icon: Icon,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-3 py-2">
      <div className="flex items-center gap-2 text-muted-foreground min-w-0">
        {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
        <span className="text-xs font-medium truncate">{label}</span>
      </div>
      <span
        className={cn(
          "text-xs font-semibold text-foreground text-right",
          valueClassName
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
}: TransactionDetailSheetProps) {
  if (!transaction) return null;

  const order = transaction.order;
  const customer = order?.guestCustomer;
  const isIncome = transaction.type === "INCOME";
  const statusInfo = STATUS_MAP[transaction.status] || {
    label: transaction.status,
    variant: "default" as const,
  };
  const items = order?.items ?? [];
  const subtotal = items.reduce(
    (sum, item) => sum + item.priceAtTimeOfOrder * item.quantity,
    0
  );
  const taxAmount = order?.taxAmount ?? 0;
  const discountAmount = order?.discountAmount ?? 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto p-0">
        <SheetHeader className="p-6 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-semibold">
              Detail Transaksi
            </SheetTitle>
            <Badge
              variant={statusInfo.variant}
              className="font-bold text-[10px] uppercase tracking-wider"
            >
              {statusInfo.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground font-mono mt-1">
            #{transaction.id.slice(-8).toUpperCase()}
          </p>
        </SheetHeader>

        <div className="p-6 space-y-5">
          {/* Amount highlight */}
          <div
            className={cn(
              "rounded-lg p-4 border",
              isIncome
                ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
                : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/40"
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {isIncome ? (
                <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              ) : (
                <TrendingDown className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              )}
              <span className="text-xs font-medium text-muted-foreground">
                {isIncome ? "Pemasukan" : "Pengeluaran"}
              </span>
            </div>
            <p
              className={cn(
                "text-2xl font-bold tabular-nums",
                isIncome
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-rose-700 dark:text-rose-300"
              )}
            >
              {isIncome ? "+" : "-"} {formatCurrency(transaction.amount)}
            </p>
          </div>

          {/* Transaction info */}
          <div className="rounded-lg border border-border/60 bg-card divide-y divide-border/40">
            <div className="px-4 py-3">
              <h4 className="text-xs font-semibold text-foreground mb-2">
                Informasi Transaksi
              </h4>
              <InfoRow
                label="Tanggal"
                icon={Calendar}
                value={formatDateTime(transaction.createdAt)}
              />
              <InfoRow
                label="Tipe"
                icon={isIncome ? TrendingUp : TrendingDown}
                value={
                  <Badge
                    variant={isIncome ? "success" : "destructive"}
                    className="font-bold text-[9px] uppercase tracking-wider"
                  >
                    {isIncome ? "Pemasukan" : "Pengeluaran"}
                  </Badge>
                }
              />
              <InfoRow
                label="Metode Pembayaran"
                icon={CreditCard}
                value={getPaymentLabel(
                  transaction.manualMethod || transaction.paymentMethod
                )}
              />
              {transaction.isManual && (
                <InfoRow
                  label="Transaksi Manual"
                  icon={FileText}
                  value={
                    <Badge
                      variant="outline"
                      className="font-bold text-[9px] uppercase"
                    >
                      Ya
                    </Badge>
                  }
                />
              )}
              {transaction.description && (
                <InfoRow
                  label="Deskripsi"
                  icon={FileText}
                  value={transaction.description}
                />
              )}
            </div>

            {/* Outlet info */}
            {transaction.outlet && (
              <div className="px-4 py-3">
                <h4 className="text-xs font-semibold text-foreground mb-2">
                  Outlet
                </h4>
                <InfoRow
                  label="Nama"
                  icon={Store}
                  value={transaction.outlet.name}
                />
                {transaction.outlet.address && (
                  <InfoRow
                    label="Alamat"
                    icon={Store}
                    value={transaction.outlet.address}
                  />
                )}
              </div>
            )}

            {/* Customer info */}
            {customer && (
              <div className="px-4 py-3">
                <h4 className="text-xs font-semibold text-foreground mb-2">
                  Customer
                </h4>
                <InfoRow
                  label="Nama"
                  icon={User}
                  value={customer.name || "-"}
                />
                <InfoRow
                  label="Telepon"
                  icon={Phone}
                  value={customer.phone || "-"}
                />
                {customer.email && (
                  <InfoRow
                    label="Email"
                    icon={User}
                    value={customer.email}
                  />
                )}
              </div>
            )}
          </div>

          {/* Order items */}
          {items.length > 0 && (
            <div className="rounded-lg border border-border/60 bg-card">
              <div className="px-4 py-3 border-b border-border/40">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  Item Pesanan ({items.length})
                </h4>
              </div>
              <div className="divide-y divide-border/40">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="px-4 py-3 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {item.product?.name || "Produk"}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {item.quantity} x{" "}
                        {formatCurrency(item.priceAtTimeOfOrder)}
                      </p>
                    </div>
                    <span className="text-xs font-bold tabular-nums text-foreground shrink-0">
                      {formatCurrency(
                        item.priceAtTimeOfOrder * item.quantity
                      )}
                    </span>
                  </div>
                ))}
              </div>

              {/* Order totals */}
              <div className="px-4 py-3 border-t border-border/40 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium tabular-nums">
                    {formatCurrency(subtotal)}
                  </span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Pajak</span>
                    <span className="font-medium tabular-nums text-blue-600 dark:text-blue-400">
                      {formatCurrency(taxAmount)}
                    </span>
                  </div>
                )}
                {discountAmount > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Diskon</span>
                    <span className="font-medium tabular-nums text-emerald-600 dark:text-emerald-400">
                      - {formatCurrency(discountAmount)}
                    </span>
                  </div>
                )}
                <Separator className="my-1.5" />
                <div className="flex justify-between text-sm font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatCurrency(order?.totalAmount ?? transaction.amount)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Payment proof */}
          {transaction.paymentProofUrl && (
            <div className="rounded-lg border border-border/60 bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border/40">
                <h4 className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <Receipt className="w-3.5 h-3.5" />
                  Bukti Pembayaran
                </h4>
              </div>
              <div className="p-4">
                <a
                  href={transaction.paymentProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-md overflow-hidden border border-border/40 hover:border-primary/40 transition-colors"
                >
                  <img
                    src={transaction.paymentProofUrl}
                    alt="Bukti pembayaran"
                    className="w-full h-auto max-h-64 object-contain bg-muted"
                  />
                </a>
              </div>
            </div>
          )}

          {/* External ID */}
          {transaction.externalId && (
            <div className="rounded-lg border border-border/60 bg-card px-4 py-3">
              <InfoRow
                label="External ID"
                icon={Hash}
                value={
                  <span className="font-mono text-[10px]">
                    {transaction.externalId}
                  </span>
                }
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default TransactionDetailSheet;
