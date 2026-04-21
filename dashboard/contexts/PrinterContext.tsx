"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

const BT_OPTIONAL_SERVICES = [
    "000018f0-0000-1000-8000-00805f9b34fb",
    "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
    "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    "00001101-0000-1000-8000-00805f9b34fb",
    "0000fee7-0000-1000-8000-00805f9b34fb",
    "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
    "0000ffe0-0000-1000-8000-00805f9b34fb",
];

interface PrinterContextValue {
    isConnected: boolean;
    isConnecting: boolean;
    connectionType: "bluetooth" | "usb" | null;
    deviceName: string | null;
    isBluetoothSupported: boolean;
    isUsbSupported: boolean;
    savedBtDevices: BluetoothDevice[];
    savedUsbDevices: USBDevice[];
    connect: () => Promise<void>;
    connectUsb: () => Promise<void>;
    connectToKnownBt: (device: BluetoothDevice) => Promise<void>;
    connectToKnownUsb: (device: USBDevice) => Promise<void>;
    disconnect: () => Promise<void>;
    refreshSavedDevices: () => Promise<void>;
    printRaw: (data: Uint8Array) => Promise<boolean>;
}

const PrinterContext = createContext<PrinterContextValue | null>(null);

export function usePrinterContext() {
    const ctx = useContext(PrinterContext);
    if (!ctx) throw new Error("usePrinterContext must be used within PrinterProvider");
    return ctx;
}

async function resolveGATTCharacteristic(
    device: BluetoothDevice
): Promise<BluetoothRemoteGATTCharacteristic> {
    const server = await device.gatt?.connect();
    if (!server) throw new Error("Gagal terhubung ke GATT Server.");

    const services = await server.getPrimaryServices();
    for (const service of services) {
        try {
            const chars = await service.getCharacteristics();
            const writeChar = chars.find(
                (c) => c.properties.write || c.properties.writeWithoutResponse
            );
            if (writeChar) return writeChar;
        } catch {
            continue;
        }
    }
    throw new Error("Tidak menemukan characteristic write pada printer ini.");
}

async function claimUsbPrinter(
    device: USBDevice
): Promise<{ endpointNumber: number }> {
    await device.open();
    if (device.configuration === null) await device.selectConfiguration(1);

    const iface =
        device.configuration?.interfaces.find(
            (i) => i.alternates[0]?.interfaceClass === 7
        ) ?? device.configuration?.interfaces[0];

    if (!iface) throw new Error("Interface printer tidak ditemukan.");
    await device.claimInterface(iface.interfaceNumber);

    const endpoint = iface.alternates[0].endpoints.find((e) => e.direction === "out");
    if (!endpoint) throw new Error("Endpoint OUT tidak ditemukan.");

    return { endpointNumber: endpoint.endpointNumber };
}

