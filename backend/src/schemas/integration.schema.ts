import z from "zod";

export const connectWhatsAppSchema = z.object({
    token: z.string().min(1, "Token WhatsApp API wajib diisi"),
    url: z.string().url("Format URL API tidak valid").optional().or(z.literal("")),
    settings: z.any().optional()
});

export type ConnectWhatsAppInput = z.infer<typeof connectWhatsAppSchema>;
