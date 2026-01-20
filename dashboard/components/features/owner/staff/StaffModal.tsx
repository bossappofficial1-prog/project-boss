import { PasswordInput } from '@/components/ui/password-input';
import { FormFieldConfig, ReusableForm } from '@/components/ui/reuseable-form';
import { useMemo } from 'react';
import { z } from 'zod';

const StaffRoleEnum = z.enum(['ADMIN', 'CASHIER']);
const StaffStatusEnum = z.enum(['ACTIVE', 'INACTIVE']);

const getStaffSchema = (isEditMode: boolean) => z
    .object({
        name: z.string().min(2, 'Nama minimal 2 karakter'),
        phone: z.string().optional().refine(
            (val) => !val || /^(\+62|62|0)8\d{8,12}$/.test(val),
            'Nomor telepon tidak valid'
        ),
        email: z.string().email('Email tidak valid').optional(),
        role: StaffRoleEnum,
        status: StaffStatusEnum,
        address: z.string().optional(),
        notes: z.string().optional(),
        password: z.string().optional(),
    })
    .superRefine((data, ctx) => {
        const isCashier = data.role === 'CASHIER';

        // Validasi Email untuk Kasir
        if (isCashier && !data.email) {
            ctx.addIssue({
                path: ['email'],
                message: 'Email wajib diisi untuk kasir',
                code: z.ZodIssueCode.custom,
            });
        }

        // Validasi Password Dinamis
        if (isCashier) {
            if (!isEditMode) {
                // Mode Create: Wajib isi
                if (!data.password || data.password.length === 0) {
                    ctx.addIssue({
                        path: ['password'],
                        message: 'Password wajib diisi untuk kasir baru',
                        code: z.ZodIssueCode.custom,
                    });
                }
            }

            // Jika diisi (baik edit/create), minimal 6 karakter
            if (data.password && data.password.length > 0 && data.password.length < 6) {
                ctx.addIssue({
                    path: ['password'],
                    message: 'Password minimal 6 karakter',
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });

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
        if (isCashier && !data.email) {
            ctx.addIssue({
                path: ['email'],
                message: 'Email wajib diisi untuk kasir',
                code: z.ZodIssueCode.custom,
            });
        }

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
            if (data.password) {
                ctx.addIssue({
                    path: ['password'],
                    message: 'Password hanya diperlukan untuk kasir',
                    code: z.ZodIssueCode.custom,
                });
            }
        }
    });


export type StaffFormValues = z.infer<typeof staffSchema>;
interface StaffDialogProps {
    modalMode: 'create' | 'edit';
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    initialData?: Partial<StaffFormValues>;
    onSubmit: (values: StaffFormValues | FormData) => void;
    isLoading?: boolean;
}

export function StaffDialog({
    modalMode,
    isOpen,
    onOpenChange,
    initialData,
    onSubmit,
    isLoading
}
    : StaffDialogProps) {
    const isEditMode = modalMode === 'edit';

    const schema = useMemo(
        () => getStaffSchema(isEditMode),
        [isEditMode]
    );

    const defaultValues = useMemo(() => {
        if (isEditMode && initialData) {
            return {
                ...initialData,
                password: '',
            } as StaffFormValues;
        }
        return {
            name: '',
            role: 'CASHIER' as const,
            status: 'ACTIVE' as const,
            phone: '',
            email: '',
            address: '',
            notes: '',
            password: '',
        } satisfies StaffFormValues;
    }, [initialData, isEditMode]);

    const fields: FormFieldConfig<StaffFormValues>[] = [
        {
            name: "name",
            label: "Nama",
            placeholder: "Nama lengkap staff",
            colSpan: 'full',
        },
        {
            name: 'phone',
            label: 'Nomor Telepon',
            type: `tel`,
            placeholder: 'No Hp staff',
            colSpan: 3
        },
        {
            name: 'email',
            label: 'Email',
            type: `email`,
            placeholder: 'staff@placeholder.com',
            colSpan: 3
        },
        {
            name: "role",
            label: "Peran",
            type: "select",
            placeholder: `Pilih Role`,
            colSpan: 3,
            options: [
                { label: 'Admin', value: 'ADMIN' },
                { label: 'Kasir', value: 'CASHIER' }
            ],
        },
        {
            name: "status",
            label: "Status",
            placeholder: "Pilih Status",
            type: 'select',
            colSpan: 3,
            options: [
                { label: 'Aktif', value: 'ACTIVE' },
                { label: 'Libur', value: 'INACTIVE' },
            ]
        },
        {
            name: 'address',
            label: 'Alamat',
            type: `textarea`,
            placeholder: 'Alamat staff',
            colSpan: 'full'
        },
        {
            name: 'notes',
            label: 'Catatan',
            type: `textarea`,
            placeholder: 'Informasi tambahan seperti keahlian atau jadwal khusus',
            colSpan: 'full'
        },
        {
            name: "password",
            label: "Password",
            type: "custom",
            colSpan: 'full',
            placeholder: isEditMode
                ? "Kosongkan jika tidak diubah"
                : "Minimal 6 karakter",
            description: "Digunakan untuk login kasir",
            condition: (values) => values.role === 'CASHIER',
            renderCustom: ({ field }) => (
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
                    <div className="mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100">Akun Login Kasir</h4>
                    </div>
                    <p className="mb-3 text-xs text-blue-700 dark:text-blue-300">
                        Kasir memerlukan akun login untuk mengakses sistem POS. {modalMode === 'edit' && 'Kosongkan jika tidak ingin mengubah password.'}
                    </p>
                    <div>
                        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">
                            Password {modalMode === 'create' && '*'}
                        </label>
                        <PasswordInput
                            value={field.value}
                            onChange={field.onChange}
                            placeholder={modalMode === 'create' ? 'Minimal 6 karakter' : 'Kosongkan jika tidak diubah'}
                        />
                        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                            Password akan digunakan oleh kasir untuk login ke sistem POS
                        </p>
                    </div>
                </div>
            )
        },
    ];

    return (
        <ReusableForm
            schema={schema}
            fields={fields}
            defaultValues={defaultValues}
            onSubmit={onSubmit}
            isLoading={isLoading}
            gridCols={6}
            withDialog
            isDialogOpen={isOpen}
            onDialogOpenChange={onOpenChange}
            dialogTitle={isEditMode ? 'Edit Data Staff' : 'Tambah Staff Baru'}
            submitText={isEditMode ? 'Simpan Perubahan' : 'Simpan Staff'}
            dialogDescription='Masukkan informasi staff untuk outlet ini. Untuk kasir, email dan password wajib diisi agar bisa login ke sistem POS.'
        />

    )
}