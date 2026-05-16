"use client";

import { z } from "zod";
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form";
import { TableAvailabilityPicker } from "@/components/cashier/reservations/table-availability-picker";

interface ReservationFormProps {
    outletId: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

const schema = z.object({
    customerName: z.string().min(1, "Nama tamu wajib diisi"),
    customerPhone: z
        .string()
        .min(10, "Nomor telepon minimal 10 digit")
        .max(15, "Nomor telepon terlalu panjang"),
    bookingDate: z.date("Tanggal reservasi wajib dipilih"),
    bookingTime: z.string().min(1, "Jam reservasi wajib dipilih"),
    durationMinutes: z
        .number("Durasi wajib diisi")
        .min(30, "Durasi minimal 30 menit")
        .max(480, "Durasi maksimal 8 jam"),
    guestCount: z
        .number("Jumlah tamu wajib diisi")
        .min(1, "Minimal 1 tamu")
        .max(20, "Maksimal 20 tamu"),
    tableId: z.string().min(1, "Pilih meja terlebih dahulu"),
    notes: z.string().optional(),
});

type ReservationFormValues = z.infer<typeof schema>;

const TIME_OPTIONS = Array.from({ length: 26 }, (_, i) => {
    const totalMinutes = 8 * 60 + i * 30; // mulai 08:00, interval 30 menit
    const h = Math.floor(totalMinutes / 60)
        .toString()
        .padStart(2, "0");
    const m = (totalMinutes % 60).toString().padStart(2, "0");
    return { label: `${h}:${m}`, value: `${h}:${m}` };
}); // 08:00 – 21:00

export function ReservationForm({
    outletId,
    isOpen,
    onOpenChange,
    onSuccess,
}: ReservationFormProps) {
    const fields: FormFieldConfig<ReservationFormValues>[] = [
        {
            name: "customerName",
            label: "Nama Tamu",
            type: "text",
            placeholder: "Contoh: Budi Santoso",
            colSpan: 1,
        },
        {
            name: "customerPhone",
            label: "Nomor Telepon",
            type: "tel",
            placeholder: "08xxxxxxxxxx",
            colSpan: 1,
        },
        {
            name: "bookingDate",
            label: "Tanggal Reservasi",
            type: "date",
            colSpan: 1,
        },
        {
            name: "bookingTime",
            label: "Jam Mulai",
            type: "select",
            placeholder: "Pilih jam",
            options: TIME_OPTIONS,
            colSpan: 1,
        },
        {
            name: "durationMinutes",
            label: "Durasi (menit)",
            type: "number",
            placeholder: "Contoh: 90",
            colSpan: 1,
        },
        {
            name: "guestCount",
            label: "Jumlah Tamu",
            type: "number",
            placeholder: "Contoh: 4",
            colSpan: 1,
        },
        {
            name: "tableId",
            label: "Pilih Meja",
            type: "custom",
            colSpan: 2,
            renderCustom: ({ field, form }) => {
                const date = form.watch("bookingDate");
                const time = form.watch("bookingTime");
                const duration = form.watch("durationMinutes");

                return (
                    <TableAvailabilityPicker
                        outletId={outletId}
                        date={date}
                        time={time}
                        duration={duration}
                        value={field.value as string}
                        onChange={field.onChange}
                    />
                );
            },
        },
        {
            name: "notes",
            label: "Catatan",
            type: "textarea",
            placeholder: "Permintaan khusus, alergi, dekorasi, dsb. (opsional)",
            colSpan: 2,
        },
    ];

    const handleSubmit = async (values: ReservationFormValues) => {
        // TODO: replace dengan API call
        console.log("Reservasi dibuat:", values);
        onSuccess?.();
    };

    return (
        <ReusableForm
            schema={schema}
            defaultValues={{
                customerName: "",
                customerPhone: "",
                bookingDate: undefined as any,
                bookingTime: "",
                durationMinutes: 60,
                guestCount: 2,
                tableId: "",
                notes: "",
            }}
            fields={fields}
            gridCols={2}
            onSubmit={handleSubmit}
            submitText="Buat Reservasi"
            loadingText="Menyimpan..."
            withDialog
            isDialogOpen={isOpen}
            onDialogOpenChange={onOpenChange}
            dialogTitle="Buat Reservasi Meja"
            dialogDescription="Isi detail reservasi. Pembayaran dilakukan saat tamu datang."
            cancelText="Batal"
        />
    );
}