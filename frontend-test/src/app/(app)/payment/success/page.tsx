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

const SUCCESS_APP_BAR_CONFIG = {
    title: 'Pembayaran Berhasil',
    showBackButton: false,
};

export default function PaymentSuccess() {
    const [paymentInfo, setPaymentInfo] = useState<any>(null);
    const router = useRouter();

    // Configure app bar
    useAppBarConfig(SUCCESS_APP_BAR_CONFIG);

    useEffect(() => {
        const lastPayment = localStorage.getItem('lastPayment');
        if (lastPayment) {
            setPaymentInfo(JSON.parse(lastPayment));
        }
    }, []);

    const formatCurrency = (amount: number): string => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const handleBackToHome = () => {
        router.push('/');
    };

    const handleViewReceipt = () => {
        // Navigate to receipt/order detail page
        router.push('/orders'); // You can implement this later
    };

    return (
        <div className="space-y-6 p-4">
            {/* Success Icon */}
            <div className="text-center py-8">
                <div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                </div>
                <h1 className="text-2xl font-bold text-green-600 mb-2">Pesanan Berhasil!</h1>
                <p className="text-muted-foreground">
                    Terima kasih, pesanan Anda sedang diproses
                </p>
            </div>

            {/* Payment Info */}
            {paymentInfo && (
                <Card className='py-0'>
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
                                <span className="font-medium">{paymentInfo.selectedPaymentMethod.name}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Nama Pembeli</span>
                                <span className="font-medium">{paymentInfo.customerInfo.name}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">No. Telepon</span>
                                <span className="font-medium">{paymentInfo.customerInfo.phone}</span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-muted-foreground">Waktu Pemesanan</span>
                                <span className="font-medium">
                                    {new Date(paymentInfo.paymentDate).toLocaleString('id-ID')}
                                </span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Status Info */}
            <Card className="border-orange-200/20 py-0s">
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
            <Card className="py-0 border-blue-200">
                <CardContent className="p-4 text-center">
                    <h3 className="font-medium text-blue-800 mb-2">Informasi Penting</h3>
                    <ul className="text-sm text-blue-600 space-y-1">
                        <li>• Anda akan menerima notifikasi saat pesanan dikonfirmasi</li>
                        <li>• Silakan datang ke outlet sesuai waktu yang dijadwalkan</li>
                        <li>• Tunjukkan bukti pemesanan saat mengambil pesanan</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
