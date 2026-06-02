import { config } from "../config";

type ManualPaymentTypeLiteral = "QRIS_OFFLINE" | "OWNER_TRANSFER";

export const paymentMethod = [
  {
    id: "qris",
    name: "Qris",
    type: "qris",
    description: "Bayar pakai QRIS (ShopeePay, GoPay, OVO, Dana, LinkAja, dll)",
    image_url: `${config.BASE_URL}/icons/qris.png`,
    flow: "midtrans" as const,
    disable: config.NODE_ENV === "production" ? true : false,
  },
  {
    id: "bca-va",
    name: "BCA Virtual Account",
    type: "va",
    description: "Bayar via transfer Virtual Account BCA",
    image_url: `${config.BASE_URL}/icons/bca-va.png`,
    flow: "midtrans" as const,
    disable: config.NODE_ENV === "production" ? true : false,
  },
  {
    id: "bni-va",
    name: "BNI Virtual Account",
    type: "va",
    description: "Bayar via transfer Virtual Account BNI",
    image_url: `${config.BASE_URL}/icons/bni-va.png`,
    flow: "midtrans" as const,
    disable: config.NODE_ENV === "production" ? true : false,
  },
  {
    id: "bri-va",
    name: "BRI Virtual Account",
    type: "va",
    description: "Bayar via transfer Virtual Account BRI",
    image_url: `${config.BASE_URL}/icons/bri-va.png`,
    flow: "midtrans" as const,
    disable: config.NODE_ENV === "production" ? true : false,
  },
  {
    id: "mandiri-va",
    name: "Mandiri Virtual Account",
    type: "va",
    description: "Bayar via transfer Virtual Account Mandiri",
    image_url: `${config.BASE_URL}/icons/mandiri-va.png`,
    flow: "midtrans" as const,
    disable: config.NODE_ENV === "production" ? true : false,
  },
  {
    id: "permata-va",
    name: "Permata Virtual Account",
    type: "va",
    description: "Bayar via transfer Virtual Account Permata",
    image_url: `${config.BASE_URL}/icons/permata-va.png`,
    flow: "midtrans" as const,
    disable: config.NODE_ENV === "production" ? true : false, // Disable QRIS in production for now since belum ada QRIS statis yang dipasang di outlet
  },
  {
    id: "manual-qris",
    name: "QRIS",
    type: "manual",
    description:
      "Bayar dengan scan QR statis outlet lalu unggah bukti transfer",
    image_url: `${config.BASE_URL}/icons/qris.png`,
    flow: "manual" as const,
    manualType: "QRIS_OFFLINE" as ManualPaymentTypeLiteral,
    disable: false,
  },
  {
    id: "manual-transfer",
    name: "Transfer ke Rekening Owner",
    type: "manual",
    description:
      "Transfer langsung ke rekening owner dan unggah bukti pembayaran",
    image_url: `${config.BASE_URL}/icons/manual-transfer.png`,
    flow: "manual" as const,
    manualType: "OWNER_TRANSFER" as ManualPaymentTypeLiteral,
    disable: false,
  },
] as const;

// Type untuk payment method ID
export type PaymentMethodId = (typeof paymentMethod)[number]["id"];

// Type untuk payment method type
export type PaymentMethodType = (typeof paymentMethod)[number]["type"];

// Mapping dari ID ke type yang digunakan di Midtrans
export const paymentMethodMapping: Partial<Record<PaymentMethodId, string>> = {
  // "qris": "qris",
  // "bca-va": "bca_va",
  // "bni-va": "bni_va",
  // "bri-va": "bri_va",
  // "mandiri-va": "mandiri_va",
  // "permata-va": "permata_va"
} as const;

// Type untuk Midtrans payment method
export type MidtransPaymentMethod =
  (typeof paymentMethodMapping)[keyof typeof paymentMethodMapping];
