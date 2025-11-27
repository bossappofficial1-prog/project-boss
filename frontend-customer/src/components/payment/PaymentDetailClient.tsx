'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PaymentOrderSummary } from '@/components/payment/PaymentOrderSummary';
import { CustomerInfo } from '@/components/payment/CustomerInfo';
import { ImportantInformationCard } from '@/components/payment/ImportantInformationCard';
import { PaymentFooter } from '@/components/payment/PaymentFooter';
import { VaPaymentDetails } from '@/components/payment/VaPaymentDetails';
import { ManualPaymentDetails } from '@/components/payment/ManualPaymentDetails';
import { ManualPaymentUpload } from '@/components/payment/ManualPaymentUpload';
import { QrisPaymentDetails } from '@/components/payment/QrisPaymentDetails';
import { useAppBarV2 } from '@/context/AppBarContextV2';
import { useTranslations } from '@/hooks/useI18n';
import { cn, formatCurrency, formatDateTime } from '@/lib/utils';
import { PaymentData } from '@/types';
import { PaymentDetailData, PaymentDetailManual, PaymentDetailMidtrans, PaymentManualInstruction } from '@/types/payment-detail';
import { AlertCircle, CheckCircle, Clock, Info, XCircle } from 'lucide-react';
import CountdownTimer from '@/components/orders/parts/CountdownTimer';
import type { ImportantInformationType } from '@/constants';
import { PaymentService } from '@/services/paymentService';
import { useSocket } from '@/hooks/useSocket-v2';

interface PaymentDetailClientProps {
    orderId: string;
    payment: PaymentDetailData;
}

type StatusTone = 'info' | 'success' | 'warning' | 'danger';

type StatusKey = 'PENDING' | 'PROCESSING' | 'SUCCESS' | 'FAILED' | 'EXPIRED' | 'CANCELLED' | 'UNKNOWN';

interface StatusPresentation {
    tone: StatusTone;
    icon: React.ReactNode;
    infoType?: ImportantInformationType;
    titleKey: string;
    descriptionKey: string;
}

const STATUS_PRESENTATION: Record<StatusKey, StatusPresentation> = {
    PENDING: {
        tone: 'warning',
        icon: <Clock className="w-5 h-5" />,
        infoType: 'pending',
        titleKey: 'status.pending.title',
        descriptionKey: 'status.pending.description',
    },
    PROCESSING: {
        tone: 'info',
        icon: <Info className="w-5 h-5" />,
        infoType: 'processing',
        titleKey: 'status.processing.title',
        descriptionKey: 'status.processing.description',
    },
    SUCCESS: {
        tone: 'success',
        icon: <CheckCircle className="w-5 h-5" />,
        infoType: 'success',
        titleKey: 'status.success.title',
        descriptionKey: 'status.success.description',
    },
    FAILED: {
        tone: 'danger',
        icon: <XCircle className="w-5 h-5" />,
        titleKey: 'status.failed.title',
        descriptionKey: 'status.failed.description',
    },
    EXPIRED: {
        tone: 'danger',
        icon: <AlertCircle className="w-5 h-5" />,
        infoType: 'expired',
        titleKey: 'status.expired.title',
        descriptionKey: 'status.expired.description',
    },
    CANCELLED: {
        tone: 'danger',
        icon: <AlertCircle className="w-5 h-5" />,
        infoType: 'cancelled',
        titleKey: 'status.cancelled.title',
        descriptionKey: 'status.cancelled.description',
    },
    UNKNOWN: {
        tone: 'info',
        icon: <Info className="w-5 h-5" />,
        titleKey: 'status.unknown.title',
        descriptionKey: 'status.unknown.description',
    },
};

const TONE_CLASSES: Record<StatusTone, string> = {
    success: 'border-green-200 bg-green-50 text-green-800 dark:border-green-900/50 dark:bg-green-950/20 dark:text-green-200',
    warning: 'border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200',
    danger: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-200',
    info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-200',
};

const METHOD_LABELS: Record<string, string> = {
    MIDTRANS: 'method.midtrans',
    MANUAL: 'method.manual',
};

function normalizeStatus(status?: string): StatusKey {
    if (!status) return 'UNKNOWN';

    const upper = status.toUpperCase();
    if (['AWAITING_PAYMENT', 'PENDING'].includes(upper)) return 'PENDING';
    if (['PROCESSING', 'AWAITING_VERIFICATION'].includes(upper)) return 'PROCESSING';
    if (['SETTLEMENT', 'SUCCESS', 'PAID', 'COMPLETED'].includes(upper)) return 'SUCCESS';
    if (['FAILURE', 'FAILED', 'DENY'].includes(upper)) return 'FAILED';
    if (['EXPIRE', 'EXPIRED'].includes(upper)) return 'EXPIRED';
    if (['CANCEL', 'CANCELLED'].includes(upper)) return 'CANCELLED';
    return 'UNKNOWN';
}

function resolveManualInstructions(manual?: PaymentDetailManual | null): PaymentManualInstruction | undefined {
    if (!manual) return undefined;
    return manual.instructions ?? manual.intruction ?? undefined;
}

