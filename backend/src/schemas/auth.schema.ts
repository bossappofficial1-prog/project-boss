import z from "zod";

export const loginSchema = z.object({
    email: z
        .string()
        .nonempty({ message: "Email tidak boleh kosong" })
        .email({ message: "Email tidak valid" })
        .transform(str => str.toLowerCase()),
    password: z
        .string()
        .nonempty({ message: "Password tidak boleh kosong" }),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const verifySchema = z.object({
    email: z
        .string()
        .nonempty({ message: "Email tidak boleh kosong" })
        .email({ message: "Email tidak valid" })
        .transform(str => str.toLowerCase()),
    code: z
        .string()
        .nonempty({ message: "Kode verifikasi tidak boleh kosong" }),
});

export type VerifyInput = z.infer<typeof verifySchema>;

export const resendVerificationSchema = z.object({
    email: z
        .string()
        .nonempty({ message: "Email tidak boleh kosong" })
        .email({ message: "Email tidak valid" })
        .transform(str => str.toLowerCase()),
});

export type ResendVerificationInput = z.infer<typeof resendVerificationSchema>;

export const forgotPasswordSchema = z.object({
    email: z
        .string()
        .nonempty({ message: "Email tidak boleh kosong" })
        .email({ message: "Email tidak valid" })
        .transform(str => str.toLowerCase()),
});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
    token: z
        .string()
        .nonempty({ message: "Token tidak boleh kosong" }),
    password: z
        .string()
        .min(8, { message: "Password minimal 8 karakter" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
            message: "Password baru harus mengandung huruf besar, kecil, dan angka"
        }),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const cashierLoginSchema = z.object({
    username: z
        .string()
        .nonempty({ message: "Username tidak boleh kosong" }),
    password: z
        .string()
        .nonempty({ message: "Password tidak boleh kosong" }),
});

export type CashierLoginInput = z.infer<typeof cashierLoginSchema>;

export const changePasswordSchema = z.object({
    currentPassword: z
        .string()
        .nonempty({ message: "Password saat ini tidak boleh kosong" }),
    newPassword: z
        .string()
        .min(8, { message: "Password baru minimal 8 karakter" })
        .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
            message: "Password baru harus mengandung huruf besar, kecil, dan angka"
        }),
});

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const completeRegisterSchema = z.object({
    businessName: z
        .string({ message: 'Wajib diisi' })
        .min(3, { message: "Nama bisnis minimal 3 karakter" })
        .max(100, { message: "Nama bisnis terlalu panjang" }),

    description: z
        .string({
            message: 'Wajib diisi'
        })
        .max(255, { message: "Deskripsi maksimal 255 karakter" })
        .optional(),
    selectedPlan: z
        .string()
        .nonempty({ message: "Plan wajib dipilih" })
        .transform(str => str.toUpperCase())
});

export type CompleteRegisterValues = z.infer<typeof completeRegisterSchema>