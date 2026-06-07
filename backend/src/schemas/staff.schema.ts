import { z } from "zod";
import { StaffPrivilegeType, StaffRole } from "@prisma/client";

export const StaffStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);
export const StaffRoleEnum = z.nativeEnum(StaffRole);
export const StaffPrivilegeTypeEnum = z.nativeEnum(StaffPrivilegeType);

const staffBaseSchema = z.object({
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
    .or(z.literal("")),

  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(30, "Username maksimal 30 karakter")
    .regex(/^[a-zA-Z0-9_]+$/, "Username hanya boleh huruf, angka, dan underscore")
    .optional()
    .nullable()
    .or(z.literal("")),

  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .nullable()
    .or(z.literal("")),

  pin: z
    .string()
    .optional()
    .nullable()
    .or(z.literal("")),

  role: StaffRoleEnum.default("CASHIER"),

  privileges: z
    .array(StaffPrivilegeTypeEnum)
    .optional()
    .default([]),

  status: StaffStatusEnum.default("ACTIVE"),

  outletId: z.string(),

  faceImageUrl: z.string().optional().nullable(),
  faceDescriptor: z.string().optional().nullable(),

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const staffSchema = staffBaseSchema.superRefine((data, ctx) => {
  // Username wajib diisi untuk kasir
  if (data.role === "CASHIER" && !data.username) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Username wajib diisi untuk kasir",
      path: ["username"],
    });
  }
  // PIN wajib diisi untuk semua staff saat create
  if (!data.pin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "PIN wajib diisi untuk staff baru",
      path: ["pin"],
    });
  } else if (!/^\d{6}$/.test(data.pin)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "PIN harus 6 digit angka",
      path: ["pin"],
    });
  }
});

export type StaffFormValues = z.infer<typeof staffSchema>;

// Schema khusus untuk Update (semua field opsional, tidak perlu outletId)
export const updateStaffSchema = staffBaseSchema
  .extend({
    pin: z.string().regex(/^\d{6}$/, "PIN harus 6 digit angka").optional().or(z.literal("")),
    privileges: z.array(StaffPrivilegeTypeEnum).optional(),
  })
  .partial()
  .omit({ outletId: true });

export type UpdateStaffSchemaValues = z.infer<typeof updateStaffSchema>;