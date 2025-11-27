'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, ArrowLeft, Clock, UploadCloud, Copy, CheckCircle, X, Image as ImageIcon } from 'lucide-react';

import { CheckoutService } from '@/services/checkout';
import { PaymentService } from '@/services/paymentService';
import { formatCurrency } from '@/lib/utils';
import { ManualPaymentInstructions, ManualPaymentTypeLiteral, PaymentData } from '@/types';
import { PaymentOrderSummary } from '@/components/payment/PaymentOrderSummary';
import { LoadingState } from '@/components/Base';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ImageRender } from '@/components/shared/Image';
import { Input } from '@/components/ui/input';
import CountdownTimer from '@/components/orders/parts/CountdownTimer';

type ManualPaymentStorage = ReturnType<typeof CheckoutService.getManualPaymentFromStorage>;

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error';

// function useCountdown(expiryTime?: string) {
//     const [secondsLeft, setSecondsLeft] = useState<number>(0);

//     useEffect(() => {
//         if (!expiryTime) return;
//         const expiry = new Date(expiryTime).getTime();

//         const tick = () => {
//             const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
//             setSecondsLeft(diff);
//         };

//         tick();
//         const interval = setInterval(tick, 1000);
//         return () => clearInterval(interval);
//     }, [expiryTime]);

//     const minutes = Math.floor(secondsLeft / 60);
//     const seconds = secondsLeft % 60;

//     return {
//         secondsLeft,
//         minutes,
//         seconds
//     };
// }

