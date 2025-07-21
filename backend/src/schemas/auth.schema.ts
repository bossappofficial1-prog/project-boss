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