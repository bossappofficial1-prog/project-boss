import { Card } from "@/components/ui/card";
import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form"
import { ACCEPTED_FILE_TYPES } from "@/lib/file-types"
import { AlignLeft, ArrowUpDown, CloudUpload, Eye, EyeOff, FileText, HardDrive, Image, Link, MousePointerClick, ToggleLeft, Type } from "lucide-react";
import z from "zod";

export const bannerSchema = z.object({
    title: z.string('Wajib diisi').min(3, { message: 'Title must be at least 3 characters' }),
    subtitle: z.string('Wajib diisi'),
    imageUrl: z.any().optional().nullable(),
    ctaType: z.enum(['none', 'url', 'deep-link']).default(`none`),
    sortOrder: z.number('Wajib diisi').int(),
    ctaPayload: z.string().optional(),
    isActive: z.enum([`draft`, 'publish']).default(`draft`),
});

export type BannerFormValues = z.infer<typeof bannerSchema>

type BannerFormProps = {
    defaultValues: BannerFormValues;
    onValuesChange?: (values: Partial<BannerFormValues>) => void;
    mode: `create` | `edit`;
    onSubmit: (values: BannerFormValues | FormData) => void
    isLoading?: boolean
}

export default function BannerForm(
    {
        defaultValues,
        onValuesChange,
        mode,
        onSubmit,
        isLoading
    }: BannerFormProps
) {

    const bannerFields: FormFieldConfig<BannerFormValues>[] = [
        {
            label: `Judul Banner`,
            placeholder: `Contoh: penambahan fitur baru`,
            name: `title`,
            colSpan: 'full',
            icon: Type
        },
        {
            label: 'Sub Title',
            name: 'subtitle',
            type: 'textarea',
            icon: AlignLeft,
            placeholder: 'Contoh: Sekarang pelanggan bisa booking langsung',
            colSpan: 'full'
        },
        {
            label: `Gambar`,
            name: 'imageUrl',
            type: 'file',
            colSpan: 'full',
            icon: Image,
            accept: ACCEPTED_FILE_TYPES.IMAGE
        },
        {
            label: `Tipe Aksi (CTA)`,
            name: 'ctaType',
            type: 'select',
            icon: MousePointerClick,
            placeholder: 'Pilih tipe aksi',
            colSpan: 6,
            options: [
                { label: 'Tidak ada aksi', value: 'none' },
                { label: 'Buka link website', value: 'url' },
                { label: 'Buka menu aplikasi', value: 'deep-link' },
            ]
        },
        {
            label: `Urutan (Sort)`,
            name: 'sortOrder',
            type: 'number',
            icon: ArrowUpDown,
            colSpan: 6,
            placeholder: 'Contoh: 1'
        },
        {
            label: `Link URL Tujuan`,
            name: `ctaPayload`,
            type: `text`,
            icon: Link,
            placeholder(values) {
                if (values.ctaType === 'deep-link') return 'Contoh: /outlet/promos';
                return 'Contoh: https://olas.xyz'
            },
            colSpan: `full`,
            condition: (values) => values.ctaType !== `none`
        },
        {
            label: `Banner Aktif?`,
            name: 'isActive',
            type: 'dual-option-switch',
            colSpan: 6,
            className: 'w-fit',
            switchOptions: {
                left: { label: 'Draft', value: 'draft', activeClass: 'text-foreground', icon: HardDrive },
                right: { label: 'Publish', value: 'publish', activeClass: 'text-primary', icon: CloudUpload },
            }
        },
    ]

    return (
        <Card
            className='p-4'
        >

            <ReusableForm
                dialogTitle={mode === 'create' ? `Tambah Banner` : `Edit Banner`}
                submitText={mode === `create` ? `Simpan` : `Simpan Perubahan`}
                fields={bannerFields}
                onSubmit={onSubmit}
                schema={bannerSchema}
                defaultValues={defaultValues}
                gridCols={12}
                onValuesChange={(values) => onValuesChange?.(values)}
                isLoading={isLoading}
            />
        </Card>
    )
}