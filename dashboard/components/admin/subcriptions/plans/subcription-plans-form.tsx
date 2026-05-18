"use client";

import { ReusableForm } from "@/components/ui/reuseable-form";
import {
  subscriptionPlanField,
  subscriptionPlanSchema,
  subscriptionPlanvalues,
} from "./schema";

interface SubcriptionPlansFormProps {
  onSubmit: (values: subscriptionPlanvalues) => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  defaultValues?: Partial<subscriptionPlanvalues>;
  isLoading?: boolean;
}

export function SubcriptionPlansForm(props: SubcriptionPlansFormProps) {
  const internalDefaultValues: Partial<subscriptionPlanvalues> = {
    name: "",
    code: "",
    price: 0,
    promo: 0,
    durationDays: 30,
    isActive: true,
    isPopular: false,
    yearlyPrice: 0,
    yearlyDiscount: 0,
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
      ...internalDefaultValues.features!,
      ...(props.defaultValues?.features as Record<string, unknown>),
    } as subscriptionPlanvalues['features'],
  };

  return (
    <ReusableForm
      withDialog
      dialogTitle={
        props.mode === "create"
          ? "Buat Paket Baru"
          : `Edit Paket - ${defaultValues.name}`
      }
      dialogDescription={
        props.mode === "create"
          ? "Buat paket langganan baru dengan konfigurasi fitur yang sesuai."
          : "Perbarui konfigurasi paket langganan."
      }
      gridCols={6}
      isLoading={props.isLoading}
      submitText={props.mode === "create" ? "Simpan" : "Simpan Perubahan"}
      defaultValues={defaultValues as subscriptionPlanvalues}
      isDialogOpen={props.isOpen}
      onDialogOpenChange={props.onOpenChange}
      fields={subscriptionPlanField}
      onSubmit={props.onSubmit}
      schema={subscriptionPlanSchema}
    />
  );
}
