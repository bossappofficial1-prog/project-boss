'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Clock, RefreshCw, ArrowLeft, Home, AlertCircle, Timer } from 'lucide-react'

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
    expiredAt: string
    paymentStarted: string
    timeLimit: number // in minutes
}

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

    const calculateExpiredDuration = () => {
        if (!paymentData) return '0 menit'

        const started = new Date(paymentData.paymentStarted)
        const expired = new Date(paymentData.expiredAt)
        const durationMs = expired.getTime() - started.getTime()
        const minutes = Math.floor(durationMs / 60000)

        return `${minutes} menit`
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
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="bg-amber-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-10 h-10 text-amber-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Kedaluwarsa</h1>
                    <p className="text-gray-600">Waktu pembayaran telah habis</p>
                </div>

                {/* Expiration Information */}
                <Card className="mb-6 border-amber-200 bg-amber-50">
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
                            <p><span className="font-medium">Dimulai:</span> {formatDateTime(paymentData.paymentStarted)}</p>
                            <p><span className="font-medium">Kedaluwarsa:</span> {formatDateTime(paymentData.expiredAt)}</p>
                            <p><span className="font-medium">Metode:</span> {paymentData.paymentMethod.name}</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Order Summary */}
                <Card className="mb-6">
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
                <Card className="mb-6">
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
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-blue-900 mb-2">Mengapa pembayaran kedaluwarsa?</h4>
                    <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Pembayaran harus diselesaikan dalam waktu yang ditentukan</li>
                        <li>• Hal ini untuk menjaga keamanan transaksi</li>
                        <li>• Virtual Account atau QR Code memiliki batas waktu aktif</li>
                        <li>• Anda dapat membuat pembayaran baru dengan mudah</li>
                    </ul>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Butuh bantuan? Hubungi customer service kami
                    </p>
                </div>
            </div>
        </div>
    )
}
