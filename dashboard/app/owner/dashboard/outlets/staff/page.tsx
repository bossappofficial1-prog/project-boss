'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
    Users,
    UserPlus,
    RefreshCw,
    Loader2,
    Phone,
    Mail,
    MapPin,
    NotebookPen,
    Edit2,
    Trash2,
} from 'lucide-react'
import { toast } from 'sonner'

import { useOutletContext } from '@/components/providers/OutletProvider'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { staffApi } from '@/lib/api'
import type { StaffMember, StaffRole, StaffStatus, CreateStaffPayload, UpdateStaffPayload } from '@/types/staff'

type StaffFormState = {
    name: string
    phone: string
    email: string
    address: string
    notes: string
    role: StaffRole
    status: StaffStatus
}

const DEFAULT_FORM: StaffFormState = {
    name: '',
    phone: '',
    email: '',
    address: '',
    notes: '',
    role: 'SERVICE',
    status: 'ACTIVE',
}

const ROLE_OPTIONS: Array<{ value: StaffRole; label: string }> = [
    { value: 'SERVICE', label: 'Staff Layanan' },
    { value: 'CASHIER', label: 'Kasir' },
    { value: 'ADMIN', label: 'Admin Outlet' },
    { value: 'INVENTORY', label: 'Gudang / Inventory' },
    { value: 'OTHER', label: 'Peran Lainnya' },
]

const STATUS_OPTIONS: Array<{ value: StaffStatus; label: string }> = [
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'INACTIVE', label: 'Nonaktif' },
    { value: 'ON_LEAVE', label: 'Cuti / Izin' },
]

const STATUS_BADGE_CLASS: Record<StaffStatus, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    INACTIVE: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    ON_LEAVE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const ROLE_BADGE_CLASS: Record<StaffRole, string> = {
    SERVICE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    CASHIER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    INVENTORY: 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300',
    OTHER: 'bg-slate-100 text-slate-700 dark:bg-slate-800/40 dark:text-slate-300',
}

const ROLE_LABEL: Record<StaffRole, string> = ROLE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label
    return acc
}, {} as Record<StaffRole, string>)

const STATUS_LABEL: Record<StaffStatus, string> = STATUS_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label
    return acc
}, {} as Record<StaffStatus, string>)

const sanitizeOptional = (value: string) => {
    const trimmed = value.trim()
    return trimmed === '' ? undefined : trimmed
}