function buildPaymentSummary(order: PaymentDetailData): PaymentData {
    const instructions = resolveManualInstructions(order.payment.manual);
    const outletName = instructions?.outletName ?? order.items[0]?.name ?? order.customerDetails.name;
    const subtotal = order.items.reduce((acc, item) => acc + (item.subtotal ?? item.price * item.quantity), 0);

    return {
        outlet: {
            id: order.items[0]?.id ?? order.id,
            name: outletName,
        },
        items: order.items.map((item) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
        })),
        subtotal,
        transactionFee: order.feeDetail.transactionFee,
        applicationFee: order.feeDetail.appFee,
        total: order.totalAmount,
        paymentMethod: {
            type: instructions?.manualType ?? order.payment.midtrans?.payment_type ?? order.payment.method,
            name: instructions?.manualType ?? order.payment.midtrans?.payment_type ?? order.payment.method,
            category: order.payment.method,
        },
        customerInfo: order.customerDetails,
        orderId: order.id,
    };
}

function derivePaymentMethodLabel(method: string, t: ReturnType<typeof useTranslations<'paymentDetail'>>): string {
    const upper = method.toUpperCase();
    const key = METHOD_LABELS[upper];
    if (key) {
        return t(key as any);
    }
    return upper.replace(/_/g, ' ');
}

function resolveStatus(order: PaymentDetailData): StatusPresentation {
    const primaryStatus = normalizeStatus(order.payment.status);
    const midtransStatus = normalizeStatus(order.payment.midtrans?.transaction_status);
    const fallbackStatus = normalizeStatus(order.status);
    const resolved = primaryStatus !== 'UNKNOWN' ? primaryStatus : (midtransStatus !== 'UNKNOWN' ? midtransStatus : fallbackStatus);
    return STATUS_PRESENTATION[resolved] ?? STATUS_PRESENTATION.UNKNOWN;
}

function getInformationType(order: PaymentDetailData): ImportantInformationType | undefined {
    const status = normalizeStatus(order.payment.status ?? order.status);
    return STATUS_PRESENTATION[status]?.infoType;
}

function getMidtransVa(midtrans?: PaymentDetailMidtrans | null): { bank: string; va: string } | null {
    if (!midtrans) return null;

    const vaArray = Array.isArray((midtrans as any).va_numbers)
        ? (midtrans as any).va_numbers
        : Array.isArray((midtrans as any).vaNumbers)
            ? (midtrans as any).vaNumbers
            : null;

    if (vaArray && vaArray.length > 0) {
        const entry = vaArray[0];
        if (entry?.va_number || entry?.vaNumber) {
            return {
                bank: (entry.bank ?? entry.bankCode ?? entry.bank_name ?? 'VA').toUpperCase(),
                va: entry.va_number ?? entry.vaNumber,
            };
        }
    }

    if (typeof (midtrans as any).va_number === 'string') {
        return {
            bank: ((midtrans as any).bank ?? (midtrans as any).bank_code ?? (midtrans.payment_type ?? 'VA')).toUpperCase(),
            va: (midtrans as any).va_number,
        };
    }

    if (typeof (midtrans as any).permata_va_number === 'string') {
        return {
            bank: 'PERMATA',
            va: (midtrans as any).permata_va_number,
        };
    }

    const billKey = (midtrans as any).bill_key ?? (midtrans as any).billKey;
    const billerCode = (midtrans as any).biller_code ?? (midtrans as any).billerCode;
    if (billKey && billerCode) {
        return {
            bank: String(billerCode).toUpperCase(),
            va: String(billKey),
        };
    }

    return null;
}

function getMidtransQr(midtrans?: PaymentDetailMidtrans | null): string | null {
    if (!midtrans) return null;
    const qrAction = midtrans.actions?.find((action) => action.name === 'generate-qr-code' || action.name === 'deeplink-redirect');
    if (qrAction?.url) return qrAction.url;
    if ((midtrans as any).qr_string) {
        return (midtrans as any).qr_string as string;
    }
    return null;
}

