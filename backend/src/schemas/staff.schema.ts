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
    .optional()
    .nullable()
    .or(z.literal("")),

  password: z
    .string()
    .min(6, "Password minimal 6 karakter")
    .max(20, "Password maksimal 20 karakter")
    .optional()
    .or(z.literal("")),

  email: z
    .string()
    .email("Format email tidak valid")
    .optional()
    .nullable()
    .or(z.literal("")),

  pin: z
    .string()
    .min(4, "PIN minimal 4 digit")
    .max(10, "PIN maksimal 10 digit")
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

  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const staffSchema = staffBaseSchema.superRefine((data, ctx) => {
  // Kasir butuh password
  if (data.role === "CASHIER" && !data.password) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Password wajib diisi untuk kasir",
      path: ["password"],
    });
  }
  // Manager butuh PIN
  if (data.role === "MANAGER" && !data.pin) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "PIN wajib diisi untuk manager",
      path: ["pin"],
    });
  }
});

export type StaffFormValues = z.infer<typeof staffSchema>;

// Schema khusus untuk Update (semua field opsional, tidak perlu outletId)
export const updateStaffSchema = staffBaseSchema
  .extend({
    password: z.string().min(6).optional().or(z.literal("")),
    pin: z.string().min(4).optional().or(z.literal("")),
    privileges: z.array(StaffPrivilegeTypeEnum).optional(),
  })
  .partial()
  .omit({ outletId: true });

export type UpdateStaffSchemaValues = z.infer<typeof updateStaffSchema>;