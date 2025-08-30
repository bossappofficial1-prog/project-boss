'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Check, Clock, AlertCircle } from 'lucide-react';
import { MidtransTransactionStatus, PaymentTimer } from '@/types'; // Assuming you create a types file

interface PaymentStatusHeaderProps {
    status: MidtransTransactionStatus;
    timer: PaymentTimer;
}

type StatusConfig = {
    borderColor: string;
    bgColor: string;
    icon: React.ReactNode;
    title: string;
    message: string;
};

const STATUS_CONFIG: Partial<Record<MidtransTransactionStatus, StatusConfig>> = {
    settlement: {
        borderColor: 'border-green-200',
        bgColor: 'bg-green-50',
        icon: <Check className="w-8 h-8 text-green-600" />,
        title: 'Pembayaran Berhasil!',
        message: 'Redirecting ke halaman sukses...',
    },
    failure: {
        borderColor: 'border-red-200',
        bgColor: 'bg-red-50',
        icon: <AlertCircle className="w-8 h-8 text-red-600" />,
        title: 'Pembayaran Gagal',
        message: 'Waktu pembayaran telah habis atau dibatalkan.',
    },
    // processing: {
    //     borderColor: 'border-blue-200',
    //     bgColor: 'bg-blue-50',
    //     icon: <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />,
    //     title: 'Memproses Pembayaran...',
    //     message: 'Mengecek status pembayaran...',
    // },
    pending: {
        borderColor: 'border-orange-200',
        bgColor: 'bg-orange-50',
        icon: <Clock className="w-8 h-8 text-orange-600" />,
        title: 'Menunggu Pembayaran',
        message: 'Selesaikan pembayaran sebelum waktu habis',
    },
};

const DEFAULT_CONFIG: StatusConfig = {
    borderColor: 'border-gray-200',
    bgColor: 'bg-white',
    icon: <AlertCircle className="w-8 h-8 text-gray-600" />,
    title: 'Status Tidak Diketahui',
    message: 'Silakan cek kembali status pembayaran.',
};

export function PaymentStatusHeader({ status, timer }: PaymentStatusHeaderProps) {
    const config = STATUS_CONFIG[status] ?? DEFAULT_CONFIG;

    return (
        <Card className={`border-2 p-0 ${config.borderColor} ${config.bgColor}`}>
            <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center mb-3">{config.icon}</div>
                <h2 className="text-lg font-bold mb-2">{config.title}</h2>
                <p className="text-sm text-muted-foreground mb-3">{config.message}</p>

                {(status === 'pending') && (
                    <div className="flex items-center justify-center gap-2 bg-white rounded-lg px-3 border py-1">
                        <Clock className="w-4 h-4 text-orange-600" />
                        <span className="font-mono font-bold text-lg">
                            {String(timer.hours).padStart(2, '0')}:{String(timer.minutes).padStart(2, '0')}:{String(timer.seconds).padStart(2, '0')}
                        </span>
                        <span className="text-sm text-muted-foreground">tersisa</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}