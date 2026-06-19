"use client";

import { z } from "zod";
import { ReusableForm, FormFieldConfig } from "@/components/ui/reuseable-form";
import { TableAvailabilityPicker } from "@/features/reservations";
import { gooeyToast } from "goey-toast";
import { format, getDay } from "date-fns";
import { useCreateReservation } from "@/hooks/api/use-reservations";
import { useOperatingHours } from "@/hooks/use-operating-hours";

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
    bookingDate: z.coerce.date({
        message: "Tanggal reservasi wajib dipilih",
    }),
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

const DAY_NAMES = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

const TIME_SLOTS = Array.from({ length: 47 }, (_, i) => {
    const totalMinutes = 30 + i * 30;
    const h = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
    const m = (totalMinutes % 60).toString().padStart(2, "0");
    return { label: `${h}:${m}`, value: `${h}:${m}` };
});

export function ReservationForm({
    outletId,
    isOpen,
    onOpenChange,
    onSuccess,
}: ReservationFormProps) {
    const { data: operatingHours = [] } = useOperatingHours(outletId);

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
            options: TIME_SLOTS,
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

                const day = date ? getDay(new Date(date)) : -1;
                const hours = operatingHours.find((h: any) => h.dayOfWeek === day);

                return (
                    <div className="space-y-2">
                        {date && hours && !hours.isOpen && (
                            <p className="text-xs text-destructive">{DAY_NAMES[day]}: Outlet tutup</p>
                        )}
                        {date && hours?.isOpen && (
                            <p className="text-xs text-muted-foreground">
                                Jam operasional {DAY_NAMES[day]}:{" "}
                                {format(new Date(hours.openTime), "HH:mm")} –{" "}
                                {format(new Date(hours.closeTime), "HH:mm")}
                            </p>
                        )}
                        {date && !hours && operatingHours.length > 0 && (
                            <p className="text-xs text-muted-foreground">
                                {DAY_NAMES[day]}: Tidak ada jam operasional
                            </p>
                        )}
                        <TableAvailabilityPicker
                            outletId={outletId}
                            date={date}
                            time={time}
                            duration={duration}
                            value={field.value as string}
                            onChange={field.onChange}
                        />
                    </div>
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

    const createMutation = useCreateReservation();

    const handleSubmit = async (values: ReservationFormValues) => {
        try {
            const dateObj = new Date(values.bookingDate);
            const dateStr = format(dateObj, "yyyy-MM-dd");
            const timeStr = values.bookingTime;
            const bookingDateTime = new Date(`${dateStr}T${timeStr}:00`);

            const payload = {
                customerName: values.customerName,
                customerPhone: values.customerPhone,
                bookingDate: bookingDateTime.toISOString(),
                durationMinutes: values.durationMinutes,
                guestCount: values.guestCount,
                tableId: values.tableId,
                notes: values.notes || "",
                outletId: outletId,
            };

            await createMutation.mutateAsync(payload);
            gooeyToast.success("Reservasi berhasil dibuat");
            onSuccess?.();
        } catch (error: any) {
            gooeyToast.error(error?.response?.data?.message || "Gagal membuat reservasi");
            throw error;
        }
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
