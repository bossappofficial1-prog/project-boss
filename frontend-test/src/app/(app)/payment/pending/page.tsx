'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useRouter } from 'next/navigation'
import { Clock, RefreshCw, ArrowLeft, CheckCircle, XCircle, AlertCircle, Phone } from 'lucide-react'
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
    pendingSince: string
    bankReference?: string
    estimatedProcessing: string
}

export default function PaymentPendingPage() {
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null)
    const [isChecking, setIsChecking] = useState(false)
    const [lastChecked, setLastChecked] = useState<string>('')
    const [checkCount, setCheckCount] = useState(0)
    const router = useRouter()

    useEffect(() => {
        // Get payment data from localStorage
        const data = localStorage.getItem('paymentData')
        if (data) {
            const parsed = JSON.parse(data)
            setPaymentData({
                ...parsed,
                pendingSince: parsed.pendingSince || new Date().toISOString(),
                bankReference: parsed.bankReference || `REF${Date.now()}`,
                estimatedProcessing: parsed.estimatedProcessing || new Date(Date.now() + 60000).toISOString() // 1 minute
            })
        } else {
            // Redirect to cart if no payment data
            router.push('/cart')
        }
    }, [router])

    // Auto check payment status every 30 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            if (checkCount < 10) { // Limit auto checks
                handleCheckStatus(true)
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [checkCount])

    const handleCheckStatus = async (isAutoCheck = false) => {
        if (!isAutoCheck) {
            setIsChecking(true)
        }

        // Simulate checking payment status
        await new Promise(resolve => setTimeout(resolve, 2000))

        setLastChecked(new Date().toISOString())
        setCheckCount(prev => prev + 1)

        // Simulate random payment outcomes (for demo)
        const outcomes = ['pending', 'success', 'failed']
        const randomOutcome = outcomes[Math.floor(Math.random() * outcomes.length)]

        if (randomOutcome === 'success' && Math.random() > 0.7) {
            // 30% chance of success
            router.push('/payment/success')
        } else if (randomOutcome === 'failed' && Math.random() > 0.9) {
            // 10% chance of failure
            router.push('/payment/failed')
        }

        setIsChecking(false)
    }

    const handleBackToCart = () => {
        localStorage.removeItem('paymentData')
        router.push('/cart')
    }

    const handleContactSupport = () => {
        // Open WhatsApp or phone dialer
        const phone = '+6281234567890' // Replace with actual support number
        window.open(`https://wa.me/${phone}?text=Halo, saya ingin menanyakan status pembayaran untuk order ${paymentData?.orderId}`, '_blank')
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

    const formatRelativeTime = (timestamp: string) => {
        const now = new Date()
        const time = new Date(timestamp)
        const diffMs = now.getTime() - time.getTime()
        const diffMins = Math.floor(diffMs / 60000)

        if (diffMins < 1) return 'Baru saja'
        if (diffMins < 60) return `${diffMins} menit yang lalu`
        const diffHours = Math.floor(diffMins / 60)
        if (diffHours < 24) return `${diffHours} jam yang lalu`
        const diffDays = Math.floor(diffHours / 24)
        return `${diffDays} hari yang lalu`
    }

    const getEstimatedTime = () => {
        if (!paymentData) return ''
        const estimated = new Date(paymentData.estimatedProcessing)
        const now = new Date()

        if (estimated > now) {
            const diffMs = estimated.getTime() - now.getTime()
            const diffMins = Math.ceil(diffMs / 60000)
            return `${diffMins} menit lagi`
        }
        return 'Sedang diproses'
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
                    <div className="bg-yellow-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-10 h-10 text-yellow-600 animate-pulse" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Pembayaran Menunggu</h1>
                    <p className="text-gray-600">Transaksi sedang diproses oleh bank</p>
                    <Badge variant="secondary" className="mt-2 bg-yellow-100 text-yellow-800">
                        Status: Pending
                    </Badge>
                </div>

                {/* Status Information */}
                <Card className="mb-6 border-yellow-200 bg-yellow-50">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-yellow-600" />
                            Status Pembayaran
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3">
                            <p className="font-medium text-yellow-800 mb-1">Sedang diverifikasi oleh bank</p>
                            <p className="text-sm text-yellow-700">
                                Estimasi selesai: {getEstimatedTime()}
                            </p>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p><span className="font-medium">Order ID:</span> {paymentData.orderId}</p>
                            <p><span className="font-medium">Referensi Bank:</span> {paymentData.bankReference}</p>
                            <p><span className="font-medium">Pending sejak:</span> {formatRelativeTime(paymentData.pendingSince)}</p>
                            <p><span className="font-medium">Metode:</span> {paymentData.paymentMethod.name}</p>
                            {lastChecked && (
                                <p><span className="font-medium">Terakhir dicek:</span> {formatRelativeTime(lastChecked)}</p>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Progress Steps */}
                <Card className="mb-6">
                    <CardHeader className="pb-3">
                        <CardTitle className="text-lg">Proses Verifikasi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-green-500" />
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Pembayaran diterima</p>
                                    <p className="text-sm text-gray-600">Transfer berhasil</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="w-5 h-5 border-2 border-yellow-400 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-900">Verifikasi bank</p>
                                    <p className="text-sm text-gray-600">Sedang diproses...</p>
                                </div>
                            </div>

                            <div className="flex items-center space-x-3">
                                <div className="w-5 h-5 border-2 border-gray-300 rounded-full"></div>
                                <div className="flex-1">
                                    <p className="font-medium text-gray-400">Konfirmasi pesanan</p>
                                    <p className="text-sm text-gray-400">Menunggu verifikasi</p>
                                </div>
                            </div>
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

                {/* Action Buttons */}
                <div className="space-y-3">
                    <Button
                        onClick={() => handleCheckStatus(false)}
                        disabled={isChecking}
                        className="w-full h-12 bg-blue-600 hover:bg-blue-700"
                        size="lg"
                    >
                        {isChecking ? (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                Mengecek Status...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="w-4 h-4 mr-2" />
                                Cek Status Pembayaran
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

                {/* Information Box */}
                <ImportantInformationCard type='pending' />

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-500">
                        Pembayaran membutuhkan waktu lebih lama? Hubungi customer service
                    </p>
                </div>
            </div>
        </div>
    )
}