function ManualInstructions({ instructions, manualType }: { instructions: ManualPaymentInstructions; manualType: ManualPaymentTypeLiteral }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" />
                    Instruksi Pembayaran Manual
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Outlet</p>
                    <p className="font-semibold text-base">{instructions.outletName}</p>
                    <p className="text-sm text-muted-foreground">{instructions.businessName}</p>
                </div>

                {instructions.note && (
                    <div className="p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-sm">
                        {instructions.note}
                    </div>
                )}

                {manualType === 'QRIS_OFFLINE' && instructions.qrImageUrl && (
                    <div className="space-y-3">
                        <div className="rounded-lg border bg-gray-200/20 p-4 flex flex-col items-center gap-3">
                            <ImageRender src={instructions.qrImageUrl} alt="QRIS Outlet" className="w-40 h-40 rounded-lg object-contain" />
                            <p className="text-sm text-muted-foreground text-center">
                                Scan QR statis outlet menggunakan aplikasi pembayaran favoritmu, lalu masukkan nominal sesuai total tagihan.
                            </p>
                        </div>
                        <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>Buka aplikasi pembayaran (Dana, GoPay, OVO, dll).</li>
                            <li>Scan QR di atas atau upload dari galeri.</li>
                            <li>Masukkan nominal sesuai tagihan dan selesaikan pembayaran.</li>
                            <li>Simpan bukti pembayaran untuk diunggah.</li>
                        </ol>
                    </div>
                )}

                {manualType === 'OWNER_TRANSFER' && instructions.bankAccount && (
                    <div className="space-y-3">
                        <div className="rounded-lg border bg-muted/20 p-4">
                            <p className="text-sm text-muted-foreground">Bank Tujuan</p>
                            <p className="font-semibold text-base">{instructions.bankAccount.bankName}</p>
                            <div className="mt-3 space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span>No. Rekening</span>
                                    <span className="font-medium">{instructions.bankAccount.accountNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Atas Nama</span>
                                    <span className="font-medium">{instructions.bankAccount.accountHolder}</span>
                                </div>
                            </div>
                        </div>
                        <ol className="text-sm space-y-2 list-decimal list-inside">
                            <li>Lakukan transfer sesuai nominal tagihan ke rekening di atas.</li>
                            <li>Pastikan nama penerima sesuai sebelum konfirmasi.</li>
                            <li>Simpan atau screenshot bukti transfer.</li>
                            <li>Unggah bukti pada form di bawah untuk verifikasi.</li>
                        </ol>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function ManualPaymentPage() {
    const router = useRouter();
    const [manualData, setManualData] = useState<ManualPaymentStorage | null>(null);
    const [isMounted, setIsMounted] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [uploadStatus, setUploadStatus] = useState<UploadStatus>('idle');
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const data = CheckoutService.getManualPaymentFromStorage();
        if (!data) {
            router.replace('/cart');
            return;
        }
        setManualData(data);
        setIsMounted(true);
    }, [router]);

    const isExpired = manualData ? new Date(manualData.response.expiry_time).getTime() < Date.now() : false;

    const paymentSummary = useMemo<PaymentData | null>(() => {
        if (!manualData) return null;
        const outlet = manualData.checkoutData.outlets[0];
        if (!outlet) return null;

        return {
            outlet: {
                id: outlet.outletId ?? manualData.response.order_id,
                name: outlet.outletName ?? manualData.response.manual.instructions.outletName
            },
            items: outlet.items.map((item) => ({
                id: item.productId,
                name: item.name,
                price: item.price,
                quantity: item.quantity
            })),
            subtotal: manualData.response.manual.fee_summary.subtotal,
            // Don't include transaction fee for manual payments (no payment gateway used)
            transactionFee: 0,
            applicationFee: 0,
            total: manualData.response.gross_amount,
            paymentMethod: {
                type: manualData.selectedPaymentMethod.type,
                name: manualData.selectedPaymentMethod.name,
                category: manualData.selectedPaymentMethod.type
            },
            customerInfo: manualData.customerInfo,
            orderId: manualData.response.order_id,
            pendingSince: manualData.createdAt
        };
    }, [manualData]);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // File size validation (10MB max)
        const maxSize = 10 * 1024 * 1024; // 10MB in bytes
        if (file.size > maxSize) {
            setErrorMessage('Ukuran file terlalu besar. Maksimal 10MB.');
            setSelectedFile(null);
            setUploadStatus('error');
            return;
        }

        // File type validation
        const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
        if (!validTypes.includes(file.type)) {
            setErrorMessage('Format file tidak didukung. Gunakan JPG, PNG, WEBP, atau PDF.');
            setSelectedFile(null);
            setUploadStatus('error');
            return;
        }

        setSelectedFile(file);
        setUploadStatus('idle');
        setErrorMessage(null);

        // Generate preview for images
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null); // PDF doesn't need preview
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setImagePreview(null);
        setUploadStatus('idle');
        setErrorMessage(null);
    };

    const handleCopyOrderId = () => {
        if (manualData?.response.order_id) {
            navigator.clipboard.writeText(manualData.response.order_id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleUpload = async (retryCount = 0) => {
        if (!manualData || !selectedFile) return;
        setUploadStatus('uploading');
        setErrorMessage(null);

        const maxRetries = 2;

        try {
            await PaymentService.uploadManualPaymentProof(manualData.response.order_id, selectedFile);
            setUploadStatus('success');
        } catch (error) {
            console.error('Failed to upload proof:', error);

            // Check if it's a network error and retry
            const isNetworkError = error instanceof Error && (
                error.message.includes('network') ||
                error.message.includes('timeout') ||
                error.message.includes('Failed to fetch')
            );

            if (isNetworkError && retryCount < maxRetries) {
                // Retry after delay
                console.log(`Retrying upload... Attempt ${retryCount + 1} of ${maxRetries}`);
                setTimeout(() => {
                    handleUpload(retryCount + 1);
                }, 1000 * (retryCount + 1)); // Exponential backoff: 1s, 2s
                return;
            }

            setUploadStatus('error');
            const errorMsg = error instanceof Error ? error.message : 'Gagal mengunggah bukti pembayaran.';
            setErrorMessage(
                retryCount >= maxRetries
                    ? `${errorMsg} Sudah dicoba ${maxRetries + 1}x. Periksa koneksi internet Anda.`
                    : errorMsg
            );
        }
    };

    if (!isMounted) {
        return <LoadingState />;
    }

    if (!manualData || !manualData.response) {
        return null;
    }

    const { response, selectedPaymentMethod, customerInfo } = manualData;

    return (
        <div className="space-y-4 pb-24">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Pembayaran Manual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Order ID</span>
                        <div className="flex items-center gap-2">
                            <span className="font-medium">{response.order_id}</span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={handleCopyOrderId}
                            >
                                {copied ? (
                                    <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                                ) : (
                                    <Copy className="h-3.5 w-3.5" />
                                )}
                            </Button>
                        </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Total Tagihan</span>
                        <span className="font-bold text-primary">{formatCurrency(response.gross_amount)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Metode</span>
                        <span className="font-medium">{selectedPaymentMethod.name}</span>
                    </div>
                    <div className='flex items-center justify-between text-sm'>
                        <span className='text-muted-foreground'>Expire</span>
                        <CountdownTimer
                            expiryTime={response.expiry_time}
                            compact
                        />
                    </div>
                </CardContent>
            </Card>

            <ManualInstructions instructions={response.manual.instructions} manualType={response.manual.type} />

            {paymentSummary && (
                <PaymentOrderSummary data={paymentSummary} />
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Unggah Bukti Pembayaran</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {uploadStatus === 'success' ? (
                        <div className="flex items-center gap-2 text-green-600 text-sm">
                            <AlertCircle className="w-4 h-4" />
                            Bukti pembayaran sudah dikirim. Menunggu verifikasi oleh kasir/outlet.
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground">
                            Unggah foto atau PDF bukti pembayaran. Maksimal ukuran file 10MB.
                        </p>
                    )}

                    {!selectedFile ? (
                        <Input
                            type="file"
                            accept="image/*,.pdf"
                            onChange={handleFileChange}
                            disabled={isExpired || uploadStatus === 'uploading'}
                        />
                    ) : (
                        <div className="space-y-3">
                            {/* File Preview */}
                            <div className="border rounded-lg p-4 bg-muted/30">
                                <div className="flex items-start gap-3">
                                    {imagePreview ? (
                                        <div className="relative w-20 h-20 rounded-md overflow-hidden bg-muted shrink-0">
                                            <img
                                                src={imagePreview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    ) : (
                                        <div className="w-20 h-20 rounded-md bg-muted flex items-center justify-center shrink-0">
                                            <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 shrink-0"
                                        onClick={handleRemoveFile}
                                        disabled={uploadStatus === 'uploading'}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    {errorMessage && (
                        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <span>{errorMessage}</span>
                        </div>
                    )}

                    <Button
                        className="w-full"
                        onClick={() => handleUpload()}
                        disabled={!selectedFile || uploadStatus === 'uploading' || isExpired}
                    >
                        {uploadStatus === 'uploading' ? (
                            <>
                                <UploadCloud className="w-4 h-4 mr-2 animate-spin" />
                                Mengunggah...
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-4 h-4 mr-2" />
                                Kirim Bukti Pembayaran
                            </>
                        )}
                    </Button>

                    {isExpired && (
                        <div className="flex items-center gap-2 text-sm text-red-600">
                            <AlertCircle className="w-4 h-4" />
                            Batas waktu pembayaran telah berakhir. Silakan hubungi outlet untuk bantuan lebih lanjut.
                        </div>
                    )}
                </CardContent>
            </Card>

            <Button variant="outline" className="w-full" onClick={() => router.push('/cart')}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Kembali ke Halaman Utama
            </Button>
        </div>
    );
}
