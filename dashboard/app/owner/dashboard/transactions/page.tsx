'use client';

import { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Eye, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';
import { DataTable } from '@/components/ui/data-table';
import { useDebounce } from '@/hooks/useDebounce';

export default function TransactionsPage() {
  const { outlets } = useOutletContext();
  const { useTransactionList } = useTransactions();

  // Filter states
  const [outletId, setOutletId] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('ALL'); // New: transaction type filter
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const searchQuery = useDebounce(searchTerm, 500)

  // Fetch transactions
  const { data, isLoading, isFetching, error, refetch } = useTransactionList({
    outletId: outletId || undefined,
    status: status || undefined,
    type: type as 'INCOME' | 'EXPENSE' | 'ALL', // New: pass type filter
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
    q: searchQuery
  });

  // Status badge color
  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; variant: 'default' | 'destructive' | 'success' | 'warning' | 'secondary' }> = {
      PENDING: { label: 'Pending', variant: 'warning' },
      SUCCESS: { label: 'Berhasil', variant: 'success' },
      FAILED: { label: 'Gagal', variant: 'destructive' },
      CANCELLED: { label: 'Dibatalkan', variant: 'secondary' },
    };

    const statusInfo = statusMap[status] || { label: status, variant: 'default' };

    return (
      <Badge variant={statusInfo.variant} className="font-poppins">
        {statusInfo.label}
      </Badge>
    );
  };

  // Payment method badge
  const getPaymentMethodBadge = (transaction: any) => {
    if (transaction.isManual) {
      return (
        <Badge variant="outline" className="font-poppins">
          {transaction.manualMethod || 'Manual'}
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="font-poppins">
        {transaction.paymentMethod || 'Online'}
      </Badge>
    );
  };

  // Reset filters
  const handleResetFilters = () => {
    setOutletId('');
    setStatus('');
    setType('ALL');
    setStartDate('');
    setEndDate('');
    setSearchTerm('');
    setPage(1);
  };

  const totalTransactions = data?.pagination?.total ?? 0;
  const pageSizeOptions = useMemo(() => {
    const base = [5, 10, 20, 50, 100];
    if (!base.includes(limit)) {
      base.push(limit);
    }
    return base.sort((a, b) => a - b);
  }, [limit]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 font-poppins">Riwayat Transaksi</h1>
          <p className="mt-1 text-sm text-gray-500 font-poppins">
            Lihat dan kelola semua transaksi bisnis Anda
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-poppins">
            <Filter className="w-5 h-5" />
            Filter
          </CardTitle>
          <CardDescription className="font-poppins">
            Filter transaksi berdasarkan tipe, outlet, status, dan tanggal
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Cari transaksi..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
                className="pl-10 font-poppins"
              />
            </div>

            {/* Type Filter - NEW */}
            <Select value={type} onValueChange={(value) => {
              setType(value);
              setPage(1);
            }}>
              <SelectTrigger className="font-poppins">
                <SelectValue placeholder="Semua Tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL" className="font-poppins">Semua Tipe</SelectItem>
                <SelectItem value="INCOME" className="font-poppins">Pemasukan</SelectItem>
                <SelectItem value="EXPENSE" className="font-poppins">Pengeluaran</SelectItem>
              </SelectContent>
            </Select>

            {/* Outlet Filter */}
            <Select value={outletId || "all"} onValueChange={(value) => {
              setOutletId(value === "all" ? "" : value);
              setPage(1);
            }}>
              <SelectTrigger className="font-poppins">
                <SelectValue placeholder="Semua Outlet" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-poppins">Semua Outlet</SelectItem>
                {outlets.map((outlet) => (
                  <SelectItem key={outlet.id} value={outlet.id} className="font-poppins">
                    {outlet.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={status || "all"} onValueChange={(value) => {
              setStatus(value === "all" ? "" : value);
              setPage(1);
            }}>
              <SelectTrigger className="font-poppins">
                <SelectValue placeholder="Semua Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="font-poppins">Semua Status</SelectItem>
                <SelectItem value="PENDING" className="font-poppins">Pending</SelectItem>
                <SelectItem value="SUCCESS" className="font-poppins">Berhasil</SelectItem>
                <SelectItem value="FAILED" className="font-poppins">Gagal</SelectItem>
                <SelectItem value="CANCELLED" className="font-poppins">Dibatalkan</SelectItem>
              </SelectContent>
            </Select>

            {/* Date Range */}
            <div className="flex gap-2 md:col-span-2 lg:col-span-1">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="font-poppins"
                placeholder="Dari tanggal"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="font-poppins"
                placeholder="Sampai tanggal"
              />
            </div>
          </div>

          {/* Reset Button */}
          {(outletId || status || type !== 'ALL' || startDate || endDate || searchTerm) && (
            <div className="mt-4">
              <Button variant="outline" onClick={handleResetFilters} className="font-poppins">
                Reset Filter
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      {!isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Income */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-poppins">Total Pemasukan</p>
                  <p className="text-2xl font-bold text-green-600 font-poppins mt-2">
                    {formatCurrency(data?.data.totals.total_revenue || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Expense */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-poppins">Total Pengeluaran</p>
                  <p className="text-2xl font-bold text-red-600 font-poppins mt-2">
                    {formatCurrency(data?.data.totals.total_expense || 0)}
                  </p>
                </div>
                <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Net Amount */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-poppins">Saldo Bersih</p>
                  <p className={`text-2xl font-bold font-poppins mt-2 ${(data?.data.totals.total_margin_pendapatan || 0) >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(data?.data.totals.total_margin_pendapatan || 0)}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${data?.data.totals.total_margin_pendapatan || 0 >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  <DollarSign className={`h-6 w-6 ${data?.data.totals.total_margin_pendapatan || 0 >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <DataTable
        isLoading={isLoading}
        isRefreshing={isFetching && !isLoading}
        onRefresh={refetch}
        data={data?.data.items || []}
        columns={[
          {
            accessorKey: 'createdAt',
            header: 'Tanggal',
            cell(props) {
              return format(new Date(props.getValue() as Date), 'dd MMM yyyy, HH:mm', { locale: localeId })
            },
          },
          {
            accessorKey: 'type',
            header: 'Tipe',
            cell(props) {
              return <Badge
                variant={props.getValue() as any === 'INCOME' ? 'success' : 'destructive'}
                className="font-poppins"
              >
                {props.getValue() as any === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
              </Badge>
            },
          },
          {
            accessorKey: 'description',
            enableSorting: false,
            header: 'Deskripsi',
          },
          {
            accessorKey: 'outlet',
            header: 'Outlet',
            enableSorting: false,
            cell: (outlet) => (outlet.getValue() as any).name || '-'
          },
          {
            accessorKey: 'paymentMethod',
            header: "Metode",
            cell: (props) => getPaymentMethodBadge(props.row.original),
          },
          {
            accessorKey: 'amount',
            header: "Total",
            cell: (props) => {
              const transaction = props.row.original
              return <span className={`font-semibold font-poppins ${transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                {transaction.type === 'EXPENSE' ? '- ' : '+ '}
                {formatCurrency(transaction.amount)}
              </span>
            },
          },
          {
            accessorKey: 'status',
            header: "Status",
            enableSorting: false,
            cell: (props) => {
              const transaction = props.row.original
              return getStatusBadge(transaction.status)
            },
          }
        ]}

        showColumnVisibility
        enableColumnResizing
        actionViewType='dropdown'
        serverSidePagination
        totalItems={totalTransactions}
        serverPage={page}
        serverLimit={limit}
        onPaginationChange={({ page: nextPage, limit: nextLimit }) => {
          setPage(nextPage);
          setLimit(nextLimit);
        }}
        pageSizeOptions={pageSizeOptions}
        globalFilter={false}
        rowActions={(row) => [
          {
            label: "Detail",
            icon: Eye,
            onClick(row) {
            },
          }
        ]}
        enableExport
        exportFilename='transactions'
        exportConfig={{
          csv: {
            enabled: true,
            filename: "TransactionsPage",
            customMapping(row) {
              return {
                ...row,
                "Outlet": row.outlet.name
              }
            },
          }
        }}
      />
    </div>
  );
}
