"use client"

import React, { useEffect, useState } from "react"
import { Plus, } from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserTable } from "@/components/features/admin/user/Table"
import { useCreateUser, useDeleteUser, useUpdateUser, useUsers } from "@/hooks/useUsers"
import { FormUser } from "@/components/features/admin/user/FormUser"
import { User } from "@/types/user"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import UserDetailSheet from "@/components/features/admin/user/UserDetailSheet"

export default function UserContent() {
    const [searchQuery, setSearchQuery] = React.useState("")
    const [page, setPage] = useState(1)
    const [limit, setLimit] = useState(10)
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
    const [selectedUser, setSelectedUser] = useState<Partial<User> | undefined>()
    const [selectedUserId, setSelectedUserId] = useState<string>('')
    const [showDetailModal, setShowDetailModal] = useState(false)

    const { data, isRefetching, refetch } = useUsers({
        search: searchQuery,
        limit: limit,
        page: page
    })

    useEffect(() => {
        document.title = 'Management User'
    }, [])

    const deleteUser = useDeleteUser()
    const createUser = useCreateUser()
    const updateUser = useUpdateUser()

    const onPaginationChange = (params: { page: number, limit: number }) => {
        setPage(params.page)
        setLimit(params.limit)
    }

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

            <UserTable
                users={data?.data || []}
                onSearchChange={setSearchQuery}
                onRefresh={refetch}
                isRefresh={isRefetching}
                limit={limit}
                onPaginationChange={onPaginationChange}
                paginationLength={data?.pagination.total}
                onShowDetail={(userId) => { setSelectedUserId(userId); setShowDetailModal(true) }}
                onEdit={(user) => { setSelectedUser({ id: user.id, name: user.name, role: user.role, email: user.email, provider: user.provider, createdAt: user.createdAt }); setIsFormOpen(true) }}
                onDelete={(user) => { setSelectedUser({ id: user.id, name: user.name }); setShowDeleteConfirmation(true) }}
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

            {/* {showDetailModal && selectedUserId && (
      )} */}
            <UserDetailSheet
                userId={selectedUserId!}
                isOpen={showDetailModal}
                onClose={setShowDetailModal}
            />

            {showDeleteConfirmation && selectedUser && (
                <ConfirmDialog
                    open={showDeleteConfirmation}
                    onOpenChange={setShowDeleteConfirmation}
                    title={`Konfirmasi Hapus`}
                    description={`Yakin ingin menghapus user '${selectedUser?.name}'`}
                    align="center"
                    confirmLoading={deleteUser.isPending}
                    onCancel={() => setSelectedUser(undefined)}
                    confirmLabel='Yakin'
                    onConfirm={() => {
                        deleteUser.mutate(selectedUser.id!, {
                            onSuccess: () => setShowDeleteConfirmation(false)
                        });
                        return false
                    }}
                />
            )}
        </div>
    )
}