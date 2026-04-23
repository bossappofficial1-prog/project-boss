"use client";

import React, { useState } from "react";
import {
    Bluetooth,
    BluetoothConnected,
    BluetoothSearching,
    Usb,
    Printer,
    RefreshCw,
    X,
    PlugZap,
    WifiOff,
    CheckCircle2,
    Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { usePrinterContext } from "@/contexts/PrinterContext";
import { cn } from "@/lib/utils";

function StatusDot({ connected }: { connected: boolean }) {
    return (
        <span className="relative flex h-1.5 w-1.5">
            {connected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
            )}
            <span
                className={cn(
                    "relative inline-flex h-1.5 w-1.5 rounded-full",
                    connected ? "bg-emerald-500" : "bg-muted-foreground/30"
                )}
            />
        </span>
    );
}

function DeviceRow({
    icon,
    label,
    onClick,
    type,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    type: "bluetooth" | "usb";
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group flex w-full items-center justify-between rounded-md border border-border/60 bg-muted/20 px-4 py-3.5",
                "transition-all duration-200 hover:border-primary/40 hover:bg-muted/40",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40"
            )}
        >
            <div className="flex items-center gap-3">
                <div className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-md border border-border/40",
                    type === "bluetooth" ? "bg-blue-500/10 text-blue-500" : "bg-emerald-500/10 text-emerald-500"
                )}>
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

function ConnectCard({
    icon,
    label,
    sub,
    onClick,
    disabled,
}: {
    icon: React.ReactNode;
    label: string;
    sub: string;
    onClick: () => void;
    disabled?: boolean;
}) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={cn(
                "group flex flex-col items-start gap-4 rounded-md border border-border/60 bg-muted/20 p-5 text-left",
                "transition-all duration-200 hover:border-primary/40 hover:bg-muted/40",
                "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary/40",
                "disabled:cursor-not-allowed disabled:opacity-40"
            )}
        >
            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/40 bg-background text-muted-foreground transition-colors group-hover:text-primary group-hover:border-primary/20">
                {icon}
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">{label}</p>
                <p className="mt-1 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-tight">{sub}</p>
            </div>
        </button>
    );
}

