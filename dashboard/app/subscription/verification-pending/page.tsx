'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { apiClient } from '@/lib/apis/base'
import { formatCurrency } from '@/lib/utils'
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowLeft,
    FileText,
    Loader2,
    RefreshCw,
} from 'lucide-react'

interface SubscriptionInfo {
    id: string
    businessId: string
    planId: string
    status: string
    startDate: string
    endDate: string
    plan: {
        id: string
        name: string
        code: string
        price: number
        durationDays: number
    }
}

interface PendingInvoice {
    id: string
    invoiceNumber: string
    amount: number
    status: string
    createdAt: string
}

interface SubscriptionStatusResponse {
    business: {
        id: string
        name: string
        subscriptionStatus: string
        subscriptionEndDate: string | null
    }
    subscription: SubscriptionInfo | null
    pendingInvoice: PendingInvoice | null
}

export default function VerificationPendingPage() {
    const router = useRouter()

    const [status, setStatus] = useState<SubscriptionStatusResponse | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [verificationProgress, setVerificationProgress] = useState(0)

    // Fetch subscription status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const { data } = await apiClient.get('/subscription/status')
                if (data.success && data.data) {
                    setStatus(data.data as SubscriptionStatusResponse)
                } else if (!data.success) {
                    console.error('Failed to fetch status:', data.message)
                }
            } catch (err) {
                console.error('Error fetching status:', err)
            } finally {
                setIsLoading(false)
            }
        }

        fetchStatus()
    }, [])

    // Simulate verification progress animation
    useEffect(() => {
        if (!status?.pendingInvoice) return

        const interval = setInterval(() => {
            setVerificationProgress((prev) => {
                if (prev >= 95) return prev
                const increment = Math.random() * 20
                return Math.min(prev + increment, 95)
            })
        }, 2000)

        return () => clearInterval(interval)
    }, [status])

    const handleRefreshStatus = async () => {
        try {
            setIsRefreshing(true)
            const { data } = await apiClient.get('/subscription/status')
            if (data.success && data.data) {
                const payload = data.data as SubscriptionStatusResponse
                setStatus(payload)

                if (payload.subscription?.status === 'ACTIVE') {
                    router.push('/owner/dashboard')
                }
            } else if (!data.success) {
                console.error('Failed to refresh status:', data.message)
            }
        } catch (err) {
            console.error('Error refreshing status:', err)
        } finally {
            setIsRefreshing(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
                    <p className="text-slate-600">Memuat status verifikasi...</p>
                </div>
            </div>
        )
    }

    const isPaymentVerified = status?.subscription?.status === 'ACTIVE'
    const isProofSubmitted = status?.subscription?.status === 'PROOF_SUBMITTED'

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="mb-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                    </Button>
                </div>

                {/* Main Content */}
                {isPaymentVerified ? (
                    /* Success State */
                    <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
                        <div className="mb-6">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                            </div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                Pembayaran Terverifikasi!
                            </h1>
                            <p className="text-slate-600 mb-6">
                                Langganan Anda telah diaktifkan. Dashboard siap digunakan.
                            </p>
                        </div>

                        {status?.subscription && (
                            <div className="bg-slate-50 rounded-lg p-4 mb-6 text-left space-y-3">
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Paket</span>
                                    <span className="font-semibold text-slate-900">
                                        {status.subscription.plan.name}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Status</span>
                                    <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                        Aktif
                                    </span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-slate-600">Berlaku hingga</span>
                                    <span className="font-semibold text-slate-900">
                                        {new Date(
                                            status.subscription.endDate
                                        ).toLocaleDateString('id-ID', {
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                        })}
                                    </span>
                                </div>
                            </div>
                        )}

                        <Button
                            onClick={() => router.push('/owner/dashboard')}
                            size="lg"
                            className="w-full"
                        >
                            Buka Dashboard
                        </Button>
                    </div>
                ) : (
                    /* Pending State */
                    <div className="space-y-6">
                        {/* Status Card */}
                        <div className="bg-white rounded-2xl shadow-lg p-8">
                            <div className="text-center mb-8">
                                <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Clock className="h-8 w-8 text-amber-600 animate-spin" />
                                </div>
                                <h1 className="text-3xl font-bold text-slate-900 mb-2">
                                    Menunggu Verifikasi
                                </h1>
                                <p className="text-slate-600">
                                    Kami sedang memverifikasi pembayaran Anda. Ini biasanya
                                    membutuhkan waktu 1 jam.
                                </p>
                            </div>

                            {/* Progress Bar */}
                            <div className="mb-6">
                                <div className="flex justify-between items-center mb-2">
                                    <p className="text-sm font-medium text-slate-600">
                                        Progres Verifikasi
                                    </p>
                                    <p className="text-sm font-semibold text-slate-900">
                                        {Math.round(verificationProgress)}%
                                    </p>
                                </div>
                                <div className="w-full bg-slate-200 rounded-full h-2.5">
                                    <div
                                        className="bg-gradient-to-r from-indigo-500 to-indigo-600 h-2.5 rounded-full transition-all duration-500"
                                        style={{ width: `${verificationProgress}%` }}
                                    ></div>
                                </div>
                            </div>

                            {/* Info Messages */}
                            <div className="space-y-3 bg-blue-50 rounded-lg p-4 border border-blue-200">
                                <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                                    <AlertCircle className="h-4 w-4" />
                                    Informasi Penting
                                </h3>
                                <ul className="text-sm text-blue-800 space-y-2">
                                    <li className="flex gap-2">
                                        <span className="flex-shrink-0">•</span>
                                        <span>
                                            Jangan tutup halaman atau browser hingga
                                            verifikasi selesai
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="flex-shrink-0">•</span>
                                        <span>
                                            Anda akan diarahkan ke dashboard secara otomatis
                                            setelah verifikasi
                                        </span>
                                    </li>
                                    <li className="flex gap-2">
                                        <span className="flex-shrink-0">•</span>
                                        <span>
                                            Periksa email untuk notifikasi status verifikasi
                                        </span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Details Card */}
                        {status?.pendingInvoice && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Detail Invoice
                                </h2>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-slate-600">Invoice Number</span>
                                        <span className="font-mono text-sm text-slate-900">
                                            {status.pendingInvoice.invoiceNumber}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-slate-600">Nominal</span>
                                        <span className="font-semibold text-slate-900">
                                            {formatCurrency(
                                                status.pendingInvoice.amount
                                            )}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-slate-600">Status Pembayaran</span>
                                        <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 text-amber-800">
                                            {status.pendingInvoice.status ===
                                                'PENDING'
                                                ? 'Menunggu Pembayaran'
                                                : 'Bukti Dikirim'}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Tanggal</span>
                                        <span className="text-slate-900">
                                            {new Date(
                                                status.pendingInvoice.createdAt
                                            ).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Subscription Info Card */}
                        {status?.subscription && (
                            <div className="bg-white rounded-2xl shadow-lg p-6">
                                <h2 className="text-lg font-semibold text-slate-900 mb-4">
                                    Informasi Langganan
                                </h2>

                                <div className="space-y-3">
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-slate-600">Paket</span>
                                        <span className="font-semibold text-slate-900">
                                            {status.subscription.plan.name}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-slate-600">Durasi</span>
                                        <span className="text-slate-900">
                                            {status.subscription.plan.durationDays}{' '}
                                            hari
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                        <span className="text-slate-600">
                                            Tanggal Mulai
                                        </span>
                                        <span className="text-slate-900">
                                            {new Date(
                                                status.subscription.startDate
                                            ).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">
                                            Berlaku Hingga
                                        </span>
                                        <span className="font-semibold text-slate-900">
                                            {new Date(
                                                status.subscription.endDate
                                            ).toLocaleDateString('id-ID', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <Button
                                variant="outline"
                                onClick={handleRefreshStatus}
                                disabled={isRefreshing}
                                className="flex-1"
                            >
                                {isRefreshing && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {isRefreshing
                                    ? 'Memeriksa...'
                                    : 'Periksa Status'}
                            </Button>
                            <Button
                                onClick={() => router.push('/owner/dashboard')}
                                className="flex-1"
                            >
                                Ke Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
