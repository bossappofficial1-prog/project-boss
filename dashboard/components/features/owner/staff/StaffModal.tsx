import { FormFieldConfig, ReusableForm } from '@/components/ui/reuseable-form';
import { useMemo } from 'react';
import { z } from 'zod';

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

    email: z
        .string()
        .email("Format email tidak valid")
        .optional()
        .nullable()
        .or(z.literal("")),

    password: z
        .string()
        .min(6, "Password minimal 6 karakter")
        .max(20, "Password maksimal 20 karakter"),

    status: StaffStatusEnum.default("ACTIVE"),

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

const getStaffSchema = (isEditMode: boolean) => z
    .object({
        name: z.string().min(2, 'Nama minimal 2 karakter'),
        phone: z.string().optional().refine(
            (val) => !val || /^(\+62|62|0)8\d{8,12}$/.test(val),
            'Nomor telepon tidak valid'
        ),
        email: z.string().email('Email tidak valid').optional(),
        status: StaffStatusEnum,
        address: z.string().optional(),
        notes: z.string().optional(),
        password: z.string().optional(),
    })

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
            status: 'ACTIVE' as const,
            phone: '',
            email: '',
            password: '',

        } satisfies StaffFormValues;
    }, [initialData, isEditMode]);

    const fields: FormFieldConfig<StaffFormValues>[] = [
        {
            name: "name",
            label: "Nama",
            placeholder: "Nama lengkap staff",
            colSpan: 'full'
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
            name: "status",
            label: "Status",
            placeholder: "Pilih Status",
            type: 'select',
            colSpan: 'full',
            options: [
                { label: 'Aktif', value: 'ACTIVE' },
                { label: 'Libur', value: 'INACTIVE' },
            ]
        },
        {
            name: "password",
            label: "Password",
            type: "password",
            colSpan: 'full',
            placeholder: isEditMode
                ? "Kosongkan jika tidak diubah"
                : "Minimal 6 karakter",
            description: "Digunakan untuk login kasir"
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