export function PaymentDetailClient({ orderId, payment }: PaymentDetailClientProps) {
    const t = useTranslations('paymentDetail');
    const [paymentData, setPaymentData] = useState<PaymentDetailData>(payment);
    const summary = useMemo(() => buildPaymentSummary(paymentData), [paymentData]);
    const statusPresentation = resolveStatus(paymentData);
    const informationType = getInformationType(paymentData);
    const { setAppBar, resetAppBar } = useAppBarV2();
    const { isConnected, joinOrderRoom, onEvent, events } = useSocket();
    const { ORDER_EVENT, ORDER_OTHER_EVENT, CUSTOMER_NOTIFICATION } = events;

    useEffect(() => {
        setAppBar({ title: t('title'), subtitle: orderId, showBackButton: true });
        return () => resetAppBar();
    }, [orderId, resetAppBar, setAppBar, t]);

    useEffect(() => {
        setPaymentData(payment);
    }, [payment]);

    const refreshPaymentDetail = useCallback(async () => {
        try {
            const latest = await PaymentService.getPaymentDetail(orderId);
            setPaymentData(latest);
        } catch (error) {
            console.error('Failed to refresh payment detail:', error);
        }
    }, [orderId]);

    const handleOrderEvent = useCallback(async (payload: any) => {
        const incomingOrderId = payload?.order_id ?? payload?.orderId;
        if (incomingOrderId !== orderId) return;
        await refreshPaymentDetail();
    }, [orderId, refreshPaymentDetail]);

    const handleCustomerNotification = useCallback(async (payload: any) => {
        if (!payload || payload.orderId !== orderId) return;
        await refreshPaymentDetail();
    }, [orderId, refreshPaymentDetail]);

    useEffect(() => {
        if (!isConnected || !orderId) return;
        joinOrderRoom(orderId);
    }, [isConnected, joinOrderRoom, orderId]);

    useEffect(() => {
        if (!isConnected) return;

        const unsubscribePrimary = onEvent(ORDER_EVENT, handleOrderEvent);
        const unsubscribeOther = onEvent(ORDER_OTHER_EVENT, handleOrderEvent);
        const unsubscribeCustomer = onEvent(CUSTOMER_NOTIFICATION, handleCustomerNotification);

        return () => {
            if (typeof unsubscribePrimary === 'function') unsubscribePrimary();
            if (typeof unsubscribeOther === 'function') unsubscribeOther();
            if (typeof unsubscribeCustomer === 'function') unsubscribeCustomer();
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

    const midtransVa = getMidtransVa(paymentData.payment.midtrans);
    const midtransQr = getMidtransQr(paymentData.payment.midtrans);
    const manualInstructions = useMemo(
        () => resolveManualInstructions(paymentData.payment.manual),
        [paymentData.payment.manual]
    );
    const manualProofUrl = paymentData.payment.manual?.paymentProofUrl ?? null;
    const isAwaitingVerification =
        paymentData.payment.status?.toUpperCase() === 'AWAITING_VERIFICATION' ||
        paymentData.status?.toUpperCase() === 'AWAITING_VERIFICATION';
    const expiryTime = paymentData.payment.midtrans?.expiry_time ?? manualInstructions?.expiry_time ?? undefined;

    const paymentMethodLabel = derivePaymentMethodLabel(paymentData.payment.method, t);

    return (
        <div className="space-y-2 pb-16">
            <Card className={cn('border-2', 'p-0 rounded-md', TONE_CLASSES[statusPresentation.tone])}>
                <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            {statusPresentation.icon}
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-lg font-semibold">
                                {t(statusPresentation.titleKey as any)}
                            </h2>
                            <p className="text-sm opacity-80">
                                {t(statusPresentation.descriptionKey as any)}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className='rounded-md'>
                <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center justify-between">
                        <span>{t('overview.title')}</span>
                        <Badge variant="outline">{paymentData.id}</Badge>
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('overview.method')}</span>
                        <span className="font-medium">{paymentMethodLabel}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{t('overview.total')}</span>
                        <span className="font-semibold text-primary">{formatCurrency(paymentData.totalAmount)}</span>
                    </div>
                    {expiryTime && (payment.payment.status == 'PENDING' || payment.payment.status == 'WAITING_VERIFICATION') && (
                        <>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted-foreground">{t('overview.expiry')}</span>
                                <span className="font-medium">{formatDateTime(expiryTime)}</span>
                            </div>
                            <CountdownTimer
                                expiryTime={expiryTime}
                                compact
                                className="mt-2"
                            />
                        </>
                    )}
                </CardContent>
            </Card>

            {paymentData.payment.isManual && paymentData.payment.manual && manualInstructions && (
                <>
                    <ManualPaymentDetails
                        manual={paymentData.payment.manual}
                        totalAmount={paymentData.totalAmount}
                    />
                    {!manualProofUrl && !isAwaitingVerification && (
                        <ManualPaymentUpload
                            orderId={paymentData.id}
                            expiryTime={expiryTime}
                            onSuccess={refreshPaymentDetail}
                        />
                    )}
                </>
            )}

            {!paymentData.payment.isManual && midtransVa && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{t('midtrans.vaTitle', { bank: midtransVa.bank })}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <VaPaymentDetails vaNumber={midtransVa.va} totalAmount={paymentData.totalAmount} />
                    </CardContent>
                </Card>
            )}

            {!paymentData.payment.isManual && !midtransVa && midtransQr && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">{t('midtrans.qrisTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <QrisPaymentDetails qrCodeUrl={midtransQr} paymentMethodName={paymentData.payment.midtrans?.payment_type ?? 'QRIS'} />
                    </CardContent>
                </Card>
            )}

            <PaymentOrderSummary data={summary} />

            <CustomerInfo name={paymentData.customerDetails.name} phone={paymentData.customerDetails.phone} />

            {informationType && (
                <ImportantInformationCard type={informationType} />
            )}

            <PaymentFooter className="pt-2" />
        </div>
    );
}
