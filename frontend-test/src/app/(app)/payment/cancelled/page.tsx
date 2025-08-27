'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { XCircle, ArrowLeft, RotateCcw, Home, Clock } from 'lucide-react'
import { ErrorState, LoadingState } from '@/components/Base'
import { formatDateTime } from '@/lib/utils'
import { ImportantInformationCard } from '@/components/payment/ImportantInformationCard'
import { PaymentFooter } from '@/components/payment/PaymentFooter'
import { CustomerInfo } from '@/components/payment/CustomerInfo'
import { PaymentOrderSummary } from '@/components/payment/PaymentOrderSummary'
import { PaymentData } from '@/types'


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
                            <p><span className="font-medium">Dibatalkan pada:</span> {formatDateTime(paymentData.cancelledAt!)}</p>
                            <p><span className="font-medium">Metode pembayaran:</span> {paymentData.paymentMethod.name}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <PaymentOrderSummary
                    data={paymentData}
                />

                {/* Customer Info */}
                <CustomerInfo
                    name={paymentData.customerInfo.name}
                    phone={paymentData.customerInfo.phone}
                />

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
                <PaymentFooter />
            </div>
        </>
    )
}
