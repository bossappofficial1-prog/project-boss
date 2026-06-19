"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { gooeyToast } from "goey-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/lib/utils";
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Clock,
  Copy,
  FileUp,
  Loader2,
  ShieldCheck,
  X,
} from "lucide-react";
import { FileUploader } from "@/components/ui/image-uploader";
import { ACCEPTED_FILE_TYPES } from "@/lib/file-types";
import { useInvoice, useUploadInvoiceProof } from "@/hooks/use-invoice";
import { PAYMENT_STATUS_LABELS, PAYMENT_STATUS_STYLES } from "../helper";

const BANK_ACCOUNTS = [
  {
    bank: "BCA",
    accountNumber: "1234567890",
    accountHolder: "PT BOSS APP INDONESIA",
  },
  {
    bank: "Mandiri",
    accountNumber: "0987654321",
    accountHolder: "PT BOSS APP INDONESIA",
  },
  {
    bank: "BNI",
    accountNumber: "1122334455",
    accountHolder: "PT BOSS APP INDONESIA",
  },
];

function CopyRow({
  label,
  value,
  field,
  copiedField,
  onCopy,
}: {
  label: string;
  value: string;
  field: string;
  copiedField: string | null;
  onCopy: (value: string, field: string) => void;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-mono text-sm font-medium">{value}</span>
        <button
          type="button"
          onClick={() => onCopy(value, field)}
          className="rounded-md p-1 hover:bg-muted transition-colors"
        >
          {copiedField === field ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          ) : (
            <Copy className="h-4 w-4 text-muted-foreground" />
          )}
        </button>
      </div>
    </div>
  );
}

