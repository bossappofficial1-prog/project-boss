"use client";

import { useMemo } from "react";
import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";
import { User } from "@/types/user";
import z from "zod";

const RoleEnum = z.enum(['ADMIN', 'OWNER']).refine(
    (val) => val !== null && val !== undefined,
    { message: 'Role harus dipilih' }
);

const passwordSchema = z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.string()
        .min(6, "Jika diganti, password minimal 6 karakter")
        .optional()
);

const baseSchema = z.object({
    name: z.string('Massukkan nama').min(3, 'Nama minimal 3 huruf'),
    role: RoleEnum,
    email: z.string('Masukkan email').email(`Masukkan email yang valid`)
});

export type UserSchemaValues = z.infer<typeof baseSchema> & { password?: string };

interface FormUserProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    defaultValues?: User; // Data user saat mode Edit
    onSubmit: (values: UserSchemaValues) => void;
    isLoading?: boolean;
}

export function FormUser({
    isOpen,
    onOpenChange,
    onSubmit,
    defaultValues,
    isLoading = false
}: FormUserProps) {

    // Helper boolean
    const isEditMode = !!defaultValues;
    const isGoogleProvider = defaultValues?.provider == 'google';

    // Schema berubah tergantung apakah ini mode "Tambah" atau "Edit"
    const schema = useMemo(() => {
        if (isEditMode || isGoogleProvider) {
            return baseSchema.extend({
                password: passwordSchema
            });
        }

        return baseSchema.extend({
            password: z.string().min(6, 'Password minimal 6 karakter')
        });
    }, [isEditMode, isGoogleProvider]);

    const defaultFormValues: UserSchemaValues = useMemo(() => ({
        name: defaultValues?.name ?? "",
        email: defaultValues?.email ?? "",
        role: (defaultValues?.role && RoleEnum.safeParse(defaultValues.role).success)
            ? (defaultValues.role as z.infer<typeof RoleEnum>)
            : "ADMIN",
        password: ""
    }), [defaultValues]);

    const formFields: FormFieldConfig<UserSchemaValues>[] = useMemo(() => [
        {
            label: `Nama`,
            name: 'name',
            type: 'text',
            placeholder: 'Masukkan nama user'
        },
        {
            label: `Email`,
            name: 'email',
            type: 'email',
            disabled: isEditMode,
            placeholder: 'Masukkan email user'
        },
        {
            label: `Peran`,
            name: 'role',
            type: 'select',
            placeholder: 'Pilih Peran',
            disabled: isLoading || isGoogleProvider,
            options: [
                { label: 'Admin', value: 'ADMIN' },
                { label: 'Owner', value: 'OWNER' },
            ]
        },
        {
            label: 'Password',
            name: 'password',
            type: 'password',
            placeholder: isEditMode ? 'Kosongkan jika tidak ingin mengganti' : 'Masukkan password',
            disabled: isLoading || isGoogleProvider,
            description: isEditMode && !isGoogleProvider
                ? 'Biarkan kosong untuk tetap menggunakan password lama.'
                : undefined
        }
    ], [isLoading, isEditMode, isGoogleProvider]);

    return (
        <ReusableForm
            fields={formFields}
            defaultValues={defaultFormValues}
            onSubmit={onSubmit}
            schema={schema}
            isLoading={isLoading}

            // Dialog Props
            withDialog
            isDialogOpen={isOpen}
            onDialogOpenChange={onOpenChange}
            dialogTitle={isEditMode ? `Edit User (${defaultValues?.name})` : 'Tambah User Baru'}
            dialogDescription={isEditMode ? "Ubah detail user di bawah ini." : "Isi form untuk menambahkan user baru."}
            resetFormOnClose={!isEditMode}
            submitText={isEditMode ? "Simpan Perubahan" : "Buat User"}
        />
    )
}