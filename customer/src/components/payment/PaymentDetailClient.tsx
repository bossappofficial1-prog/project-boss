"use client";

import React, { useEffect, useMemo, useState, useCallback } from "react";
import { cn, formatCurrency, formatDateTime, copyToClipboard } from "@/lib/utils";
import { useAppBarV2 } from "@/context/AppBarContextV2";
import { useLocale, useTranslations } from "@/hooks/useI18n";
import type {
  PaymentDetailData,
  PaymentDetailManual,
  PaymentDetailMidtrans,
  PaymentManualInstruction,
} from "@/types/payment-detail";
import {
  AlertCircle,
  CheckCircle,
  Clock,
  Copy,
  Check,
  Info,
  XCircle,
  User,
  Phone,
  HelpCircle,
  Loader2,
} from "lucide-react";
import { PaymentService } from "@/services/paymentService";
import { useSocket } from "@/hooks/useSocket-v2";
import {
  IMPORTANT_INFORMATION_PAYMENT,
  type ImportantInformationType,
} from "@/constants";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";

const CountdownTimer = dynamic(
  () => import("@/components/orders/parts/CountdownTimer"),
  { ssr: false },
);
const ManualPaymentDetails = dynamic(
  () =>
    import("@/components/payment/ManualPaymentDetails").then((m) => ({
      default: m.ManualPaymentDetails,
    })),
  { ssr: false, loading: () => <SectionSkeleton /> },
);
const ManualPaymentUpload = dynamic(
  () =>
    import("@/components/payment/ManualPaymentUpload").then((m) => ({
      default: m.ManualPaymentUpload,
    })),
  { ssr: false, loading: () => <SectionSkeleton /> },
);
const VaPaymentDetails = dynamic(
  () =>
    import("@/components/payment/VaPaymentDetails").then((m) => ({
      default: m.VaPaymentDetails,
    })),
  { ssr: false, loading: () => <SectionSkeleton /> },
);
const QrisPaymentDetails = dynamic(
  () =>
    import("@/components/payment/QrisPaymentDetails").then((m) => ({
      default: m.QrisPaymentDetails,
    })),
  { ssr: false, loading: () => <SectionSkeleton /> },
);

function SectionSkeleton() {
  return (
    <div className="rounded-md border p-4 space-y-3 animate-pulse">
      <div className="h-4 w-1/3 bg-muted rounded" />
      <div className="h-3 w-full bg-muted rounded" />
      <div className="h-3 w-2/3 bg-muted rounded" />
    </div>
  );
}

interface PaymentDetailClientProps {
  orderId: string;
  payment: PaymentDetailData;
}

type StatusTone = "info" | "success" | "warning" | "danger";
type StatusKey =
  | "PENDING"
  | "PROCESSING"
  | "AWAITING_VERIFICATION"
  | "SUCCESS"
  | "FAILED"
  | "EXPIRED"
  | "CANCELLED"
  | "UNKNOWN";

interface StatusPresentation {
  tone: StatusTone;
  icon: React.ReactNode;
  infoType?: ImportantInformationType;
  titleKey: string;
  descriptionKey: string;
}

// ── Constants ──

const STATUS_PRESENTATION: Record<StatusKey, StatusPresentation> = {
  PENDING: {
    tone: "warning",
    icon: <Clock className="w-5 h-5" />,
    infoType: "pending",
    titleKey: "status.pending.title",
    descriptionKey: "status.pending.description",
  },
  PROCESSING: {
    tone: "info",
    icon: <Info className="w-5 h-5" />,
    infoType: "processing",
    titleKey: "status.processing.title",
    descriptionKey: "status.processing.description",
  },
  AWAITING_VERIFICATION: {
    tone: "warning",
    icon: <Clock className="w-5 h-5" />,
    infoType: "processing",
    titleKey: "status.awaitingVerification.title",
    descriptionKey: "status.awaitingVerification.description",
  },
  SUCCESS: {
    tone: "success",
    icon: <CheckCircle className="w-5 h-5" />,
    infoType: "success",
    titleKey: "status.success.title",
    descriptionKey: "status.success.description",
  },
  FAILED: {
    tone: "danger",
    icon: <XCircle className="w-5 h-5" />,
    titleKey: "status.failed.title",
    descriptionKey: "status.failed.description",
  },
  EXPIRED: {
    tone: "danger",
    icon: <AlertCircle className="w-5 h-5" />,
    infoType: "expired",
    titleKey: "status.expired.title",
    descriptionKey: "status.expired.description",
  },
  CANCELLED: {
    tone: "danger",
    icon: <AlertCircle className="w-5 h-5" />,
    infoType: "cancelled",
    titleKey: "status.cancelled.title",
    descriptionKey: "status.cancelled.description",
  },
  UNKNOWN: {
    tone: "info",
    icon: <Info className="w-5 h-5" />,
    titleKey: "status.unknown.title",
    descriptionKey: "status.unknown.description",
  },
};

