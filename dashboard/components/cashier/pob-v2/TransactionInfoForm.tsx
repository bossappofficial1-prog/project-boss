"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SelectOption } from "@/components/shared/SelectOption";
import FileUploader from "@/components/ui/ImageUploader";

const TRANSACTION_TYPE_OPTIONS = [
    { label: "Pembelian (Stok Masuk)", value: "PURCHASE" },
    { label: "Pengembalian (Stok Keluar)", value: "RETURN" },
];

interface TransactionInfoFormProps {
    referenceType: string;
    referenceId: string;
    notes: string;
    fakturFile: File | null;
    onReferenceTypeChange: (val: string) => void;
    onReferenceIdChange: (val: string) => void;
    onNotesChange: (val: string) => void;
    onFakturChange: (file: File | null) => void;
    errors?: Record<string, string>;
}

export function TransactionInfoForm({
    referenceType,
    referenceId,
    notes,
    fakturFile,
    onReferenceTypeChange,
    onReferenceIdChange,
    onNotesChange,
    onFakturChange,
    errors,
}: TransactionInfoFormProps) {
    return (
        <div className="space-y-3">
            <div className="space-y-1.5">
                <Label>Tipe Transaksi</Label>
                <SelectOption
                    value={referenceType}
                    onValueChange={onReferenceTypeChange}
                    options={TRANSACTION_TYPE_OPTIONS}
                    placeholder="Pilih tipe"
                />
            </div>

            <div className="space-y-1.5">
                <Label>Supplier</Label>
                <Input
                    placeholder="Contoh: Toko ABC"
                    value={referenceId}
                    onChange={(e) => onReferenceIdChange(e.target.value)}
                />
                {errors?.referenceId && (
                    <p className="text-xs text-destructive">{errors.referenceId}</p>
                )}
            </div>

            <div className="space-y-1.5">
                <Label>Catatan</Label>
                <Textarea
                    placeholder="Catatan tambahan (opsional)"
                    value={notes}
                    onChange={(e) => onNotesChange(e.target.value)}
                    rows={2}
                />
            </div>

            <div className="space-y-1.5">
                <Label>Faktur Pembelian</Label>
                <FileUploader
                    value={fakturFile}
                    onValueChange={onFakturChange}
                    accept={{ "image/*": [".jpeg", ".png", ".jpg", ".webp"] }}
                    maxSize={5 * 1024 * 1024}
                    label="Upload gambar faktur"
                    helperText="Format: JPG, PNG, WEBP (Maks 5MB)"
                />
                {errors?.faktur && (
                    <p className="text-xs text-destructive">{errors.faktur}</p>
                )}
            </div>
        </div>
    );
}
