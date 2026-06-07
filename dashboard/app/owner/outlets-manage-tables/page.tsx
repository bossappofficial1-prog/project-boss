"use client";

import { useOutletStore } from "@/stores/outlet.store";
import { TableManagement } from "@/features/outlet/components/table-management";
import { LayoutGrid, Users, FileText } from "lucide-react";
import { EmptyOutletState } from "@/components/ui/empty-outlet";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { useMemo, useState } from "react";
import { OutletTable } from "@/lib/apis/table";
import { FormFieldConfig, ReusableForm } from "@/components/ui/reuseable-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { TableFormValues, tableSchema, useTable } from "@/hooks/use-table";

const formFields: FormFieldConfig<TableFormValues>[] = [
    {
        name: 'name',
        label: 'Nama / Nomor Meja',
        type: 'text',
        placeholder: 'Misal: Meja 01, VIP 1',
        icon: LayoutGrid
    },
    {
        name: 'capacity',
        label: 'Kapasitas (Orang)',
        type: 'number',
        placeholder: 'Masukkan jumlah kursi',
        icon: Users
    },
    {
        name: 'note',
        label: 'Catatan / Instruksi',
        type: 'textarea',
        placeholder: 'Misal: pesan jemput ke kasir',
        icon: FileText
    }
]


export default function OutletTablesPage() {
    const { selectedOutlet, isLoading } = useOutletStore();
    const { createMutation, updateMutation, deleteMutation } = useTable()
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
    const [selectedTable, setSelectedTable] = useState<OutletTable | null>(null)
    const router = useRouter();

    const outletId = selectedOutlet?.id || ""

    const defaultValues = useMemo(() => {
        return selectedTable ?
            {
                name: selectedTable.name,
                capacity: selectedTable.capacity,
                note: selectedTable.note || ''
            }
            : { name: '', capacity: 2, note: '' }
    }, [selectedTable])

    const handleSubmit = async (values: TableFormValues) => {
        if (isEditModalOpen && selectedTable) {
            await updateMutation.mutateAsync({ id: selectedTable.id, payload: values }, {
                onSuccess: () => {
                    setIsEditModalOpen(false)
                    setSelectedTable(null)
                }
            })
        } else {
            await createMutation.mutateAsync({ payload: values, outletId }, {
                onSuccess: () => {
                    setIsAddModalOpen(false)
                }
            })
        }
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-20 w-full rounded-md" />
                <Skeleton className="h-[400px] w-full rounded-md" />
            </div>
        );
    }

    if (!selectedOutlet?.id) {
        return <EmptyOutletState onAddOutlet={() => router.push("/owner#add-outlet")} />;
    }

    return (
        <div className="space-y-4">
            <TableManagement
                onAdd={setIsAddModalOpen}
                onEdit={(table) => {
                    setSelectedTable(table)
                    setIsEditModalOpen(true)
                }}
                onDelete={(table) => {
                    setSelectedTable(table)
                    setIsDeleteModalOpen(true)
                }}
                outletId={selectedOutlet.id}
                outletSlug={selectedOutlet.slug}
                outletName={selectedOutlet.name}
            />

            {/* Add Table Form */}
            <ReusableForm
                schema={tableSchema}
                fields={formFields}
                defaultValues={defaultValues}
                onSubmit={handleSubmit}
                withDialog
                isDialogOpen={isAddModalOpen || isEditModalOpen}
                onDialogOpenChange={(open) => {
                    if (isEditModalOpen) {
                        setIsEditModalOpen(open)
                        setSelectedTable(null)
                    } else {
                        setIsAddModalOpen(open)
                    }
                }}
                dialogTitle={isEditModalOpen && selectedTable ? "Edit Meja" : "Tambah Meja Baru"}
                dialogDescription={isEditModalOpen && selectedTable ? `Perbarui informasi meja ${selectedTable.name}.` : "Masukkan informasi meja untuk outlet ini."}
                submitText={isEditModalOpen && selectedTable ? "Simpan Perubahan" : "Simpan Meja"}
                isLoading={isEditModalOpen && selectedTable ? updateMutation.isPending : createMutation.isPending}
            />

            {/* Delete Confirmation */}
            <ConfirmDialog
                open={isDeleteModalOpen}
                onOpenChange={setIsDeleteModalOpen}
                title="Hapus Meja?"
                description={
                    <div className="space-y-3">
                        <div>Apakah Anda yakin ingin menghapus meja <span className="font-bold text-foreground">{selectedTable?.name}</span>? Tindakan ini tidak dapat dibatalkan.</div>
                        <span className="block py-3 bg-amber-500/10 border border-amber-200/50 text-amber-600 text-xs">
                            Perhatian: Meja hanya dapat dihapus jika tidak ada pesanan aktif.
                        </span>
                    </div>
                }
                confirmLabel="Hapus Permanen"
                confirmVariant="destructive"
                onConfirm={() => { selectedTable && deleteMutation.mutate(selectedTable.id, { onSuccess: () => { setIsDeleteModalOpen(false); setSelectedTable(null); } }) }}
                confirmLoading={deleteMutation.isPending}
            />
        </div>
    );
}
