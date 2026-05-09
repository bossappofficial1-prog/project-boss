import { Input } from "@/components/ui/input";
import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";
import { useMemo } from "react";
import { z } from "zod";

export const StaffStatusEnum = z.enum(["ACTIVE", "INACTIVE"]);

export const staffSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter").max(50, "Nama maksimal 50 karakter"),

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
    .regex(/^[^@]*$/, "Username tidak boleh mengandung @")
    .optional()
    .nullable()
    .or(z.literal("")),

  domain: z.literal("@bossapp.id").default("@bossapp.id"),

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
export const updateStaffSchema = staffSchema
  .extend({
    password: z.string().min(6).optional().or(z.literal("")),
  })
  .partial();

export type UpdateStaffSchemaValues = z.infer<typeof updateStaffSchema>;

const getStaffSchema = (isEditMode: boolean) =>
  z.object({
    name: z.string().min(2, "Nama minimal 2 karakter"),
    phone: z
      .string()
      .optional()
      .refine((val) => !val || /^(\+62|62|0)8\d{8,12}$/.test(val), "Nomor telepon tidak valid"),
    email: z
      .string()
      .regex(/^[^@]*$/, "Username tidak boleh mengandung @")
      .optional(),
    status: StaffStatusEnum,
    address: z.string().optional(),
    notes: z.string().optional(),
    password: z.string().optional(),
  });

interface StaffDialogProps {
  modalMode: "create" | "edit";
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
  isLoading,
}: StaffDialogProps) {
  const isEditMode = modalMode === "edit";

  const schema = useMemo(() => getStaffSchema(isEditMode), [isEditMode]);

  const defaultValues = useMemo(() => {
    if (isEditMode && initialData) {
      return {
        ...initialData,
        email: initialData.email?.split("@")[0] || "",
        password: "",
      } as StaffFormValues;
    }
    return {
      name: "",
      status: "ACTIVE" as const,
      phone: "",
      email: "",
      domain: "@bossapp.id",
      password: "",
    } satisfies StaffFormValues;
  }, [initialData, isEditMode]);

  const fields: FormFieldConfig<StaffFormValues>[] = [
    {
      name: "name",
      label: "Nama Lengkap",
      placeholder: "Contoh: Budi Santoso",
      colSpan: "full",
    },
    {
      name: "phone",
      label: "Nomor Telepon",
      type: `tel`,
      placeholder: "08xx-xxxx-xxxx",
      colSpan: 3,
    },
    {
      name: "email",
      label: "Alamat Email",
      type: `custom`,
      placeholder: "kasir",
      colSpan: 3,
      renderCustom(props) {
        const {} = props;

        return (
          <div className="flex">
            <Input
              className="rounded-r-none"
              {...props.field}
              value={(props.field.value as string)?.split("@")[0] || ""}
              placeholder="kasir"
              onChange={(e) => {
                const value = e.target.value.split("@")[0];
                props.field.onChange(value);
              }}
            />
            <Input className="rounded-l-none" value="@bossapp.id" disabled />
          </div>
        );
      },
    },
    {
      name: "status",
      label: "Status Akses",
      placeholder: "Pilih Status Keaktifan",
      type: "select",
      colSpan: "full",
      options: [
        { label: "Aktif (Dapat Login)", value: "ACTIVE" },
        { label: "Nonaktif (Akses Dicabut)", value: "INACTIVE" },
      ],
    },
    {
      name: "password",
      label: "Kata Sandi Kasir",
      type: "password",
      colSpan: "full",
      placeholder: isEditMode
        ? "Biarkan kosong jika tidak ingin mengubah"
        : "Minimal 6 karakter kombinasi",
      description: "Kredensial ini digunakan kasir untuk masuk ke aplikasi Point of Sale (POS).",
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
      dialogTitle={isEditMode ? "Perbarui Akun Kasir" : "Registrasi Kasir Baru"}
      submitText={isEditMode ? "Simpan Perubahan" : "Daftarkan Kasir"}
      dialogDescription="Lengkapi detail akun kasir di bawah ini. Email dan kata sandi akan digunakan petugas untuk masuk ke sistem transaksi POS."
    />
  );
}
