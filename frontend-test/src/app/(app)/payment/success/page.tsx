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
            setPaymentInfo(JSON.parse(lastPayment));
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

                {/* Additional Info */}
                <Card className="p-0 border-blue-200">
                    <CardContent className="p-4">
                        <h3 className="font-medium text-center text-blue-800 mb-2">Informasi Penting</h3>
                        <ul className="text-sm text-blue-600 space-y-1">
                            <li>Anda akan menerima notifikasi saat pesanan dikonfirmasi</li>
                            <li>Silakan datang ke outlet sesuai waktu yang dijadwalkan</li>
                            <li>Tunjukkan bukti pemesanan saat mengambil pesanan</li>
                        </ul>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
