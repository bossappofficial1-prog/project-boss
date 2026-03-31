'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Users,
    UserPlus,
} from 'lucide-react'
import { toast } from 'sonner'

import { useOutletContext } from '@/components/providers/OutletProvider'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { staffApi } from '@/lib/api'
import type { StaffMember, CreateStaffPayload } from '@/types/staff'
import { StaffDialog } from '@/components/features/owner/staff/StaffModal'
import { StaffTable } from '@/components/features/owner/staff/StaffTable'
import { EmptyOutletState } from '@/components/ui/empty-outlet'
import { useRouter } from 'next/navigation'

export default function StaffManagementPage() {
    const { selectedOutlet } = useOutletContext()
    const [staff, setStaff] = useState<StaffMember[]>([])
    const router = useRouter()
    const [, setIsLoading] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [editingStaff, setEditingStaff] = useState<StaffMember | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [deletingStaff, setDeletingStaff] = useState<StaffMember | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)

    const outletName = useMemo(() => selectedOutlet?.name ?? 'Outlet tidak dipilih', [selectedOutlet?.name])

    const loadStaff = useCallback(async () => {
        if (!selectedOutlet?.id) {
            setStaff([])
            return
        }

        try {
            setIsLoading(true)
            const results = await staffApi.listByOutlet(selectedOutlet.id)
            setStaff(results)
        } catch (error) {
            console.error('Failed to load staff list', error)
            toast.error((error as Error).message ?? 'Gagal memuat data staff')
        } finally {
            setIsLoading(false)
        }
    }, [selectedOutlet?.id])

    useEffect(() => {
        loadStaff()
    }, [loadStaff])


    const resetForm = () => {
        setEditingStaff(null)
    }

    const handleOpenCreate = () => {
        resetForm()
        setModalMode('create')
        setIsModalOpen(true)
    }

    const handleOpenEdit = (member: StaffMember) => {
        setModalMode('edit')
        setEditingStaff(member)
        setIsModalOpen(true)
    }

    const handleSubmit = async (payload: any) => {
        if (!selectedOutlet?.id) return

        if (modalMode === 'create') {
            const payloads: CreateStaffPayload = {
                ...payload,
                outletId: selectedOutlet.id,
            }
            await staffApi.create(payloads)
            toast.success('Staff berhasil ditambahkan')
        } else if (editingStaff) {
            await staffApi.update(editingStaff.id, payload)
            toast.success('Data staff berhasil diperbarui')
        }
        try {
            setIsSubmitting(true)

            setIsModalOpen(false)
            resetForm()
            await loadStaff()
        } catch (error) {
            console.error('Failed to submit staff form', error)
            toast.error((error as Error).message ?? 'Gagal menyimpan data staff')
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleDelete = async () => {
        if (!deletingStaff) {
            return false
        }

        try {
            setIsDeleting(true)
            await staffApi.delete(deletingStaff.id)
            toast.success('Staff berhasil dihapus')
            setDeletingStaff(null)
            await loadStaff()
            return true
        } catch (error) {
            console.error('Failed to delete staff', error)
            toast.error((error as Error).message ?? 'Gagal menghapus staff')
            return false
        } finally {
            setIsDeleting(false)
        }
    }

    if (!selectedOutlet) return <EmptyOutletState onAddOutlet={() => router.push('/owner/dashboard#add-outlet')} />;

    return (
        <div className="space-y-6 pb-12">
            <section className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Kelola Staff</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Atur daftar staff layanan untuk {outletName}. Tambahkan anggota tim, ubah peran, dan atur status keaktifan mereka.
                </p>
            </section>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-end">
                <Button type="button" onClick={handleOpenCreate} className="inline-flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Tambah Staff
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                    <span>Total staff: {staff.length}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Outlet: {outletName}</span>
                </div>
                <StaffTable
                    data={staff}
                    onDelete={(member) => {
                        setDeletingStaff(member)
                        setIsDeleteDialogOpen(true)
                    }}
                    onEdit={(member) => {
                        handleOpenEdit(member)
                    }}
                />
            </div>

            <StaffDialog
                onSubmit={handleSubmit}
                initialData={editingStaff as any}
                isOpen={isModalOpen}
                onOpenChange={(open) => !isSubmitting && setIsModalOpen(open)}
                modalMode={modalMode}

            />

            <ConfirmDialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        setDeletingStaff(null)
                    }
                    setIsDeleteDialogOpen(open)
                }}
                title="Hapus staff?"
                description={deletingStaff ? `Staff ${deletingStaff.name} tidak akan bisa dijadwalkan lagi setelah dihapus.` : undefined}
                confirmLabel="Hapus"
                confirmVariant="destructive"
                confirmLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </div>
    )
}