export default function SubscriptionPaymentContent({
  invoiceId,
}: {
  invoiceId: string;
}) {
  const router = useRouter();
  const { data: invoice, isLoading } = useInvoice(invoiceId);
  const { mutateAsync: uploadProof, isPending: isUploading } =
    useUploadInvoiceProof();

  const [selectedBank, setSelectedBank] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => setFilePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleCopy = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
    gooeyToast.success("Disalin ke clipboard");
  };

  const handleUploadProof = async () => {
    if (!selectedFile) return;
    try {
      await uploadProof({ file: selectedFile, invoiceId });
      setUploadSuccess(true);
      setSelectedFile(null);
      setFilePreview(null);
      gooeyToast.success("Bukti pembayaran berhasil diunggah");
    } catch {
      gooeyToast.error("Gagal mengunggah bukti pembayaran");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="max-w-md py-0 w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
            <div>
              <h2 className="text-lg font-medium">Invoice Tidak Ditemukan</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Invoice yang Anda cari tidak ada atau sudah tidak berlaku.
              </p>
            </div>
            <Button
              className="w-full"
              onClick={() => router.push("/owner/subscription")}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Ke Dashboard Langganan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isUploadable =
    invoice.status === "PENDING" || invoice.status === "REJECTED_MANUAL";
  const isVerified = invoice.status === "SUCCESS";
  const bank = BANK_ACCOUNTS[selectedBank];

  return (
    <div className="min-h-screen bg-background px-4 py-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => router.push("/owner/subscription")}
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              Konfirmasi Pembayaran
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              {invoice.invoiceNumber}
            </p>
          </div>
          <Badge
            className={`border text-sm font-semibold w-fit ${PAYMENT_STATUS_STYLES[invoice.status]}`}
          >
            {PAYMENT_STATUS_LABELS[invoice.status]}
          </Badge>
        </div>

        {/* Status Callouts */}
        {uploadSuccess && (
          <div className="flex gap-3 rounded-lg border-l-4 border-emerald-500 bg-muted/50 p-4">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                Bukti pembayaran berhasil diunggah
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Tim kami akan memverifikasi dalam 1×24 jam.
              </p>
            </div>
          </div>
        )}

        {isVerified && (
          <div className="flex gap-3 rounded-lg border-l-4 border-emerald-500 bg-muted/50 p-4">
            <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">
                Pembayaran telah diverifikasi
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Langganan Anda sudah aktif.
              </p>
            </div>
          </div>
        )}

        {invoice.status === "REJECTED_MANUAL" && invoice.rejectionReason && (
          <div className="flex gap-3 rounded-lg border-l-4 border-destructive bg-destructive/5 p-4">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-destructive">
                Pembayaran ditolak
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {invoice.rejectionReason}
              </p>
              <p className="text-sm text-muted-foreground">
                Silakan unggah ulang bukti yang valid.
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Bank Selector */}
            <Card className="gap-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">
                  Pilih Bank Tujuan
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-3">
                  {BANK_ACCOUNTS.map((item, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedBank(idx)}
                      className={`relative rounded-lg border p-4 text-center transition-colors
                                                ${
                                                  selectedBank === idx
                                                    ? "border-primary bg-primary/5"
                                                    : "border-border hover:border-muted-foreground/40"
                                                }`}
                    >
                      <div
                        className={`mx-auto mb-2 h-10 w-10 rounded-full flex items-center justify-center text-xs font-bold
                                                ${selectedBank === idx ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
                      >
                        {item.bank.slice(0, 3)}
                      </div>
                      <p className="text-sm font-semibold">{item.bank}</p>
                      <p className="text-xs text-muted-foreground font-mono mt-0.5">
                        {item.accountNumber.slice(0, 4)}···
                      </p>
                      {selectedBank === idx && (
                        <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Transfer Detail */}
            <Card className="gap-0">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">
                  Detail Transfer
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <CopyRow
                  label="Bank"
                  value={bank.bank}
                  field="bank"
                  copiedField={copiedField}
                  onCopy={handleCopy}
                />
                <Separator />
                <CopyRow
                  label="Nomor Rekening"
                  value={bank.accountNumber}
                  field="account"
                  copiedField={copiedField}
                  onCopy={handleCopy}
                />
                <Separator />
                <CopyRow
                  label="Atas Nama"
                  value={bank.accountHolder}
                  field="holder"
                  copiedField={copiedField}
                  onCopy={handleCopy}
                />
                <Separator />
                <div className="flex items-center justify-between pt-3">
                  <span className="text-sm font-medium">Jumlah Transfer</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xl font-bold text-primary">
                      {formatCurrency(invoice.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        handleCopy(String(invoice.amount), "amount")
                      }
                      className="rounded-md p-1 hover:bg-muted transition-colors"
                    >
                      {copiedField === "amount" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      ) : (
                        <Copy className="h-4 w-4 text-muted-foreground" />
                      )}
                    </button>
                  </div>
                </div>
                <p className="flex items-center gap-1.5 text-xs text-muted-foreground pt-1">
                  <Clock className="h-3.5 w-3.5" />
                  Transfer sesuai nominal agar verifikasi lebih cepat
                </p>
              </CardContent>
            </Card>

            {/* Upload Proof */}
            {isUploadable && (
              <Card className="gap-0">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <FileUp className="h-4 w-4 text-primary" />
                    Upload Bukti Pembayaran
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {filePreview ? (
                    <div className="relative rounded-lg border border-border overflow-hidden">
                      <img
                        src={filePreview}
                        alt="Preview bukti pembayaran"
                        className="w-full max-h-64 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedFile(null);
                          setFilePreview(null);
                        }}
                        className="absolute top-2 right-2 bg-background/90 backdrop-blur rounded-full p-1.5 shadow-sm hover:bg-background"
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
                  <Button
                    className="w-full"
                    disabled={!selectedFile || isUploading}
                    onClick={handleUploadProof}
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Mengunggah...
                      </>
                    ) : (
                      "Upload Bukti Pembayaran"
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar Summary */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-medium">
                  Ringkasan Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-lg bg-muted/50 p-4 text-center">
                  <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                    Total Tagihan
                  </p>
                  <p className="text-3xl font-bold text-primary">
                    {formatCurrency(invoice.amount)}
                  </p>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Paket</span>
                    <span className="font-medium">{invoice.plan?.name}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Siklus</span>
                    <span className="font-medium">
                      {invoice.billingCycle === 365 ? "Tahunan" : "Bulanan"}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge
                      className={`border text-xs font-semibold ${PAYMENT_STATUS_STYLES[invoice.status]}`}
                    >
                      {PAYMENT_STATUS_LABELS[invoice.status]}
                    </Badge>
                  </div>
                  <Separator />
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tanggal</span>
                    <span className="text-xs">
                      {new Date(invoice.createdAt).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
