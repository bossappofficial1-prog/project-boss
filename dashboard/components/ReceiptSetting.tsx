import React, { useEffect, useMemo, useState, useCallback } from "react";
import { PrinterCheck, Loader2 } from "lucide-react";
import z from "zod";
import { useOutletContext } from "./providers/OutletProvider";
import { Button } from "./ui/button";
import { FormFieldConfig, ReusableForm } from "./ui/reuseable-form";
import { ReceiptSettingService, ReceiptSettingType } from "@/lib/apis/receipt-setting";
import { fileToBase64 } from "@/lib/utils";

export const updateReceiptSettingSchema = z.object({
    photoString: z.any().optional().nullable(),
    showLogo: z.enum(['ACTIVE', 'INACTIVE']),
    printHeight: z.coerce.number({
        message: "Tinggi wajib diisi dan harus berupa angka"
    }).positive("Tidak boleh nol atau negatif"),
    printWidth: z.coerce.number({
        message: "Lebar wajib diisi dan harus berupa angka"
    }).positive("Tidak boleh nol atau negatif"),
});

export type UpdateReceiptSettingValues = z.infer<typeof updateReceiptSettingSchema>;

export default function ReceiptSetting({ outletId }: { outletId?: string }) {
    // States
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFetching, setIsFetching] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [receiptData, setReceiptData] = useState<ReceiptSettingType | null>(null);

    const fetchSettings = useCallback(async (outletId: string) => {
        setIsFetching(true);
        try {
            const data = await ReceiptSettingService.getByOutlet(outletId);
            setReceiptData(data);
        } catch (error) {
            console.error("Failed to fetch receipt settings:", error);
        } finally {
            setIsFetching(false);
        }
    }, []);

    useEffect(() => {
        if (outletId) {
            fetchSettings(outletId);
        }
    }, [outletId, fetchSettings]);

    const defaultValues = useMemo(() => ({
        printHeight: receiptData?.printHeight || 0,
        printWidth: receiptData?.printWidth || 0,
        photoString: receiptData?.photoString || null,
        showLogo: receiptData?.showLogo ? 'ACTIVE' : 'INACTIVE',
    }), [receiptData]);

    const handleSubmit = async (values: any) => {
        if (!outletId) return;

        setIsSubmitting(true);
        try {
            const formData = values as FormData;
            const fileEntry = formData.get('photoString');

            const payload: any = {
                printHeight: formData.get('printHeight'),
                printWidth: formData.get('printWidth'),
                showLogo: formData.get('showLogo') === 'ACTIVE',
            };

            // Jika user mengupload file baru (File object), konversi ke base64
            if (fileEntry instanceof File && fileEntry.size > 0) {
                payload.photoString = await fileToBase64(fileEntry);
            } else if (typeof fileEntry === 'string') {
                // Jika tidak ada perubahan file, tetap gunakan string URL/Base64 lama
                payload.photoString = fileEntry;
            }

            const result = await ReceiptSettingService.update(outletId, payload);

            setReceiptData(result);
            setIsModalOpen(false);
        } catch (error) {
            console.error("Update failed:", error);
            throw error;
        } finally {
            setIsSubmitting(false);
        }
    };

    const fields: FormFieldConfig<UpdateReceiptSettingValues>[] = [
        {
            name: 'printHeight',
            label: 'Tinggi Kertas (mm)',
            type: 'number',
            placeholder: 'Contoh: 110',
            colSpan: 3
        },
        {
            name: 'printWidth',
            label: 'Lebar Kertas (mm)',
            type: 'number',
            placeholder: 'Contoh: 80',
            colSpan: 3
        },
        {
            name: 'showLogo',
            label: 'Tampilkan Logo di Struk',
            type: 'dual-option-switch',
            colSpan: 6,
            switchOptions: {
                right: { label: 'Aktif', value: 'ACTIVE' },
                left: { label: 'Nonaktif', value: 'INACTIVE' }
            }
        },
        {
            name: 'photoString',
            label: 'Upload Logo Baru',
            type: 'file',
            colSpan: 6,
            description: 'Format PNG/JPG transparan. Maks 300KB.',
            accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
            maxSizes: 300 * 1024,
            disabled: isSubmitting
        }
    ];

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                disabled={!outletId || isFetching}
                onClick={() => setIsModalOpen(true)}
                title="Pengaturan Cetak Struk"
            >
                {isFetching ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                    <PrinterCheck className="h-5 w-5 text-muted-foreground hover:text-primary transition-colors" />
                )}
            </Button>

            <ReusableForm
                key={isModalOpen ? 'open' : 'closed'}
                defaultValues={defaultValues}
                gridCols={6}
                dialogTitle="Pengaturan Struk"
                isDialogOpen={isModalOpen}
                onDialogOpenChange={!isSubmitting ? setIsModalOpen : undefined}
                withDialog
                onSubmit={handleSubmit}
                fields={fields}
                submitText={isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                schema={updateReceiptSettingSchema}
            />
        </>
    );
}