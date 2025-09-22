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
            message: "Password harus mengandung huruf besar, kecil, dan angka"
        }),
});

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

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