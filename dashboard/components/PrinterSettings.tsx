"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    Bluetooth, BluetoothConnected, BluetoothSearching, Usb, Printer,
    RefreshCw, X, PlugZap, WifiOff, CheckCircle2, Settings2, Layout,
    Loader2,
} from "lucide-react";
import z from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePrinterContext } from "@/contexts/PrinterContext";
import { cn, fileToBase64 } from "@/lib/utils";
import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";
import { ReceiptSettingService, ReceiptSettingType } from "@/lib/apis/receipt-setting";
import { toast } from "sonner";

const updateReceiptSettingSchema = z.object({
    photoString: z.union([z.string(), z.instanceof(File)]).nullable().optional(),
    showLogo: z.enum(['ACTIVE', 'INACTIVE']),
    printWidth: z.coerce.number(),
    endFeed: z.coerce.number(),
    autoCut: z.enum(['ACTIVE', 'INACTIVE']),
    copies: z.coerce.number(),
    imageThreshold: z.coerce.number(),
    headerText: z.string().nullable().optional(),
    footerText: z.string().nullable().optional(),
    showCashier: z.enum(['ACTIVE', 'INACTIVE']),
    showCustomer: z.enum(['ACTIVE', 'INACTIVE']),
    showQR: z.enum(['ACTIVE', 'INACTIVE']),
    qrContent: z.string().nullable().optional(),
});

type UpdateReceiptSettingValues = {
    printWidth: number;
    endFeed: number;
    autoCut: 'ACTIVE' | 'INACTIVE';
    copies: number;
    showLogo: 'ACTIVE' | 'INACTIVE';
    photoString: string | File | null;
    imageThreshold: number;
    headerText: string | null;
    footerText: string | null;
    showCashier: 'ACTIVE' | 'INACTIVE';
    showCustomer: 'ACTIVE' | 'INACTIVE';
    showQR: 'ACTIVE' | 'INACTIVE';
    qrContent: string | null;
};

function StatusDot({ connected }: { connected: boolean }) {
    return (
        <span className="relative flex h-1.5 w-1.5">
            {connected && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />}
            <span className={cn("relative inline-flex h-1.5 w-1.5 rounded-full", connected ? "bg-emerald-500" : "bg-muted-foreground/30")} />
        </span>
    );
}

