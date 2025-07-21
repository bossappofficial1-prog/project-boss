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
});

export type CreateUserInput = z.infer<typeof createUserSchema>;

export const updateUserSchema = z
    .object({
        name: z
            .string()
            .min(3, { message: "Nama minimal 3 karakter" })
            .optional(), // kalau kamu izinkan string kosong
        email: z
            .string()
            .email({ message: "Email tidak valid" })
            .max(255, { message: "Email terlalu panjang, maksimal 255 karakter" })
            .optional()
            .transform((str) => (str ? str.toLowerCase() : str))
        ,
        password: z
            .string()
            .min(6, { message: "Password minimal 6 karakter" })
            .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
        message: "Minimal satu field harus diisi untuk update",
    });

export type UpdateUserInput = z.infer<typeof updateUserSchema>;
