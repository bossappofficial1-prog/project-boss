import z from "zod";

export const registerBusinessSchema = z.object({
    name: z.string({ required_error: "Nama Harus diisi" })
        .nonempty("Nama tidak boleh kosong")
        .trim(),
    // email: z.string().email("Email tidak valid").
})

export type RegisterBusinessInput = z.infer<typeof registerBusinessSchema>