function DeviceRow({ icon, label, onClick, type }: { icon: React.ReactNode; label: string; onClick: () => void; type: "bluetooth" | "usb" }) {
    return (
        <button onClick={onClick} className={cn(
            "group flex w-full items-center justify-between rounded-md border border-border/60 bg-muted/20 px-4 py-3",
            "transition-all duration-200 hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-md border border-border/40",
                    type === "bluetooth" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500")}>
                    {icon}
                </div>
                <div className="text-left">
                    <p className="text-xs font-bold text-foreground/80 leading-none mb-1">{label}</p>
                    <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">{type}</p>
                </div>
            </div>
            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-widest bg-background border-border/40 opacity-0 group-hover:opacity-100 transition-opacity">
                Hubungkan
            </Badge>
        </button>
    );
}

function ConnectCard({ icon, label, sub, onClick, disabled }: { icon: React.ReactNode; label: string; sub: string; onClick: () => void; disabled?: boolean }) {
    return (
        <button onClick={onClick} disabled={disabled} className={cn(
            "group flex flex-col items-start gap-3 rounded-md border border-border/60 bg-muted/20 p-4 text-left",
            "transition-all duration-200 hover:border-primary/40 hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
            "disabled:cursor-not-allowed disabled:opacity-40"
        )}>
            <div className="flex h-9 w-9 items-center justify-center rounded-md border border-border/40 bg-background text-muted-foreground transition-colors group-hover:text-primary group-hover:border-primary/20">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-foreground">{label}</p>
                <p className="mt-1 text-[9px] font-bold text-muted-foreground/40 uppercase tracking-tight line-clamp-1">{sub}</p>
            </div>
        </button>
    );
}

export function PrinterSettings({ outletId }: { outletId?: string }) {
    const printer = usePrinterContext();
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<"connection" | "format">("connection");
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptSettingType | null>(null);

    const hasSaved = printer.savedBtDevices.length > 0 || printer.savedUsbDevices.length > 0;

    const fetchReceiptSettings = useCallback(async (oid: string) => {
        setIsFetching(true);
        try {
            const data = await ReceiptSettingService.getByOutlet(oid);
            setReceiptData(data);
        } catch (error) {
            console.error("Failed to fetch receipt settings:", error);
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        if (open && outletId && activeTab === "format") {
            fetchReceiptSettings(outletId);
        }
    }, [open, outletId, activeTab, fetchReceiptSettings]);

    const receiptDefaultValues = useMemo<UpdateReceiptSettingValues>(() => ({
        printWidth: Number(receiptData?.printWidth || 80),
        endFeed: receiptData?.endFeed || 3,
        autoCut: receiptData?.autoCut !== false ? 'ACTIVE' : 'INACTIVE',
        copies: receiptData?.copies || 1,
        showLogo: receiptData?.showLogo ? 'ACTIVE' : 'INACTIVE',
        photoString: receiptData?.photoString || null,
        imageThreshold: receiptData?.imageThreshold || 180,
        headerText: receiptData?.headerText || null,
        footerText: receiptData?.footerText || null,
        showCashier: receiptData?.showCashier !== false ? 'ACTIVE' : 'INACTIVE',
        showCustomer: receiptData?.showCustomer !== false ? 'ACTIVE' : 'INACTIVE',
        showQR: receiptData?.showQR ? 'ACTIVE' : 'INACTIVE',
        qrContent: receiptData?.qrContent || null,
    }), [receiptData]);

    console.log(receiptDefaultValues)

    const handleReceiptSubmit = async (values: any) => {
        if (!outletId) return;
        setIsSubmitting(true);
        try {
            const formData = values as FormData;
            const fileEntry = formData.get('photoString');
            const payload: any = {
                printWidth: Number(formData.get('printWidth')),
                endFeed: Number(formData.get('endFeed')),
                autoCut: formData.get('autoCut') === 'ACTIVE',
                copies: Number(formData.get('copies')),
                showLogo: formData.get('showLogo') === 'ACTIVE',
                imageThreshold: Number(formData.get('imageThreshold')),
                headerText: formData.get('headerText'),
                footerText: formData.get('footerText'),
                showCashier: formData.get('showCashier') === 'ACTIVE',
                showCustomer: formData.get('showCustomer') === 'ACTIVE',
                showQR: formData.get('showQR') === 'ACTIVE',
                qrContent: formData.get('qrContent'),
            };
            if (fileEntry instanceof File && fileEntry.size > 0) {
                payload.photoString = await fileToBase64(fileEntry);
            } else if (typeof fileEntry === 'string') {
                payload.photoString = fileEntry;
            }
            const result = await ReceiptSettingService.update(outletId, payload);
            toast.success("Pengaturan struk berhasil disimpan", { duration: 5000 });
            setReceiptData(result);
        } catch (error) {
            console.error("Update failed:", error);
            toast.error("Gagal menyimpan pengaturan struk")
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const receiptFields: FormFieldConfig<UpdateReceiptSettingValues>[] = [
        { name: 'printWidth', label: 'Lebar Kertas', type: 'select', colSpan: 3, placeholder: "Pilih Lebar Kertas", options: [{ label: '58mm', value: '58' }, { label: '80mm', value: '80' }] },
        { name: 'copies', label: 'Jumlah Rangkap', type: 'number', colSpan: 3 },
        { name: 'autoCut', label: 'Potong Otomatis', type: 'dual-option-switch', colSpan: 3, switchOptions: { right: { label: 'Aktif', value: 'ACTIVE' }, left: { label: 'Nonaktif', value: 'INACTIVE' } } },
        { name: 'endFeed', label: 'Jarak Kertas Akhir', type: 'number', colSpan: 3, description: 'Baris kosong sebelum potong.' },

        { name: 'headerText', label: 'Teks Header', type: 'text', colSpan: 6, placeholder: 'Contoh: Promo Beli 1 Gratis 1' },
        { name: 'footerText', label: 'Teks Footer', type: 'textarea', colSpan: 6, placeholder: 'Contoh: Barang yang sudah dibeli tidak dapat ditukar.' },

        { name: 'showLogo', label: 'Tampilkan Logo', type: 'dual-option-switch', className: 'w-full', colSpan: 3, switchOptions: { right: { label: 'Aktif', value: 'ACTIVE' }, left: { label: 'Nonaktif', value: 'INACTIVE' } } },
        { name: 'imageThreshold', label: 'Sensitivitas Logo', type: 'number', colSpan: 3, description: '0-255 (Default: 180)' },
        { name: 'photoString', label: 'File Logo', type: 'file', colSpan: 6, description: 'PNG/JPG transparan. Maks 300KB.', accept: { 'image/*': ['.png', '.jpg', '.jpeg'] }, maxSizes: 300 * 1024, disabled: isSubmitting },

        { name: 'showCashier', label: 'Tampilkan Kasir', type: 'dual-option-switch', colSpan: 3, switchOptions: { right: { label: 'Aktif', value: 'ACTIVE' }, left: { label: 'Nonaktif', value: 'INACTIVE' } } },
        { name: 'showCustomer', label: 'Tampilkan Pelanggan', type: 'dual-option-switch', colSpan: 3, switchOptions: { right: { label: 'Aktif', value: 'ACTIVE' }, left: { label: 'Nonaktif', value: 'INACTIVE' } } },

        { name: 'showQR', label: 'Tampilkan QR Code', type: 'dual-option-switch', colSpan: 3, switchOptions: { right: { label: 'Aktif', value: 'ACTIVE' }, left: { label: 'Nonaktif', value: 'INACTIVE' } } },
        { name: 'qrContent', label: 'Isi QR Code', type: 'text', colSpan: 3, placeholder: 'URL atau ID Struk' },
    ];

    const triggerIcon = () => {
        if (!printer.isConnected) return <Printer className="h-[18px] w-[18px] text-muted-foreground/60" />;
        if (printer.connectionType === "usb") return <Usb className="h-[18px] w-[18px] text-primary" />;
        return <BluetoothConnected className="h-[18px] w-[18px] text-primary" />;
    };

    const navItems = [
        { key: "connection" as const, icon: <PlugZap className="w-4 h-4" />, label: "Koneksi Printer" },
        { key: "format" as const, icon: <Layout className="w-4 h-4" />, label: "Format Struk" },
    ];

    return (
        <>
            <Button variant="ghost" size="icon" onClick={() => setOpen(true)}
                title={printer.isConnected ? `Terhubung: ${printer.deviceName}` : "Pengaturan Printer"}
                className="relative h-9 w-9 rounded-md hover:bg-muted/50">
                {triggerIcon()}
                {printer.isConnected && (
                    <span className="absolute right-2 top-2 flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                )}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="p-0 sm:max-w-4xl overflow-hidden rounded-md border-border/80 shadow-2xl">
                    {/* Hidden for accessibility */}
                    <DialogTitle className="sr-only">Pengaturan Printer</DialogTitle>
                    <DialogDescription className="sr-only">Kelola koneksi printer dan format struk</DialogDescription>

                    <div className="flex h-[600px] w-full">
                        {/* Sidebar */}
                        <aside className="w-[220px] shrink-0 border-r border-border/40 bg-muted/20 flex flex-col">
                            <div className="px-6 py-8">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                                    <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">Pengaturan</h2>
                                </div>
                                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest">Printer & Struk</p>
                            </div>

                            <nav className="flex flex-col gap-1 px-3">
                                {navItems.map(({ key, icon, label }) => (
                                    <button
                                        key={key}
                                        onClick={() => setActiveTab(key)}
                                        className={cn(
                                            "flex w-full items-center gap-3 px-4 py-3 rounded-md transition-all text-left",
                                            "text-[10px] font-bold uppercase tracking-widest",
                                            activeTab === key
                                                ? "bg-background text-primary shadow-sm ring-1 ring-border/20"
                                                : "text-muted-foreground hover:bg-background/60 hover:text-foreground"
                                        )}
                                    >
                                        {icon}
                                        {label}
                                    </button>
                                ))}
                            </nav>

                            <div className="mt-auto p-6">
                                <div className={cn(
                                    "flex items-center justify-center gap-2 px-3 py-2.5 rounded-md border border-border/40 bg-background/50",
                                    printer.isConnected ? "text-emerald-600" : "text-muted-foreground/40"
                                )}>
                                    <StatusDot connected={printer.isConnected} />
                                    <span className="text-[9px] font-bold uppercase tracking-widest">
                                        Status: {printer.isConnected ? "Online" : "Offline"}
                                    </span>
                                </div>
                            </div>
                        </aside>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto bg-background">
                            {/* Connection Tab */}
                            {activeTab === "connection" && (
                                <div className="p-10">
                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-foreground">Koneksi Perangkat</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Kelola koneksi printer Bluetooth atau USB Anda.</p>
                                    </div>

                                    <div className="space-y-8">
                                        {printer.isConnecting && (
                                            <div className="flex flex-col items-center gap-6 rounded-md border border-dashed border-border/60 bg-muted/5 py-16 text-center">
                                                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/5">
                                                    <BluetoothSearching className="h-10 w-10 text-primary animate-pulse" />
                                                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">Mencari Perangkat…</p>
                                                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Pilih printer pada dialog sistem browser</p>
                                                </div>
                                                <Button variant="outline" size="sm" className="h-10 px-8 font-bold text-[10px] uppercase tracking-widest" onClick={() => printer.disconnect()}>
                                                    Batalkan
                                                </Button>
                                            </div>
                                        )}

                                        {!printer.isConnecting && printer.isConnected && (
                                            <div className="space-y-6">
                                                <div className="rounded-md border border-border/60 bg-muted/20 p-6">
                                                    <div className="flex items-center justify-between mb-6">
                                                        <div className="flex items-center gap-4">
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-md border border-border/40 bg-background text-primary">
                                                                {printer.connectionType === "usb" ? <Usb className="h-6 w-6" /> : <BluetoothConnected className="h-6 w-6" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-base font-bold text-foreground leading-none mb-1.5">{printer.deviceName}</p>
                                                                <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-2">
                                                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                                                    Tersambung via {printer.connectionType}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <Button variant="ghost" size="icon" onClick={() => printer.disconnect()} className="h-9 w-9 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10">
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    <Separator className="bg-border/40 mb-6" />
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <Button variant="outline" className="h-11 font-bold text-[10px] uppercase tracking-widest bg-background" onClick={() => printer.refreshSavedDevices()}>
                                                            <RefreshCw className="w-4 h-4 mr-2" /> Test Print
                                                        </Button>
                                                        <Button variant="outline" className="h-11 font-bold text-[10px] uppercase tracking-widest bg-background" onClick={() => setActiveTab("format")}>
                                                            <Settings2 className="w-4 h-4 mr-2" /> Format
                                                        </Button>
                                                    </div>
                                                </div>
                                                <Button variant="outline" className="w-full h-12 font-bold text-[10px] uppercase tracking-[0.15em] border-dashed" onClick={() => printer.disconnect()}>
                                                    <PlugZap className="mr-2 h-4 w-4" /> Ganti Perangkat Printer
                                                </Button>
                                            </div>
                                        )}

                                        {!printer.isConnecting && !printer.isConnected && (
                                            <div className="space-y-8">
                                                {hasSaved && (
                                                    <div className="space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">Perangkat Tersimpan</p>
                                                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground/40 hover:text-primary" onClick={() => printer.refreshSavedDevices()}>
                                                                <RefreshCw className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                        <div className="grid grid-cols-1 gap-2">
                                                            {printer.savedBtDevices.map((d, i) => (
                                                                <DeviceRow key={`bt-${i}`} icon={<Bluetooth className="h-4 w-4" />} label={d.name || "Unknown Device"} onClick={() => printer.connectToKnownBt(d)} type="bluetooth" />
                                                            ))}
                                                            {printer.savedUsbDevices.map((d, i) => (
                                                                <DeviceRow key={`usb-${i}`} icon={<Usb className="h-4 w-4" />} label={d.productName || "USB Printer"} onClick={() => printer.connectToKnownUsb(d)} type="usb" />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="space-y-4">
                                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">Hubungkan Baru</p>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <ConnectCard icon={<Bluetooth className="h-6 w-6" />} label="Bluetooth" sub={printer.isBluetoothSupported ? "Wireless Mode" : "Not Supported"} onClick={() => printer.connect()} disabled={!printer.isBluetoothSupported} />
                                                        <ConnectCard icon={<Usb className="h-6 w-6" />} label="USB / Kabel" sub={printer.isUsbSupported ? "Direct Cable" : "Not Supported"} onClick={() => printer.connectUsb()} disabled={!printer.isUsbSupported} />
                                                    </div>
                                                </div>

                                                {!printer.isBluetoothSupported && !printer.isUsbSupported && (
                                                    <div className="flex items-start gap-4 rounded-md bg-destructive/5 border border-destructive/20 px-5 py-4 text-destructive">
                                                        <WifiOff className="h-5 w-5 shrink-0 mt-0.5" />
                                                        <p className="text-[10px] font-bold uppercase tracking-wide leading-relaxed">
                                                            Browser ini tidak mendukung Web Bluetooth atau WebUSB. Silakan gunakan Chrome atau Edge versi terbaru.
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Format Tab */}
                            {activeTab === "format" && (
                                <div className="p-10">
                                    <div className="mb-8">
                                        <h3 className="text-lg font-bold text-foreground">Format Struk</h3>
                                        <p className="text-xs text-muted-foreground mt-1">Atur tampilan logo dan ukuran kertas struk.</p>
                                    </div>

                                    {isFetching ? (
                                        <div className="flex flex-col items-center justify-center py-24 gap-4">
                                            <Loader2 className="h-10 w-10 animate-spin text-primary/40" />
                                            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Memuat Pengaturan…</p>
                                        </div>
                                    ) : (
                                        <ReusableForm<UpdateReceiptSettingValues>
                                            key={open ? 'open' : 'closed'}
                                            defaultValues={receiptDefaultValues}
                                            gridCols={6}
                                            onSubmit={handleReceiptSubmit}
                                            fields={receiptFields}
                                            submitText={isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
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