const TONE_CLASSES: Record<StatusTone, { banner: string; dot: string }> = {
  success: {
    banner:
      "border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-200",
    dot: "bg-green-500",
  },
  warning: {
    banner:
      "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200",
    dot: "bg-amber-500",
  },
  danger: {
    banner:
      "border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200",
    dot: "bg-red-500",
  },
  info: {
    banner:
      "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200",
    dot: "bg-blue-500",
  },
};

// ── Helpers (pure functions) ──

function normalizeStatus(status?: string): StatusKey {
  if (!status) return "UNKNOWN";
  const upper = status.toUpperCase();
  if (["AWAITING_PAYMENT", "PENDING"].includes(upper)) return "PENDING";
  if (upper === "AWAITING_VERIFICATION") return "AWAITING_VERIFICATION";
  if (upper === "PROCESSING") return "PROCESSING";
  if (["SETTLEMENT", "SUCCESS", "PAID", "COMPLETED"].includes(upper))
    return "SUCCESS";
  if (["FAILURE", "FAILED", "DENY"].includes(upper)) return "FAILED";
  if (["EXPIRE", "EXPIRED"].includes(upper)) return "EXPIRED";
  if (["CANCEL", "CANCELLED"].includes(upper)) return "CANCELLED";
  return "UNKNOWN";
}

function resolveManualInstructions(
  manual?: PaymentDetailManual | null,
): PaymentManualInstruction | undefined {
  if (!manual) return undefined;
  return manual.instructions ?? manual.intruction ?? undefined;
}

function resolveStatus(order: PaymentDetailData): StatusPresentation {
  const primaryStatus = normalizeStatus(order.payment.status);
  const midtransStatus = normalizeStatus(
    order.payment.midtrans?.transaction_status,
  );
  const fallbackStatus = normalizeStatus(order.status);
  const resolved =
    primaryStatus !== "UNKNOWN"
      ? primaryStatus
      : midtransStatus !== "UNKNOWN"
        ? midtransStatus
        : fallbackStatus;
  return STATUS_PRESENTATION[resolved] ?? STATUS_PRESENTATION.UNKNOWN;
}

function getMidtransVa(
  midtrans?: PaymentDetailMidtrans | null,
): { bank: string; va: string } | null {
  if (!midtrans) return null;
  const m = midtrans as any;

  const vaArray = Array.isArray(m.va_numbers)
    ? m.va_numbers
    : Array.isArray(m.vaNumbers)
      ? m.vaNumbers
      : null;

  if (vaArray?.[0]) {
    const e = vaArray[0];
    const va = e.va_number ?? e.vaNumber;
    if (va)
      return {
        bank: (e.bank ?? e.bankCode ?? e.bank_name ?? "VA").toUpperCase(),
        va,
      };
  }
  if (typeof m.va_number === "string")
    return {
      bank: (
        m.bank ??
        m.bank_code ??
        midtrans.payment_type ??
        "VA"
      ).toUpperCase(),
      va: m.va_number,
    };
  if (typeof m.permata_va_number === "string")
    return { bank: "PERMATA", va: m.permata_va_number };
  const billKey = m.bill_key ?? m.billKey;
  const billerCode = m.biller_code ?? m.billerCode;
  if (billKey && billerCode)
    return { bank: String(billerCode).toUpperCase(), va: String(billKey) };
  return null;
}

function getMidtransQr(
  midtrans?: PaymentDetailMidtrans | null,
): string | null {
  if (!midtrans) return null;
  const qrAction = midtrans.actions?.find(
    (a) => a.name === "generate-qr-code" || a.name === "deeplink-redirect",
  );
  if (qrAction?.url) return qrAction.url;
  if ((midtrans as any).qr_string) return (midtrans as any).qr_string;
  return null;
}

function deriveMethodLabel(method: string): string {
  const upper = method.toUpperCase();
  if (upper === "MIDTRANS") return "Midtrans";
  if (upper === "MANUAL") return "Manual";
  return upper.replace(/_/g, " ");
}

