"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { SelectOption } from "@/components/shared/SelectOption";
import { FileUploader } from "@/components/ui/ImageUploader";
import { useSuppliers } from "@/hooks/api/use-suppliers";
import { useCashierContext } from "@/components/cashier/layout/CashierLayoutClient";
import { Badge } from "@/components/ui/badge";
import { Truck } from "lucide-react";

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
  const { outletData } = useCashierContext();
  const outletId = outletData?.id as string;
  const { data } = useSuppliers(outletId);
  const suppliers = data?.suppliers ?? [];

  const [showSuggestions, setShowSuggestions] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const filteredSuggestions = React.useMemo(() => {
    if (!referenceId.trim()) return suppliers.slice(0, 5);
    const q = referenceId.toLowerCase();
    return suppliers
      .filter((s) => s.name.toLowerCase().includes(q))
      .slice(0, 5);
  }, [suppliers, referenceId]);

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

      <div className="space-y-1.5 relative">
        <Label>Supplier</Label>
        <Input
          ref={inputRef}
          placeholder="Ketik atau pilih supplier..."
          value={referenceId}
          onChange={(e) => onReferenceIdChange(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        />
        {errors?.referenceId && (
          <p className="text-xs text-destructive">{errors.referenceId}</p>
        )}
        {/* Supplier suggestions dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div className="absolute z-50 top-full left-0 right-0 mt-1 rounded-md border border-border bg-popover shadow-md overflow-hidden animate-in fade-in slide-in-from-top-1 duration-150">
            {filteredSuggestions.map((supplier) => (
              <button
                key={supplier.id}
                type="button"
                className="flex items-center gap-2 w-full px-3 py-2 text-left text-sm hover:bg-muted/50 transition-colors"
                onMouseDown={(e) => {
                  e.preventDefault();
                  onReferenceIdChange(supplier.name);
                  setShowSuggestions(false);
                }}
              >
                <Truck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="font-medium truncate">{supplier.name}</span>
                {supplier.phone && (
                  <span className="text-xs text-muted-foreground ml-auto shrink-0">
                    {supplier.phone}
                  </span>
                )}
              </button>
            ))}
          </div>
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
