'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    CheckCircle,
    Receipt,
    Home,
    Clock
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppBarConfig } from '@/hooks/useAppBarConfig';
import { formatCurrency } from '@/lib/utils';
import { SuccessState } from '@/components/Base';
import { ImportantInformationCard } from '@/components/payment/ImportantInformationCard';

const SUCCESS_APP_BAR_CONFIG = {
    title: 'Pembayaran Berhasil',
    showBackButton: false,
};

export default function PaymentSuccess() {
    const [paymentInfo, setPaymentInfo] = useState<any>(null);
    const router = useRouter();

    useAppBarConfig(SUCCESS_APP_BAR_CONFIG);
    useEffect(() => {
        const lastPayment = localStorage.getItem('lastPayment');
        if (lastPayment) {
            const paymentData = JSON.parse(lastPayment);
            setPaymentInfo(paymentData);

            // Save to orders list
            try {
                const savedOrders = localStorage.getItem('userOrders');
                const orders = savedOrders ? JSON.parse(savedOrders) : [];

                // Check if this payment is already saved as an order
                const orderExists = orders.some((order: any) =>
                    order.paymentDate === paymentData.paymentDate
                );

                if (!orderExists) {
                    const newOrder = {
                        id: Date.now().toString(),
                        ...paymentData,
                        status: 'pending',
                        orderNumber: `ORD-${Date.now().toString().slice(-6)}`
                    };

                    orders.unshift(newOrder); // Add to beginning of array
                    localStorage.setItem('userOrders', JSON.stringify(orders));
                }
            } catch (error) {
                console.error('Error saving order:', error);
            }
        }
    }, []);

    const handleBackToHome = () => {
        router.push('/');
    };

    const handleViewReceipt = () => {
        router.push('/orders');
    };

    return (
        <>
            <SuccessState
                title='Pesanan Berhasil!'
                description='Terima kasih, pesanan Anda sedang diproses'
            />

            <div className='space-y-4'>
                {/* Payment Info */}
                {paymentInfo && (
                    <Card className='p-0'>
                        <CardContent className="p-6 space-y-4">
                            <div className="text-center border-b pb-4">
                                <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                                <p className="text-3xl font-bold text-primary">
                                    {formatCurrency(paymentInfo.checkoutData.grandTotal)}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Metode Pembayaran</span>
                                    <span className="font-medium text-sm">{paymentInfo.selectedPaymentMethod.name}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Nama Pembeli</span>
                                    <span className="font-medium text-sm">{paymentInfo.customerInfo.name}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">No. Telepon</span>
                                    <span className="font-medium text-sm">{paymentInfo.customerInfo.phone}</span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Waktu Pemesanan</span>
                                    <span className="font-medium text-sm">
                                        {new Date(paymentInfo.paymentDate).toLocaleString('id-ID')}
                                    </span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Status Info */}
                <Card className="border-orange-200/20 p-0">
                    <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-orange-600" />
                            <div>
                                <p className="font-medium text-orange-800">Status: Menunggu Konfirmasi</p>
                                <p className="text-sm text-orange-600">
                                    Outlet akan mengonfirmasi pesanan Anda dalam 5-10 menit
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        size="lg"
                        className="w-full h-12"
                        onClick={handleViewReceipt}
                    >
                        <Receipt className="w-4 h-4 mr-2" />
                        Lihat Detail Pesanan
                    </Button>

                    <Button
                        variant="outline"
                        size="lg"
                        className="w-full h-12"
                        onClick={handleBackToHome}
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Kembali ke Beranda
                    </Button>
                </div>

                <ImportantInformationCard type='success' />
            </div>
        </>
    );
}
