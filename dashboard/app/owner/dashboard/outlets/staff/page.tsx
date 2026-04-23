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
import { cn } from '@/lib/utils'

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

    const activeStaffCount = useMemo(() => staff.filter(s => s.status === 'ACTIVE').length, [staff])
    const inactiveStaffCount = useMemo(() => staff.filter(s => s.status === 'INACTIVE').length, [staff])

    if (!selectedOutlet) return <EmptyOutletState onAddOutlet={() => router.push('/owner/dashboard#add-outlet')} />;

    return (
        <div className="space-y-6 pb-12 animate-fade-in">
            {/* Solid & Clean Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border/80 bg-background -mx-6 px-6 pt-2">
                <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-md bg-muted text-foreground flex items-center justify-center border border-border shadow-sm">
                            <Users className="h-6 w-6" />
                        </div>
                        <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
                            Kelola Kasir
                        </h1>
                    </div>
                    <p className="text-sm text-muted-foreground font-medium max-w-2xl">
                        Atur petugas kasir untuk <span className="text-foreground font-bold">{outletName}</span>. Kelola akses masuk mereka ke sistem Point of Sale (POS).
                    </p>
                </div>

                <Button
                    type="button"
                    onClick={handleOpenCreate}
                    className="h-11 px-6 gap-3 font-black uppercase tracking-widest text-[10px] shadow-sm border border-primary/20 transition-all hover:bg-primary/90"
                >
                    <UserPlus className="h-4 w-4" /> Tambah Kasir Baru
                </Button>
            </div>

            {/* Solid Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Kasir Terdaftar", value: staff.length, icon: Users, color: "text-foreground", bg: "bg-muted/50", border: "border-border" },
                    { label: "Kasir Aktif", value: activeStaffCount, icon: UserPlus, color: "text-emerald-600", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
                    { label: "Kasir Nonaktif", value: inactiveStaffCount, icon: Users, color: "text-rose-600", bg: "bg-rose-500/10", border: "border-rose-500/20" }
                ].map((stat, idx) => (
                    <div key={idx} className={cn(
                        "flex items-center gap-4 p-4 rounded-md border bg-card shadow-sm transition-all hover:shadow-md",
                        stat.border
                    )}>
                        <div className={`h-12 w-12 rounded-md ${stat.bg} ${stat.color} flex items-center justify-center border border-current/10`}>
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <div className="space-y-0.5">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.label}</p>
                            <p className="text-2xl font-black tracking-tighter text-foreground">{stat.value} Petugas</p>
                        </div>
                    </div>
                ))}
            </div>

            <div className="rounded-md border border-border/80 bg-background shadow-sm overflow-hidden">
                <div className="p-4 border-b border-border/40 bg-muted/30">
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Database Petugas Kasir</p>
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
                title="Hapus Akun Kasir?"
                description={deletingStaff ? `Apakah Anda yakin ingin menghapus akses kasir ${deletingStaff.name}? Kasir ini tidak akan bisa login lagi ke sistem POS.` : undefined}
                confirmLabel="Hapus Akses"
                confirmVariant="destructive"
                confirmLoading={isDeleting}
                onConfirm={handleDelete}
            />
        </div>
    )
}