export default function StaffManagementPage() {
    const { selectedOutlet } = useOutletContext()
    const [staff, setStaff] = useState<StaffMember[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
    const [formState, setFormState] = useState<StaffFormState>(DEFAULT_FORM)
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

    const filteredStaff = useMemo(() => {
        if (!searchTerm.trim()) return staff
        const query = searchTerm.trim().toLowerCase()
        return staff.filter((member) => {
            return [
                member.name,
                member.email ?? '',
                member.phone ?? '',
                ROLE_LABEL[member.role],
                STATUS_LABEL[member.status],
            ]
                .join(' ')
                .toLowerCase()
                .includes(query)
        })
    }, [staff, searchTerm])

    const resetForm = () => {
        setFormState(DEFAULT_FORM)
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
        setFormState({
            name: member.name,
            phone: member.phone ?? '',
            email: member.email ?? '',
            address: member.address ?? '',
            notes: member.notes ?? '',
            role: member.role,
            status: member.status,
        })
        setIsModalOpen(true)
    }

    const validateForm = (): string | null => {
        if (!formState.name.trim()) {
            return 'Nama staff wajib diisi'
        }

        if (formState.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim())) {
            return 'Format email tidak valid'
        }

        if (formState.phone && !/^([+]?\d){6,15}$/.test(formState.phone.trim())) {
            return 'Nomor telepon tidak valid'
        }

        return null
    }

    const handleSubmit = async () => {
        if (!selectedOutlet?.id) return

        const validation = validateForm()
        if (validation) {
            toast.error(validation)
            return
        }

        const commonFields = {
            name: formState.name.trim(),
            role: formState.role,
            status: formState.status,
            phone: sanitizeOptional(formState.phone),
            email: sanitizeOptional(formState.email),
            address: sanitizeOptional(formState.address),
            notes: sanitizeOptional(formState.notes),
        } satisfies UpdateStaffPayload & Pick<CreateStaffPayload, 'name' | 'role' | 'status' | 'phone' | 'email' | 'address' | 'notes'>

        try {
            setIsSubmitting(true)
            if (modalMode === 'create') {
                const payload: CreateStaffPayload = {
                    ...commonFields,
                    outletId: selectedOutlet.id,
                }
                await staffApi.create(payload)
                toast.success('Staff berhasil ditambahkan')
            } else if (editingStaff) {
                const payload: UpdateStaffPayload = { ...commonFields }
                await staffApi.update(editingStaff.id, payload)
                toast.success('Data staff berhasil diperbarui')
            }

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

    if (!selectedOutlet) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
                <Users className="h-10 w-10 text-red-500" />
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">Pilih outlet terlebih dahulu</p>
                <p className="max-w-sm text-sm text-slate-600 dark:text-slate-400">
                    Kelola staff outlet aktif akan muncul setelah kamu memilih outlet.
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-12">
            <section className="space-y-2">
                <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Kelola Staff</h1>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                    Atur daftar staff layanan untuk {outletName}. Tambahkan anggota tim, ubah peran, dan atur status keaktifan mereka.
                </p>
            </section>

            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-3">
                    <Input
                        value={searchTerm}
                        onChange={(event) => setSearchTerm(event.target.value)}
                        placeholder="Cari nama, peran, atau kontak..."
                        className="w-full md:w-72"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        onClick={loadStaff}
                        disabled={isLoading}
                        className="flex items-center gap-2"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Muat Ulang
                    </Button>
                </div>

                <Button type="button" onClick={handleOpenCreate} className="inline-flex items-center gap-2">
                    <UserPlus className="h-4 w-4" /> Tambah Staff
                </Button>
            </div>

            <div className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900/60">
                <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700 dark:border-slate-800 dark:bg-slate-900/40 dark:text-slate-200">
                    <span>Total staff: {staff.length}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">Outlet: {outletName}</span>
                </div>

                {isLoading ? (
                    <div className="flex items-center justify-center gap-2 px-4 py-16 text-sm text-slate-500 dark:text-slate-400">
                        <Loader2 className="h-4 w-4 animate-spin" /> Memuat data staff...
                    </div>
                ) : filteredStaff.length === 0 ? (
                    <div className="px-4 py-16 text-center text-sm text-slate-500 dark:text-slate-400">
                        Belum ada staff yang tercatat atau tidak ada yang cocok dengan pencarian.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[28%]">Nama & Catatan</TableHead>
                                <TableHead className="w-[25%]">Kontak</TableHead>
                                <TableHead className="w-[20%]">Peran</TableHead>
                                <TableHead className="w-[15%]">Status</TableHead>
                                <TableHead className="w-[12%] text-right">Aksi</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredStaff.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <div className="font-semibold text-slate-900 dark:text-slate-100">{member.name}</div>
                                        {member.address && (
                                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <MapPin className="h-3.5 w-3.5" />
                                                {member.address}
                                            </p>
                                        )}
                                        {member.notes && (
                                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                                <NotebookPen className="h-3.5 w-3.5" />
                                                {member.notes}
                                            </p>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                                            {member.phone ? (
                                                <p className="flex items-center gap-2">
                                                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{member.phone}</span>
                                                </p>
                                            ) : (
                                                <p className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Phone className="h-3.5 w-3.5" />
                                                    <span>Belum diisi</span>
                                                </p>
                                            )}
                                            {member.email ? (
                                                <p className="flex items-center gap-2">
                                                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                                                    <span>{member.email}</span>
                                                </p>
                                            ) : (
                                                <p className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Mail className="h-3.5 w-3.5" />
                                                    <span>Belum diisi</span>
                                                </p>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${ROLE_BADGE_CLASS[member.role]} font-medium`}>{ROLE_LABEL[member.role]}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={`${STATUS_BADGE_CLASS[member.status]} font-medium`}>{STATUS_LABEL[member.status]}</Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center justify-end gap-2">
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                onClick={() => handleOpenEdit(member)}
                                                aria-label={`Edit ${member.name}`}
                                            >
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                type="button"
                                                size="icon"
                                                variant="ghost"
                                                className="text-red-500 hover:text-red-600"
                                                onClick={() => {
                                                    setDeletingStaff(member)
                                                    setIsDeleteDialogOpen(true)
                                                }}
                                                aria-label={`Hapus ${member.name}`}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </div>

            <Dialog open={isModalOpen} onOpenChange={(open) => !isSubmitting && setIsModalOpen(open)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{modalMode === 'create' ? 'Tambah Staff Baru' : 'Edit Data Staff'}</DialogTitle>
                        <DialogDescription>
                            {modalMode === 'create'
                                ? 'Masukkan informasi staff untuk outlet ini. Staff aktif dapat dijadwalkan pada slot layanan.'
                                : `Perbarui informasi ${editingStaff?.name} sesuai kebutuhan.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Nama *</label>
                            <Input
                                value={formState.name}
                                onChange={(event) => setFormState((prev) => ({ ...prev, name: event.target.value }))}
                                placeholder="Nama lengkap staff"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Nomor Telepon</label>
                                <Input
                                    value={formState.phone}
                                    onChange={(event) => setFormState((prev) => ({ ...prev, phone: event.target.value }))}
                                    placeholder="Contoh: 081234567890"
                                />
                            </div>
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Email</label>
                                <Input
                                    type="email"
                                    value={formState.email}
                                    onChange={(event) => setFormState((prev) => ({ ...prev, email: event.target.value }))}
                                    placeholder="staff@contoh.com"
                                />
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Peran</label>
                                <Select
                                    value={formState.role}
                                    onValueChange={(value: StaffRole) => setFormState((prev) => ({ ...prev, role: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih peran" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {ROLE_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div>
                                <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Status</label>
                                <Select
                                    value={formState.status}
                                    onValueChange={(value: StaffStatus) => setFormState((prev) => ({ ...prev, status: value }))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_OPTIONS.map((option) => (
                                            <SelectItem key={option.value} value={option.value}>
                                                {option.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Alamat</label>
                            <Textarea
                                value={formState.address}
                                onChange={(event) => setFormState((prev) => ({ ...prev, address: event.target.value }))}
                                rows={2}
                                placeholder="Alamat atau lokasi bertugas"
                            />
                        </div>

                        <div>
                            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-200">Catatan</label>
                            <Textarea
                                value={formState.notes}
                                onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
                                rows={2}
                                placeholder="Informasi tambahan seperti keahlian atau jadwal khusus"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-3">
                        <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>
                            Batal
                        </Button>
                        <Button type="button" onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-2">
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {modalMode === 'create' ? 'Simpan Staff' : 'Simpan Perubahan'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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