export function PrinterSettingDialog() {
    const printer = usePrinterContext();
    const [open, setOpen] = useState(false);

    const hasSaved = printer.savedBtDevices.length > 0 || printer.savedUsbDevices.length > 0;

    const triggerIcon = () => {
        if (!printer.isConnected)
            return <Printer className="h-[18px] w-[18px] text-muted-foreground/60" />;
        if (printer.connectionType === "usb")
            return <Usb className="h-[18px] w-[18px] text-primary" />;
        return <BluetoothConnected className="h-[18px] w-[18px] text-primary" />;
    };

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                title={printer.isConnected ? `Terhubung: ${printer.deviceName}` : "Printer"}
                className="relative h-9 w-9 rounded-md hover:bg-muted/50"
            >
                {triggerIcon()}
                {printer.isConnected && (
                    <span className="absolute right-2 top-2 flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                )}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="gap-0 p-0 sm:max-w-md overflow-hidden rounded-md border-border/80 shadow-2xl">
                    <DialogHeader className="flex flex-row items-center justify-between border-b border-border/40 px-6 py-5 space-y-0">
                        <div className="flex items-center gap-4">
                            <div className="w-1 h-8 bg-primary rounded-full" />
                            <div>
                                <DialogTitle className="text-sm font-bold uppercase tracking-[0.15em] leading-none">
                                    Printer Kasir
                                </DialogTitle>
                                <DialogDescription className="mt-1.5 text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">
                                    Pengaturan Koneksi Cetak
                                </DialogDescription>
                            </div>
                        </div>

                        <Badge variant="outline" className={cn(
                            "text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-sm border-0",
                            printer.isConnected ? "bg-emerald-500/10 text-emerald-600" : "bg-muted/50 text-muted-foreground/60"
                        )}>
                            <StatusDot connected={printer.isConnected} />
                            <span className="ml-2">{printer.isConnected ? "Connected" : "Disconnected"}</span>
                        </Badge>
                    </DialogHeader>

                    <div className="p-6 space-y-6">
                        {/* State: Connecting */}
                        {printer.isConnecting && (
                            <div className="flex flex-col items-center gap-5 rounded-md border border-dashed border-border/60 bg-muted/10 py-10 text-center animate-in fade-in zoom-in-95">
                                <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary/5">
                                    <BluetoothSearching className="h-8 w-8 text-primary animate-pulse" />
                                    <div className="absolute inset-0 animate-ping rounded-full bg-primary/5" />
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground">Mencari Perangkat…</p>
                                    <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest">Pilih printer pada dialog sistem browser</p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 px-6 font-bold text-[10px] uppercase tracking-widest"
                                    onClick={() => printer.disconnect()}
                                >
                                    Batalkan
                                </Button>
                            </div>
                        )}

                        {/* State: Connected */}
                        {!printer.isConnecting && printer.isConnected && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                                <div className="rounded-md border border-border/60 bg-muted/20 p-5">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 items-center justify-center rounded-md border border-border/40 bg-background text-primary">
                                                {printer.connectionType === "usb" ? <Usb className="h-5 w-5" /> : <BluetoothConnected className="h-5 w-5" />}
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground leading-none mb-1">{printer.deviceName}</p>
                                                <p className="text-[9px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1.5">
                                                    <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                                                    Tersambung via {printer.connectionType}
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => printer.disconnect()}
                                            className="h-8 w-8 rounded-md text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <Separator className="bg-border/40 mb-4" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button variant="outline" size="sm" className="h-10 font-bold text-[9px] uppercase tracking-widest bg-background" onClick={() => printer.refreshSavedDevices()}>
                                            <RefreshCw className="w-3 h-3 mr-2" /> Test Print
                                        </Button>
                                        <Button variant="outline" size="sm" className="h-10 font-bold text-[9px] uppercase tracking-widest bg-background" onClick={() => printer.disconnect()}>
                                            <Settings2 className="w-3 h-3 mr-2" /> Konfigurasi
                                        </Button>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full h-11 font-bold text-[10px] uppercase tracking-[0.15em] border-dashed"
                                    onClick={() => printer.disconnect()}
                                >
                                    <PlugZap className="mr-2 h-4 w-4" />
                                    Ganti Perangkat Printer
                                </Button>
                            </div>
                        )}

                        {/* State: Idle */}
                        {!printer.isConnecting && !printer.isConnected && (
                            <div className="space-y-8 animate-in fade-in">
                                {/* Saved devices */}
                                {hasSaved && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                                                Perangkat Tersimpan
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-muted-foreground/40 hover:text-primary"
                                                onClick={() => printer.refreshSavedDevices()}
                                            >
                                                <RefreshCw className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {printer.savedBtDevices.map((d, i) => (
                                                <DeviceRow
                                                    key={`bt-${i}`}
                                                    icon={<Bluetooth className="h-4 w-4" />}
                                                    label={d.name || "Unknown Device"}
                                                    onClick={() => printer.connectToKnownBt(d)}
                                                    type="bluetooth"
                                                />
                                            ))}
                                            {printer.savedUsbDevices.map((d, i) => (
                                                <DeviceRow
                                                    key={`usb-${i}`}
                                                    icon={<Usb className="h-4 w-4" />}
                                                    label={d.productName || "USB Printer"}
                                                    onClick={() => printer.connectToKnownUsb(d)}
                                                    type="usb"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* New connection */}
                                <div className="space-y-3">
                                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">
                                        Hubungkan Baru
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <ConnectCard
                                            icon={<Bluetooth className="h-5 w-5" />}
                                            label="Bluetooth"
                                            sub={printer.isBluetoothSupported ? "Wireless Mode" : "Not Supported"}
                                            onClick={() => printer.connect()}
                                            disabled={!printer.isBluetoothSupported}
                                        />
                                        <ConnectCard
                                            icon={<Usb className="h-5 w-5" />}
                                            label="USB / Kabel"
                                            sub={printer.isUsbSupported ? "Direct Cable" : "Not Supported"}
                                            onClick={() => printer.connectUsb()}
                                            disabled={!printer.isUsbSupported}
                                        />
                                    </div>
                                </div>

                                {/* Support note */}
                                {!printer.isBluetoothSupported && !printer.isUsbSupported && (
                                    <div className="flex items-start gap-3 rounded-md bg-destructive/5 border border-destructive/20 px-4 py-3.5 text-destructive">
                                        <WifiOff className="h-4 w-4 shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-bold uppercase tracking-wide leading-relaxed">
                                            Browser ini tidak mendukung Web Bluetooth atau WebUSB. Silakan gunakan Chrome atau Edge versi terbaru.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}