"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    BluetoothConnected,
    Usb,
    Printer,
    PlugZap,
    Layout,
    Loader2,
} from "lucide-react";
import z from "zod";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { usePrinterStore } from "@/stores/printer.store";
import { cn, fileToBase64 } from "@/lib/utils";
import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";
import {
    ReceiptSettingService,
    ReceiptSettingType,
} from "@/lib/apis/receipt-setting";
import { toast } from "sonner";

import { StatusDot } from "@/features/printer-settings/components/status-dot";
import { ConnectionTab } from "@/features/printer-settings/components/connection-tab";

/* ------------------------------------------------------------------ */
/* Schema & Types                                                       */
/* ------------------------------------------------------------------ */

const updateReceiptSettingSchema = z.object({
    photoString: z
        .union([z.string(), z.instanceof(File)])
        .nullable()
        .optional(),
    showLogo: z.enum(["ACTIVE", "INACTIVE"]),
    printWidth: z.coerce.number(),
    endFeed: z.coerce.number(),
    autoCut: z.enum(["ACTIVE", "INACTIVE"]),
    copies: z.coerce.number(),
    imageThreshold: z.coerce.number(),
    headerText: z.string().nullable().optional(),
    footerText: z.string().nullable().optional(),
    showCashier: z.enum(["ACTIVE", "INACTIVE"]),
    showCustomer: z.enum(["ACTIVE", "INACTIVE"]),
    showQR: z.enum(["ACTIVE", "INACTIVE"]),
    qrContent: z.string().nullable().optional(),
});

type UpdateReceiptSettingValues = {
    printWidth: number;
    endFeed: number;
    autoCut: "ACTIVE" | "INACTIVE";
    copies: number;
    showLogo: "ACTIVE" | "INACTIVE";
    photoString: string | File | null;
    imageThreshold: number;
    headerText: string | null;
    footerText: string | null;
    showCashier: "ACTIVE" | "INACTIVE";
    showCustomer: "ACTIVE" | "INACTIVE";
    showQR: "ACTIVE" | "INACTIVE";
    qrContent: string | null;
};

