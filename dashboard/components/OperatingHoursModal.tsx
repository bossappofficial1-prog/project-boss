'use client';

import { useEffect, useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useOperatingHours, useUpsertOperatingHours } from '@/hooks/useOperatingHours';
import OperatingHoursManager from './ui/OperatingHoursManager';
import { OperatingHours, OperatingHoursFormData } from '@/types/dashboard';
import { parseOperatingHours } from '@/lib/utils';

interface OperatingHoursModalProps {
    isOpen: boolean;
    onClose: () => void;
    outletId: string;
    onSuccess?: () => void;
}

const DAYS = [
    { value: 0, label: 'Senin' },
    { value: 1, label: 'Selasa' },
    { value: 2, label: 'Rabu' },
    { value: 3, label: 'Kamis' },
    { value: 4, label: 'Jumat' },
    { value: 5, label: 'Sabtu' },
    { value: 6, label: 'Minggu' },
];

export default function OperatingHoursModal({
    isOpen,
    onClose,
    outletId,
    onSuccess
}: OperatingHoursModalProps) {
    const [operatingHoursData, setOperatingHoursData] = useState<Record<number, OperatingHoursFormData>>({});
    const [isSaving, setIsSaving] = useState(false);
    const { data, isLoading, error } = useOperatingHours(outletId);
    const upsertMutation = useUpsertOperatingHours();

    // Fetch data saat modal dibuka
    useEffect(() => {
        if (!isOpen) return;

        // Jika data berhasil dimuat
        if (data && Array.isArray(data)) {
            const hoursMap = parseOperatingHours(data as unknown as OperatingHours[]);
            setOperatingHoursData(hoursMap);
        }
    }, [data, isLoading, isOpen]);

    const getDayLabel = (dayKey: number) => {
        return DAYS.find(d => d.value === dayKey)?.label || dayKey;
    };

    const handleSave = async () => {
        if (!operatingHoursData || Object.keys(operatingHoursData).length === 0) return;

        // Validasi
        for (const hour of Object.values(operatingHoursData)) {
            if (hour.isOpen && hour.openTime >= hour.closeTime) {
                toast.error(`Jam buka harus lebih kecil dari jam tutup untuk ${getDayLabel(hour.dayOfWeek)}`);
                return;
            }
        }

        setIsSaving(true);
        try {
            // 2. Handle operating hours if any changes exist
            const hasOperatingHoursChanges = Object.values(operatingHoursData).some(
                (data: OperatingHoursFormData) => data.isOpen !== undefined
            )
            if (hasOperatingHoursChanges) {
                await upsertMutation.mutateAsync({
                    outletId,
                    hours: Object.values(operatingHoursData).map(hour => ({
                        openTime: new Date(`1970-01-01T${hour.openTime}:00`),
                        closeTime: new Date(`1970-01-01T${hour.closeTime}:00`),
                        dayOfWeek: hour.dayOfWeek,
                        isOpen: hour.isOpen,
                    }))
                })
            }

            toast.success('Jam operasional berhasil disimpan');
            onSuccess?.();
            onClose();
        } catch (error) {
            toast.error('Gagal menyimpan jam operasional');
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Jam Operasional</DialogTitle>
                    <DialogDescription>
                        Atur jam buka dan tutup untuk setiap hari operasional outlet Anda
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Loading State */}
                    {isLoading && (
                        <div className="flex items-center justify-center py-8">
                            <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-muted-foreground">Memuat jam operasional...</p>
                            </div>
                        </div>
                    )}

                    {/* Error State */}
                    {error && !isLoading && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                            <p className="text-sm text-red-700 dark:text-red-300">
                                Gagal memuat jam operasional. Menggunakan data default.
                            </p>
                        </div>
                    )}

                    {/* Content */}
                    {!isLoading && (
                        <OperatingHoursManager
                            outletId={outletId}
                            onOperatingHoursChange={(data) => { console.log(data); setOperatingHoursData(data) }}
                            operatingHoursData={operatingHoursData} />
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose}>
                        Batal
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || isLoading}
                        className="flex items-center gap-2"
                    >
                        <Save size={18} />
                        {isSaving ? 'Menyimpan...' : 'Simpan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
