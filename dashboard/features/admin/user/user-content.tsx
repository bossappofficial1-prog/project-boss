'use client';

import React, { useState, useMemo } from 'react';
import { Plus, UserCog, Trash2, EyeIcon, MailPlus, CheckCircle2, ShieldAlert, Ban, UserCheck, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsers, useCreateUser, useUpdateUser, useDeleteUser } from '@/hooks/use-users';
import { useSuspendUser, useReactivateUser, useBulkSuspendUsers, useBulkReactivateUsers, useAdminUserStats } from '@/lib/apis/admin-users';
import { FormUser } from '@/features/admin/user/form-user';
import { User } from '@/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import UserDetailSheet from '@/features/admin/user/user-detail-sheet';
import { DataTable } from '@/components/ui/data-table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatISOStringDate } from '@/lib/utils';
import { GoogleIcon } from '@/icons';
import { toast } from 'sonner';

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Aktif',
  SUSPENDED: 'Suspended',
  INACTIVE: 'Nonaktif',
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  SUSPENDED: 'bg-red-500/10 text-red-600 border-red-500/20',
  INACTIVE: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

export default function UserContent() {
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [showSuspendConfirmation, setShowSuspendConfirmation] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Partial<User> | undefined>();
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  const { data, isLoading, isRefetching, refetch } = useUsers({
    search: searchQuery,
    limit,
    page,
  });

  const { data: stats } = useAdminUserStats();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const deleteUser = useDeleteUser();
  const suspendUser = useSuspendUser();
  const reactivateUser = useReactivateUser();
  const bulkSuspend = useBulkSuspendUsers();
  const bulkReactivate = useBulkReactivateUsers();

  const onPaginationChange = (params: { page: number; limit: number }) => {
    setPage(params.page);
    setLimit(params.limit);
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: 'id',
        header: 'Name',
        enableSorting: false,
        cell(record: any) {
          const user = record.row.original;
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
          );
        },
      },
      {
        accessorKey: 'provider',
        header: 'Login Dengan',
        enableSorting: false,
        cell(props: any) {
          const record = props.row.original;
          return record.provider === 'local' ? (
            <span className="text-sm flex items-center gap-2 text-foreground">
              <MailPlus className="size-3.5" /> Email
            </span>
          ) : (
            <span className="text-sm flex items-center gap-2 text-foreground">
              <GoogleIcon className="size-3.5" /> Google
            </span>
          );
        },
      },
      {
        accessorKey: 'role',
        header: 'Role',
        cell(record: any) {
          const user = record.row.original;
          return (
            <Badge
              variant="outline"
              className={`text-[10px] px-2 py-0.5 h-5 font-medium border-0
                ${user.role === 'OWNER' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400' : ''}
                ${user.role === 'ADMIN' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' : ''}
              `}
            >
              {user.role}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell(record: any) {
          const user = record.row.original;
          const status = user.status || 'ACTIVE';
          return (
            <Badge variant="outline" className={STATUS_COLORS[status] || STATUS_COLORS.ACTIVE}>
              {STATUS_LABELS[status] || status}
            </Badge>
          );
        },
      },
      {
        accessorKey: 'isVerified',
        header: 'Verifikasi',
        cell(record: any) {
          const user = record.row.original;
          return (
            <div className="flex items-center gap-2">
              {user.isVerified ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              ) : (
                <ShieldAlert className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-xs capitalize text-muted-foreground">
                {user.isVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'createdAt',
        header: 'Terdaftar',
        cell(value: any) {
          return (
            <span className="text-muted-foreground">
              {formatISOStringDate(value.row.original.createdAt)}
            </span>
          );
        },
      },
    ],
    [],
  );

  const handleRowActions = (row: User) => [
    {
      label: 'Edit',
      icon: UserCog,
      onClick() {
        setSelectedUser({
          id: row.id,
          name: row.name,
          role: row.role,
          email: row.email,
          provider: row.provider,
          createdAt: row.createdAt,
        });
        setIsFormOpen(true);
      },
    },
    ...((row as any).status !== 'SUSPENDED'
      ? [
          {
            label: 'Suspend',
            icon: Ban,
            variant: 'destructive' as const,
            onClick() {
              setSelectedUser({ id: row.id, name: row.name });
              setShowSuspendConfirmation(true);
            },
          },
        ]
      : [
          {
            label: 'Aktifkan',
            icon: UserCheck,
            onClick() {
              reactivateUser.mutate(row.id!);
            },
          },
        ]),
    {
      label: 'Hapus',
      icon: Trash2,
      variant: 'destructive' as const,
      onClick() {
        setSelectedUser({ id: row.id, name: row.name });
        setShowDeleteConfirmation(true);
      },
    },
    ...(row.role === 'OWNER' && (row as any).business
      ? [
          {
            label: 'Detail',
            icon: EyeIcon,
            onClick() {
              setSelectedUserId(row.id!);
              setShowDetailModal(true);
            },
          },
        ]
      : []),
  ];

  const bulkActions = [
    {
      label: 'Suspend Terpilih',
      icon: Ban,
      variant: 'destructive' as const,
      onClick: () => {
        if (selectedRowIds.length === 0) {
          toast.error('Pilih user terlebih dahulu');
          return;
        }
        bulkSuspend.mutate(
          { userIds: selectedRowIds },
          { onSuccess: () => setSelectedRowIds([]) },
        );
      },
    },
    {
      label: 'Aktifkan Terpilih',
      icon: UserCheck,
      onClick: () => {
        if (selectedRowIds.length === 0) {
          toast.error('Pilih user terlebih dahulu');
          return;
        }
        bulkReactivate.mutate(selectedRowIds, {
          onSuccess: () => setSelectedRowIds([]),
        });
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola akses, peran, dan status pengguna sistem
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setSelectedUser(undefined);
              setIsFormOpen(true);
            }}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Tambah User
          </Button>
        </div>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total User</CardTitle>
              <UserCog className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktif</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspended</CardTitle>
              <Ban className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.suspended}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Nonaktif</CardTitle>
              <ShieldAlert className="h-4 w-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.inactive}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filter */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Semua Status</SelectItem>
            <SelectItem value="ACTIVE">Aktif</SelectItem>
            <SelectItem value="SUSPENDED">Suspended</SelectItem>
            <SelectItem value="INACTIVE">Nonaktif</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* DataTable */}
      <DataTable
        data={(data?.data as any) || []}
        columns={columns}
        onRefresh={refetch}
        isLoading={isLoading}
        isRefreshing={isRefetching}
        serverSideSearch
        onSearchChange={setSearchQuery}
        searchPlaceholder="Cari pengguna..."
        serverSidePagination
        serverLimit={limit}
        totalItems={data?.pagination?.total || 0}
        emptyMessage="Tidak ada user"
        tableId="admin-users"
        labelAction="Aksi"
        actionViewType="dropdown"
        onPaginationChange={onPaginationChange}
        rowActions={handleRowActions}
        enableRowSelection
        bulkActions={bulkActions}
        onRowSelectionChange={(selection) => {
          const ids = Object.keys(selection).filter((key) => selection[key]);
          setSelectedRowIds(ids);
        }}
      />

      {/* Form Dialog */}
      <FormUser
        isOpen={isFormOpen}
        onOpenChange={(open) => {
          setIsFormOpen(open);
          if (!open) setSelectedUser(undefined);
        }}
        isLoading={createUser.isPending || updateUser.isPending}
        onSubmit={async (values) => {
          selectedUser?.id
            ? updateUser.mutate(
                { userId: selectedUser.id!, userData: values as any },
                {
                  onError: () => setIsFormOpen(true),
                  onSuccess: () => setIsFormOpen(false),
                },
              )
            : createUser.mutate(values as any, {
                onError: () => setIsFormOpen(true),
                onSuccess: () => setIsFormOpen(false),
              });
        }}
        defaultValues={
          selectedUser?.id && selectedUser.name && selectedUser.role && selectedUser.email
            ? {
                id: selectedUser.id,
                name: selectedUser.name,
                role: selectedUser.role,
                email: selectedUser.email,
                provider: selectedUser.provider,
                createdAt: selectedUser.createdAt,
                phone: selectedUser.phone ?? '',
                isVerified: selectedUser.isVerified ?? false,
                avatar: selectedUser.avatar ?? '',
                updatedAt: selectedUser.updatedAt ?? '',
              }
            : undefined
        }
      />

      {/* Detail Sheet */}
      <UserDetailSheet
        userId={selectedUserId}
        isOpen={showDetailModal}
        onClose={setShowDetailModal}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirmation}
        onOpenChange={setShowDeleteConfirmation}
        title="Konfirmasi Hapus"
        description={`Yakin ingin menghapus user '${selectedUser?.name}'? Aksi ini tidak dapat dibatalkan.`}
        align="center"
        confirmVariant="destructive"
        confirmLoading={deleteUser.isPending}
        onCancel={() => setSelectedUser(undefined)}
        confirmLabel="Hapus"
        onConfirm={() => {
          deleteUser.mutate(selectedUser!.id!, {
            onSuccess: () => {
              setShowDeleteConfirmation(false);
              setSelectedUser(undefined);
            },
          });
          return false;
        }}
      />

      {/* Suspend Confirmation */}
      <ConfirmDialog
        open={showSuspendConfirmation}
        onOpenChange={setShowSuspendConfirmation}
        title="Konfirmasi Suspend"
        description={`Yakin ingin suspend user '${selectedUser?.name}'? User tidak akan bisa mengakses platform.`}
        align="center"
        confirmVariant="destructive"
        confirmLoading={suspendUser.isPending}
        onCancel={() => setSelectedUser(undefined)}
        confirmLabel="Suspend"
        showInput
        inputPlaceholder="Alasan suspend (opsional)"
        onConfirm={(reason) => {
          suspendUser.mutate(
            { userId: selectedUser!.id!, reason: reason || undefined },
            {
              onSuccess: () => {
                setShowSuspendConfirmation(false);
                setSelectedUser(undefined);
              },
            },
          );
          return false;
        }}
      />
    </div>
  );
}
