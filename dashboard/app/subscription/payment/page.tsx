'use client'

import React, { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { apiClient } from '@/lib/apis/base'
import { formatCurrency } from '@/lib/utils'
import {
    AlertCircle,
    CheckCircle2,
    Copy,
    DollarSign,
    FileText,
    Upload,
    X,
    ArrowLeft,
} from 'lucide-react'
import { Loader2 } from 'lucide-react'

interface Invoice {
    id: string
    invoiceNumber: string
    amount: number
    status: string
    businessId: string
    subscriptionId: string
    createdAt: string
}

interface SubscriptionPlan {
    id: string
    name: string
    code: string
    price: number
    durationDays: number
}

interface InvoiceDetail extends Invoice {
    plan: SubscriptionPlan
}

const BANK_ACCOUNTS = [
    {
        bank: 'BCA',
        accountNumber: '1234567890',
        accountHolder: 'PT BOSS APP INDONESIA',
    },
    {
        bank: 'Mandiri',
        accountNumber: '0987654321',
        accountHolder: 'PT BOSS APP INDONESIA',
    },
    {
        bank: 'BNI',
        accountNumber: '1122334455',
        accountHolder: 'PT BOSS APP INDONESIA',
    },
]

export default function SubscriptionPaymentPage() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const invoiceId = searchParams.get('invoiceId')

    const [invoice, setInvoice] = useState<InvoiceDetail | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isUploading, setIsUploading] = useState(false)
    const [uploadSuccess, setUploadSuccess] = useState(false)
    const [selectedBank, setSelectedBank] = useState(0)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    console.log(invoiceId, error);

    // Fetch invoice details
    useEffect(() => {
        const fetchInvoice = async () => {
            if (!invoiceId) {
                setError('Invoice ID tidak ditemukan')
                setIsLoading(false)
                return
            }

            try {
                const { data } = await apiClient.get(`/subscription/invoice/${invoiceId}`)

                if (!data.success) {
                    setError(data.message || 'Invoice tidak ditemukan')
                    return
                }

                setInvoice(data.data as InvoiceDetail)
            } catch (err: any) {
                console.error('Error fetching invoice:', err)
                setError(err?.response?.data?.message || 'Gagal memuat invoice')
            } finally {
                setIsLoading(false)
            }
        }

        fetchInvoice()
    }, [invoiceId])

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        const validTypes = ['image/jpeg', 'image/png', 'image/webp']
        if (!validTypes.includes(file.type)) {
            setError('Format file harus JPG, PNG, atau WebP')
            return
        }

        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
            setError('Ukuran file maksimal 5MB')
            return
        }

        setSelectedFile(file)
        setError(null)

        // Create preview
        const reader = new FileReader()
        reader.onload = (event) => {
            setFilePreview(event.target?.result as string)
        }
        reader.readAsDataURL(file)
    }

    const handleUploadProof = async () => {
        if (!selectedFile || !invoiceId) {
            setError('Silakan pilih file terlebih dahulu')
            return
        }

        try {
            setIsUploading(true)
            setError(null)

            const formData = new FormData()
            formData.append('proof', selectedFile)
            formData.append('invoiceId', invoiceId)

            const { data } = await apiClient.post(
                '/subscription/upload-proof',
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    },
                }
            )

            if (!data.success) {
                setError(data.message || 'Gagal mengupload bukti pembayaran')
                return
            }

            setUploadSuccess(true)
            setSelectedFile(null)
            setFilePreview(null)

            setTimeout(() => {
                router.push('/subscription/verification-pending')
            }, 3000)
        } catch (err: any) {
            console.error('Upload error:', err)
            const errorMsg =
                err?.response?.data?.message ||
                'Gagal mengupload bukti pembayaran. Silakan coba lagi.'
            setError(errorMsg)
        } finally {
            setIsUploading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-indigo-600" />
                    <p className="text-slate-600">Memuat informasi pembayaran...</p>
                </div>
            </div>
        )
    }

    if (error && !invoice) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <h1 className="text-xl font-bold text-slate-900 mb-2">Terjadi Kesalahan</h1>
                    <p className="text-slate-600 mb-6">{error}</p>
                    <Button
                        onClick={() => router.back()}
                        className="w-full"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Kembali
                    </Button>
                </div>
            </div>
        )
    }

    if (!invoice) {
        return null
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4">
            <div className="max-w-6xl mx-auto">
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
                    <h1 className="text-3xl font-bold text-slate-900">
                        Konfirmasi Pembayaran
                    </h1>
                    <p className="text-slate-600 mt-2">
                        Invoice #{invoice.invoiceNumber}
                    </p>
                </div>

                {uploadSuccess && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
                        <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-semibold text-green-900">
                                Bukti Pembayaran Berhasil Diupload!
                            </h3>
                            <p className="text-sm text-green-800 mt-1">
                                Tim kami akan memverifikasi pembayaran Anda. Halaman akan dialihkan dalam beberapa detik...
                            </p>
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                            <h3 className="font-semibold text-red-900">Error</h3>
                            <p className="text-sm text-red-800 mt-1">{error}</p>
                        </div>
                        <button
                            onClick={() => setError(null)}
                            className="text-red-600 hover:text-red-900"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Left: Informasi Pembayaran */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Total Pembayaran */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                                Total Pembayaran
                            </h2>
                            <div className="space-y-3">
                                <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                    <span className="text-slate-700">{invoice.plan?.name ?? 'Paket Langganan'} Plan</span>
                                    <span className="font-semibold text-slate-900">
                                        {formatCurrency(invoice.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between items-center pt-3">
                                    <span className="font-semibold text-slate-900">
                                        Total
                                    </span>
                                    <span className="text-2xl font-bold text-indigo-600">
                                        {formatCurrency(invoice.amount)}
                                    </span>
                                </div>
                                <p className="text-xs text-slate-500 mt-2">
                                    Durasi langganan: {invoice.plan?.durationDays ?? '-'} hari
                                </p>
                            </div>
                        </div>

                        {/* Petunjuk Transfer */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                                Pilih Bank Tujuan
                            </h2>

                            <div className="space-y-3">
                                {BANK_ACCOUNTS.map((bank, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedBank(idx)}
                                        className={`w-full p-4 rounded-lg border-2 transition-all text-left ${selectedBank === idx
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold text-slate-900">
                                                {bank.bank}
                                            </h3>
                                            {selectedBank === idx && (
                                                <CheckCircle2 className="h-5 w-5 text-indigo-600" />
                                            )}
                                        </div>
                                        <p className="text-sm text-slate-600 font-mono mb-1">
                                            {bank.accountNumber}
                                        </p>
                                        <p className="text-xs text-slate-500">
                                            a.n. {bank.accountHolder}
                                        </p>
                                    </button>
                                ))}
                            </div>

                            {/* Tampilkan detail bank terpilih */}
                            <div className="mt-6 bg-slate-50 rounded-lg p-4 border border-slate-200">
                                <h3 className="font-semibold text-slate-900 mb-3">
                                    Informasi Transfer
                                </h3>
                                <div className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Bank:</span>
                                        <span className="font-medium text-slate-900">
                                            {BANK_ACCOUNTS[selectedBank].bank}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Nomor Rekening:</span>
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono font-medium text-slate-900">
                                                {BANK_ACCOUNTS[selectedBank].accountNumber}
                                            </span>
                                            <button
                                                onClick={() =>
                                                    copyToClipboard(
                                                        BANK_ACCOUNTS[selectedBank]
                                                            .accountNumber
                                                    )
                                                }
                                                className="p-1.5 hover:bg-slate-200 rounded transition-colors"
                                            >
                                                <Copy className="h-4 w-4 text-slate-600" />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Atas Nama:</span>
                                        <span className="font-medium text-slate-900">
                                            {BANK_ACCOUNTS[selectedBank].accountHolder}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Jumlah:</span>
                                        <span className="font-bold text-indigo-600">
                                            {formatCurrency(invoice.amount)}
                                        </span>
                                    </div>
                                </div>

                                {copied && (
                                    <p className="text-xs text-green-600 mt-3">
                                        ✓ Nomor rekening disalin!
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Upload Bukti Pembayaran */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
                            <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                                Upload Bukti Transfer
                            </h2>

                            {filePreview ? (
                                <div className="space-y-4">
                                    <div className="relative rounded-lg overflow-hidden bg-slate-100 h-48">
                                        <img
                                            src={filePreview}
                                            alt="Preview bukti pembayaran"
                                            className="w-full h-full object-cover"
                                        />
                                        <button
                                            onClick={() => {
                                                setSelectedFile(null)
                                                setFilePreview(null)
                                            }}
                                            className="absolute top-2 right-2 bg-white rounded-full p-1.5 hover:bg-slate-100 transition-colors shadow-md"
                                        >
                                            <X className="h-4 w-4 text-slate-600" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        File: {selectedFile?.name}
                                    </p>
                                </div>
                            ) : (
                                <label className="block border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition-colors">
                                    <div className="flex flex-col items-center">
                                        <Upload className="h-8 w-8 text-slate-400 mb-2" />
                                        <p className="font-medium text-slate-900 mb-1">
                                            Klik untuk upload bukti transfer
                                        </p>
                                        <p className="text-sm text-slate-500">
                                            JPG, PNG atau WebP, maksimal 5MB
                                        </p>
                                    </div>
                                    <input
                                        type="file"
                                        accept="image/jpeg,image/png,image/webp"
                                        onChange={handleFileSelect}
                                        className="hidden"
                                    />
                                </label>
                            )}

                            <Button
                                onClick={handleUploadProof}
                                disabled={!selectedFile || isUploading || uploadSuccess}
                                className="w-full mt-4"
                                size="lg"
                            >
                                {isUploading && (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                )}
                                {uploadSuccess
                                    ? 'Bukti Berhasil Diupload'
                                    : 'Upload Bukti Pembayaran'}
                            </Button>

                            <p className="text-xs text-slate-500 mt-3 text-center">
                                Pastikan bukti transfer jelas terlihat dengan informasi
                                lengkap (nominal, waktu, rekening tujuan)
                            </p>
                        </div>
                    </div>

                    {/* Right: Info Sidebar */}
                    <div className="space-y-4">
                        {/* Ringkasan Order */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sticky top-4">
                            <h3 className="text-sm font-semibold text-slate-600 uppercase tracking-wide mb-4">
                                Ringkasan
                            </h3>

                            <div className="space-y-3 text-sm">
                                <div>
                                    <p className="text-slate-500 mb-1">Paket</p>
                                    <p className="font-semibold text-slate-900">
                                        {invoice.plan?.name ?? 'Paket Langganan'}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500 mb-1">Invoice Number</p>
                                    <p className="font-mono text-xs text-slate-900 bg-slate-50 p-2 rounded break-all">
                                        {invoice.invoiceNumber}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-slate-500 mb-1">Status</p>
                                    <span className="inline-block px-2.5 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                                        {invoice.status === 'PENDING'
                                            ? 'Menunggu Pembayaran'
                                            : invoice.status === 'PROOF_SUBMITTED'
                                                ? 'Bukti Dikirim'
                                                : 'Sudah Dibayar'}
                                    </span>
                                </div>

                                <div className="pt-3 border-t border-slate-100">
                                    <p className="text-slate-500 mb-1">Total</p>
                                    <p className="text-xl font-bold text-indigo-600">
                                        {formatCurrency(invoice.amount)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Info Box */}
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <h4 className="font-semibold text-blue-900 text-sm mb-2">
                                💡 Tips
                            </h4>
                            <ul className="text-xs text-blue-800 space-y-1.5">
                                <li className="flex gap-2">
                                    <span>•</span>
                                    <span>Transfer sesuai nominal yang tertera</span>
                                </li>
                                <li className="flex gap-2">
                                    <span>•</span>
                                    <span>
                                        Tunggu konfirmasi transfer masuk
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <span>•</span>
                                    <span>
                                        Upload bukti dalam 5 menit setelah transfer
                                    </span>
                                </li>
                                <li className="flex gap-2">
                                    <span>•</span>
                                    <span>
                                        Verifikasi biasanya selesai dalam 1 jam
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
