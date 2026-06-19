import { create } from 'zustand';
import { gooeyToast } from "goey-toast";

const BT_OPTIONAL_SERVICES = [
  "000018f0-0000-1000-8000-00805f9b34fb",
  "e7810a71-73ae-499d-8c15-faa9aef0c3f2",
  "49535343-fe7d-4ae5-8fa9-9fafd205e455",
  "00001101-0000-1000-8000-00805f9b34fb",
  "0000fee7-0000-1000-8000-00805f9b34fb",
  "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
  "0000ffe0-0000-1000-8000-00805f9b34fb",
];

export interface PrinterState {
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
  checkSupport: () => void;
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

export const usePrinterStore = create<PrinterState>((set, get) => ({
  isConnected: false,
  isConnecting: false,
  connectionType: null,
  deviceName: null,
  isBluetoothSupported: false,
  isUsbSupported: false,
  savedBtDevices: [],
  savedUsbDevices: [],

  checkSupport: () => {
    if (typeof window === "undefined") return;
    set({
      isBluetoothSupported: !!navigator.bluetooth,
      isUsbSupported: !!navigator.usb,
    });
    get().refreshSavedDevices();
  },

  refreshSavedDevices: async () => {
    if (typeof window === "undefined") return;
    try {
      if (navigator.bluetooth?.getDevices) {
        const devices = await navigator.bluetooth.getDevices();
        set({ savedBtDevices: devices });
      }
    } catch (e) {
      console.warn("BT getDevices:", e);
    }
    try {
      if (navigator.usb?.getDevices) {
        const devices = await navigator.usb.getDevices();
        set({ savedUsbDevices: devices });
      }
    } catch (e) {
      console.warn("USB getDevices:", e);
    }
  },

  connect: async () => {
    if (!navigator.bluetooth) {
      gooeyToast.error("Browser tidak mendukung Web Bluetooth.");
      return;
    }
    set({ isConnecting: true });
    try {
      const device = await navigator.bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: BT_OPTIONAL_SERVICES,
      });
      const char = await resolveGATTCharacteristic(device);
      set({
        connectionType: "bluetooth",
        deviceName: device.name || "BT Printer",
      });
      // Store device reference in a way we can access later
      (window as any).__btDevice = device;
      (window as any).__btCharacteristic = char;
      gooeyToast.success(`Terhubung ke ${device.name || "Printer"}`);
    } catch (err: any) {
      if (err.name !== "NotFoundError") gooeyToast.error(`Bluetooth gagal: ${err.message}`);
    } finally {
      set({ isConnecting: false });
      get().refreshSavedDevices();
    }
  },

  connectToKnownBt: async (device) => {
    set({ isConnecting: true });
    try {
      const char = await resolveGATTCharacteristic(device);
      set({
        connectionType: "bluetooth",
        deviceName: device.name || "BT Printer",
      });
      (window as any).__btDevice = device;
      (window as any).__btCharacteristic = char;
      gooeyToast.success(`Terhubung ke ${device.name || "Printer"}`);
    } catch (err: any) {
      gooeyToast.error(`Gagal reconnect: ${err.message}`);
    } finally {
      set({ isConnecting: false });
    }
  },

  connectUsb: async () => {
    if (!navigator.usb) {
      gooeyToast.error("Browser tidak mendukung WebUSB.");
      return;
    }
    set({ isConnecting: true });
    try {
      const device = await navigator.usb.requestDevice({ filters: [] });
      const { endpointNumber } = await claimUsbPrinter(device);
      set({
        connectionType: "usb",
        deviceName: device.productName || "USB Printer",
      });
      (window as any).__usbDevice = device;
      (window as any).__usbEndpoint = endpointNumber;
      gooeyToast.success(`Terhubung ke ${device.productName || "USB Printer"}`);
    } catch (err: any) {
      if (err.name !== "NotFoundError") gooeyToast.error(`USB gagal: ${err.message}`);
    } finally {
      set({ isConnecting: false });
    }
  },

  connectToKnownUsb: async (device) => {
    set({ isConnecting: true });
    try {
      const { endpointNumber } = await claimUsbPrinter(device);
      set({
        connectionType: "usb",
        deviceName: device.productName || "USB Printer",
      });
      (window as any).__usbDevice = device;
      (window as any).__usbEndpoint = endpointNumber;
      gooeyToast.success(`Terhubung ke ${device.productName || "USB Printer"}`);
    } catch (err: any) {
      gooeyToast.error(`Gagal reconnect USB: ${err.message}`);
    } finally {
      set({ isConnecting: false });
    }
  },

  disconnect: async () => {
    const { connectionType } = get();
    try {
      if (connectionType === "bluetooth") {
        const device = (window as any).__btDevice;
        if (device?.gatt?.connected) device.gatt.disconnect();
      } else if (connectionType === "usb") {
        const device = (window as any).__usbDevice;
        if (device) await device.close();
      }
    } catch (e) {
      console.error("Disconnect error:", e);
    } finally {
      set({
        isConnected: false,
        connectionType: null,
        deviceName: null,
      });
      delete (window as any).__btDevice;
      delete (window as any).__btCharacteristic;
      delete (window as any).__usbDevice;
      delete (window as any).__usbEndpoint;
      gooeyToast.info("Printer diputus.");
    }
  },

  printRaw: async (data: Uint8Array): Promise<boolean> => {
    const { connectionType } = get();

    if (connectionType === "bluetooth") {
      const characteristic = (window as any).__btCharacteristic;
      if (!characteristic) {
        gooeyToast.error("Printer tidak terhubung.");
        return false;
      }
      try {
        const CHUNK = 512;
        for (let i = 0; i < data.length; i += CHUNK) {
          await characteristic.writeValue(data.slice(i, i + CHUNK));
          await new Promise((r) => setTimeout(r, 10));
        }
        return true;
      } catch (err: any) {
        gooeyToast.error(`Gagal print (BT): ${err.message}`);
        return false;
      }
    }

    if (connectionType === "usb") {
      const device = (window as any).__usbDevice;
      const endpoint = (window as any).__usbEndpoint;
      if (!device || endpoint === null || endpoint === undefined) {
        gooeyToast.error("Printer tidak terhubung.");
        return false;
      }
      try {
        await device.transferOut(endpoint, data as any);
        return true;
      } catch (err: any) {
        gooeyToast.error(`Gagal print (USB): ${err.message}`);
        return false;
      }
    }

    gooeyToast.error("Printer tidak terhubung.");
    return false;
  },
}));
