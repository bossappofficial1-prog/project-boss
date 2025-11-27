import { UserRole } from "@prisma/client";
import z from "zod";

export const createUserSchema = z.object({
    name: z
        .string()
        .nonempty({ message: "Nama tidak boleh kosong" })
        .min(3, { message: "Nama minimal 3 karakter" })
        .max(125, "Nama maksimal 125 karakter"),
    email: z
        .string()
        .nonempty({ message: "Email tidak boleh kosong" })
        .email({ message: "Email tidak valid" })
        .max(255, { message: "Email terlalu panjang, maksimal 255 karakter" })
        .transform(str => str.toLowerCase()),
    password: z
        .string()
        .nonempty({ message: "Password tidak boleh kosong" })
        .min(6, { message: "Password minimal 6 karakter" }),
    role: z.nativeEnum(UserRole).default("OWNER"),
    phone: z
        .string()
        .nonempty({ message: "Nomor telepon tidak boleh kosong" })
        .regex(/^(\+62|62|0)[8-9]\d{7,11}$/, {
            message: "Nomor telepon harus format Indonesia yang valid (contoh: 08123456789, +6281234567890, atau 6281234567890)"
        })
        .transform((phone) => {
            // Normalize phone number to +62 format
            if (phone.startsWith('0')) {
                return '+62' + phone.substring(1);
            } else if (phone.startsWith('62')) {
                return '+' + phone;
            } else if (!phone.startsWith('+62')) {
                return '+62' + phone;
            }
            return phone;
        })
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
    .object({
        name: z
            .string()
            .min(3, { message: "Nama minimal 3 karakter" })
            .max(125, "Nama maksimal 125 karakter")
            .optional(),
        email: z
            .string()
            .email({ message: "Email tidak valid" })
            .max(255, { message: "Email terlalu panjang, maksimal 255 karakter" })
            .optional()
            .transform((str) => (str ? str.toLowerCase() : str)),
        password: z
            .string()
            .min(6, { message: "Password minimal 6 karakter" })
            .optional(),
        phone: z
            .string()
            .regex(/^(\+62|62|0)[8-9]\d{7,11}$/, {
                message: "Nomor telepon harus format Indonesia yang valid (contoh: 08123456789, +6281234567890, atau 6281234567890)"
            })
            .transform((phone) => {
                // Normalize phone number to +62 format
                if (phone.startsWith('0')) {
                    return '+62' + phone.substring(1);
                } else if (phone.startsWith('62')) {
                    return '+' + phone;
                } else if (!phone.startsWith('+62')) {
                    return '+62' + phone;
                }
                return phone;
            })
            .optional(),
        role: z.nativeEnum(UserRole).optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Minimal satu field harus diisi untuk update",
    });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
