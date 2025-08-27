'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Clock, RefreshCw, ArrowLeft, Home, AlertCircle, Timer } from 'lucide-react'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import { ErrorState, LoadingState } from '@/components/Base'
import { ImportantInformationCard } from '@/components/payment/ImportantInformationCard'
import { CustomerInfo } from '@/components/payment/CustomerInfo'
import { PaymentFooter } from '@/components/payment/PaymentFooter'
import { PaymentOrderSummary } from '@/components/payment/PaymentOrderSummary'
import { PaymentData } from '@/types'

// interface PaymentData {
//     outlet: {
//         name: string
//         id: string
//     }
//     items: Array<{
//         id: string
//         name: string
//         price: number
//         quantity: number
//     }>
//     subtotal: number
//     applicationFee: number
//     total: number
//     paymentMethod: {
//         type: string
//         name: string
//         category: string
//     }
//     customerInfo: {
//         name: string
//         phone: string
//     }
//     orderId: string
// expiredAt: string
// paymentStarted: string
// timeLimit: number
// }

export default function PaymentExpiredPage() {
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
    const [isCreatingNewPayment, setIsCreatingNewPayment] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Get payment data from localStorage
        const data = localStorage.getItem('paymentData')
        if (data) {
            const parsed = JSON.parse(data)
            const now = new Date()
            const startTime = new Date(parsed.paymentStarted || now.toISOString())
            const timeLimit = parsed.timeLimit || 15 // default 15 minutes

            setPaymentData({
                ...parsed,
                expiredAt: new Date(startTime.getTime() + timeLimit * 60000).toISOString(),
                paymentStarted: startTime.toISOString(),
                timeLimit
            })
        } else {
            // Redirect to cart if no payment data
            router.push('/cart')
        }
    }, [router])

    const handleCreateNewPayment = async () => {
        setIsCreatingNewPayment(true)

        // Simulate creating new payment
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Update payment data with new timestamp and redirect
        if (paymentData) {
            const newPaymentData = {
                ...paymentData,
                paymentStarted: new Date().toISOString(),
                orderId: `ORD-${Date.now()}` // Generate new order ID
            }
            const { expiredAt, ...paymentToSave } = newPaymentData
            localStorage.setItem('paymentData', JSON.stringify(paymentToSave))
        }

        setIsCreatingNewPayment(false)
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

    const calculateExpiredDuration = () => {
        if (!paymentData) return '0 menit'

        const started = new Date(paymentData.paymentStarted!)
        const expired = new Date(paymentData.expiredAt!)
        const durationMs = expired.getTime() - started.getTime()
        const minutes = Math.floor(durationMs / 60000)

        return `${minutes} menit`
    }

    if (!paymentData) return <LoadingState message='Memuat data...' />;

    return (
        <>
            <ErrorState
                title='Pembayaran Kedaluwarsa'
                message='Waktu pembayaran telah habis'
                icon={<Clock className="text-amber-600" />}
            />

            <div className='space-y-4'>

                {/* Expiration Information */}
                <Card className=" border-amber-200 bg-amber-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Timer className="w-5 h-5 text-amber-600" />
                            Informasi Waktu
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="bg-amber-100 border border-amber-300 rounded-lg p-3">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertCircle className="w-4 h-4 text-amber-700" />
                                <p className="font-medium text-amber-800">Batas waktu pembayaran telah terlampaui</p>
                            </div>
                            <p className="text-sm text-amber-700">
                                Pembayaran harus diselesaikan dalam {calculateExpiredDuration()}
                            </p>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Order ID:</span> {paymentData.orderId}</p>
                            <p><span className="font-medium">Dimulai:</span> {formatDateTime(paymentData.paymentStarted!)}</p>
                            <p><span className="font-medium">Kedaluwarsa:</span> {formatDateTime(paymentData.expiredAt!)}</p>
                            <p><span className="font-medium">Metode:</span> {paymentData.paymentMethod.name}</p>
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
                        onClick={handleCreateNewPayment}
                        disabled={isCreatingNewPayment}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                        size="lg"
                    >
                        {isCreatingNewPayment ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Membuat Pembayaran Baru...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Buat Pembayaran Baru
                            </>
                        )}
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
                <ImportantInformationCard type='expired' />

                {/* Help Text */}
                <PaymentFooter />
            </div>
        </>
    )
}
