import { FormFieldConfig } from "@/components/ui/reuseable-form";
import z from "zod";

const planFeaturesSchema = z.object({
    maxOutlets: z
        .number(`Batas outlet wajib diisi`)
        .int({ message: "Batas outlet harus berupa bilangan bulat" })
        .min(-1, {
            message: "Batas outlet minimal -1 (untuk unlimited) atau lebih",
        }),

    maxProducts: z
        .number("Batas produk wajib diisi")
        .int({ message: "Batas produk harus berupa bilangan bulat" })
        .min(-1, {
            message: "Batas produk minimal -1 (untuk unlimited) atau lebih",
        }),

    maxStaff: z
        .number("Batas staf wajib diisi")
        .int({ message: "Batas staf harus berupa bilangan bulat" })
        .min(-1, {
            message: "Batas staf minimal -1 (untuk unlimited) atau lebih",
        }),

    canExportReport: z.boolean("Izin ekspor laporan wajib ditentukan"),

    supportLevel: z.enum(["EMAIL", "WHATSAPP", "PRIORITY"], "Tingkat dukungan wajib dipilih"),
});

export const subscriptionPlanSchema = z.object({
    id: z.string().optional(),

    name: z
        .string("Nama paket wajib diisi")
        .min(3, {
            message: "Nama paket minimal 3 karakter",
        })
        .max(50, {
            message: "Nama paket maksimal 50 karakter",
        }),

    code: z
        .string("Kode paket wajib diisi")
        .min(2, {
            message: "Kode paket minimal 2 karakter",
        })
        .regex(/^[A-Z0-9_]+$/, {
            message:
                "Kode hanya boleh berisi huruf kapital, angka, dan garis bawah (_)",
        }),

    price: z
        .number("Harga wajib diisi")
        .min(0, {
            message: "Harga tidak boleh bernilai negatif",
        }),
    promo: z
        .number("Promo wajib diisi")
        .min(0, {
            message: "Harga tidak boleh bernilai negatif",
        })
        .optional(),

    durationDays: z
        .number("Durasi paket wajib diisi")
        .int({
            message: "Durasi paket harus berupa bilangan bulat",
        })
        .min(1, {
            message: "Durasi paket minimal 1 hari",
        }),

    isActive: z.boolean("Status aktif harus berupa boolean").default(true),

    isPopular: z.boolean("Status populer harus berupa boolean").default(false),

    features: planFeaturesSchema,
});

export type subscriptionPlanvalues = z.infer<typeof subscriptionPlanSchema>

export const subscriptionPlanField: FormFieldConfig<subscriptionPlanvalues>[] = [
    {
        label: 'Nama Paket',
        name: 'name',
        colSpan: 3,
        type: 'text',
        placeholder: `Contoh: TRIAL`
    },
    {
        label: 'Kode Unik',
        name: 'code',
        colSpan: 3,
        valueToUpperCase: true,
        placeholder: `TRIAL`
    },
    {
        label: 'Harga',
        name: 'price',
        type: 'currency',
        colSpan: 3,
    },
    {
        label: 'Promo (Optional)',
        name: 'promo',
        type: 'currency',
        colSpan: 3,
    },
    {
        label: 'Durasi',
        name: 'durationDays',
        colSpan: 3,
        type: 'number'
    },
    {
        label: 'Status Aktif',
        name: 'isActive',
        type: 'dual-option-switch',
        colSpan: 3,
        switchOptions: {
            left: { label: 'Tidak', value: false },
            right: { label: 'Iya', value: true }
        }
    },
    {
        label: 'Tandai Populer',
        name: 'isPopular',
        type: 'dual-option-switch',
        colSpan: 3,
        switchOptions: {
            left: { label: 'Tidak', value: false },
            right: { label: 'Iya', value: true }
        }
    },
    {
        label: 'Max Outlets',
        name: 'features.maxOutlets',
        type: 'number',
        colSpan: 2,
        placeholder: 'Isi -1 untuk Unlimited'
    },
    {
        label: 'Max Products',
        name: 'features.maxProducts',
        type: 'number',
        colSpan: 2,
        placeholder: 'Isi -1 untuk Unlimited'
    },
    {
        label: 'Max Staff',
        name: 'features.maxStaff',
        type: 'number',
        colSpan: 2,
        placeholder: 'Jumlah kasir yang bisa login'
    },
    {
        label: 'Export Laporan',
        name: 'features.canExportReport',
        type: 'dual-option-switch',
        colSpan: 3,
        switchOptions: {
            left: { label: 'Tidak', value: false },
            right: { label: 'Iya', value: true }
        },
    },
    {
        label: 'Support Level',
        name: 'features.supportLevel',
        type: 'select',
        colSpan: 3,
        options: [
            { label: 'Email', value: 'EMAIL' },
            { label: 'WhatsApp', value: 'WHATSAPP' },
            { label: 'PRIORITY', value: 'PRIORITY' }
        ],
        placeholder: 'Pilih salah satu'
    }
]