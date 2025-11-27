import type { OnlinePaymentChannel } from '@/lib/apis/order';

export const ONLINE_PAYMENT_OPTIONS: Array<{
    value: OnlinePaymentChannel;
    label: string;
    description: string;
}> = [
        {
            value: 'qris_dynamic',
            label: 'QRIS Dinamis',
            description: 'Tampilkan QR dinamis langsung di layar kasir dari Midtrans Core API.',
        },
        {
            value: 'va_bca',
            label: 'VA BCA',
            description: 'Generate nomor virtual account BCA dan tampilkan instruksi pembayaran.',
        },
        {
            value: 'ewallet_gopay',
            label: 'GoPay',
            description: 'Siapkan pembayaran dompet digital dengan kode bayar dari Midtrans.',
        },
    ];

export const ONLINE_PAYMENT_LABELS: Record<OnlinePaymentChannel, string> = {
    qris_dynamic: 'QRIS Dinamis',
    va_bca: 'VA BCA',
    ewallet_gopay: 'GoPay',
};
