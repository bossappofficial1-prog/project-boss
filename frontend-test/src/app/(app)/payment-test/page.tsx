'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function PaymentTestPage() {
    const router = useRouter()

    // Sample payment data untuk testing
    const samplePaymentData = {
        outlet: {
            name: "Warung Makan Sederhana",
            id: "outlet-001"
        },
        items: [
            {
                id: "item-1",
                name: "Nasi Gudeg Jogja",
                price: 25000,
                quantity: 2
            },
            {
                id: "item-2",
                name: "Es Teh Manis",
                price: 5000,
                quantity: 2
            }
        ],
        subtotal: 60000,
        applicationFee: 1000,
        total: 61000,
        paymentMethod: {
            type: "qris",
            name: "QRIS",
            category: "QRIS"
        },
        customerInfo: {
            name: "John Doe",
            phone: "+6281234567890"
        },
        orderId: `ORD-${Date.now()}`,
        paymentStarted: new Date().toISOString(),
        timeLimit: 15
    }

    const setupPaymentData = (additionalData = {}) => {
        const paymentData = { ...samplePaymentData, ...additionalData }
        localStorage.setItem('paymentData', JSON.stringify(paymentData))
    }

    const testPages = [
        {
            title: "Payment Page",
            description: "Halaman utama pembayaran dengan form customer info",
            path: "/payment",
            setup: () => setupPaymentData()
        },
        {
            title: "Payment Processing",
            description: "Halaman proses pembayaran dengan timer dan QR code",
            path: "/payment/processing",
            setup: () => setupPaymentData({
                paymentStarted: new Date().toISOString(),
                qrCode: "00020101021126580014ID.CO.QRIS.WWW0215ID20200000000000303UMI51440014ID.DANA.WWW0215020000000000008180214123456789012345802ID5914MERCHANT NAME6007JAKARTA61051234562070703A01630477DE"
            })
        },
        {
            title: "Payment Success",
            description: "Halaman konfirmasi pembayaran berhasil",
            path: "/payment/success",
            setup: () => setupPaymentData({
                completedAt: new Date().toISOString(),
                transactionId: `TXN-${Date.now()}`
            })
        },
        {
            title: "Payment Failed",
            description: "Halaman pembayaran gagal dengan opsi retry",
            path: "/payment/failed",
            setup: () => setupPaymentData({
                failureReason: "Saldo tidak mencukupi atau koneksi terputus",
                timestamp: new Date().toISOString()
            })
        },
        {
            title: "Payment Cancelled",
            description: "Halaman pembayaran dibatalkan oleh user",
            path: "/payment/cancelled",
            setup: () => setupPaymentData({
                cancelledAt: new Date().toISOString(),
                cancelReason: "Pembayaran dibatalkan oleh pengguna"
            })
        },
        {
            title: "Payment Expired",
            description: "Halaman pembayaran kedaluwarsa dengan opsi buat baru",
            path: "/payment/expired",
            setup: () => setupPaymentData({
                expiredAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
                paymentStarted: new Date(Date.now() - 16 * 60000).toISOString() // 16 minutes ago
            })
        },
        {
            title: "Payment Pending",
            description: "Halaman status pembayaran pending dari bank",
            path: "/payment/pending",
            setup: () => setupPaymentData({
                pendingSince: new Date(Date.now() - 2 * 60000).toISOString(), // 2 minutes ago
                bankReference: `REF${Date.now()}`,
                estimatedProcessing: new Date(Date.now() + 3 * 60000).toISOString() // 3 minutes from now
            })
        }
    ]

    const handleTestPage = (page: typeof testPages[0]) => {
        page.setup()
        router.push(page.path)
    }

    const clearTestData = () => {
        localStorage.removeItem('paymentData')
        alert('Test data cleared!')
    }

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Pages Testing</h1>
                    <p className="text-gray-600 mb-4">
                        Klik tombol di bawah untuk test berbagai halaman payment dengan data simulasi
                    </p>
                    <Button onClick={clearTestData} variant="outline" className="mb-6">
                        Clear Test Data
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testPages.map((page, index) => (
                        <Card key={index} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <CardTitle className="text-lg">{page.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-sm text-gray-600 mb-4">
                                    {page.description}
                                </p>
                                <Button
                                    onClick={() => handleTestPage(page)}
                                    className="w-full"
                                >
                                    Test {page.title}
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Sample Payment Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
                            {JSON.stringify(samplePaymentData, null, 2)}
                        </pre>
                    </CardContent>
                </Card>

                <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h3 className="font-bold text-blue-900 mb-3">Testing Instructions:</h3>
                    <ol className="text-sm text-blue-800 space-y-2">
                        <li>1. <strong>Payment Page:</strong> Test form validation, customer info input</li>
                        <li>2. <strong>Processing:</strong> Test timer countdown, QR code display, auto status check</li>
                        <li>3. <strong>Success:</strong> Test order confirmation, download receipt</li>
                        <li>4. <strong>Failed:</strong> Test retry mechanism, customer service contact</li>
                        <li>5. <strong>Cancelled:</strong> Test auto-redirect, continue payment option</li>
                        <li>6. <strong>Expired:</strong> Test new payment creation, time information</li>
                        <li>7. <strong>Pending:</strong> Test status checking, progress visualization</li>
                    </ol>
                </div>
            </div>
        </div>
    )
}
