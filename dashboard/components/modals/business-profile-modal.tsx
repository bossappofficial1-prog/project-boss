"use client";

import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Building2, FileText } from "lucide-react";
import { businessApi } from "@/lib/api";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { z } from "zod";
import {
  ReusableForm,
  type FormFieldConfig,
} from "@/components/ui/reuseable-form";

const businessSchema = z.object({
  name: z.string().min(1, "Nama bisnis wajib diisi"),
  description: z.string().optional(),
});

type BusinessFormValues = z.infer<typeof businessSchema>;

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  businessId?: string;
  onSuccess?: () => void;
  onCreateRequested?: (data: {
    name: string;
    description?: string;
    defaultTransactionFeeBearer: "CUSTOMER" | "OWNER";
  }) => void;
  initialName?: string;
  initialDescription?: string;
  initialDefaultTransactionFeeBearer?: "CUSTOMER" | "OWNER";
};

export default function BusinessProfileModal({
  open,
  onOpenChange,
  businessId,
  onSuccess,
  onCreateRequested,
  initialName,
  initialDescription,
  initialDefaultTransactionFeeBearer,
}: Props) {
  const { mutate, isPending } = useMutation({
    mutationFn: async (values: BusinessFormValues) => {
      if (!businessId) throw new Error("Business ID tidak tersedia");
      return businessApi.updateBusiness(businessId, {
        name: values.name,
        description: values.description,
      });
    },
    onSuccess: () => {
      toast.success("Profil bisnis berhasil diperbarui");
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (e: AxiosError) => {
      const message =
        e.status === 409
          ? "Nama bisnis sudah ada"
          : (e.response?.data as any)?.message ||
            "Gagal menyimpan profil bisnis";
      toast.error(message);
    },
  });

  const handleSubmit = (values: BusinessFormValues) => {
    if (businessId) {
      mutate(values);
      return;
    }
    onCreateRequested?.({
      name: values.name,
      description: values.description,
      defaultTransactionFeeBearer:
        initialDefaultTransactionFeeBearer ?? "CUSTOMER",
    });
    onOpenChange(false);
  };

  const fields: FormFieldConfig<BusinessFormValues>[] = useMemo(
    () => [
      {
        name: "name",
        label: "Nama Bisnis",
        type: "text",
        placeholder: "Contoh: Laundry Bersih Jaya",
        icon: Building2,
        colSpan: "full" as const,
      },
      {
        name: "description",
        label: "Deskripsi",
        type: "textarea",
        placeholder: "Deskripsi singkat bisnis Anda",
        icon: FileText,
        colSpan: "full" as const,
      },
    ],
    []
  );

  const defaultValues: BusinessFormValues = {
    name: initialName || "",
    description: initialDescription || "",
  };

  return (
    <ReusableForm<BusinessFormValues>
      schema={businessSchema}
      fields={fields}
      defaultValues={defaultValues}
      onSubmit={handleSubmit}
      isLoading={isPending}
      submitText={businessId ? "Simpan Perubahan" : "Lanjut"}
      gridCols={1}
      withDialog
      isDialogOpen={open}
      onDialogOpenChange={onOpenChange}
      dialogTitle={
        businessId ? "Edit Profil Bisnis" : "Lengkapi Profil Bisnis"
      }
      dialogDescription="Isi informasi dasar bisnis Anda."
      resetFormOnClose
    />
  );
}
