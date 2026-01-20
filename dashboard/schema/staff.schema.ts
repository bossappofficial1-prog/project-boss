import { z } from 'zod';

export const StaffRoleEnum = z.enum(['OWNER', 'MANAGER', 'CASHIER']);
export const StaffStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);
export const staffSchema = z
    .object({
        name: z
            .string()
            .min(2, 'Nama minimal 2 karakter'),

        phone: z
            .string()
            .optional()
            .refine(
                (val) => !val || /^(\+62|62|0)8\d{8,12}$/.test(val),
                'Nomor telepon tidak valid'
            ),

        email: z
            .string()
            .email('Email tidak valid')
            .optional(),

        role: StaffRoleEnum,

        status: StaffStatusEnum,

        address: z
            .string()
            .optional(),

        notes: z
            .string()
            .optional(),

        password: z
            .string()
            .optional(),
    })
    .superRefine((data, ctx) => {
        const isCashier = data.role === 'CASHIER';

        // =====================
        // EMAIL VALIDATION
        // =====================
        if (isCashier && !data.email) {
            ctx.addIssue({
                path: ['email'],
                message: 'Email wajib diisi untuk kasir',
                code: z.ZodIssueCode.custom,
            });
        }

        // =====================
        // PASSWORD VALIDATION
        // =====================
        if (isCashier) {
            if (!data.password || data.password.length === 0) {
                ctx.addIssue({
                    path: ['password'],
                    message: 'Password wajib diisi untuk kasir',
                    code: z.ZodIssueCode.custom,
                });
            } else if (data.password.length < 6) {
                ctx.addIssue({
                    path: ['password'],
                    message: 'Password minimal 6 karakter',
                    code: z.ZodIssueCode.custom,
                });
            }
        } else {
            // Jika bukan cashier, password harus kosong
            if (data.password) {
                ctx.addIssue({
                    path: ['password'],
                    message: 'Password hanya diperlukan untuk kasir',
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

export const createStaffSchema = staffSchema;

export const editStaffSchema = staffSchema
    .safeExtend({
        password: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        if (data.password && data.password.length < 6) {
            ctx.addIssue({
                path: ['password'],
                message: 'Password minimal 6 karakter',
                code: z.ZodIssueCode.custom,
            });
        }
    });

