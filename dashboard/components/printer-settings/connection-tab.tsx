import React from "react";
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
    Layout,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { usePrinterContext } from "@/contexts/PrinterContext";
import { StatusDot } from "./status-dot";
import { DeviceRow } from "./device-row";
import { ConnectCard } from "./connect-card";

export function ConnectionTab({
    printer,
    onSwitchToFormat,
}: {
    printer: ReturnType<typeof usePrinterContext>;
    onSwitchToFormat: () => void;
}) {
    const hasSaved =
        printer.savedBtDevices.length > 0 || printer.savedUsbDevices.length > 0;

    /* Searching / pairing in progress */
    if (printer.isConnecting) {
        return (
            <div className="flex flex-col items-center justify-center gap-5 py-16 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border/50 bg-muted/30">
                    <BluetoothSearching className="h-6 w-6 animate-pulse text-muted-foreground" />
                </div>
                <div className="space-y-1">
                    <p className="text-[13px] font-medium text-foreground">
                        Mencari perangkat…
                    </p>
                    <p className="text-[12px] text-muted-foreground">
                        Pilih printer pada dialog sistem browser
                    </p>
                </div>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-9 border-border/50 px-6 text-[12px]"
                    onClick={() => printer.disconnect()}
                >
                    Batalkan
                </Button>
            </div>
        );
    }

    /* Connected */
    if (printer.isConnected) {
        return (
            <div className="space-y-3">
                <div className="rounded-md border border-border/50 bg-muted/20 p-4">
                    {/* Device header */}
                    <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded border border-border/40 bg-background text-muted-foreground">
                                {printer.connectionType === "usb" ? (
                                    <Usb className="h-4 w-4" />
                                ) : (
                                    <BluetoothConnected className="h-4 w-4" />
                                )}
                            </div>
                            <div>
                                <p className="text-[14px] font-medium leading-none text-foreground">
                                    {printer.deviceName}
                                </p>
                                <p className="mt-1.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                                    <CheckCircle2 className="h-3.5 w-3.5 text-[#1D9E75]" />
                                    Tersambung via {printer.connectionType}
                                </p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => printer.disconnect()}
                            className="h-8 w-8 rounded text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                            aria-label="Putuskan koneksi"
                        >
                            <X className="h-3.5 w-3.5" />
                        </Button>
                    </div>

                    <Separator className="mb-4 bg-border/50" />

                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 border-border/50 text-[12px]"
                            onClick={() => printer.refreshSavedDevices()}
                        >
                            <Printer className="mr-1.5 h-3.5 w-3.5" />
                            Test print
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 border-border/50 text-[12px]"
                            onClick={onSwitchToFormat}
                        >
                            <Layout className="mr-1.5 h-3.5 w-3.5" />
                            Format struk
                        </Button>
                    </div>
                </div>

                <Button
                    variant="outline"
                    className="h-10 w-full border-dashed border-border/50 text-[12px] text-muted-foreground hover:text-foreground"
                    onClick={() => printer.disconnect()}
                >
                    <PlugZap className="mr-2 h-3.5 w-3.5" />
                    Ganti perangkat printer
                </Button>
            </div>
        );
    }

    /* Disconnected */
    return (
        <div className="space-y-6">
            {/* Saved devices */}
            {hasSaved && (
                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <p className="text-[12px] text-muted-foreground">
                            Perangkat tersimpan
                        </p>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-foreground"
                            onClick={() => printer.refreshSavedDevices()}
                            aria-label="Refresh daftar perangkat"
                        >
                            <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                    <div className="flex flex-col gap-2">
                        {printer.savedBtDevices.map((d, i) => (
                            <DeviceRow
                                key={`bt-${i}`}
                                icon={<Bluetooth className="h-3.5 w-3.5" />}
                                label={d.name || "Unknown device"}
                                type="bluetooth"
                                onClick={() => printer.connectToKnownBt(d)}
                            />
                        ))}
                        {printer.savedUsbDevices.map((d, i) => (
                            <DeviceRow
                                key={`usb-${i}`}
                                icon={<Usb className="h-3.5 w-3.5" />}
                                label={d.productName || "USB printer"}
                                type="usb"
                                onClick={() => printer.connectToKnownUsb(d)}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* New connection */}
            <div>
                <p className="mb-2 text-[12px] text-muted-foreground">
                    Hubungkan baru
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <ConnectCard
                        icon={<Bluetooth className="h-4 w-4" />}
                        label="Bluetooth"
                        sub={
                            printer.isBluetoothSupported ? "Mode nirkabel" : "Tidak didukung"
                        }
                        onClick={() => printer.connect()}
                        disabled={!printer.isBluetoothSupported}
                    />
                    <ConnectCard
                        icon={<Usb className="h-4 w-4" />}
                        label="USB / Kabel"
                        sub={
                            printer.isUsbSupported ? "Sambungan langsung" : "Tidak didukung"
                        }
                        onClick={() => printer.connectUsb()}
                        disabled={!printer.isUsbSupported}
                    />
                </div>
            </div>

            {/* Browser compatibility warning */}
            {!printer.isBluetoothSupported && !printer.isUsbSupported && (
                <div className="flex items-start gap-3 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3">
                    <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                    <p className="text-[12px] leading-relaxed text-destructive">
                        Browser ini tidak mendukung Web Bluetooth or WebUSB. Gunakan
                        Chrome atau Edge versi terbaru.
                    </p>
                </div>
            )}
        </div>
    );
}
