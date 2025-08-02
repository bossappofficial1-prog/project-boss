import { z } from "zod";
import { StaffStatus } from "@prisma/client";

export const createStaffSchema = z.object({
    name: z.string().min(1, "Nama staff harus diisi"),
    phone: z.string().optional(),
    status: z.nativeEnum(StaffStatus).default(StaffStatus.ACTIVE),
    outletId: z.string().uuid("ID outlet tidak valid"),
});

export const updateStaffSchema = z.object({
    name: z.string().optional(),
    phone: z.string().optional(),
    status: z.nativeEnum(StaffStatus).optional(),
});

export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
