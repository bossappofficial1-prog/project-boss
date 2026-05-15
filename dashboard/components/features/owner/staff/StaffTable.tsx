import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { StaffMember, StaffRole, StaffStatus } from "@/types/staff";
import { Edit2, Mail, MapPin, NotebookPen, Phone, Trash2, User } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

const ROLE_OPTIONS: Array<{ value: StaffRole; label: string }> = [
    { value: 'CASHIER', label: 'Kasir' },
    { value: 'ADMIN', label: 'Admin Outlet' }
]


const STATUS_BADGE_CLASS: Record<StaffStatus, string> = {
    ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 shadow-none',
    INACTIVE: 'bg-muted text-muted-foreground border-border shadow-none'
}

const STATUS_OPTIONS: Array<{ value: StaffStatus; label: string }> = [
    { value: 'ACTIVE', label: 'Aktif' },
    { value: 'INACTIVE', label: 'Nonaktif' },
]

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
        title="Database Petugas Kasir"
        data={data}
        columns={[
            {
                accessorKey: 'name',
                header: 'Informasi Kasir',
                cell(props) {
                    const member = props.row.original
                    const initials = member.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    return (
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border border-border/60 shadow-sm">
                                <AvatarFallback className="bg-primary/5 text-primary text-xs font-black">
                                    {initials || <User className="h-4 w-4" />}
                                </AvatarFallback>
                            </Avatar>
                            <div className="space-y-0.5">
                                <div className="font-black tracking-tight text-foreground">{member.name}</div>
                                {member.notes ? (
                                    <p className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground italic">
                                        <NotebookPen className="h-3 w-3" />
                                        {member.notes}
                                    </p>
                                ) : (
                                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Petugas Kasir</p>
                                )}
                            </div>
                        </div>
                    )
                },
            },
            {
                accessorKey: 'phone',
                header: 'Detail Kontak',
                cell(props) {
                    const member = props.row.original
                    return (
                        <div className="space-y-1.5">
                            <div className="flex items-center gap-2 group">
                                <div className="h-6 w-6 rounded-md bg-muted/50 flex items-center justify-center border border-border/40 group-hover:bg-primary/10 transition-colors">
                                    <Phone className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <span className="text-xs font-bold tabular-nums text-foreground/80">{member.phone || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 group">
                                <div className="h-6 w-6 rounded-md bg-muted/50 flex items-center justify-center border border-border/40 group-hover:bg-primary/10 transition-colors">
                                    <Mail className="h-3 w-3 text-muted-foreground group-hover:text-primary" />
                                </div>
                                <span className="text-xs font-medium text-foreground/70 truncate max-w-[150px]">{member.email || '-'}</span>
                            </div>
                        </div>
                    )
                },
            },
            {
                accessorKey: 'status',
                header: 'Status Login',
                cell(props) {
                    const member = props.row.original
                    return (
                        <Badge className={cn(
                            "px-3 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-widest transition-all",
                            STATUS_BADGE_CLASS[member.status]
                        )}>
                            {STATUS_LABEL[member.status]}
                        </Badge>
                    )
                },
            },
        ]}
        actionViewType="flex"
        rowActions={() => [
            {
                icon: Edit2,
                variant: 'ghost',
                onClick: (row) => { onEdit(row) },
                className: 'h-8 w-8 hover:bg-primary/10 hover:text-primary'
            },
            {
                icon: Trash2,
                variant: 'ghost',
                onClick: (row) => { onDelete(row) },
                className: 'h-8 w-8 text-red-500 hover:bg-red-500/10 hover:text-red-600'
            }
        ]}
    />
}