import { Badge } from "@/components/ui/badge";
import { DataTable } from "@/components/ui/data-table";
import { Business } from "@/hooks/useBusiness";
import { formatISOStringDate } from "@/lib/utils";
import { ColumnDef } from "@tanstack/react-table";
import { Ban, Calendar, CheckCircle2, Clock, PencilLine } from "lucide-react";

type AllBusinessTableProps = {
    data: Business[]
    onSearchChange: (value: string) => void;
    isRefreshing?: boolean,
    onRefresh?: () => void,
    onEdit: (tenant: Business) => void
}

const getPlanBadge = (plan: string) => {
    switch (plan) {
        case 'PRO': return <div className="inline-flex items-center rounded-md border border-indigo-200 bg-indigo-50 px-2.5 py-0.5 text-xs font-semibold text-indigo-700">Pro Plan</div>;
        case 'ENTERPRISE': return <div className="inline-flex items-center rounded-md border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">Enterprise</div>;
        default: return <div className="inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Basic</div>;
    }
}

const getStatusBadge = (status: string) => {
    switch (status) {
        case 'ACTIVE': return <Badge variant="success" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Active</Badge>;
        case 'EXPIRED': return <Badge variant="warning" className="gap-1"><Clock className="h-3 w-3" /> Expired</Badge>;
        case 'SUSPENDED': return <Badge variant="destructive" className="gap-1"><Ban className="h-3 w-3" /> Suspended</Badge>;
        default: return <Badge variant="secondary">{status}</Badge>;
    }
};

export function AllBusinessTable({
    data,
    onSearchChange,
    isRefreshing,
    onRefresh,
    onEdit
}: AllBusinessTableProps) {
    const columns: ColumnDef<Business>[] = [
        {
            accessorKey: 'id',
            header: 'Business Profile',
            cell(props) {
                const tenant = props.row.original
                return (
                    <div className="flex items-center gap-3">
                        <div>
                            <div className="font-semibold text-foreground">{tenant.name}</div>
                            <div className="text-xs text-muted-foreground font-mono">ID: {tenant.id.substring(0, 8)}...</div>
                        </div>
                    </div>
                )

            },
        },
        {
            accessorKey: `owner`,
            header: `Owner`,
            cell(props) {
                const tenant = props.row.original
                return (
                    <div className="flex flex-col">
                        <span className="font-medium text-sm text-foreground">{tenant.owner.name}</span>
                        <span className="text-xs text-muted-foreground">{tenant.owner.email}</span>
                    </div>
                )
            },
        },
        {
            accessorKey: `subscriptionPlan`,
            header: `Subscription`,
            cell(props) {
                const tenant = props.row.original

                return (
                    <div className="space-y-1">
                        {getPlanBadge(tenant.subscriptionPlan)}
                        <div className="flex items-center text-xs text-foreground">
                            <Calendar className="mr-1.5 h-3 w-3 text-foreground" />
                            {tenant.subscriptionEndDate
                                ? new Date(tenant.subscriptionEndDate).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', year: 'numeric' })
                                : 'Lifetime'}
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: `subscriptionStatus`,
            header: `Status`,
            cell(props) {
                const tenant = props.row.original

                return (getStatusBadge(tenant.subscriptionStatus))
            },
        },
        {
            accessorKey: 'createdAt',
            header: `Joined Date`,
            cell(props) {
                const createdAt = props.row.original.createdAt

                return formatISOStringDate(createdAt)
            },
        }
    ]
    return (
        <DataTable
            columns={columns}
            data={data}
            isRefreshing={isRefreshing}
            onRefresh={onRefresh}
            actionViewType="flex"
            emptyMessage="Tidak Ada Tenant"
            serverSideSearch
            exportConfig={[
                {
                    id: 'xlsx',
                    label: 'Excel (XLSX)',
                    icon: 'spreadsheet',
                    enabled: true,
                    type: 'server',
                    exportUrl: 'http://localhost:1234/api/v1/business/export'
                }
            ]}
            onSearchChange={onSearchChange}
            searchDebounceMs={350}
            enableExport
            searchPlaceholder="Cari berdasarkan nama bisnis"
            rowActions={() => [
                {
                    icon: PencilLine,
                    variant: 'ghost',
                    onClick: onEdit,
                }
            ]}
        />
    )
}