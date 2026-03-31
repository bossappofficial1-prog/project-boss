import z from "zod";

export const updateProfileSchema = z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    phone: z.string().regex(/^[0-9]*$/, "Nomor telepon hanya boleh angka").optional().or(z.literal("")),
    avatar: z.string().optional(),
});

export type UpdateProfileValues = z.infer<typeof updateProfileSchema>

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
});

export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>
