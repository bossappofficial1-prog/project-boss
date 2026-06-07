"use client"

import React, { useEffect, useState, useMemo } from "react"
import { Plus, UserCog, Trash2, EyeIcon, MailPlus, CheckCircle2, ShieldAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from "@/hooks/use-users"
import { FormUser } from "@/features/admin/user/form-user"
import { User } from "@/types"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import UserDetailSheet from "@/features/admin/user/user-detail-sheet"
import { DataTable } from "@/components/ui/data-table"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { formatISOStringDate } from "@/lib/utils"
import { GoogleIcon } from "@/icons"

export default function UserContent() {
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
    const [selectedUser, setSelectedUser] = useState<Partial<User> | undefined>()
    const [selectedUserId, setSelectedUserId] = useState<string>("")
    const [showDetailModal, setShowDetailModal] = useState(false)

    const { data, isLoading, isRefetching, refetch } = useUsers({
        search: searchQuery,
        limit: limit,
        page: page
    })

    useEffect(() => {
        document.title = "Management User"
    }, [])

    const createUser = useCreateUser()
    const updateUser = useUpdateUser()
    const deleteUser = useDeleteUser()

    const onPaginationChange = (params: { page: number; limit: number }) => {
        setPage(params.page)
        setLimit(params.limit)
    }

    const columns = useMemo(() => [
        {
            accessorKey: "id",
            header: "Name",
            enableSorting: false,
            cell(record: any) {
                const user = record.row.original
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9 border border-border/50">
                            <AvatarImage alt={user.name} src={user.avatar!} />
                            <AvatarFallback className="text-xs font-medium bg-primary/10 text-primary">
                                {user.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="font-medium text-sm text-foreground">{user.name}</span>
                            <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                    </div>
                )
            },
        },
        {
            accessorKey: "provider",
            header: "Login Dengan",
            enableSorting: false,
            cell(props: any) {
                const record = props.row.original
                return (
                    <>
                        {record.provider === "local" ? (
                            <span className="text-sm flex items-center gap-2 text-foreground">
                                <MailPlus className="size-3.5" /> Email
                            </span>
                        ) : (
                            <span className="text-sm flex items-center gap-2 text-foreground">
                                <GoogleIcon className="size-3.5" /> Google
                            </span>
                        )}
                    </>
                )
            },
        },
        {
            accessorKey: "role",
            header: "Role",
            cell(record: any) {
                const user = record.row.original
                return (
                    <Badge
                        variant="outline"
                        className={`
                            text-[10px] px-2 py-0.5 h-5 font-medium border-0
                            ${user.role === "OWNER" ? "bg-purple-500/15 text-purple-700 dark:text-purple-400" : ""}
                            ${user.role === "ADMIN" ? "bg-blue-500/15 text-blue-700 dark:text-blue-400" : ""}
                        `}
                    >
                        {user.role}
                    </Badge>
                )
            },
        },
        {
            accessorKey: "isVerified",
            header: "Status",
            cell(record: any) {
                const user = record.row.original
                return (
                    <div className="flex items-center gap-2">
                        {user.isVerified ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                            <ShieldAlert className="h-4 w-4 text-amber-500" />
                        )}
                        <span className="text-xs capitalize text-muted-foreground">
                            {user.isVerified ? "Verified" : "Unverified"}
                        </span>
                    </div>
                )
            },
        },
        {
            accessorKey: "createdAt",
            header: "Terdaftar",
            cell(value: any) {
                return <span className="text-muted-foreground">{formatISOStringDate(value.row.original.createdAt)}</span>
            },
        }
    ], [])

    const handleRowActions = (row: User) => [
        {
            icon: UserCog,
            onClick(row: User) {
                setSelectedUser({
                    id: row.id,
                    name: row.name,
                    role: row.role,
                    email: row.email,
                    provider: row.provider,
                    createdAt: row.createdAt
                })
                setIsFormOpen(true)
            },
        },
        {
            icon: Trash2,
            variant: "destructive" as const,
            onClick(row: User) {
                setSelectedUser({ id: row.id, name: row.name })
                setShowDeleteConfirmation(true)
            },
        },
        ...((row.role === "OWNER" && row.business) ? [
            {
                variant: "ghost" as const,
                icon: EyeIcon,
                className: "bg-blue-500 hover:bg-blue-600 text-white hover:text-white cursor-pointer",
                onClick(row: User) {
                    setSelectedUserId(row.id)
                    setShowDetailModal(true)
                },
            }
        ] : [])
    ]

    return (
        <div className="flex flex-col space-y-3 p-3 h-full">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-2 sm:space-y-0">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                    <p className="text-muted-foreground text-sm">
                        Kelola akses, peran, dan status pengguna sistem.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button size="sm" onClick={() => { setSelectedUser(undefined); setIsFormOpen(true) }} className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Tambah User
                    </Button>
                </div>
            </div>

            <DataTable
                data={(data?.data as any) || []}
                columns={columns}
                onRefresh={refetch}
                isLoading={isLoading}
                isRefreshing={isRefetching}
                serverSideSearch
                onSearchChange={setSearchQuery}
                searchPlaceholder="Cari pengguna..."
                enableColumnResizing
                serverSidePagination
                serverLimit={limit}
                totalItems={data?.pagination.total || 0}
                emptyMessage="Tidak ada user"
                labelAction="Aksi"
                actionViewType="flex"
                onPaginationChange={onPaginationChange}
                rowActions={handleRowActions}
            />

            <FormUser
                isOpen={isFormOpen}
                onOpenChange={(open) => {
                    setIsFormOpen(open)
                    if (!open) setSelectedUser(undefined)
                }}
                isLoading={createUser.isPending || updateUser.isPending}
                onSubmit={async (values) => {
                    selectedUser?.id
                        ? updateUser.mutate({ userId: selectedUser.id!, userData: values as any }, {
                            onError: () => setIsFormOpen(true),
                            onSuccess: () => setIsFormOpen(false),
                        })
                        : createUser.mutate(values as any, {
                            onError: () => setIsFormOpen(true),
                            onSuccess: () => setIsFormOpen(false),
                        })
                }}
                defaultValues={
                    selectedUser && selectedUser.id && selectedUser.name && selectedUser.role && selectedUser.email && selectedUser.provider && selectedUser.createdAt
                        ? {
                            id: selectedUser.id,
                            name: selectedUser.name,
                            role: selectedUser.role,
                            email: selectedUser.email,
                            provider: selectedUser.provider,
                            createdAt: selectedUser.createdAt,
                            phone: selectedUser.phone ?? "",
                            isVerified: selectedUser.isVerified ?? false,
                            avatar: selectedUser.avatar ?? "",
                            updatedAt: selectedUser.updatedAt ?? ""
                        }
                        : undefined
                }
            />

            <UserDetailSheet
                userId={selectedUserId}
                isOpen={showDetailModal}
                onClose={setShowDetailModal}
            />

            {showDeleteConfirmation && selectedUser && (
                <ConfirmDialog
                    open={showDeleteConfirmation}
                    onOpenChange={setShowDeleteConfirmation}
                    title="Konfirmasi Hapus"
                    description={`Yakin ingin menghapus user '${selectedUser?.name}'?`}
                    align="center"
                    confirmLoading={deleteUser.isPending}
                    onCancel={() => setSelectedUser(undefined)}
                    confirmLabel="Yakin"
                    onConfirm={() => {
                        deleteUser.mutate(selectedUser.id!, {
                            onSuccess: () => setShowDeleteConfirmation(false)
                        })
                        return false
                    }}
                />
            )}
        </div>
    )
}