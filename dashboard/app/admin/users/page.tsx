"use client"

import React, { useState } from "react"
import {
  Plus,
  Download
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { UserTable } from "@/components/features/admin/user/Table"
import { useUsers } from "@/hooks/useUsers"
import { FormUser } from "@/components/features/admin/user/FormUser"
import { User } from "@/types/user"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import ConfirmationModal from "@/components/ui/confirmation-modal"
import { UserService } from "@/lib/servicev2/user.service"

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false)
  const [editedUser, setEditedUser] = useState<Partial<User> | undefined>()

  const { data, isRefetching, refetch } = useUsers({
    search: searchQuery,
    limit: limit,
    page: page
  })

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
          <Button variant="outline" size="sm" className="shadow-sm">
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
          <Button size="sm" onClick={() => { setEditedUser(undefined); setIsFormOpen(true) }} className="shadow-sm">
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
        onEdit={(user) => { setEditedUser({ name: user.name, role: user.role, email: user.email, provider: user.provider, createdAt: user.createdAt }); setIsFormOpen(true) }}
        onDelete={(user) => { setEditedUser({ name: user.name, role: user.role, email: user.email, provider: user.provider, createdAt: user.createdAt }); setShowDeleteConfirmation(true) }}
      />

      <FormUser
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open)
          if (!open) setEditedUser(undefined)
        }}
        onSubmit={async (values) => {
          await UserService.create(values as any)
          // const valueses = values as FormData
          // console.log('Nama file:', valueses.get('name'))
        }}
        defaultValues={editedUser}
      />

      {showDeleteConfirmation && (
        <ConfirmDialog
          open={showDeleteConfirmation}
          onOpenChange={setShowDeleteConfirmation}
          title={`Konfirmasi Hapus`}
          description={`Yakin ingin menghapus user '${editedUser?.name}'`}
          align="center"
          onCancel={() => setEditedUser(undefined)}
          confirmLabel='Yakin'
          onConfirm={async () => {
            await new Promise(resolve => setTimeout(resolve, 5000))
          }}
        />
        // <ConfirmDialog
        //   open={showDeleteConfirmation}
        //   onOpenChange={setShowDeleteConfirmation}
        //   title={`Konfirmat`}
        // />
      )}
    </div>
  )
}