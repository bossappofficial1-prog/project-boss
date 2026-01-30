'use client'

import { DataTable } from "@/components/ui/data-table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User } from "@/types/user"
import { CheckCircle2, EyeIcon, MailPlus, ShieldAlert, ShowerHeadIcon, Trash2, UserCog } from "lucide-react";
import { formatISOStringDate } from "@/lib/utils";
import { GoogleIcon } from "@/icons";

type UserTableProps = {
    users: User[];
    onSearchChange: (value: string) => void;
    onRefresh: () => void;
    onLoading?: boolean;
    isRefresh: boolean;
    onPaginationChange?: (params: { page: number; limit: number }) => void;
    limit?: number;
    paginationLength?: number
    onEdit?: (user: User) => void
    onDelete?: (user: User) => void
    onShowDetail?: (userId: string) => void
}
export function UserTable({
    users,
    onSearchChange,
    onRefresh,
    onLoading,
    isRefresh,
    onPaginationChange,
    limit,
    paginationLength,
    onEdit,
    onDelete,
    onShowDetail
}: UserTableProps) {

    return (
        <DataTable
            data={users}
            onRefresh={onRefresh}
            isLoading={onLoading || false}
            isRefreshing={isRefresh}
            serverSideSearch
            onSearchChange={onSearchChange}
            searchPlaceholder="Cari pengguna"
            enableColumnResizing
            serverSidePagination
            serverLimit={limit || 10}
            totalItems={paginationLength}
            emptyMessage="Tidak ada user"
            labelAction="Aksi"
            onPaginationChange={(params: { page: number; limit: number }) => onPaginationChange?.(params)}
            columns={[
                {
                    accessorKey: 'id',
                    header: 'Name',
                    enableSorting: false,
                    cell(record) {
                        const user = record.row.original;
                        return (
                            <div className="flex items-center gap-3">
                                <Avatar className="h-9 w-9 border border-border/50">
                                    <AvatarImage alt={user.name} />
                                    <AvatarFallback className="text-xs font-medium">
                                        {user.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium text-sm">{user.name}</span>
                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                </div>
                            </div>
                        )
                    },
                },
                {
                    accessorKey: 'provider',
                    header: 'Login Dengan',
                    enableSorting: false,
                    cell(props) {
                        const record = props.row.original;
                        return (
                            <>
                                {record.provider == 'local'
                                    ? <span className="text-sm flex items-center gap-2">
                                        <MailPlus className="size-3.5" /> Email
                                    </span>
                                    : <span className="text-sm flex items-center gap-2">
                                        <GoogleIcon className="size-3.5" /> Google
                                    </span>}
                            </>
                        )
                    },
                },
                {
                    accessorKey: 'role',
                    header: 'Role',
                    cell(record) {
                        const user = record.row.original;
                        return (
                            <Badge
                                variant="outline"
                                className={`
                          text-[10px] px-2 py-0.5 h-5 font-medium border-0
                          ${user.role === 'OWNER' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400' : ''}
                          ${user.role === 'ADMIN' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' : ''}
                        `}
                            >
                                {user.role}
                            </Badge>
                        )
                    },
                },
                {
                    accessorKey: 'isVerified',
                    header: 'Status',
                    cell(record) {
                        const user = record.row.original
                        return (
                            <div className="flex items-center gap-2">
                                {user.isVerified
                                    ? <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    : <ShieldAlert className="h-4 w-4 text-amber-500" />}
                                <span className="text-xs capitalize text-muted-foreground">
                                    {user.isVerified ? 'Verified' : 'Unverified'}
                                </span>
                            </div>
                        )
                    },
                },
                {
                    accessorKey: 'createdAt',
                    header: 'Terdaftar',
                    cell(value) {
                        return <span>{formatISOStringDate(value.row.original.createdAt)}</span>
                    },
                }
            ]}
            actionViewType="flex"
            rowActions={(row) => [
                {
                    icon: UserCog,
                    onClick(row) {
                        return onEdit?.(row)
                    },
                },
                {
                    onClick(row) {
                        return onDelete?.(row)
                    },
                    variant: 'destructive',
                    icon: Trash2,
                },

                ...((row.role === 'OWNER' && row.business) ? [
                    {
                        variant: 'ghost' as const,
                        icon: EyeIcon,
                        className: 'bg-blue-500 hover:bg-blue-600 text-white hover:text-white cursor-pointer',
                        onClick(row: User) {
                            return onShowDetail?.(row.id)
                        },
                    }
                ] : [])
            ]}
        />
    )
}