'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { XCircle, RefreshCw, ArrowLeft, Phone, AlertTriangle } from 'lucide-react'
import { CUSTOMER_SERVICE_NUMBER } from '@/constants'
import { ErrorState } from '@/components/Base'

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
    failureReason?: string
    timestamp: string
}

export default function PaymentFailedPage() {
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
    const [isRetrying, setIsRetrying] = useState(false)
    const router = useRouter()

    useEffect(() => {
        // Get payment data from localStorage
        const data = localStorage.getItem('paymentData')
        if (data) {
            const parsed = JSON.parse(data)
            setPaymentData({
                ...parsed,
                failureReason: parsed.failureReason || 'Transaksi gagal diproses',
                timestamp: new Date().toISOString()
            })
        } else {
            // Redirect to cart if no payment data
            router.push('/cart')
        }
    }, [router])

    const handleRetryPayment = async () => {
        setIsRetrying(true)

        // Simulate retry delay
        await new Promise(resolve => setTimeout(resolve, 2000))

        // Clear failure reason and redirect back to payment
        if (paymentData) {
            const updatedData = { ...paymentData }
            delete updatedData.failureReason
            localStorage.setItem('paymentData', JSON.stringify(updatedData))
        }

        setIsRetrying(false)
        router.push('/payment')
    }

    const handleBackToCart = () => {
        localStorage.removeItem('paymentData')
        router.push('/cart')
    }

    const handleContactSupport = () => {
        window.open(`https://wa.me/${CUSTOMER_SERVICE_NUMBER}?text=Halo, saya mengalami masalah pembayaran untuk order ${paymentData?.orderId}`, '_blank')
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatDateTime = (timestamp: string) => {
        return new Date(timestamp).toLocaleString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    if (!paymentData) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Memuat data...</p>
                </div>
            </div>
        )
    }

    return (
        <>

            {/* Header */}
            <ErrorState
                title='Pembayaran Gagal'
                message='Maaf, transaksi Anda tidak dapat diproses'
            />
            <div className='space-y-4'>

                {/* Failure Information */}
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Informasi Kegagalan
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                            <p className="text-red-800 font-medium">{paymentData.failureReason}</p>
                        </div>
                        <div className="text-sm text-gray-600">
                            <p><span className="font-medium">Order ID:</span> {paymentData.orderId}</p>
                            <p><span className="font-medium">Waktu:</span> {formatDateTime(paymentData.timestamp)}</p>
                            <p><span className="font-medium">Metode:</span> {paymentData.paymentMethod.name}</p>
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
                        disabled={isRetrying}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                        size="lg"
                    >
                        {isRetrying ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Mencoba Ulang...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Coba Lagi
                            </>
                        )}
                    </Button>

                    <Button
                        onClick={handleContactSupport}
                        variant="outline"
                        className="w-full h-12"
                        size="lg"
                    >
                        <Phone className="w-4 h-4 mr-2" />
                        Hubungi Customer Service
                    </Button>

                    <Button
                        onClick={handleBackToCart}
                        variant="ghost"
                        className="w-full h-12"
                        size="lg"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Kembali ke Keranjang
                    </Button>
                </div>

                {/* Help Text */}
                <div className="text-center">
                    <p className="text-sm text-gray-500">
                        Jika masalah berlanjut, silakan hubungi customer service kami
                    </p>
                </div>
            </div>
        </>
    )
}
