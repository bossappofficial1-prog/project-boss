import z from "zod";

const memberTypeEnum = z.enum(["REGULAR", "VIP", "PREMIUM"]);

export const createMembershipSchema = z.object({
    guestCustomerId: z.string().nonempty({ message: "ID Customer tidak boleh kosong" }),
    businessId: z.string().nonempty({ message: "ID Bisnis tidak boleh kosong" }),
    memberCode: z.string().nonempty({ message: "Kode Member tidak boleh kosong" }),
    memberType: memberTypeEnum.default("REGULAR"),
    discountPercentage: z.number().min(0).max(100).default(0),
    notes: z.string().optional(),
});

export type CreateMembershipInput = z.infer<typeof createMembershipSchema>;

export const updateMembershipSchema = z.object({
    memberCode: z.string().optional(),
    memberType: memberTypeEnum.optional(),
    discountPercentage: z.number().min(0).max(100).optional(),
    isActive: z.boolean().optional(),
    notes: z.string().optional(),
}).refine(data => Object.keys(data).length > 0, {
    message: "Minimal satu field harus diisi untuk update",
});

export type UpdateMembershipInput = z.infer<typeof updateMembershipSchema>;