'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, RefreshCw } from 'lucide-react';

import { useSocket } from '@/hooks/useSocket-v2';
import { usePaymentTimer } from '@/hooks/usePaymentTimer';
import { useTranslations } from '@/hooks/useI18n';

import { PaymentService } from '@/services/paymentService';
import { formatCurrency } from '@/lib/utils';
import { CustomerInfo as CustomerInfoType, MidtransTransactionStatus, PaymentMethod, PaymentResponse } from '@/types';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CustomerInfo } from '@/components/payment/CustomerInfo';
import { ImportantInformationCard } from '@/components/payment/ImportantInformationCard';
import { PaymentStatusHeader } from '@/components/payment/PaymentStatusHeader';
import { QrisPaymentDetails } from '@/components/payment/QrisPaymentDetails';
import { VaPaymentDetails } from '@/components/payment/VaPaymentDetails';
import { ImageRender } from '@/components/shared/Image';
import { LoadingState, ConfirmationModal } from '@/components/Base';
import { redirectMap } from '@/components/payment/function';
import { useMutation } from '@tanstack/react-query';

export default function PaymentProcessing() {
    const [paymentInfo, setPaymentInfo] = useState<PaymentResponse & { customerInfo: CustomerInfoType; selectedPaymentMethod: PaymentMethod } | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<MidtransTransactionStatus>('pending');
    const [isMounted, setIsMounted] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [showCancelConfirmation, setShowCancelConfirmation] = useState(false);
    const {
        isConnected,
        onEvent,
        joinOrderRoom,
        joinCustomerRoom,
        events,
    } = useSocket();
    const {
        ORDER_OTHER_EVENT,
        ORDER_EVENT,
        CUSTOMER_NOTIFICATION,
    } = events;
    const [isCancelling, setIsCancelling] = useState(false);
    const router = useRouter();
    const t = useTranslations("paymentProcessing");

    useEffect(() => {
        if (typeof window === "undefined") return
        if (isMounted) return
        setIsMounted(true)
    }, [])

    const cancelPaymentMutation = useMutation({
        mutationFn: async (orderId: string) => {
            return PaymentService.cancelPayment(orderId)
        },
        onSuccess: () => {
            setPaymentStatus('cancel');
            PaymentService.updatePaymentInformation({ ...(paymentInfo as PaymentResponse), transaction_status: 'cancel' });
            router.push('/payment/cancelled');
        },
        onError: (error) => {
            console.error('Error cancelling payment:', error);
        }
    });

    const handleCancelPayment = () => {
        setShowCancelConfirmation(true);
    };

    const confirmCancelPayment = () => {
        if (!orderId || !paymentInfo) return;
        setShowCancelConfirmation(false);
        cancelPaymentMutation.mutate(orderId);
    };

    useEffect(() => {
        const paymentData = PaymentService.getPaymentInformation();
        if (!paymentData || !paymentData.order_id) {
            router.replace('/cart');
            return;
        }
        setPaymentInfo(paymentData);
        setPaymentStatus(paymentData.transaction_status as MidtransTransactionStatus);
    }, [router]);

    const onTimerExpire = useCallback(() => { setPaymentStatus("failure") }, [])

    const timer = usePaymentTimer(paymentInfo?.expiry_time ?? '', onTimerExpire);

    const orderId = useMemo(() => paymentInfo?.order_id, [paymentInfo]);

    const handleOrderEvent = useCallback((data: PaymentResponse) => {
        if (data.order_id === orderId) {
            console.log('✅ Event matches, updating status:', data.transaction_status);
            const newStatus = data.transaction_status as MidtransTransactionStatus;
            setPaymentStatus(newStatus);
            PaymentService.updatePaymentInformation(data);

            const redirectPath = redirectMap[newStatus];
            if (redirectPath) {
                setTimeout(() => { router.push(redirectPath) }, 2000)
            }
        }
    }, [orderId, router]);

    const handleCustomerNotification = useCallback((data: any) => {
        if (!data || data.orderId !== orderId) return;
        console.log('ℹ️ Customer notification received:', data);
    }, [orderId]);

    useEffect(() => {
        if (!isConnected || !orderId) return;

        joinOrderRoom(orderId);
        const unsubscribeOther = onEvent(ORDER_OTHER_EVENT, handleOrderEvent);
        const unsubscribePrimary = onEvent(ORDER_EVENT, handleOrderEvent);
        const unsubscribeCustomer = onEvent(CUSTOMER_NOTIFICATION, handleCustomerNotification);

        return () => {
            if (typeof unsubscribeOther === 'function') unsubscribeOther();
            if (typeof unsubscribePrimary === 'function') unsubscribePrimary();
            if (typeof unsubscribeCustomer === 'function') unsubscribeCustomer();
        };
    }, [
        isConnected,
        orderId,
        joinOrderRoom,
        onEvent,
        ORDER_OTHER_EVENT,
        ORDER_EVENT,
        CUSTOMER_NOTIFICATION,
        handleOrderEvent,
        handleCustomerNotification,
    ]);

    useEffect(() => {
        if (!isConnected) return;
        const phone = paymentInfo?.customerInfo.phone;
        if (!phone) return;
        joinCustomerRoom(phone);
    }, [isConnected, paymentInfo?.customerInfo.phone, joinCustomerRoom]);

    const handleRefreshStatus = () => {
        if (!orderId) return;
        setIsRefreshing(true);
        setTimeout(() => {
            console.log('Simulating status refresh...');
            setIsRefreshing(false);
        }, 1500);
    };

    const vaNumber = paymentInfo?.va_numbers?.[0]?.va_number;
    const qrCodeUrl = paymentInfo?.actions?.[0]?.url;

    if (!paymentInfo) return <LoadingState />
    if (isMounted) {
        const redirectPath = redirectMap[paymentStatus]
        if (redirectPath && redirectPath !== "/payment/processing") window.location.href = redirectPath;
    }

    const { selectedPaymentMethod, customerInfo, gross_amount } = paymentInfo;

    return (
        <div className="space-y-4">
            <PaymentStatusHeader status={paymentStatus} timer={timer} />

            <Card className='p-0'>
                <CardContent className="p-4">
                    {/* Payment Method Info */}
                    <div className="flex items-center gap-3 mb-4">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background text-lg">
                            <ImageRender
                                src={selectedPaymentMethod.image_url}
                                alt={selectedPaymentMethod.name}
                            />
                        </div>
                        <div>
                            <h3 className="font-semibold">{selectedPaymentMethod.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedPaymentMethod.description}</p>
                        </div>
                    </div>

                    {/* Total Amount */}
                    <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground">{t("totalPayment")}</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(Number(gross_amount))}</p>
                    </div>

                    {/* Conditional Rendering of Payment Details */}
                    {selectedPaymentMethod.type === 'qris' && qrCodeUrl && (
                        <QrisPaymentDetails qrCodeUrl={qrCodeUrl} paymentMethodName={selectedPaymentMethod.name} />
                    )}

                    {selectedPaymentMethod.type === 'va' && vaNumber && (
                        <VaPaymentDetails vaNumber={vaNumber} totalAmount={Number(gross_amount)} />
                    )}
                </CardContent>
            </Card>

            <CustomerInfo name={customerInfo.name} phone={customerInfo.phone} />

            <div className="space-y-3">
                <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12"
                    onClick={handleRefreshStatus}
                    disabled={isRefreshing}
                >
                    {isRefreshing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
                    {t("refreshStatus")}
                </Button>
                <Button
                    variant="destructive"
                    size="lg"
                    className="w-full h-12"
                    onClick={handleCancelPayment}
                    disabled={cancelPaymentMutation.isPending || paymentStatus !== 'pending'}
                >
                    {cancelPaymentMutation.isPending ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    {t("cancelPayment")}
                </Button>
            </div>

            <ImportantInformationCard type='processing' />

            {/* Cancel Payment Confirmation Modal */}
            <ConfirmationModal
                isOpen={showCancelConfirmation}
                onClose={() => setShowCancelConfirmation(false)}
                onConfirm={confirmCancelPayment}
                title={t("cancelConfirmation.title")}
                message={t("cancelConfirmation.message")}
                confirmText={t("cancelConfirmation.confirm")}
                cancelText={t("cancelConfirmation.cancel")}
                variant="destructive"
                isLoading={cancelPaymentMutation.isPending}
            />
        </div>
    );
}