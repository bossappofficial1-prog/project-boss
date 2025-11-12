import { z } from "zod";
import { StaffRole, StaffStatus } from "@prisma/client";

const nullableString = (schema: z.ZodString) =>
    z.preprocess((value) => {
        if (value === null || value === undefined || value === "") {
            return undefined;
        }
        return value;
    }, schema.optional());

export const createStaffSchema = z.object({
    name: z.string().min(1, "Nama staff harus diisi"),
    phone: nullableString(z.string().min(6, "Nomor telepon tidak valid").max(32, "Nomor telepon terlalu panjang")),
    email: nullableString(z.string().email("Email tidak valid")),
    address: nullableString(z.string().max(255, "Alamat maksimal 255 karakter")),
    notes: nullableString(z.string().max(500, "Catatan maksimal 500 karakter")),
    role: z.nativeEnum(StaffRole).default(StaffRole.SERVICE),
    status: z.nativeEnum(StaffStatus).default(StaffStatus.ACTIVE),
    outletId: z.string().uuid("ID outlet tidak valid"),
});

export const updateStaffSchema = z.object({
    name: z.string().optional(),
    phone: nullableString(z.string().min(6, "Nomor telepon tidak valid").max(32, "Nomor telepon terlalu panjang")),
    email: nullableString(z.string().email("Email tidak valid")),
    address: nullableString(z.string().max(255, "Alamat maksimal 255 karakter")),
    notes: nullableString(z.string().max(500, "Catatan maksimal 500 karakter")),
    role: z.nativeEnum(StaffRole).optional(),
    status: z.nativeEnum(StaffStatus).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