export function PrinterSettings({ outletId }: { outletId?: string }) {
    const printer = usePrinterStore();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"connection" | "format">(
        "connection"
    );
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptSettingType | null>(
        null
    );

    const fetchReceiptSettings = useCallback(async (oid: string) => {
        setIsFetching(true);
        try {
            const data = await ReceiptSettingService.getByOutlet(oid);
            setReceiptData(data);
        } catch (err) {
            console.error("Failed to fetch receipt settings:", err);
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        if (open && outletId && activeTab === "format") {
            fetchReceiptSettings(outletId);
        }
    }, [open, outletId, activeTab, fetchReceiptSettings]);

    /* ---- Form defaults ---- */
    const receiptDefaultValues = useMemo<UpdateReceiptSettingValues>(
        () => ({
            printWidth: receiptData?.printWidth.toString() as any,
            endFeed: receiptData?.endFeed ?? 3,
            autoCut: receiptData?.autoCut !== false ? "ACTIVE" : "INACTIVE",
            copies: receiptData?.copies ?? 1,
            showLogo: receiptData?.showLogo ? "ACTIVE" : "INACTIVE",
            photoString: receiptData?.photoString ?? null,
            imageThreshold: receiptData?.imageThreshold ?? 180,
            headerText: receiptData?.headerText ?? null,
            footerText: receiptData?.footerText ?? null,
            showCashier: receiptData?.showCashier !== false ? "ACTIVE" : "INACTIVE",
            showCustomer:
                receiptData?.showCustomer !== false ? "ACTIVE" : "INACTIVE",
            showQR: receiptData?.showQR ? "ACTIVE" : "INACTIVE",
            qrContent: receiptData?.qrContent ?? null,
        }),
        [receiptData]
    );

    /* ---- Submit ---- */
    const handleReceiptSubmit = async (values: any) => {
        if (!outletId) return;
        setIsSubmitting(true);
        try {
            const formData = values as FormData;
            const fileEntry = formData.get("photoString");

            const payload: any = {
                printWidth: Number(formData.get("printWidth")),
                endFeed: Number(formData.get("endFeed")),
                autoCut: formData.get("autoCut") === "ACTIVE",
                copies: Number(formData.get("copies")),
                showLogo: formData.get("showLogo") === "ACTIVE",
                imageThreshold: Number(formData.get("imageThreshold")),
                headerText: formData.get("headerText"),
                footerText: formData.get("footerText"),
                showCashier: formData.get("showCashier") === "ACTIVE",
                showCustomer: formData.get("showCustomer") === "ACTIVE",
                showQR: formData.get("showQR") === "ACTIVE",
                qrContent: formData.get("qrContent"),
            };

            if (fileEntry instanceof File && fileEntry.size > 0) {
                payload.photoString = await fileToBase64(fileEntry);
            } else if (typeof fileEntry === "string") {
                payload.photoString = fileEntry;
            }

            const result = await ReceiptSettingService.update(outletId, payload);
            toast.success("Pengaturan struk berhasil disimpan", { duration: 5000 });
            setReceiptData(result);
        } catch (err) {
            console.error("Update failed:", err);
            toast.error("Gagal menyimpan pengaturan struk");
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    /* ---- Form field config ---- */
    const receiptFields: FormFieldConfig<UpdateReceiptSettingValues>[] = [
        {
            name: "printWidth",
            label: "Lebar kertas",
            type: "select",
            colSpan: 3,
            placeholder: "Pilih lebar kertas",
            options: [
                { label: "58 mm", value: "58" },
                { label: "80 mm", value: "80" },
            ],
        },
        { name: "copies", label: "Jumlah rangkap", type: "number", colSpan: 3 },
        {
            name: "autoCut",
            label: "Potong otomatis",
            type: "dual-option-switch",
            colSpan: 3,
            switchOptions: {
                right: { label: "Aktif", value: "ACTIVE" },
                left: { label: "Nonaktif", value: "INACTIVE" },
            },
        },
        {
            name: "endFeed",
            label: "Jarak kertas akhir",
            type: "number",
            colSpan: 3,
            description: "Baris kosong sebelum potong",
        },
        {
            name: "headerText",
            label: "Teks header",
            type: "text",
            colSpan: 6,
            placeholder: "Contoh: Promo Beli 1 Gratis 1",
        },
        {
            name: "footerText",
            label: "Teks footer",
            type: "textarea",
            colSpan: 6,
            placeholder: "Contoh: Barang yang sudah dibeli tidak dapat ditukar.",
        },
        {
            name: "showLogo",
            label: "Tampilkan logo",
            type: "dual-option-switch",
            colSpan: 3,
            switchOptions: {
                right: { label: "Aktif", value: "ACTIVE" },
                left: { label: "Nonaktif", value: "INACTIVE" },
            },
        },
        {
            name: "imageThreshold",
            label: "Sensitivitas logo",
            type: "number",
            colSpan: 3,
            description: "0–255 (default: 180)",
        },
        {
            name: "photoString",
            label: "File logo",
            type: "file",
            colSpan: 6,
            description: "PNG/JPG transparan. Maks 300 KB.",
            accept: { "image/*": [".png", ".jpg", ".jpeg"] },
            maxSizes: 300 * 1024,
            disabled: isSubmitting,
        },
        {
            name: "showCashier",
            label: "Tampilkan kasir",
            type: "dual-option-switch",
            colSpan: 3,
            switchOptions: {
                right: { label: "Aktif", value: "ACTIVE" },
                left: { label: "Nonaktif", value: "INACTIVE" },
            },
        },
        {
            name: "showCustomer",
            label: "Tampilkan pelanggan",
            type: "dual-option-switch",
            colSpan: 3,
            switchOptions: {
                right: { label: "Aktif", value: "ACTIVE" },
                left: { label: "Nonaktif", value: "INACTIVE" },
            },
        },
        {
            name: "showQR",
            label: "Tampilkan QR code",
            type: "dual-option-switch",
            colSpan: 3,
            switchOptions: {
                right: { label: "Aktif", value: "ACTIVE" },
                left: { label: "Nonaktif", value: "INACTIVE" },
            },
        },
        {
            name: "qrContent",
            label: "Isi QR code",
            type: "text",
            colSpan: 3,
            placeholder: "URL atau ID struk",
        },
    ];

    const triggerIcon = () => {
        if (!printer.isConnected)
            return <Printer className="h-4 w-4 text-muted-foreground" />;
        if (printer.connectionType === "usb")
            return <Usb className="h-4 w-4 text-foreground" />;
        return <BluetoothConnected className="h-4 w-4 text-foreground" />;
    };

    const navItems = [
        {
            key: "connection" as const,
            icon: <PlugZap className="h-3.5 w-3.5" />,
            label: "Koneksi printer",
        },
        {
            key: "format" as const,
            icon: <Layout className="h-3.5 w-3.5" />,
            label: "Format struk",
        },
    ];

    return (
        <>
            {/* Trigger */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                title={
                    printer.isConnected
                        ? `Terhubung: ${printer.deviceName}`
                        : "Pengaturan printer"
                }
                className="relative h-9 w-9 rounded-md hover:bg-muted/50"
            >
                {triggerIcon()}
                {printer.isConnected && (
                    <span className="absolute right-2 top-2">
                        <StatusDot connected />
                    </span>
                )}
            </Button>

            {/* Dialog */}
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 sm:max-w-4xl overflow-hidden rounded-lg border-border/60 shadow-lg">
                    {/* Accessibility */}
                    <DialogTitle className="sr-only">Pengaturan printer</DialogTitle>
                    <DialogDescription className="sr-only">
                        Kelola koneksi printer dan format struk
                    </DialogDescription>

                    <div className="flex h-[600px] w-full">
                        {/* ---- Sidebar ---- */}
                        <aside className="w-[196px] shrink-0 border-r border-border/50 bg-muted/20 flex flex-col">
                            {/* Branding */}
                            <div className="px-5 py-6">
                                <div className="flex items-center gap-2 mb-1">
                                    <Printer className="h-3.5 w-3.5 text-muted-foreground" />
                                    <h2 className="text-[13px] font-medium text-foreground">
                                        Pengaturan printer
                                    </h2>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Koneksi &amp; format struk
                                </p>
                            </div>

                            <Separator className="bg-border/40" />

                            {/* Navigation */}
                            <nav className="flex flex-col gap-1 p-2 pt-3">
                                {navItems.map(({ key, icon, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={cn(
                                            "flex w-full items-center gap-2.5 rounded-md px-3 py-2.5",
                                            "text-[13px] text-left transition-colors duration-150",
                                            "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                                            activeTab === key
                                                ? "bg-background font-medium text-foreground shadow-sm ring-1 ring-border/30"
                                                : "font-normal text-muted-foreground hover:bg-background/60 hover:text-foreground"
                                        )}
                                    >
                                        {icon}
                                        {label}
                                    </button>
                                ))}
                            </nav>

                            {/* Status */}
                            <div className="mt-auto p-4">
                                <div
                                    className={cn(
                                        "flex items-center gap-2 rounded-md border border-border/40",
                                        "bg-background/50 px-3 py-2"
                                    )}
                                >
                                    <StatusDot connected={printer.isConnected} />
                                    <span className="text-[12px] text-muted-foreground">
                                        Status:{" "}
                                        <span
                                            className={
                                                printer.isConnected
                                                    ? "text-foreground font-medium"
                                                    : ""
                                            }
                                        >
                                            {printer.isConnected ? "Online" : "Offline"}
                                        </span>
                                    </span>
                                </div>
                            </div>
                        </aside>

                        {/* ---- Content ---- */}
                        <div className="flex-1 overflow-y-auto bg-background">

                            {/* Connection tab */}
                            {activeTab === "connection" && (
                                <div className="p-8">
                                    <div className="mb-6">
                                        <h3 className="text-[16px] font-medium text-foreground">
                                            Koneksi perangkat
                                        </h3>
                                        <p className="mt-1 text-[13px] text-muted-foreground">
                                            Kelola koneksi printer Bluetooth atau USB Anda.
                                        </p>
                                    </div>
                                    <ConnectionTab
                                        printer={printer}
                                        onSwitchToFormat={() => setActiveTab("format")}
                                    />
                                </div>
                            )}

                            {/* Format tab */}
                            {activeTab === "format" && (
                                <div className="p-8">
                                    <div className="mb-6">
                                        <h3 className="text-[16px] font-medium text-foreground">
                                            Format struk
                                        </h3>
                                        <p className="mt-1 text-[13px] text-muted-foreground">
                                            Atur tampilan logo dan ukuran kertas struk.
                                        </p>
                                    </div>

                                    {isFetching ? (
                                        <div className="flex flex-col items-center justify-center gap-3 py-24">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground/40" />
                                            <p className="text-[12px] text-muted-foreground">
                                                Memuat pengaturan…
                                            </p>
                                        </div>
                                    ) : (
                                        <ReusableForm<UpdateReceiptSettingValues>
                                            key={open ? "open" : "closed"}
                                            defaultValues={receiptDefaultValues}
                                            gridCols={6}
                                            onSubmit={handleReceiptSubmit}
                                            fields={receiptFields}
                                            submitText={
                                                isSubmitting ? "Menyimpan…" : "Simpan perubahan"
                                            }
                                            schema={updateReceiptSettingSchema}
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}