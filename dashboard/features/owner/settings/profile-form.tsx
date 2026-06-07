import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";
import { useProfileSetting } from "@/hooks/use-owner-setting";
import z from "zod";

const profileSchema = z.object({
    avatar: z.any().optional(),
    name: z.string().min(2, "Nama minimal 2 karakter"),
    phone: z
        .string()
        .regex(/^[0-9]*$/, "Nomor telepon hanya boleh angka")
        .optional()
        .or(z.literal("")),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

const profileFields: FormFieldConfig<ProfileFormValues>[] = [
    {
        name: "avatar",
        label: "Foto Profil",
        type: "file",
        variant: 'avatar',
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".webp"],
        },
        maxSizes: 2 * 1024 * 1024,
        description: "Format yang didukung: JPG, PNG, WEBP. Maksimal ukuran 2MB.",
        colSpan: "full",
    },
    {
        name: "name",
        label: "Nama Lengkap",
        type: "text",
        placeholder: "Masukkan nama lengkap Anda",
        colSpan: 1,
    },
    {
        name: "phone",
        label: "Nomor Telepon",
        type: "tel",
        placeholder: "Contoh: 081234567890",
        colSpan: 1,
    },
];

interface ProfileFormProps {
    defaultValues?: ProfileFormValues;
    userId: string;
}

export function ProfileForm({ defaultValues, userId }: ProfileFormProps) {
    const { isProfileUpdate, updateProfileMutation } = useProfileSetting()
    return (
        <ReusableForm<ProfileFormValues>
            schema={profileSchema}
            defaultValues={defaultValues}
            fields={profileFields}
            onSubmit={(v) => updateProfileMutation({ userId, values: v })}
            submitText="Simpan Profil"
            isLoading={isProfileUpdate}
            gridCols={2}
            useFormData={true}
        />
    )
}