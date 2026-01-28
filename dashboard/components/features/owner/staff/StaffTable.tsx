'use client'

import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { StaffMember, StaffRole, StaffStatus } from "@/types/staff";
import { Edit2, KeyRound, Mail, MapPin, NotebookPen, Phone, Trash2 } from "lucide-react";

const ROLE_OPTIONS: Array<{ value: StaffRole; label: string }> = [
    { value: 'CASHIER', label: 'Kasir' },
    { value: 'ADMIN', label: 'Admin Outlet' }
]


const STATUS_BADGE_CLASS: Record<StaffStatus, string> = {
    ACTIVE: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    INACTIVE: 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
}

const ROLE_BADGE_CLASS: Record<StaffRole, string> = {
    CASHIER: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    ADMIN: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
}

const STATUS_OPTIONS: Array<{ value: StaffStatus; label: string }> = [
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'INACTIVE', label: 'Nonaktif' },
]

const ROLE_LABEL: Record<StaffRole, string> = ROLE_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label
    return acc
}, {} as Record<StaffRole, string>)

const STATUS_LABEL: Record<StaffStatus, string> = STATUS_OPTIONS.reduce((acc, option) => {
    acc[option.value] = option.label
    return acc
}, {} as Record<StaffStatus, string>)

type StaffTableProps = {
    data: StaffMember[]
    onEdit: (data: StaffMember) => void
    onDelete: (data: StaffMember) => void
}

export function StaffTable({
    data,
    onDelete,
    onEdit
}: StaffTableProps) {

    return <DataTable
        data={data}
        columns={[
            {
                accessorKey: 'id',
                header: 'Nama & Catatan',
                cell(props) {
                    const member = props.row.original
                    return (
                        <>
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
                        </>
                    )
                },
            },
            {
                accessorKey: 'phone',
                header: 'Kontak',
                cell(props) {
                    const member = props.row.original
                    return (
                        <>
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
                        </>
                    )
                },
            },
            {
                accessorKey: 'status',
                header: 'Status',
                cell(props) {
                    const member = props.row.original
                    return (
                        <>
                            <Badge className={`${STATUS_BADGE_CLASS[member.status]} font-medium`}>{STATUS_LABEL[member.status]}</Badge>
                        </>
                    )
                },
            },
        ]}
        actionViewType="flex"
        rowActions={() => [
            {
                icon: Edit2,
                variant: 'ghost',
                onClick: (row) => { onEdit(row) }
            },
            {
                icon: Trash2,
                variant: 'ghost',
                onClick: (row) => { onDelete(row) },
                className: 'text-red-500 hover:text-red-600'
            }
        ]}
    />
}