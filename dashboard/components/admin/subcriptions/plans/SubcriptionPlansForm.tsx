import { ReusableForm } from "@/components/ui/reuseable-form";
import { subscriptionPlanField, subscriptionPlanSchema, subscriptionPlanvalues } from "./schema";

type SubcriptionPlansFormProps = {
    onSubmit: (values: subscriptionPlanvalues) => void;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void
    mode: 'create' | 'edit',
    defaultValues?: Partial<subscriptionPlanvalues>
    isLoading?: boolean
}

export function SubcriptionPlansForm(props: SubcriptionPlansFormProps) {
    const internalDefaultValues: Partial<subscriptionPlanvalues> = {
        name: "",
        code: "",
        price: 0,
        durationDays: 1,
        isActive: true,
        isPopular: false,
        features: {
            maxOutlets: -1,
            maxProducts: -1,
            maxStaff: -1,
            canExportReport: false,
            supportLevel: "EMAIL",
        },
    };

    const defaultValues: Partial<subscriptionPlanvalues> = {
        ...internalDefaultValues,
        ...props.defaultValues,
        features: {
            ...internalDefaultValues.features,
            ...props.defaultValues?.features as any,
        },
    };

    return (
        <ReusableForm
            withDialog
            dialogTitle={props.mode === 'create' ? 'Buat Paket Baru' : 'Update Paket ' + defaultValues.name}
            gridCols={6}
            isLoading={props.isLoading}
            submitText={props.mode === 'create' ? 'Simpan' : 'Simpan Perubahan'}
            defaultValues={defaultValues as any}
            isDialogOpen={props.isOpen}
            onDialogOpenChange={props.onOpenChange}
            fields={subscriptionPlanField}
            onSubmit={props.onSubmit as any}
            schema={subscriptionPlanSchema}
        />
    )
}
