import { FormFieldConfig } from "@/components/ui/reuseable-form";
import { FileText, Lock, Mail, Phone, Store, User } from "lucide-react";
import { z } from "zod";

export const registerStep1Schema = z.object({
    name: z
        .string('Wajib diisi')
        .min(3, { message: "Nama lengkap minimal 3 karakter" })
        .max(50, { message: "Nama lengkap maksimal 50 karakter" }),

    email: z
        .string('Wajib diisi')
        .min(1, { message: "Email wajib diisi" })
        .email({ message: "Format email tidak valid" }),

    phone: z
        .string('Wajib diisi')
        .min(10, { message: "Nomor WhatsApp minimal 10 digit" })
        .max(15, { message: "Nomor WhatsApp maksimal 15 digit" })
        .regex(/^(\+62|62|0)8[1-9][0-9]{6,9}$/, {
            message: "Format nomor tidak valid (Gunakan format 08...)"
        }),

    password: z
        .string('Wajib diisi')
        .min(8, { message: "Password minimal 8 karakter" })
        .regex(/[A-Z]/, { message: "Harus mengandung 1 huruf besar" })
        .regex(/[0-9]/, { message: "Harus mengandung 1 angka" })
});

export const registerStep1GoogleSchema = registerStep1Schema.omit({ password: true });

export const otpVerificationSchema = z.object({
    email: z.string('Wajib diisi').email(),
    otp: z
        .string()
        .length(6, { message: "Kode OTP harus 6 digit" })
        .regex(/^\d+$/, { message: "Kode OTP hanya boleh berisi angka" }),
});

export const registerStep2Schema = z.object({
    businessName: z
        .string('Wajib diisi')
        .min(3, { message: "Nama bisnis minimal 3 karakter" })
        .max(100, { message: "Nama bisnis terlalu panjang" }),

    description: z
        .string('Wajib diisi')
        .max(255, { message: "Deskripsi maksimal 255 karakter" })
        .optional(),
});

export const registerStep3Schema = z.object({
    selectedPlan: z.enum(["TRIAL", "BASIC", "PRO", "ENTERPRISE"], "Pilih salah satu paket yang tersedia"),
});

export const completeOnboardingSchema = z.object({
    businessName: registerStep2Schema.shape.businessName,
    description: registerStep2Schema.shape.description,
    subscriptionPlan: registerStep3Schema.shape.selectedPlan,
});

export type RegisterStep1Input = z.infer<typeof registerStep1Schema>;
export type OtpVerificationInput = z.infer<typeof otpVerificationSchema>;
export type RegisterStep2Input = z.infer<typeof registerStep2Schema>;
export type RegisterStep3Input = z.infer<typeof registerStep3Schema>;

export const fieldRegisterStep1: FormFieldConfig<RegisterStep1Input>[] = [
    {
        label: 'Nama Lengkap',
        name: `name`,
        icon: User,
        type: 'text',
        placeholder: 'Contoh: Budi Santoso'
    },
    {
        label: 'Email Bisnis',
        name: `email`,
        icon: Mail,
        type: 'email',
        placeholder: 'owner@bisnis.com'
    },
    {
        label: 'Nomor WhatsApp',
        name: `phone`,
        icon: Phone,
        type: 'tel',
        placeholder: '0812...'
    },
    {
        label: 'Password',
        name: `password`,
        icon: Lock,
        type: 'password',
        placeholder: 'Min. 8 karakter'
    },
];

export const fieldRegisterStep2: FormFieldConfig<RegisterStep2Input>[] = [
    {
        label: 'Nama Bisnis / Toko',
        name: `businessName`,
        icon: Store,
        type: 'text',
        placeholder: 'Contoh: Kopi Kenangan Senja'
    },
    {
        label: 'Deskripsi Singkat (Opsional)',
        name: `description`,
        icon: FileText,
        type: 'textarea',
        placeholder: 'Contoh: Kopi Kenangan Senja'
    },
]