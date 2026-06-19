'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Building2,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Store,
  RefreshCw,
  Plus,
} from 'lucide-react';
import { ColumnDef } from '@tanstack/react-table';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DataTable } from '@/components/ui/data-table';
import { useGetAdminBusinesses, useUpdateBusinessSuspend, useDeleteBusiness } from '@/hooks/api/use-admin-control';
import BusinessDetailSheet from '@/features/admin/businesses/business-detail-sheet';
import { gooeyToast } from "goey-toast";

export default function BusinessManagement() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBusiness, setSelectedBusiness] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Debounce search
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, refetch, isRefetching } = useGetAdminBusinesses({
    page: 1,
    limit: 100,
    search: debouncedSearch,
    status: statusFilter === 'all' ? undefined : statusFilter,
  });

  const toggleSuspend = useUpdateBusinessSuspend();
  const deleteBusiness = useDeleteBusiness();

  const businesses = data?.businesses || [];

  const handleRowClick = (biz: any) => {
    setSelectedBusiness(biz);
    setIsSheetOpen(true);
  };

  const handleSuspend = async (businessId: string, isSuspended: boolean) => {
    await toggleSuspend.mutateAsync({ businessId, isSuspended });
    // Update local state
    if (selectedBusiness?.id === businessId) {
      setSelectedBusiness({
        ...selectedBusiness,
        subscriptionStatus: isSuspended ? 'SUSPENDED' : 'ACTIVE',
      });
    }
  };

  const handleDelete = async (businessId: string) => {
    await deleteBusiness.mutateAsync(businessId);
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    ACTIVE: {
      label: 'Aktif',
      className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    },
    SUSPENDED: {
      label: 'Suspended',
      className: 'bg-red-500/10 text-red-600 border-red-500/20',
    },
    TRIAL: {
      label: 'Trial',
      className: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    },
    EXPIRED: {
      label: 'Expired',
      className: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    },
    AWAITING_PAYMENT: {
      label: 'Menunggu Bayar',
      className: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    },
  };

  const columns = useMemo<ColumnDef<any>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Nama Bisnis',
        cell: ({ row }) => {
          const biz = row.original;
          return (
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 rounded-md border border-border/50">
                <AvatarFallback className="rounded-md bg-muted">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-sm truncate">{biz.name}</span>
                <span className="text-xs text-muted-foreground">
                  {new Date(biz.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: 'owner',
        header: 'Pemilik',
        cell: ({ row }) => {
          const biz = row.original;
          return (
            <div className="text-sm min-w-0">
              <div className="font-medium truncate">{biz.owner?.name || 'N/A'}</div>
              <div className="text-xs text-muted-foreground truncate">{biz.owner?.email}</div>
            </div>
          );
        },
      },
      {
        accessorKey: 'subscriptionStatus',
        header: 'Status',
        cell: ({ row }) => {
          const biz = row.original;
          const status = statusConfig[biz.subscriptionStatus] || {
            label: biz.subscriptionStatus,
            className: 'bg-muted text-muted-foreground',
          };
          return (
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          );
        },
      },
      {
        accessorKey: '_count.outlets',
        header: 'Outlet',
        cell: ({ row }) => {
          const biz = row.original;
          return <span className="font-medium text-sm">{biz._count?.outlets || 0}</span>;
        },
      },
      {
        accessorKey: 'owner.isVerified',
        header: 'KYC',
        cell: ({ row }) => {
          const biz = row.original;
          return biz.owner?.isVerified ? (
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Verified</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Pending</span>
            </div>
          );
        },
      },
    ],
    [],
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bisnis Terdaftar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola profil bisnis, verifikasi, dan langganan mitra
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
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama bisnis atau pemilik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <div className="flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                  <SelectValue placeholder="Semua Status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="ACTIVE">Aktif</SelectItem>
                <SelectItem value="SUSPENDED">Suspended</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="TRIAL">Trial</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <DataTable
        columns={columns}
        data={businesses}
        isLoading={isLoading}
        pagination={true}
        pageSize={10}
        emptyMessage="Tidak ada bisnis ditemukan."
        tableId="admin-businesses-table"
        onRowClick={handleRowClick}
      />

      {/* Detail Sheet */}
      <BusinessDetailSheet
        business={selectedBusiness}
        isOpen={isSheetOpen}
        onClose={setIsSheetOpen}
        onSuspend={handleSuspend}
        onDelete={handleDelete}
        isSuspendPending={toggleSuspend.isPending}
        isDeletePending={deleteBusiness.isPending}
      />
    </div>
  );
}
