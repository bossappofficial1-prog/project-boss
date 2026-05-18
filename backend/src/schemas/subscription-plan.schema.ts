import { z } from "zod";

const planFeaturesSchema = z.object({
    maxOutlets: z
        .number({
            required_error: "Batas outlet wajib diisi",
            invalid_type_error: "Batas outlet harus berupa angka",
        })
        .int({ message: "Batas outlet harus berupa bilangan bulat" })
        .min(-1, {
            message: "Batas outlet minimal -1 (untuk unlimited) atau lebih",
        }),

    maxProducts: z
        .number({
            required_error: "Batas produk wajib diisi",
            invalid_type_error: "Batas produk harus berupa angka",
        })
        .int({ message: "Batas produk harus berupa bilangan bulat" })
        .min(-1, {
            message: "Batas produk minimal -1 (untuk unlimited) atau lebih",
        }),

    maxStaff: z
        .number({
            required_error: "Batas staf wajib diisi",
            invalid_type_error: "Batas staf harus berupa angka",
        })
        .int({ message: "Batas staf harus berupa bilangan bulat" })
        .min(-1, {
            message: "Batas staf minimal -1 (untuk unlimited) atau lebih",
        }),

    canExportReport: z.boolean({
        required_error: "Izin ekspor laporan wajib ditentukan",
        invalid_type_error: "Izin ekspor laporan harus berupa boolean",
    }),

    supportLevel: z.enum(["EMAIL", "WHATSAPP", "PRIORITY"], {
        required_error: "Tingkat dukungan wajib dipilih",
        invalid_type_error: "Tingkat dukungan harus berupa pilihan yang valid",
    }),
});

export const subscriptionPlanSchema = z.object({
    id: z.string().optional(),

    name: z
        .string({
            required_error: "Nama paket wajib diisi",
            invalid_type_error: "Nama paket harus berupa teks",
        })
        .min(3, {
            message: "Nama paket minimal 3 karakter",
        })
        .max(50, {
            message: "Nama paket maksimal 50 karakter",
        }),

    code: z
        .string({
            required_error: "Kode paket wajib diisi",
            invalid_type_error: "Kode paket harus berupa teks",
        })
        .min(2, {
            message: "Kode paket minimal 2 karakter",
        })
        .regex(/^[A-Z0-9_]+$/, {
            message:
                "Kode hanya boleh berisi huruf kapital, angka, dan garis bawah (_)",
        }),

    price: z
        .number({
            required_error: "Harga wajib diisi",
            invalid_type_error: "Harga harus berupa angka",
        })
        .min(0, {
            message: "Harga tidak boleh bernilai negatif",
        }),
    promo: z
        .number({
            required_error: "Harga wajib diisi",
            invalid_type_error: "Harga harus berupa angka",
        })
        .min(0, {
            message: "Harga tidak boleh bernilai negatif",
        })
        .optional(),

    durationDays: z
        .number({
            required_error: "Durasi paket wajib diisi",
            invalid_type_error: "Durasi paket harus berupa angka",
        })
        .int({
            message: "Durasi paket harus berupa bilangan bulat",
        })
        .min(1, {
            message: "Durasi paket minimal 1 hari",
        }),

    isActive: z.boolean({
        invalid_type_error: "Status aktif harus berupa boolean",
    }).default(true),

    isPopular: z.boolean({
        invalid_type_error: "Status populer harus berupa boolean",
    }).default(false),

    yearlyPrice: z
        .number({
            required_error: "Harga yearly wajib diisi",
            invalid_type_error: "Harga yearly harus berupa angka",
        })
        .min(0, {
            message: "Harga yearly tidak boleh bernilai negatif",
        })
        .default(0),

    yearlyDiscount: z
        .number({
            required_error: "Diskon yearly wajib diisi",
            invalid_type_error: "Diskon yearly harus berupa angka",
        })
        .min(0, {
            message: "Diskon minimal 0%",
        })
        .max(100, {
            message: "Diskon maksimal 100%",
        })
        .default(0),

    features: planFeaturesSchema,
});

export const subscriptionPlanUpdateSchema =
    subscriptionPlanSchema
        .omit({ id: true })
        .partial();


export type SubscriptionPlanInput = z.infer<
    typeof subscriptionPlanSchema
>;
export type UpdateSubscriptionPlanInput = z.infer<
    typeof subscriptionPlanUpdateSchema
>;
export type PlanFeaturesInput = z.infer<
    typeof planFeaturesSchema
>;