// ── Inline sub-components ──

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    const ok = await copyToClipboard(value);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-muted transition-colors"
    >
      {copied ? (
        <Check className="w-3 h-3 text-green-600" />
      ) : (
        <Copy className="w-3 h-3 text-muted-foreground" />
      )}
    </button>
  );
}

function InlineImportantInfo({
  type,
  locale,
}: {
  type: ImportantInformationType;
  locale: "id" | "en";
}) {
  const items = IMPORTANT_INFORMATION_PAYMENT[type]?.[locale] ?? [];
  if (!items || (items as readonly string[]).length < 1) return null;
  return (
    <div className="rounded-md border bg-blue-50/50 dark:bg-blue-950/10 border-blue-200 dark:border-blue-900/40 p-3">
      <p className="text-[11px] font-semibold text-blue-800 dark:text-blue-200 mb-1.5 flex items-center gap-1.5">
        <HelpCircle className="w-3 h-3" />
        Info Penting
      </p>
      <ul className="text-[11px] text-blue-700 dark:text-blue-300 space-y-1 list-disc list-inside leading-relaxed">
        {items.map((info, i) => (
          <li key={i}>{info}</li>
        ))}
      </ul>
    </div>
  );
}

export function PaymentDetailClient({
  orderId,
  payment,
}: PaymentDetailClientProps) {
  const t = useTranslations("paymentDetail");
  const tComp = useTranslations("paymentComponents");
  const locale = useLocale();
  const router = useRouter()

  const [paymentData, setPaymentData] = useState<PaymentDetailData>(payment);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const statusPresentation = useMemo(
    () => resolveStatus(paymentData),
    [paymentData],
  );
  const normalizedStatus = useMemo(
    () => normalizeStatus(paymentData.payment.status ?? paymentData.status),
    [paymentData],
  );
  const tone = TONE_CLASSES[statusPresentation.tone];
  const informationType = STATUS_PRESENTATION[normalizedStatus]?.infoType;

  const midtransVa = useMemo(
    () => getMidtransVa(paymentData.payment.midtrans),
    [paymentData.payment.midtrans],
  );
  const midtransQr = useMemo(
    () => getMidtransQr(paymentData.payment.midtrans),
    [paymentData.payment.midtrans],
  );
  const manualInstructions = useMemo(
    () => resolveManualInstructions(paymentData.payment.manual),
    [paymentData.payment.manual],
  );

  const manualProofUrl = paymentData.payment.manual?.paymentProofUrl ?? null;
  const isAwaitingVerification =
    paymentData.payment.status?.toUpperCase() === "AWAITING_VERIFICATION" ||
    paymentData.status?.toUpperCase() === "AWAITING_VERIFICATION";
  const expiryTime =
    paymentData.payment.midtrans?.expiry_time ??
    manualInstructions?.expiry_time ??
    undefined;

  const showCountdown =
    expiryTime &&
    !isAwaitingVerification &&
    (normalizedStatus === "PENDING" || normalizedStatus === "PROCESSING");
  const showManual =
    paymentData.payment.isManual &&
    paymentData.payment.manual &&
    manualInstructions;
  const showUpload = showManual && !manualProofUrl && !isAwaitingVerification;
  const showVa = !paymentData.payment.isManual && midtransVa;
  const showQris = !paymentData.payment.isManual && !midtransVa && midtransQr;

  const subtotal = useMemo(
    () =>
      paymentData.items.reduce(
        (acc, item) => acc + (item.subtotal ?? item.price * item.quantity),
        0,
      ),
    [paymentData.items],
  );
  const showTxFee =
    paymentData.feeDetail.transactionFee > 0 &&
    paymentData.payment.method !== "QRIS_OFFLINE" &&
    paymentData.payment.method !== "OWNER_TRANSFER";

  const methodLabel = deriveMethodLabel(paymentData.payment.method);

  // App bar
  const { setAppBar, resetAppBar } = useAppBarV2();
  useEffect(() => {
    setAppBar({
      title: t("title"),
      subtitle: orderId,
      showBackButton: true,
      onLeftClick() {
        router.push('/orders')
      },
    });
    return () => resetAppBar();
  }, [orderId, resetAppBar, setAppBar, t]);

  // Sync server prop
  useEffect(() => {
    setPaymentData(payment);
  }, [payment]);

  // Real-time socket updates
  const { isConnected, joinOrderRoom, onEvent, events } = useSocket();
  const { ORDER_EVENT, ORDER_OTHER_EVENT, CUSTOMER_NOTIFICATION } = events;

  const refreshPaymentDetail = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const latest = await PaymentService.getPaymentDetail(orderId);
      setPaymentData(latest);
    } catch (error) {
      console.error("Failed to refresh payment detail:", error);
    } finally {
      setIsRefreshing(false);
    }
  }, [orderId]);

  const handleOrderEvent = useCallback(
    async (payload: any) => {
      const incoming = payload?.order_id ?? payload?.orderId;
      if (incoming !== orderId) return;
      await refreshPaymentDetail();
    },
    [orderId, refreshPaymentDetail],
  );

  const handleCustomerNotification = useCallback(
    async (payload: any) => {
      if (!payload || payload.orderId !== orderId) return;
      await refreshPaymentDetail();
    },
    [orderId, refreshPaymentDetail],
  );

  useEffect(() => {
    if (isConnected && orderId) joinOrderRoom(orderId);
  }, [isConnected, joinOrderRoom, orderId]);

  useEffect(() => {
    if (!isConnected) return;
    const unsub1 = onEvent(ORDER_EVENT, handleOrderEvent);
    const unsub2 = onEvent(ORDER_OTHER_EVENT, handleOrderEvent);
    const unsub3 = onEvent(CUSTOMER_NOTIFICATION, handleCustomerNotification);
    return () => {
      if (typeof unsub1 === "function") unsub1();
      if (typeof unsub2 === "function") unsub2();
      if (typeof unsub3 === "function") unsub3();
    };
  }, [
    isConnected,
    onEvent,
    ORDER_EVENT,
    ORDER_OTHER_EVENT,
    CUSTOMER_NOTIFICATION,
    handleOrderEvent,
    handleCustomerNotification,
  ]);

  return (
    <div className="space-y-3 pb-16">
      {/* Status Banner */}
      <div
        className={cn(
          "rounded-md border p-3 flex items-start gap-3",
          tone.banner,
        )}
      >
        <div className="mt-0.5 shrink-0">{statusPresentation.icon}</div>
        <div className="flex-1 min-w-0">
          <h2 className="text-sm font-bold leading-tight">
            {t(statusPresentation.titleKey as any)}
          </h2>
          <p className="text-[11px] opacity-80 mt-0.5 leading-relaxed">
            {t(statusPresentation.descriptionKey as any)}
          </p>
        </div>
        {isRefreshing && (
          <Loader2 className="w-4 h-4 animate-spin shrink-0 opacity-50" />
        )}
      </div>

      {/* Countdown Timer */}
      {showCountdown && (
        <CountdownTimer expiryTime={expiryTime!} compact={false} />
      )}

      {/* Awaiting Verification Notice */}
      {isAwaitingVerification && (
        <div className="rounded-md border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 p-3 flex items-start gap-3">
          <Clock className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-amber-700 dark:text-amber-300">
              Menunggu Konfirmasi Pembayaran
            </p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5 leading-relaxed">
              Bukti pembayaran Anda telah dikirim dan sedang ditinjau oleh pihak outlet. Anda akan menerima notifikasi setelah pembayaran dikonfirmasi.
            </p>
          </div>
        </div>
      )}

      {/* Operating Hours Confirmation Notice */}
      {/* {normalizedStatus === "SUCCESS" && paymentData.outletInfo && !paymentData.outletInfo.isWithinOperatingHours && paymentData.outletInfo.todaySchedule?.isOpen && (
        <div className="rounded-md border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30 p-3 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-blue-700 dark:text-blue-300">
              Konfirmasi Sesuai Jam Operasional
            </p>
            <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-0.5 leading-relaxed">
              Pembayaran Anda berhasil! Pesanan akan dikonfirmasi saat jam operasional outlet{" "}
              <span className="font-semibold">
                {paymentData.outletInfo.name}
              </span>{" "}
              (buka pukul{" "}
              <span className="font-semibold">
                {new Date(paymentData.outletInfo.todaySchedule.openTime).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
              </span>
              ).
            </p>
          </div>
        </div>
      )} */}

      {/* Payment Overview */}
      <div className="rounded-md border overflow-hidden">
        <div className="px-3 py-2.5 flex items-center justify-between bg-muted/30">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {t("overview.title")}
          </span>
          <div className="flex items-center gap-1">
            <code className="text-[10px] font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              #{paymentData.id.slice(0, 12)}
            </code>
            <CopyButton value={paymentData.id} />
          </div>
        </div>
        <div className="px-3 py-2.5 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {t("overview.method")}
            </span>
            <span className="font-medium capitalize">{methodLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t("overview.total")}
            </span>
            <span className="text-base font-bold text-primary">
              {formatCurrency(paymentData.totalAmount)}
            </span>
          </div>
          {expiryTime && showCountdown && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">
                {t("overview.expiry")}
              </span>
              <span className="font-medium">{formatDateTime(expiryTime)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Payment Method Details (dynamic) */}
      {showManual && (
        <>
          <ManualPaymentDetails
            manual={paymentData.payment.manual!}
            totalAmount={paymentData.totalAmount}
          />
          {showUpload && (
            <ManualPaymentUpload
              orderId={paymentData.id}
              expiryTime={expiryTime}
              onSuccess={refreshPaymentDetail}
            />
          )}
        </>
      )}

      {showVa && (
        <div className="rounded-md border overflow-hidden">
          <div className="px-3 py-2.5 bg-muted/30">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("midtrans.vaTitle", { bank: midtransVa!.bank })}
            </span>
          </div>
          <div className="p-3">
            <VaPaymentDetails
              vaNumber={midtransVa!.va}
              totalAmount={paymentData.totalAmount}
            />
          </div>
        </div>
      )}

      {showQris && (
        <div className="rounded-md border overflow-hidden">
          <div className="px-3 py-2.5 bg-muted/30">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {t("midtrans.qrisTitle")}
            </span>
          </div>
          <div className="p-3">
            <QrisPaymentDetails
              qrCodeUrl={midtransQr!}
              paymentMethodName={
                paymentData.payment.midtrans?.payment_type ?? "QRIS"
              }
            />
          </div>
        </div>
      )}

      {/* Order Items */}
      <div className="rounded-md border overflow-hidden">
        <div className="px-3 py-2.5 bg-muted/30">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {tComp("orderSummary.title")}
          </span>
        </div>
        <div className="divide-y">
          {paymentData.items.map((item) => (
            <div
              key={item.id}
              className="px-3 py-2.5 flex items-center justify-between"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{item.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {item.quantity} x {formatCurrency(item.price)}
                  {item.taxPercentage ? (
                    <span className="text-blue-500 ml-1">+PPN {item.taxPercentage}%</span>
                  ) : null}
                </p>
              </div>
              <span className="text-sm font-semibold ml-3 shrink-0">
                {formatCurrency(item.subtotal ?? item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="border-t px-3 py-2.5 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {tComp("orderSummary.subtotal")}
            </span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {(paymentData.taxAmount ?? 0) > 0 && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                PPN
              </span>
              <span>
                {formatCurrency(paymentData.taxAmount!)}
              </span>
            </div>
          )}
          {showTxFee && (
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">
                {tComp("orderSummary.transactionFee")}
              </span>
              <span>
                {formatCurrency(paymentData.feeDetail.transactionFee)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">
              {tComp("orderSummary.applicationFee")}
            </span>
            <span>{formatCurrency(paymentData.feeDetail.appFee)}</span>
          </div>
          <div className="h-px bg-border my-1" />
          <div className="flex justify-between items-center pt-0.5">
            <span className="text-sm font-bold">
              {tComp("orderSummary.total")}
            </span>
            <span className="text-base font-bold text-primary">
              {formatCurrency(paymentData.totalAmount)}
            </span>
          </div>
        </div>
      </div>

      {/* Customer Info (inlined) */}
      <div className="rounded-md border px-3 py-2.5 space-y-1.5">
        <div className="flex items-center gap-2.5 text-xs">
          <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            {tComp("customerInfo.name")}
          </span>
          <span className="ml-auto font-medium">
            {paymentData.customerDetails.name}
          </span>
        </div>
        <div className="flex items-center gap-2.5 text-xs">
          <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          <span className="text-muted-foreground">
            {tComp("customerInfo.phone")}
          </span>
          <span className="ml-auto font-medium">
            {paymentData.customerDetails.phone}
          </span>
        </div>
      </div>

      {/* Important Information (inlined) */}
      {informationType && (
        <InlineImportantInfo type={informationType} locale={locale} />
      )}

      {/* Footer */}
      <p className="text-center text-[11px] text-muted-foreground pt-2 pb-4">
        {tComp("footer.helpText")}
      </p>
    </div>
  );
}
