export const ROUTES_CART_DISABLED: string[] = ["/cart", "/payment/**", "/checkout", "/profile"]

export const CUSTOMER_SERVICE_NUMBER: string = "+6283180541892" as const

export const IMPORTANT_INFORMATION_PAYMENT = {
    success: {
        "id": [
            "Anda akan menerima notifikasi saat pesanan dikonfirmasi.",
            "Silakan datang ke outlet sesuai waktu yang dijadwalkan.",
            "Tunjukkan bukti pemesanan saat mengambil pesanan.",
        ],
        "en": [
            "You will receive a notification once your order is confirmed.",
            "Please visit the outlet at the scheduled time.",
            "Show your order confirmation when picking up your order.",
        ]
    },
    processing: {
        "id": [
            "Jangan tutup halaman ini sampai pembayaran selesai.",
            "Status akan diperbarui otomatis setelah pembayaran.",
            "Hubungi customer service jika ada kendala.",
        ],
        "en": [
            "Please don't close this page until the payment is complete.",
            "The status will update automatically once the payment is processed.",
            "Contact customer service if you encounter any issues.",
        ]
    },
    cancelled: {
        "id": [
            "Pesanan Anda belum diproses.",
            "Tidak ada biaya yang dikenakan.",
            "Anda dapat melanjutkan pembayaran kapan saja."
        ],
        "en": [
            "Your order has not been processed yet.",
            "No charges have been applied.",
            "You can continue the payment anytime.",
        ]
    },
    expired: {
        "id": [
            "Pembayaran harus diselesaikan dalam waktu yang ditentukan.",
            "Hal ini untuk menjaga keamanan transaksi.",
            "Virtual Account atau QR Code memiliki batas waktu aktif.",
            "Anda dapat membuat pembayaran baru dengan mudah"
        ],
        "en": [
            "Payments must be completed within the specified time.",
            "This is to ensure the security of your transaction.",
            "Virtual Accounts or QR Codes have an expiration time.",
            "You can easily create a new payment if needed."
        ]
    },
    pending: {
        id: [
            "Pembayaran sudah diterima dan sedang diverifikasi.",
            "Proses verifikasi biasanya memakan waktu 1-10 menit.",
            "Anda akan mendapat notifikasi saat pembayaran terkonfirmasi.",
            "Jangan lakukan pembayaran ulang."
        ],
        "en": [
            "Your payment has been received and is being verified.",
            "Verification usually takes 1-10 minutes.",
            "You will be notified once the payment is confirmed.",
            "Please do not make another payment."
        ]
    }
} as const

export type ImportantInformationPaymentType = typeof IMPORTANT_INFORMATION_PAYMENT
export type ImportantInformationType = keyof typeof IMPORTANT_INFORMATION_PAYMENT

export const LANGUAGES = [
    {
        key: "id",
        label: "Indonesia"
    },
    {
        key: "en",
        label: "English"
    }
] as const

export type LanguageType = typeof LANGUAGES[number]["key"]

export const STORAGE_PROFILE_KEY = "user_preferences";

export const DAY_NAMES = {
    "id": ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'],
    "en": ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
}