export function PrinterProvider({ children }: { children: React.ReactNode }) {
    const [btDevice, setBtDevice] = useState<BluetoothDevice | null>(null);
    const [characteristic, setCharacteristic] =
        useState<BluetoothRemoteGATTCharacteristic | null>(null);
    const [usbDevice, setUsbDevice] = useState<USBDevice | null>(null);
    const [usbEndpoint, setUsbEndpoint] = useState<number | null>(null);
    const [connectionType, setConnectionType] = useState<"bluetooth" | "usb" | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isBluetoothSupported, setIsBluetoothSupported] = useState(false);
    const [isUsbSupported, setIsUsbSupported] = useState(false);
    const [savedBtDevices, setSavedBtDevices] = useState<BluetoothDevice[]>([]);
    const [savedUsbDevices, setSavedUsbDevices] = useState<USBDevice[]>([]);

    const clearState = useCallback(() => {
        setBtDevice(null);
        setCharacteristic(null);
        setUsbDevice(null);
        setUsbEndpoint(null);
        setConnectionType(null);
    }, []);

    const handleDisconnected = useCallback(() => {
        clearState();
        toast.info("Printer terputus.");
    }, [clearState]);

    const refreshSavedDevices = useCallback(async () => {
        if (typeof window === "undefined") return;
        try {
            if (navigator.bluetooth?.getDevices) {
                setSavedBtDevices(await navigator.bluetooth.getDevices());
            }
        } catch (e) {
            console.warn("BT getDevices:", e);
        }
        try {
            if (navigator.usb?.getDevices) {
                setSavedUsbDevices(await navigator.usb.getDevices());
            }
        } catch (e) {
            console.warn("USB getDevices:", e);
        }
    }, []);

    useEffect(() => {
        if (typeof window === "undefined") return;
        setIsBluetoothSupported(!!navigator.bluetooth);
        setIsUsbSupported(!!navigator.usb);
        refreshSavedDevices();
    }, [refreshSavedDevices]);

    const connect = async () => {
        if (!navigator.bluetooth) {
            toast.error("Browser tidak mendukung Web Bluetooth.");
            return;
        }
        setIsConnecting(true);
        try {
            const device = await navigator.bluetooth.requestDevice({
                acceptAllDevices: true,
                optionalServices: BT_OPTIONAL_SERVICES,
            });
            device.addEventListener("gattserverdisconnected", handleDisconnected);
            const char = await resolveGATTCharacteristic(device);
            setBtDevice(device);
            setCharacteristic(char);
            setConnectionType("bluetooth");
            toast.success(`Terhubung ke ${device.name || "Printer"}`);
        } catch (err: any) {
            if (err.name !== "NotFoundError") toast.error(`Bluetooth gagal: ${err.message}`);
        } finally {
            setIsConnecting(false);
            refreshSavedDevices();
        }
    };

    const connectToKnownBt = async (device: BluetoothDevice) => {
        setIsConnecting(true);
        try {
            device.addEventListener("gattserverdisconnected", handleDisconnected);
            const char = await resolveGATTCharacteristic(device);
            setBtDevice(device);
            setCharacteristic(char);
            setConnectionType("bluetooth");
            toast.success(`Terhubung ke ${device.name || "Printer"}`);
        } catch (err: any) {
            toast.error(`Gagal reconnect: ${err.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const connectUsb = async () => {
        if (!navigator.usb) {
            toast.error("Browser tidak mendukung WebUSB.");
            return;
        }
        setIsConnecting(true);
        try {
            const device = await navigator.usb.requestDevice({ filters: [] });
            const { endpointNumber } = await claimUsbPrinter(device);
            setUsbDevice(device);
            setUsbEndpoint(endpointNumber);
            setConnectionType("usb");
            toast.success(`Terhubung ke ${device.productName || "USB Printer"}`);
        } catch (err: any) {
            if (err.name !== "NotFoundError") toast.error(`USB gagal: ${err.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const connectToKnownUsb = async (device: USBDevice) => {
        setIsConnecting(true);
        try {
            const { endpointNumber } = await claimUsbPrinter(device);
            setUsbDevice(device);
            setUsbEndpoint(endpointNumber);
            setConnectionType("usb");
            toast.success(`Terhubung ke ${device.productName || "USB Printer"}`);
        } catch (err: any) {
            toast.error(`Gagal reconnect USB: ${err.message}`);
        } finally {
            setIsConnecting(false);
        }
    };

    const disconnect = useCallback(async () => {
        try {
            if (connectionType === "bluetooth" && btDevice?.gatt?.connected) {
                btDevice.gatt.disconnect();
            } else if (connectionType === "usb" && usbDevice) {
                await usbDevice.close();
            }
        } catch (e) {
            console.error("Disconnect error:", e);
        } finally {
            clearState();
            toast.info("Printer diputus.");
        }
    }, [connectionType, btDevice, usbDevice, clearState]);

    const printRaw = async (data: Uint8Array): Promise<boolean> => {
        if (connectionType === "bluetooth" && characteristic) {
            try {
                const CHUNK = 512;
                for (let i = 0; i < data.length; i += CHUNK) {
                    await characteristic.writeValue(data.slice(i, i + CHUNK));
                    await new Promise((r) => setTimeout(r, 10));
                }
                return true;
            } catch (err: any) {
                toast.error(`Gagal print (BT): ${err.message}`);
                return false;
            }
        }

        if (connectionType === "usb" && usbDevice && usbEndpoint !== null) {
            try {
                await usbDevice.transferOut(usbEndpoint, data as any);
                return true;
            } catch (err: any) {
                toast.error(`Gagal print (USB): ${err.message}`);
                return false;
            }
        }

        toast.error("Printer tidak terhubung.");
        return false;
    };

    const deviceName =
        connectionType === "bluetooth"
            ? (btDevice?.name ?? "BT Printer")
            : connectionType === "usb"
                ? (usbDevice?.productName ?? "USB Printer")
                : null;

    return (
        <PrinterContext.Provider
            value={{
                isConnected: !!connectionType,
                isConnecting,
                connectionType,
                deviceName,
                isBluetoothSupported,
                isUsbSupported,
                savedBtDevices,
                savedUsbDevices,
                connect,
                connectUsb,
                connectToKnownBt,
                connectToKnownUsb,
                disconnect,
                refreshSavedDevices,
                printRaw,
            }}
        >
            {children}
        </PrinterContext.Provider>
    );
}