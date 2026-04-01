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
import { SectionHeader } from '@/components/ui/section-header'

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
            <SectionHeader
                title='Kelola Staff'
                description={`Atur daftar staff layanan untuk ${outletName}. Tambahkan anggota tim, ubah peran, dan atur status keaktifan mereka.`}
                actions={
                    <Button type="button" onClick={handleOpenCreate} className="inline-flex items-center gap-2">
                        <UserPlus className="h-4 w-4" /> Tambah Staff
                    </Button>
                }
            />
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
