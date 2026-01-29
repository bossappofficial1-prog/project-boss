import { Button } from "@/components/ui/button";
import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import z from "zod";

const businessSchema = z.object({
    name: z
        .string()
        .min(1, 'Nama bisnis wajib diisi')
        .max(100, 'Nama bisnis terlalu panjang'),

    owner: z.object({
        name: z.string()
            .min(1, 'Nama pemilik wajib diisi')
            .max(100, 'Nama pemilik terlalu panjang'),
        email: z
            .string()
            .email('Format email tidak valid'),
    }),

    subscriptionPlan: z.enum(['BASIC', 'PRO', 'ENTERPRISE']),

    subscriptionEndDate: z.coerce.date().nullable().optional(),
})

export type BusinessValues = z.infer<typeof businessSchema>

type AllBusinessFormProps = {
    onSubmit: (values: BusinessValues | FormData) => void
    initialValues: BusinessValues
}

export function AllBusinessForm({
    initialValues,
    onSubmit
}: AllBusinessFormProps) {

    const form = useForm({
        resolver: zodResolver(businessSchema),
        defaultValues: initialValues,
    });

    const fields: FormFieldConfig<BusinessValues>[] = [
        {
            label: 'Nama Bisnis',
            name: 'name',
            type: 'text'
        },
        {
            label: 'Nama Pemilik',
            name: 'owner.name',
            type: 'text',
            disabled: true
        },
        {
            label: 'Email Pemilik',
            name: 'owner.email',
            type: 'email'
        },
        {
            label: 'Current Plan',
            name: 'subscriptionPlan',
            type: 'toogle',
            options: [
                { label: 'BASIC', value: 'BASIC' },
                { label: 'PRO', value: 'PRO' },
                { label: 'ENTERPRISE', value: 'ENTERPRISE' },
            ]
        },
        {
            label: 'Tanggal Expire',
            name: 'subscriptionEndDate',
            type: 'date'
        },
    ]
    return (
        <>

            <ReusableForm
                id="businesses-form"
                hideSubmitButton
                onSubmit={onSubmit}
                fields={fields}
                schema={businessSchema}
                defaultValues={initialValues}
            />
        </>
    )
}