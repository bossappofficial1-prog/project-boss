'use client';

import { useState, useMemo } from 'react';
import { useTransactions } from '@/hooks/useTransactions';
import { useOutletContext } from '@/components/providers/OutletProvider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Calendar, Filter, Eye, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

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
  const limit = 10;

  // Fetch transactions
  const { data, isLoading, error } = useTransactionList({
    outletId: outletId || undefined,
    status: status || undefined,
    type: type as 'INCOME' | 'EXPENSE' | 'ALL', // New: pass type filter
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    page,
    limit,
  });

  // Filter transactions by search term (client-side)
  const filteredTransactions = useMemo(() => {
    if (!data?.data) return [];
    
    if (!searchTerm) return data.data;

    return data.data.filter((transaction) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        transaction.id.toLowerCase().includes(searchLower) ||
        transaction.description.toLowerCase().includes(searchLower) ||
        transaction.order?.guestCustomer?.name.toLowerCase().includes(searchLower) ||
        transaction.order?.guestCustomer?.phone.toLowerCase().includes(searchLower) ||
        transaction.outlet?.name.toLowerCase().includes(searchLower)
      );
    });
  }, [data?.data, searchTerm]);

  // Calculate summary
  const summary = useMemo(() => {
    if (!filteredTransactions.length) {
      return { totalIncome: 0, totalExpense: 0, netAmount: 0 };
    }

    const totalIncome = filteredTransactions
      .filter(t => t.type === 'INCOME' && t.status === 'SUCCESS')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = filteredTransactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      totalIncome,
      totalExpense,
      netAmount: totalIncome - totalExpense,
    };
  }, [filteredTransactions]);

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

  // Export to CSV
  const handleExport = () => {
    if (!filteredTransactions.length) return;

    const csvHeaders = [
      'ID Transaksi',
      'Tipe',
      'Tanggal',
      'Outlet',
      'Deskripsi',
      'Customer',
      'Total',
      'Status',
      'Metode Pembayaran',
    ].join(',');

    const csvRows = filteredTransactions.map((transaction) => {
      return [
        transaction.id,
        transaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran',
        format(new Date(transaction.createdAt), 'dd/MM/yyyy HH:mm', { locale: localeId }),
        transaction.outlet?.name || '-',
        transaction.description,
        transaction.order?.guestCustomer?.name || '-',
        transaction.type === 'INCOME' ? transaction.amount : -transaction.amount,
        transaction.status,
        transaction.isManual ? transaction.manualMethod : transaction.paymentMethod,
      ].join(',');
    });

    const csv = [csvHeaders, ...csvRows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaksi-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

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
        <div className="mt-4 sm:mt-0">
          <Button 
            onClick={handleExport} 
            disabled={!filteredTransactions.length}
            className="font-poppins"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
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
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 font-poppins"
              />
            </div>

            {/* Type Filter - NEW */}
            <Select value={type} onValueChange={(value) => setType(value)}>
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
            <Select value={outletId || "all"} onValueChange={(value) => setOutletId(value === "all" ? "" : value)}>
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
            <Select value={status || "all"} onValueChange={(value) => setStatus(value === "all" ? "" : value)}>
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
                onChange={(e) => setStartDate(e.target.value)}
                className="font-poppins"
                placeholder="Dari tanggal"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
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
      {!isLoading && filteredTransactions.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Income */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 font-poppins">Total Pemasukan</p>
                  <p className="text-2xl font-bold text-green-600 font-poppins mt-2">
                    {formatCurrency(summary.totalIncome)}
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
                    {formatCurrency(summary.totalExpense)}
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
                  <p className={`text-2xl font-bold font-poppins mt-2 ${summary.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                    {formatCurrency(summary.netAmount)}
                  </p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${summary.netAmount >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
                  <DollarSign className={`h-6 w-6 ${summary.netAmount >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transactions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
                <p className="text-gray-500 font-poppins">Memuat transaksi...</p>
              </div>
            </div>
          ) : error ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <p className="text-red-600 font-poppins mb-2">Gagal memuat transaksi</p>
                <p className="text-sm text-gray-500 font-poppins">
                  {typeof error === 'object' && error && 'message' in error 
                    ? (error as any).message 
                    : 'Terjadi kesalahan saat memuat data'}
                </p>
              </div>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="mx-auto h-24 w-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                  <Calendar className="h-12 w-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 font-poppins">
                  Tidak ada transaksi
                </h3>
                <p className="text-gray-600 font-poppins">
                  {searchTerm || outletId || status || startDate || endDate
                    ? 'Tidak ada transaksi yang sesuai dengan filter'
                    : 'Belum ada transaksi yang tercatat'}
                </p>
              </div>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="font-poppins">Tanggal</TableHead>
                    <TableHead className="font-poppins">Tipe</TableHead>
                    <TableHead className="font-poppins">Deskripsi</TableHead>
                    <TableHead className="font-poppins">Outlet</TableHead>
                    <TableHead className="font-poppins">Metode</TableHead>
                    <TableHead className="font-poppins">Total</TableHead>
                    <TableHead className="font-poppins">Status</TableHead>
                    <TableHead className="font-poppins">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map((transaction) => (
                    <TableRow key={transaction.id}>
                      <TableCell className="font-poppins">
                        {format(new Date(transaction.createdAt), 'dd MMM yyyy, HH:mm', { locale: localeId })}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={transaction.type === 'INCOME' ? 'success' : 'destructive'}
                          className="font-poppins"
                        >
                          {transaction.type === 'INCOME' ? 'Pemasukan' : 'Pengeluaran'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-poppins max-w-xs truncate">
                        {transaction.description}
                      </TableCell>
                      <TableCell className="font-poppins">
                        {transaction.outlet?.name || '-'}
                      </TableCell>
                      <TableCell>{getPaymentMethodBadge(transaction)}</TableCell>
                      <TableCell className={`font-semibold font-poppins ${transaction.type === 'EXPENSE' ? 'text-red-600' : 'text-green-600'}`}>
                        {transaction.type === 'EXPENSE' ? '- ' : '+ '}
                        {formatCurrency(transaction.amount)}
                      </TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="font-poppins">
                          <Eye className="w-4 h-4 mr-1" />
                          Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {data?.pagination && data.pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t">
                  <div className="text-sm text-gray-500 font-poppins">
                    Menampilkan {((page - 1) * limit) + 1} - {Math.min(page * limit, data.pagination.total)} dari {data.pagination.total} transaksi
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                      className="font-poppins"
                    >
                      Sebelumnya
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: data.pagination.totalPages }, (_, i) => i + 1)
                        .filter((p) => {
                          // Show first, last, current, and adjacent pages
                          return p === 1 || 
                                 p === data.pagination.totalPages || 
                                 (p >= page - 1 && p <= page + 1);
                        })
                        .map((p, idx, arr) => {
                          // Add ellipsis
                          if (idx > 0 && p - arr[idx - 1] > 1) {
                            return (
                              <>
                                <span key={`ellipsis-${p}`} className="px-2">...</span>
                                <Button
                                  key={p}
                                  variant={p === page ? 'default' : 'outline'}
                                  size="sm"
                                  onClick={() => setPage(p)}
                                  className="font-poppins"
                                >
                                  {p}
                                </Button>
                              </>
                            );
                          }
                          return (
                            <Button
                              key={p}
                              variant={p === page ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setPage(p)}
                              className="font-poppins"
                            >
                              {p}
                            </Button>
                          );
                        })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === data.pagination.totalPages}
                      className="font-poppins"
                    >
                      Selanjutnya
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
