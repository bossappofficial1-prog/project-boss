import { z } from "zod";

export const StaffStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const staffSchema = z.object({

  name: z
    .string()
    .min(2, "Nama minimal 2 karakter")
    .max(50, "Nama maksimal 50 karakter"),

  phone: z
    .string()
    .min(10, "Nomor telepon minimal 10 digit")
    .max(15, "Nomor telepon terlalu panjang")
    .regex(/^[0-9+]+$/, "Nomor telepon hanya boleh angka dan +")
    .optional()
    .nullable()
    .or(z.literal("")), // Menangani string kosong dari form

  username: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),

  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(20, "Password maksimal 20 karakter"),

  status: StaffStatusEnum.default("ACTIVE"),

  outletId: z.string(),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

// Type inference untuk TypeScript
export type StaffFormValues = z.infer<typeof staffSchema>;

// Schema khusus untuk Update (semua field opsional, password boleh kosong jika tidak diubah)
export const updateStaffSchema = staffSchema.extend({
  password: z.string().min(6).optional().or(z.literal("")),
}).partial();

export type UpdateStaffSchemaValues = z.infer<typeof updateStaffSchema>