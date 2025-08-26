'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, RotateCcw, Home, Clock } from 'lucide-react'
import { ErrorState, LoadingState } from '@/components/Base'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ImportantInformationCard } from '@/components/payment/ImportantInformationCard'

interface PaymentData {
    outlet: {
        name: string
        id: string
    }
    items: Array<{
        id: string
        name: string
        price: number
        quantity: number
    }>
    subtotal: number
    applicationFee: number
    total: number
    paymentMethod: {
        type: string
        name: string
        category: string
    }
    customerInfo: {
        name: string
        phone: string
    }
    orderId: string
    cancelledAt: string
    cancelReason?: string
}

export default function PaymentCancelledPage() {
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
    const [countdown, setCountdown] = useState(10)
    const router = useRouter()

    useEffect(() => {
        // Get payment data from localStorage
        const data = localStorage.getItem('paymentData')
        if (data) {
            const parsed = JSON.parse(data)
            setPaymentData({
                ...parsed,
                cancelledAt: new Date().toISOString(),
                cancelReason: parsed.cancelReason || 'Pembayaran dibatalkan oleh pengguna'
            })
        } else {
            // Redirect to cart if no payment data
            router.push('/cart')
        }
    }, [router])

    useEffect(() => {
        // Auto redirect countdown
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer)
                    router.push('/cart')
                    return 0
                }
                return prev - 1
            })
        }, 1000)

        return () => clearInterval(timer)
    }, [router])

    const handleRetryPayment = () => {
        if (paymentData) {
            const { cancelledAt, cancelReason, ...rest } = paymentData
            localStorage.setItem('paymentData', JSON.stringify(rest))
        }
        router.push('/payment')
    }

    const handleBackToCart = () => {
        localStorage.removeItem('paymentData')
        router.push('/cart')
    }

    const handleBackToHome = () => {
        localStorage.removeItem('paymentData')
        router.push('/')
    }

    if (!paymentData) return <LoadingState message='Memuat data...' />;

    return (
        <>
            {/* Header */}
            <ErrorState
                title='Pembayaran Dibatalkan'
                message='Transaksi Anda telah dibatalkan'
            />

            <div className='space-y-4'>
                {/* Auto Redirect Notice */}
                <Card className="border-orange-200 bg-orange-50">
                    <CardContent>
                        <div className="flex items-center justify-center space-x-2 text-orange-800">
                            <Clock className="w-5 h-5" />
                            <p className="text-sm font-medium">
                                Otomatis kembali ke keranjang dalam {countdown} detik
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Cancellation Information */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <XCircle className="w-5 h-5 text-orange-500" />
                            Informasi Pembatalan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                            <p className="text-orange-800 font-medium">{paymentData.cancelReason}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p><span className="font-medium">Order ID:</span> {paymentData.orderId}</p>
                            <p><span className="font-medium">Dibatalkan pada:</span> {formatDateTime(paymentData.cancelledAt)}</p>
                            <p><span className="font-medium">Metode pembayaran:</span> {paymentData.paymentMethod.name}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Ringkasan Pesanan</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        {/* Outlet Info */}
                        <div className="pb-3 border-b">
                            <h3 className="font-medium text-gray-900">{paymentData.outlet.name}</h3>
                        </div>

                        {/* Items */}
                        <div className="space-y-2">
                            {paymentData.items.map((item) => (
                                <div key={item.id} className="flex justify-between items-center text-sm">
                                    <div className="flex-1">
                                        <p className="font-medium text-gray-900">{item.name}</p>
                                        <p className="text-gray-600">{item.quantity}x {formatCurrency(item.price)}</p>
                                    </div>
                                    <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
                                </div>
                            ))}
                        </div>

                        {/* Fees */}
                        <div className="border-t pt-3 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Subtotal</span>
                                <span>{formatCurrency(paymentData.subtotal)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Biaya Aplikasi</span>
                                <span>{formatCurrency(paymentData.applicationFee)}</span>
                            </div>
                            <div className="flex justify-between font-bold border-t pt-2">
                                <span>Total</span>
                                <span>{formatCurrency(paymentData.total)}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Customer Info */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Informasi Pelanggan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Nama</span>
                                <span className="font-medium">{paymentData.customerInfo.name}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">No. Telepon</span>
                                <span className="font-medium">{paymentData.customerInfo.phone}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={handleRetryPayment}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                        size="lg"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" />
                        Lanjutkan Pembayaran
                    </Button>

                    <Button
                        onClick={handleBackToCart}
                        variant="outline"
                        className="w-full h-12"
                        size="lg"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Keranjang
                    </Button>

                    <Button
                        onClick={handleBackToHome}
                        variant="ghost"
                        className="w-full h-12"
                        size="lg"
                    >
                        <Home className="w-4 h-4 mr-2" />
                        Kembali ke Beranda
                    </Button>
                </div>

                {/* Information Box */}
                <ImportantInformationCard type='cancelled' />

                {/* Help Text */}
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Butuh bantuan? Hubungi customer service kami
                    </p>
                </div>
            </div>
        </>
    )
}
