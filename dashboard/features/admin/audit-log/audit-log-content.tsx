'use client';

import { useState, useMemo } from 'react';
import { DataTable } from '@/components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/DatePickerWithRange';
import { useAuditLogs, useAuditLogStats, AuditLog } from '@/lib/apis/admin-audit-log';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Shield, Activity, Clock, Users, RefreshCw } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  USER_CREATED: 'User Dibuat',
  USER_UPDATED: 'User Diupdate',
  USER_SUSPENDED: 'User Disuspend',
  USER_REACTIVATED: 'User Diaktifkan',
  USER_DELETED: 'User Dihapus',
  BUSINESS_SUSPENDED: 'Bisnis Disuspend',
  BUSINESS_UNSUSPENDED: 'Bisnis Diaktifkan',
  BUSINESS_DELETED: 'Bisnis Dihapus',
  OUTLET_FORCE_CLOSED: 'Outlet Ditutup Paksa',
  OUTLET_FORCE_OPENED: 'Outlet Dibuka',
  OUTLET_DELETED: 'Outlet Dihapus',
  INVOICE_VERIFIED: 'Invoice Diverifikasi',
  INVOICE_REJECTED: 'Invoice Ditolak',
  BULK_INVOICE_VERIFIED: 'Bulk Invoice Diverifikasi',
  BULK_INVOICE_REJECTED: 'Bulk Invoice Ditolak',
  BULK_BUSINESS_SUSPENDED: 'Bulk Bisnis Disuspend',
  BULK_BUSINESS_UNSUSPENDED: 'Bulk Bisnis Diaktifkan',
  BULK_BUSINESS_DELETED: 'Bulk Bisnis Dihapus',
  BULK_OUTLET_DELETED: 'Bulk Outlet Dihapus',
  SETTINGS_UPDATED: 'Settings Diupdate',
  REPORT_GENERATED: 'Laporan Dibuat',
  PLAN_CREATED: 'Plan Dibuat',
  PLAN_UPDATED: 'Plan Diupdate',
  PLAN_DELETED: 'Plan Dihapus',
  BANNER_CREATED: 'Banner Dibuat',
  BANNER_UPDATED: 'Banner Diupdate',
  BANNER_DELETED: 'Banner Dihapus',
};

const ACTION_COLORS: Record<string, string> = {
  USER_SUSPENDED: 'bg-red-500/10 text-red-600 border-red-500/20',
  USER_DELETED: 'bg-red-500/10 text-red-600 border-red-500/20',
  BUSINESS_SUSPENDED: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  BUSINESS_DELETED: 'bg-red-500/10 text-red-600 border-red-500/20',
  OUTLET_DELETED: 'bg-red-500/10 text-red-600 border-red-500/20',
  INVOICE_REJECTED: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  SETTINGS_UPDATED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  REPORT_GENERATED: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
};

const ENTITY_TYPE_LABELS: Record<string, string> = {
  USER: 'User',
  BUSINESS: 'Bisnis',
  OUTLET: 'Outlet',
  SUBSCRIPTION_INVOICE: 'Invoice',
  SUBSCRIPTION_PLAN: 'Plan',
  BANNER: 'Banner',
  SETTINGS: 'Settings',
  REPORT: 'Laporan',
};

export function AuditLogContent() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [entityTypeFilter, setEntityTypeFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date } | undefined>();

  const filters = {
    page,
    limit,
    search: search || undefined,
    action: actionFilter || undefined,
    entityType: entityTypeFilter || undefined,
    startDate: dateRange?.from?.toISOString(),
    endDate: dateRange?.to?.toISOString(),
  };

  const { data, isLoading, refetch, isRefetching } = useAuditLogs(filters);
  const { data: stats } = useAuditLogStats();

  const columns: ColumnDef<AuditLog>[] = useMemo(
    () => [
      {
        accessorKey: 'createdAt',
        header: 'Waktu',
        cell: ({ row }) => (
          <div className="text-sm">
            <div className="font-medium">
              {format(new Date(row.original.createdAt), 'dd MMM yyyy', { locale: id })}
            </div>
            <div className="text-muted-foreground">
              {format(new Date(row.original.createdAt), 'HH:mm:ss')}
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'action',
        header: 'Aksi',
        cell: ({ row }) => (
          <Badge
            variant="outline"
            className={ACTION_COLORS[row.original.action] || 'bg-gray-500/10 text-gray-600 border-gray-500/20'}
          >
            {ACTION_LABELS[row.original.action] || row.original.action}
          </Badge>
        ),
      },
      {
        accessorKey: 'entityType',
        header: 'Tipe Entity',
        cell: ({ row }) => (
          <Badge variant="secondary">
            {ENTITY_TYPE_LABELS[row.original.entityType] || row.original.entityType}
          </Badge>
        ),
      },
      {
        accessorKey: 'entityName',
        header: 'Entity',
        cell: ({ row }) => (
          <div className="max-w-[200px] truncate font-medium">
            {row.original.entityName || row.original.entityId}
          </div>
        ),
      },
      {
        accessorKey: 'performedByUser',
        header: 'Oleh',
        cell: ({ row }) => (
          <div>
            <div className="font-medium">{row.original.performedByUser.name}</div>
            <div className="text-xs text-muted-foreground">{row.original.performedByUser.email}</div>
          </div>
        ),
      },
      {
        accessorKey: 'ipAddress',
        header: 'IP Address',
        cell: ({ row }) => (
          <span className="text-sm font-mono text-muted-foreground">
            {row.original.ipAddress || '-'}
          </span>
        ),
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Riwayat semua aksi yang dilakukan di platform
          </p>
        </div>
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
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Log</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Hari Ini</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.todayCount.toLocaleString('id-ID')}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aksi Terbanyak</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.actionDistribution[0]
                  ? ACTION_LABELS[stats.actionDistribution[0].action] || stats.actionDistribution[0].action
                  : '-'}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.actionDistribution[0]?.count || 0} kali
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Top Admin</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">-</div>
              <p className="text-xs text-muted-foreground">Berdasarkan aktivitas</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <Input
              placeholder="Cari log..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="md:w-64"
            />
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Semua Aksi" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Aksi</SelectItem>
                {Object.entries(ACTION_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entityTypeFilter} onValueChange={setEntityTypeFilter}>
              <SelectTrigger className="md:w-48">
                <SelectValue placeholder="Semua Entity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Semua Entity</SelectItem>
                {Object.entries(ENTITY_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <DatePickerWithRange
              value={dateRange}
              onChange={setDateRange}
            />
          </div>
        </CardContent>
      </Card>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={data?.data || []}
        isLoading={isLoading}
        emptyMessage="Belum ada audit log."
        tableId="admin-audit-logs"
        serverSidePagination
        totalItems={data?.meta?.total || 0}
        serverPage={page}
        serverLimit={limit}
        onPaginationChange={({ page: p, limit: l }) => {
          setPage(p);
          setLimit(l);
        }}
      />
    </div>
  );
}
