'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import {
    AlertCircle,
    CheckCircle2,
    Copy,
    X,
    ArrowLeft,
    Loader2,
} from 'lucide-react'
import { FileUploader } from '@/components/ui/ImageUploader'
import { ACCEPTED_FILE_TYPES } from '@/constants/file-types'
import { useInvoice, useUploadInvoiceProof } from '@/hooks/use-invoice'
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from '../helper'

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

export default function SubscriptionPaymentContent({ invoiceId }: { invoiceId: string }) {
    const router = useRouter()
    const { data: invoice, isLoading } = useInvoice(invoiceId)
    const { mutateAsync: uploadProof, isPending: isUploading, isSuccess } =
        useUploadInvoiceProof()

    const [selectedBank, setSelectedBank] = useState(0)
    const [selectedFile, setSelectedFile] = useState<File | null>(null)
    const [filePreview, setFilePreview] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const handleFileSelect = (file: File | null) => {
        if (!file) return
        setSelectedFile(file)

        const reader = new FileReader()
        reader.onload = (e) => setFilePreview(e.target?.result as string)
        reader.readAsDataURL(file)
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    if (!invoice) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card className="max-w-md w-full text-center">
                    <CardHeader>
                        <AlertCircle className="h-10 w-10 text-destructive mx-auto" />
                        <CardTitle>Terjadi Kesalahan</CardTitle>
                    </CardHeader>
                    <CardFooter>
                        <Button className="w-full" onClick={() => router.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Kembali
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen px-4 py-6">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Button variant="ghost" size="sm" onClick={() => router.push('/owner/subscription')}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Ke Dashboard
                    </Button>
                    <h1 className="text-3xl font-bold mt-2">
                        Konfirmasi Pembayaran
                    </h1>
                    <p className="text-muted-foreground">
                        Invoice #{invoice.invoiceNumber}
                    </p>
                </div>

                {isSuccess && (
                    <Card className="border-green-500/30 bg-green-500/5">
                        <CardContent className="flex gap-3 py-4">
                            <CheckCircle2 className="text-green-600 h-5 w-5 mt-0.5" />
                            <div>
                                <p className="font-semibold text-green-700">
                                    Bukti pembayaran berhasil diupload
                                </p>
                                <p className="text-sm text-green-600">
                                    Tim kami akan memverifikasi pembayaran Anda.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                )}

                <div className="grid md:grid-cols-6 gap-6">
                    {/* LEFT */}
                    <div className="md:col-span-4 space-y-6">
                        {/* Total */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Total Pembayaran</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">
                                        {invoice.plan?.name}
                                    </span>
                                    <span className="font-semibold">
                                        {formatCurrency(invoice.amount)}
                                    </span>
                                </div>
                                <div className="flex justify-between border-t pt-3">
                                    <span className="font-semibold">Total</span>
                                    <span className="text-xl font-bold text-primary">
                                        {formatCurrency(invoice.amount)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Bank */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Pilih Bank Tujuan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {BANK_ACCOUNTS.map((bank, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedBank(idx)}
                                        className={`w-full rounded-md border p-4 text-left transition
                                        ${selectedBank === idx
                                                ? 'border-primary bg-primary/5'
                                                : 'hover:border-muted-foreground/30'
                                            }`}
                                    >
                                        <div className="flex justify-between">
                                            <span className="font-semibold">{bank.bank}</span>
                                            {selectedBank === idx && (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                        <p className="font-mono text-sm text-muted-foreground">
                                            {bank.accountNumber}
                                        </p>
                                    </button>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Informasi Transfer</CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Bank</span>
                                    <span className="font-medium">
                                        {BANK_ACCOUNTS[selectedBank].bank}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground">Nomor Rekening</span>
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono font-medium">
                                            {BANK_ACCOUNTS[selectedBank].accountNumber}
                                        </span>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() =>
                                                copyToClipboard(
                                                    BANK_ACCOUNTS[selectedBank].accountNumber
                                                )
                                            }
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Atas Nama</span>
                                    <span className="font-medium">
                                        {BANK_ACCOUNTS[selectedBank].accountHolder}
                                    </span>
                                </div>

                                <div className="flex justify-between border-t pt-3">
                                    <span className="text-muted-foreground">Jumlah Transfer</span>
                                    <span className="font-bold text-primary">
                                        {formatCurrency(invoice.amount)}
                                    </span>
                                </div>

                                {copied && (
                                    <p className="text-xs text-green-600 pt-2">
                                        ✓ Nomor rekening berhasil disalin
                                    </p>
                                )}
                            </CardContent>
                        </Card>


                        {/* Upload */}
                        {(invoice.status === 'PENDING' ||
                            invoice.status === 'REJECTED_MANUAL') && (
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Upload Bukti Pembayaran</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {invoice.status === 'REJECTED_MANUAL' && invoice.rejectionReason && (
                                            <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                                                <AlertCircle className="h-4 w-4 mt-0.5" />
                                                <div>
                                                    <p className="font-semibold">Bukti ditolak</p>
                                                    <p>{invoice.rejectionReason}</p>
                                                    <p className="mt-1 text-rose-600">Unggah ulang bukti yang valid agar invoice dapat diverifikasi.</p>
                                                </div>
                                            </div>
                                        )}
                                        {filePreview ? (
                                            <div className="relative">
                                                <img
                                                    src={filePreview}
                                                    className="rounded-md object-cover max-h-64 w-full"
                                                />
                                                <button
                                                    onClick={() => {
                                                        setSelectedFile(null)
                                                        setFilePreview(null)
                                                    }}
                                                    className="absolute top-2 right-2 bg-background rounded-full p-1 shadow"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                            </div>
                                        ) : (
                                            <FileUploader
                                                accept={ACCEPTED_FILE_TYPES.IMAGE}
                                                onValueChange={handleFileSelect}
                                                maxSize={5 * 1024 * 1024}
                                            />
                                        )}
                                    </CardContent>
                                    <CardFooter>
                                        <Button
                                            className="w-full"
                                            disabled={!selectedFile || isUploading || isSuccess}
                                            onClick={() =>
                                                uploadProof({ file: selectedFile!, invoiceId })
                                            }
                                        >
                                            {isUploading && (
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            )}
                                            Upload Bukti
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )}
                    </div>

                    {/* RIGHT */}
                    <div className="md:col-span-2">
                        <Card className="sticky top-4">
                            <CardHeader>
                                <CardTitle>Ringkasan</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <p className="text-muted-foreground">Paket</p>
                                    <p className="font-semibold">{invoice.plan?.name}</p>
                                </div>
                                <div>
                                    <p className="text-muted-foreground">Status</p>
                                    <span className={`inline-block rounded-full px-2 py-1 text-xs ${PAYMENT_STATUS_STYLES[invoice.status]}`}>
                                        {PAYMENT_STATUS_LABELS[invoice.status]}
                                    </span>
                                </div>
                                <div className="border-t pt-3">
                                    <p className="text-muted-foreground">Total</p>
                                    <p className="text-xl font-bold text-primary">
                                        {formatCurrency(invoice.amount)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
