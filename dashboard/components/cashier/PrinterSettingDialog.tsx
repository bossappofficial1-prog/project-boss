import React, { useState } from "react";
import {
    Bluetooth,
    BluetoothConnected,
    BluetoothSearching,
    Usb,
    Printer,
    RefreshCw,
    X,
    Plug,
    PlugZap,
    WifiOff,
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
        <span className="relative flex h-2 w-2">
            {connected && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
            )}
            <span
                className={cn(
                    "relative inline-flex h-2 w-2 rounded-full",
                    connected ? "bg-primary" : "bg-muted-foreground/30"
                )}
            />
        </span>
    );
}

function DeviceRow({
    icon,
    label,
    onClick,
    accent,
}: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
    accent: "blue" | "green";
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3",
                "transition-all duration-200 hover:border-primary/40 hover:bg-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
        >
            <div className="flex items-center gap-3">
                <span
                    className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-md transition-colors duration-200",
                        accent === "blue"
                            ? "bg-blue-500/10 text-blue-500 group-hover:bg-blue-500 group-hover:text-white dark:bg-blue-500/15"
                            : "bg-emerald-500/10 text-emerald-500 group-hover:bg-emerald-500 group-hover:text-white dark:bg-emerald-500/15"
                    )}
                >
                    {icon}
                </span>
                <span className="text-sm font-medium">{label}</span>
            </div>
            <Badge variant="secondary" className="text-[10px] font-semibold">
                Connect
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
                "group flex flex-col items-center gap-3 rounded-xl border-2 border-border bg-card p-6",
                "transition-all duration-200 hover:border-primary/50 hover:bg-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-not-allowed disabled:opacity-40"
            )}
        >
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted transition-colors duration-200 group-hover:bg-primary group-hover:text-primary-foreground">
                {icon}
            </span>
            <div className="text-center">
                <p className="text-sm font-bold uppercase tracking-wide">{label}</p>
                <p className="mt-0.5 text-[11px] text-muted-foreground">{sub}</p>
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
            return <Printer className="h-[18px] w-[18px] text-muted-foreground" />;
        if (printer.connectionType === "usb")
            return <Usb className="h-[18px] w-[18px] text-primary" />;
        return <BluetoothConnected className="h-[18px] w-[18px] text-primary" />;
    };

    return (
        <>
            {/* Trigger */}
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(true)}
                title={printer.isConnected ? `Terhubung: ${printer.deviceName}` : "Printer"}
                className="relative"
            >
                {triggerIcon()}
                {printer.isConnected && (
                    <span className="absolute right-1.5 top-1.5 flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
                    </span>
                )}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="gap-0 p-0 sm:max-w-lg overflow-hidden">
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-border px-6 py-5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                                <Printer className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-base font-bold leading-none">
                                    Printer
                                </DialogTitle>
                                <DialogDescription className="mt-0.5 text-xs text-muted-foreground">
                                    Kelola koneksi printer kasir
                                </DialogDescription>
                            </div>
                        </div>

                        {/* Status badge */}
                        <div className="flex items-center gap-2">
                            <StatusDot connected={printer.isConnected} />
                            <span className="text-xs text-muted-foreground">
                                {printer.isConnected ? printer.deviceName : "Tidak terhubung"}
                            </span>
                        </div>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-6">
                        {/* State: Connecting */}
                        {printer.isConnecting && (
                            <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border bg-muted/30 py-12 text-center">
                                <div className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                                    <BluetoothSearching className="h-7 w-7 animate-pulse text-primary" />
                                    <span className="absolute inset-0 animate-ping rounded-full bg-primary/10" />
                                </div>
                                <div>
                                    <p className="font-semibold">Mencari Printer…</p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Pilih printer pada dialog browser
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => printer.disconnect()}
                                >
                                    Batalkan
                                </Button>
                            </div>
                        )}

                        {/* State: Connected */}
                        {!printer.isConnecting && printer.isConnected && (
                            <div className="space-y-4">
                                <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                                            {printer.connectionType === "usb" ? (
                                                <Usb className="h-5 w-5 text-primary" />
                                            ) : (
                                                <BluetoothConnected className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-sm font-semibold leading-none">
                                                {printer.deviceName}
                                            </p>
                                            <p className="mt-1 text-xs text-muted-foreground uppercase tracking-wider">
                                                {printer.connectionType}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => printer.disconnect()}
                                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => printer.disconnect()}
                                >
                                    <PlugZap className="mr-2 h-4 w-4" />
                                    Ganti Printer
                                </Button>
                            </div>
                        )}

                        {/* State: Idle */}
                        {!printer.isConnecting && !printer.isConnected && (
                            <div className="space-y-6">
                                {/* Saved devices */}
                                {hasSaved && (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                                Perangkat Tersimpan
                                            </p>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6"
                                                onClick={() => printer.refreshSavedDevices()}
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {printer.savedBtDevices.map((d, i) => (
                                                <DeviceRow
                                                    key={`bt-${i}`}
                                                    icon={<Bluetooth className="h-4 w-4" />}
                                                    label={d.name || "Unknown Device"}
                                                    onClick={() => printer.connectToKnownBt(d)}
                                                    accent="blue"
                                                />
                                            ))}
                                            {printer.savedUsbDevices.map((d, i) => (
                                                <DeviceRow
                                                    key={`usb-${i}`}
                                                    icon={<Usb className="h-4 w-4" />}
                                                    label={d.productName || "USB Printer"}
                                                    onClick={() => printer.connectToKnownUsb(d)}
                                                    accent="green"
                                                />
                                            ))}
                                        </div>
                                        <Separator />
                                    </div>
                                )}

                                {/* New connection */}
                                <div className="space-y-3">
                                    <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                                        Tambah Baru
                                    </p>
                                    <div className="grid grid-cols-2 gap-3">
                                        <ConnectCard
                                            icon={<Bluetooth className="h-5 w-5" />}
                                            label="Bluetooth"
                                            sub={printer.isBluetoothSupported ? "Wireless" : "Tidak Didukung"}
                                            onClick={() => printer.connect()}
                                            disabled={!printer.isBluetoothSupported}
                                        />
                                        <ConnectCard
                                            icon={<Usb className="h-5 w-5" />}
                                            label="USB"
                                            sub={printer.isUsbSupported ? "Kabel Langsung" : "Tidak Didukung"}
                                            onClick={() => printer.connectUsb()}
                                            disabled={!printer.isUsbSupported}
                                        />
                                    </div>
                                </div>

                                {/* Support note */}
                                {!printer.isBluetoothSupported && !printer.isUsbSupported && (
                                    <div className="flex items-center gap-3 rounded-lg bg-destructive/10 px-4 py-3 text-destructive">
                                        <WifiOff className="h-4 w-4 shrink-0" />
                                        <p className="text-xs">
                                            Browser tidak mendukung Web Bluetooth / WebUSB. Gunakan Chrome/Edge terbaru.
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