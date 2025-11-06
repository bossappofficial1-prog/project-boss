import React from 'react';

import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ONLINE_PAYMENT_OPTIONS } from '@/constants/pos';
import type { OnlinePaymentChannel } from '@/lib/apis/order';
import type { PaymentMethod } from '@/types/pos';

export interface PaymentMethodCardProps {
    paymentMethod: PaymentMethod;
    onPaymentMethodChange: (method: PaymentMethod) => void;
    cashReceived: string;
    onCashReceivedChange: (value: string) => void;
    cashChange: number;
    qrisImage?: string | null;
    onShowQRISModal: () => void;
    onlineChannel: OnlinePaymentChannel;
    onOnlineChannelChange: (channel: OnlinePaymentChannel) => void;
}

export function PaymentMethodCard({
    paymentMethod,
    onPaymentMethodChange,
    cashReceived,
    onCashReceivedChange,
    cashChange,
    qrisImage,
    onShowQRISModal,
    onlineChannel,
    onOnlineChannelChange,
}: PaymentMethodCardProps) {
    return (
        <Card className="border-slate-200 bg-white shadow-sm transition-colors dark:border-slate-800 dark:bg-slate-900/60">
            <CardHeader className="pb-3">
                <CardTitle className="text-base">Metode Pembayaran</CardTitle>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                    Pilih metode yang sesuai dengan pelanggan. Sistem akan menyesuaikan langkah berikutnya.
                </p>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid gap-2 sm:grid-cols-2">
                    {(
                        [
                            { value: 'cash', label: 'Cash' },
                            // { value: 'qris', label: 'QRIS' },
                            { value: 'online', label: 'Online' },
                        ] as const
                    ).map((item) => (
                        <Button
                            key={item.value}
                            type="button"
                            variant={paymentMethod === item.value ? 'default' : 'secondary'}
                            className={
                                paymentMethod === item.value
                                    ? 'bg-red-600 hover:bg-red-500'
                                    : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800'
                            }
                            onClick={() => onPaymentMethodChange(item.value)}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>

                {paymentMethod === 'cash' && (
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-950/60">
                        <Label htmlFor="cash-received" className="text-xs text-slate-600 dark:text-slate-400">
                            Nominal cash diterima
                        </Label>
                        <Input
                            id="cash-received"
                            type="number"
                            min={0}
                            value={cashReceived}
                            onChange={(event) => onCashReceivedChange(event.target.value)}
                            className="border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                        />
                        {cashReceived && (
                            <p
                                className={`text-xs ${cashChange < 0 ? 'text-red-500 dark:text-red-400' : 'text-slate-600 dark:text-slate-400'}`}
                            >
                                {cashChange < 0 ? 'Nominal masih kurang' : `Kembalian: Rp ${cashChange.toLocaleString('id-ID')}`}
                            </p>
                        )}
                    </div>
                )}

                {paymentMethod === 'qris' && (
                    <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                        {qrisImage ? (
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={onShowQRISModal}
                                className="w-full border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-transparent dark:text-slate-300 dark:hover:bg-slate-800"
                            >
                                Lihat kode QR outlet
                            </Button>
                        ) : (
                            <p>Outlet belum memiliki QRIS. Hubungi admin untuk mengunggah QR.</p>
                        )}
                        <p className="text-xs">Pastikan pelanggan menunjukkan bukti pembayaran. Status transaksi tetap menunggu verifikasi.</p>
                    </div>
                )}

                {paymentMethod === 'online' && (
                    <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-400">
                        <p className="text-xs">
                            Pilih kanal pembayaran digital. Sistem akan membuat transaksi Midtrans Core API sesuai pilihan ini.
                        </p>
                        <div className="space-y-2">
                            {ONLINE_PAYMENT_OPTIONS.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => onOnlineChannelChange(option.value)}
                                    className={`w-full rounded-lg border px-4 py-3 text-left transition-colors ${onlineChannel === option.value
                                        ? 'border-red-500 bg-white shadow-sm dark:border-red-400 dark:bg-slate-900'
                                        : 'border-slate-200 bg-white hover:border-red-400 hover:bg-red-50 dark:border-slate-700 dark:bg-slate-900/60 dark:hover:border-red-300 dark:hover:bg-slate-900'
                                        }`}
                                >
                                    <span className="block text-sm font-semibold text-slate-800 dark:text-slate-100">
                                        {option.label}
                                    </span>
                                    <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">{option.description}</span>
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Setelah pesanan dibuat, kasir akan melihat kode bayar atau instruksi pembayaran sesuai kanal yang dipilih.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default PaymentMethodCard;
