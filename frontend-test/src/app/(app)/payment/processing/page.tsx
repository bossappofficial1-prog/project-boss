'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Loader2,
    QrCode,
    Building2,
    Copy,
    Check,
    Clock,
    AlertCircle,
    ArrowLeft,
    Smartphone,
    RefreshCw
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAppBarConfig } from '@/hooks/useAppBarConfig';
import { formatCurrency } from '@/lib/utils';
import { ImportantInformationCard } from '@/components/payment/ImportantInformationCard';

const PROCESSING_APP_BAR_CONFIG = {
    title: 'Proses Pembayaran',
    showBackButton: true,
};

interface PaymentTimer {
    minutes: number;
    seconds: number;
}

export default function PaymentProcessing() {
    const [paymentInfo, setPaymentInfo] = useState<any>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'processing' | 'confirmed' | 'failed'>('pending');
    const [timer, setTimer] = useState<PaymentTimer>({ minutes: 15, seconds: 0 });
    const [qrCode, setQrCode] = useState<string>('');
    const [vaNumber, setVaNumber] = useState<string>('');
    const [copied, setCopied] = useState(false);
    const router = useRouter();
    const searchParams = useSearchParams();

    // Configure app bar
    useAppBarConfig(PROCESSING_APP_BAR_CONFIG);

    useEffect(() => {
        // Load payment data
        const lastPayment = localStorage.getItem('lastPayment');
        if (lastPayment) {
            const payment = JSON.parse(lastPayment);
            setPaymentInfo(payment);

            // Generate mock payment details based on method
            if (payment.selectedPaymentMethod.type === 'qris') {
                setQrCode(`QRIS_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
            } else if (payment.selectedPaymentMethod.type === 'va') {
                const bankCode = payment.selectedPaymentMethod.id.includes('bca') ? '8877' :
                    payment.selectedPaymentMethod.id.includes('bni') ? '8866' :
                        payment.selectedPaymentMethod.id.includes('mandiri') ? '8855' : '8844';
                setVaNumber(`${bankCode}${Math.random().toString().slice(2, 14)}`);
            }
        } else {
            router.replace('/cart');
        }
    }, [router]);

    // Timer countdown
    useEffect(() => {
        const countdown = setInterval(() => {
            setTimer(prev => {
                if (prev.minutes === 0 && prev.seconds === 0) {
                    clearInterval(countdown);
                    setPaymentStatus('failed');
                    return { minutes: 0, seconds: 0 };
                }

                if (prev.seconds === 0) {
                    return { minutes: prev.minutes - 1, seconds: 59 };
                }

                return { ...prev, seconds: prev.seconds - 1 };
            });
        }, 1000);

        return () => clearInterval(countdown);
    }, []);

    // Simulate payment status check
    useEffect(() => {
        const statusCheck = setInterval(() => {
            // Simulate random payment confirmation (for demo)
            if (Math.random() > 0.98 && paymentStatus === 'pending') {
                setPaymentStatus('confirmed');
                setTimeout(() => {
                    router.push('/payment/success');
                }, 2000);
            }
        }, 3000);

        return () => clearInterval(statusCheck);
    }, [paymentStatus, router]);

    const handleCopy = async (text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy: ', err);
        }
    };

    const handleRefreshStatus = () => {
        setPaymentStatus('processing');
        setTimeout(() => {
            setPaymentStatus('pending');
        }, 1000);
    };

    const handleCancelPayment = () => {
        localStorage.removeItem('lastPayment');
        router.push('/payment/failed?reason=cancelled');
    };

    if (!paymentInfo) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="w-8 h-8 animate-spin" />
            </div>
        );
    }

    const { selectedPaymentMethod, checkoutData, customerInfo } = paymentInfo;

    return (
        <div className="space-y-4">
            {/* Payment Status Header */}
            <Card className={`border-2 p-0 ${paymentStatus === 'confirmed' ? 'border-green-200 bg-green-50' :
                paymentStatus === 'failed' ? 'border-red-200 bg-red-50' :
                    paymentStatus === 'processing' ? 'border-blue-200 bg-blue-50' :
                        'border-orange-200 bg-orange-50'
                }`}>
                <CardContent className="p-4 text-center">
                    <div className="flex items-center justify-center mb-3">
                        {paymentStatus === 'confirmed' ? (
                            <Check className="w-8 h-8 text-green-600" />
                        ) : paymentStatus === 'failed' ? (
                            <AlertCircle className="w-8 h-8 text-red-600" />
                        ) : paymentStatus === 'processing' ? (
                            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
                        ) : (
                            <Clock className="w-8 h-8 text-orange-600" />
                        )}
                    </div>

                    <h2 className="text-lg font-bold mb-2">
                        {paymentStatus === 'confirmed' ? 'Pembayaran Berhasil!' :
                            paymentStatus === 'failed' ? 'Pembayaran Gagal' :
                                paymentStatus === 'processing' ? 'Memproses Pembayaran...' :
                                    'Menunggu Pembayaran'}
                    </h2>

                    <p className="text-sm text-muted-foreground mb-3">
                        {paymentStatus === 'confirmed' ? 'Redirecting ke halaman sukses...' :
                            paymentStatus === 'failed' ? 'Waktu pembayaran telah habis' :
                                paymentStatus === 'processing' ? 'Mengecek status pembayaran...' :
                                    'Selesaikan pembayaran sebelum waktu habis'}
                    </p>

                    {/* Timer */}
                    {(paymentStatus === 'pending' || paymentStatus === 'processing') && (
                        <div className="flex items-center justify-center gap-2 bg-white rounded-lg px-3 border">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="font-mono font-bold text-lg">
                                {String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
                            </span>
                            <span className="text-sm text-muted-foreground">tersisa</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Payment Details */}
            <Card className='p-0'>
                <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-lg bg-white border flex items-center justify-center text-lg">
                            {selectedPaymentMethod.icon}
                        </div>
                        <div>
                            <h3 className="font-semibold">{selectedPaymentMethod.name}</h3>
                            <p className="text-sm text-muted-foreground">{selectedPaymentMethod.description}</p>
                        </div>
                    </div>

                    <div className="text-center mb-4">
                        <p className="text-sm text-muted-foreground">Total Pembayaran</p>
                        <p className="text-2xl font-bold text-primary">{formatCurrency(checkoutData.grandTotal)}</p>
                    </div>

                    {/* QRIS Payment */}
                    {selectedPaymentMethod.type === 'qris' && (
                        <div className="space-y-4">
                            <div className="w-48 h-48 mx-auto bg-muted/20 border-2 border-dashed rounded-xl flex items-center justify-center">
                                <div className="text-center">
                                    <QrCode className="w-16 h-16 mx-auto mb-2 text-muted-foreground" />
                                    <p className="text-sm text-muted-foreground">QR Code</p>
                                    <p className="text-xs text-muted-foreground">Scan untuk bayar</p>
                                </div>
                            </div>

                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <Smartphone className="w-4 h-4" />
                                    Cara Pembayaran:
                                </h4>
                                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>Buka aplikasi {selectedPaymentMethod.name}</li>
                                    <li>Pilih menu "Scan" atau "Bayar"</li>
                                    <li>Scan QR Code di atas</li>
                                    <li>Konfirmasi pembayaran</li>
                                </ol>
                            </div>
                        </div>
                    )}

                    {/* Virtual Account Payment */}
                    {selectedPaymentMethod.type === 'va' && (
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium mb-2">Nomor Virtual Account</p>
                                <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-3">
                                    <span className="font-mono font-bold text-lg flex-1">{vaNumber}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => handleCopy(vaNumber)}
                                    >
                                        {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Cara Transfer:
                                </h4>
                                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                    <li>Buka mobile banking atau ATM</li>
                                    <li>Pilih menu "Transfer" → "Virtual Account"</li>
                                    <li>Masukkan nomor: {vaNumber}</li>
                                    <li>Masukkan nominal: {formatCurrency(checkoutData.grandTotal)}</li>
                                    <li>Konfirmasi pembayaran</li>
                                </ol>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Customer Info */}
            <Card className='p-0'>
                <CardContent className="p-4">
                    <h3 className="font-semibold mb-3">Detail Pembeli</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Nama</span>
                            <span className="font-medium">{customerInfo.name}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">No. Telepon</span>
                            <span className="font-medium">{customerInfo.phone}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
                <Button
                    variant="outline"
                    size="lg"
                    className="w-full h-12"
                    onClick={handleRefreshStatus}
                    disabled={paymentStatus === 'processing'}
                >
                    {paymentStatus === 'processing' ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                        <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Refresh Status
                </Button>

                <Button
                    variant="destructive"
                    size="lg"
                    className="w-full h-12"
                    onClick={handleCancelPayment}
                    disabled={paymentStatus === 'confirmed' || paymentStatus === 'processing'}
                >
                    Batalkan Pembayaran
                </Button>
            </div>

            {/* Important Notes */}
            <ImportantInformationCard type='processing' />
        </div>
    );
}
