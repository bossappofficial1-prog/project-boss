/**
 * CONTOH PENGGUNAAN PATTERN BARU
 * 
 * File ini mendemonstrasikan cara menggunakan:
 * - useUsersV3 (factory pattern hooks)
 * - DataTable (generic table component)
 * - Pagination (reusable pagination)
 * - useTableState (combined table state management)
 * 
 * Copy pattern ini ke halaman lain untuk konsistensi
 */

'use client';

import { useState } from 'react';
import { useUsersV3 } from '@/hooks/useUsersV3';
import { useTableState } from '@/hooks/useTableFilters';
import { DataTable } from '@/components/shared/DataTable';
import { Pagination } from '@/components/shared/Pagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User, UserRole, TableColumn, TableAction, UserFilters } from '@/types';
import { Pencil, Trash2, Mail, UserCheck, UserX, Search, X } from 'lucide-react';

export default function UsersPageExample() {
  // ============================================================================
  // HOOKS - Modern Pattern
  // ============================================================================
  
  // Factory hooks untuk CRUD operations
  const {
    useList,
    useCreate,
    useUpdate,
    useDelete,
    useBulkDelete,
    useChangeRole,
    useVerifyEmail,
  } = useUsersV3();

  // Combined table state (pagination + filters + sorting)
  const table = useTableState<UserFilters>({
    initialPage: 1,
    initialPageSize: 10,
    defaultSort: 'createdAt',
    defaultOrder: 'desc',
  });

  // API call dengan semua params
  const { data: users, isLoading } = useList(table.getAllParams());

  // Mutations
  const createMutation = useCreate();
  const updateMutation = useUpdate();
  const deleteMutation = useDelete();
  const bulkDeleteMutation = useBulkDelete();

  // Local state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ============================================================================
  // TABLE CONFIGURATION
  // ============================================================================

  const columns: TableColumn<User>[] = [
    {
      key: 'name',
      title: 'Nama',
      sortable: true,
      render: (value, record) => (
        <div className="flex items-center gap-2">
          {record.avatar && (
            <img
              src={record.avatar}
              alt={value}
              className="h-8 w-8 rounded-full"
            />
          )}
          <div>
            <div className="font-medium">{value}</div>
            <div className="text-sm text-muted-foreground">{record.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      title: 'Role',
      sortable: true,
      render: (value) => (
        <Badge variant={value === UserRole.ADMIN ? 'destructive' : 'default'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'isVerified',
      title: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Verified' : 'Unverified'}
        </Badge>
      ),
    },
    {
      key: 'phone',
      title: 'Telepon',
      render: (value) => value || '-',
    },
    {
      key: 'createdAt',
      title: 'Dibuat',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString('id-ID'),
    },
  ];

  const actions: TableAction<User>[] = [
    {
      label: 'Edit',
      icon: Pencil,
      variant: 'default',
      onClick: (user) => {
        console.log('Edit user:', user);
        // TODO: Open edit modal
      },
    },
    {
      label: 'Verify',
      icon: UserCheck,
      variant: 'default',
      onClick: (user) => {
        // useVerifyEmail().mutate(user.id);
      },
      hidden: (user) => user.isVerified,
    },
    {
      label: 'Delete',
      icon: Trash2,
      variant: 'destructive',
      onClick: (user) => {
        if (confirm(`Hapus user ${user.name}?`)) {
          deleteMutation.mutate(user.id);
        }
      },
    },
  ];

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Hapus ${selectedIds.length} user?`)) {
      bulkDeleteMutation.mutate(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleResetFilters = () => {
    table.resetAll();
    setSelectedIds([]);
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users Management</h1>
          <p className="text-muted-foreground">
            Manage users with modern pattern
          </p>
        </div>
        <Button onClick={() => console.log('Create user')}>
          + Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau email..."
            value={table.filters.search}
            onChange={(e) => table.filters.setSearch(e.target.value)}
            className="pl-9"
          />
          {table.filters.search && (
            <button
              onClick={() => table.filters.setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Role Filter */}
        <Select
          value={table.filters.filters.role || 'all'}
          onValueChange={(value) =>
            table.filters.updateFilter('role', value === 'all' ? undefined : (value as UserRole))
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Role</SelectItem>
            <SelectItem value={UserRole.ADMIN}>Admin</SelectItem>
            <SelectItem value={UserRole.OWNER}>Owner</SelectItem>
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select
          value={table.filters.filters.status || 'all'}
          onValueChange={(value) =>
            table.filters.updateFilter('status', value === 'all' ? undefined : (value as 'verified' | 'unverified'))
          }
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Semua Status</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="unverified">Unverified</SelectItem>
          </SelectContent>
        </Select>

        {/* Reset */}
        {table.filters.hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            <X className="h-4 w-4 mr-2" />
            Reset ({table.filters.activeFilterCount})
          </Button>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <span className="text-sm font-medium">
            {selectedIds.length} user dipilih
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleBulkDelete}
            disabled={bulkDeleteMutation.isPending}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Selected
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds([])}
          >
            Cancel
          </Button>
        </div>
      )}

      {/* Table */}
      <DataTable
        data={users || []}
        columns={columns}
        actions={actions}
        loading={isLoading}
        selectable
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        sortBy={table.sorting.sortBy}
        sortOrder={table.sorting.sortOrder}
        onSort={table.sorting.handleSort}
        emptyMessage="Tidak ada user ditemukan"
      />

      {/* Pagination */}
      {users && users.length > 0 && (
        <Pagination
          page={table.pagination.page}
          pageSize={table.pagination.pageSize}
          total={users.length}
          onPageChange={table.pagination.setPage}
          onPageSizeChange={table.pagination.setPageSize}
        />
      )}
    </div>
  );
}
