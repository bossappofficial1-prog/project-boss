import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";
import { useProfileSetting } from "@/hooks/use-owner-setting";
import z from "zod";

const passwordSchema = z.object({
    currentPassword: z.string().min(1, "Kata sandi saat ini wajib diisi"),
    newPassword: z.string().min(8, "Kata sandi baru minimal 8 karakter"),
    confirmPassword: z.string().min(1, "Konfirmasi kata sandi wajib diisi"),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Konfirmasi kata sandi tidak cocok",
    path: ["confirmPassword"],
});

export type PasswordFormValues = z.infer<typeof passwordSchema>;


const passwordFields: FormFieldConfig<PasswordFormValues>[] = [
    {
        name: "currentPassword",
        label: "Kata Sandi Saat Ini",
        type: "password",
        placeholder: "Masukkan kata sandi saat ini",
        colSpan: "full",
    },
    {
        name: "newPassword",
        label: "Kata Sandi Baru",
        type: "password",
        placeholder: "Minimal 8 karakter",
        colSpan: 1,
    },
    {
        name: "confirmPassword",
        label: "Konfirmasi Kata Sandi",
        type: "password",
        placeholder: "Ulangi kata sandi baru",
        colSpan: 1,
    },
];

interface ProfileFormProps {
    defaultValues?: PasswordFormValues;
    userId: string;
}

export function PasswordForm({ defaultValues, userId }: ProfileFormProps) {
    const { isPasswordUpdate, updatePasswordMutation } = useProfileSetting()
    return (
        <ReusableForm<PasswordFormValues>
            schema={passwordSchema}
            defaultValues={defaultValues}
            fields={passwordFields}
            onSubmit={(values) => updatePasswordMutation({ userId: userId, payload: values })}
            submitText="Perbarui Kata Sandi"
            isLoading={isPasswordUpdate}
            gridCols={2}
        />
    )
}