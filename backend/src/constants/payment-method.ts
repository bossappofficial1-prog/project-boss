import { config } from "../config";

export const paymentMethod = [
    {
        id: "qris",
        name: "Qris",
        type: "qris",
        description: "Bayar pakai QRIS (ShopeePay, GoPay, OVO, Dana, LinkAja, dll)",
        image_url: `${config.BASE_URL}/icons/qris.png`
    },
    {
        id: "bca-va",
        name: "BCA Virtual Account",
        type: "va",
        description: "Bayar via transfer Virtual Account BCA",
        image_url: `${config.BASE_URL}/icons/bca-va.png`
    },
    {
        id: "bni-va",
        name: "BNI Virtual Account",
        type: "va",
        description: "Bayar via transfer Virtual Account BNI",
        image_url: `${config.BASE_URL}/icons/bni-va.png`
    },
    {
        id: "bri-va",
        name: "BRI Virtual Account",
        type: "va",
        description: "Bayar via transfer Virtual Account BRI",
        image_url: `${config.BASE_URL}/icons/bri-va.png`
    },
    {
        id: "mandiri-va",
        name: "Mandiri Virtual Account",
        type: "va",
        description: "Bayar via transfer Virtual Account Mandiri",
        image_url: `${config.BASE_URL}/icons/mandiri-va.png`
    },
    {
        id: "permata-va",
        name: "Permata Virtual Account",
        type: "va",
        description: "Bayar via transfer Virtual Account Permata",
        image_url: `${config.BASE_URL}/icons/permata-va.png`
    },
] as const

// Type untuk payment method ID
export type PaymentMethodId = typeof paymentMethod[number]['id'];

// Type untuk payment method type
export type PaymentMethodType = typeof paymentMethod[number]['type'];

// Mapping dari ID ke type yang digunakan di Midtrans
export const paymentMethodMapping: Record<PaymentMethodId, string> = {
    "qris": "qris",
    "bca-va": "bca_va",
    "bni-va": "bni_va",
    "bri-va": "bri_va",
    "mandiri-va": "mandiri_va",
    "permata-va": "permata_va"
} as const

// Type untuk Midtrans payment method
export type MidtransPaymentMethod = typeof paymentMethodMapping[keyof typeof paymentMethodMapping];

const payloadBody = {
    customer_details: {
        name: "name",
        phone: "phone"
    },
    item_details: [
        {
            productId: "",
            quantity: 0,
            outletId: ""
        }
    ]
};