/**
 * Example: Transaction List/Table Page
 * Menampilkan list transaksi dengan action buttons di setiap row
 */

'use client';

import { useState } from 'react';
import { ApprovePaymentButton, RejectPaymentButton } from '@/components/transactions';
import { useTransactions } from '@/hooks/useTransactions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TransactionListPage() {
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [statusFilter, setStatusFilter] = useState<string>('');

  const { useTransactionList } = useTransactions();
  const { data, isLoading } = useTransactionList({ 
    page, 
    limit,
    ...(statusFilter && { status: statusFilter })
  });

  const transactions = data?.data || [];
  const pagination = data?.pagination;

  const getStatusBadge = (status: string) => {
    const config: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      'PENDING': { variant: 'outline', label: 'Menunggu' },
      'SUCCESS': { variant: 'default', label: 'Berhasil' },
      'FAILED': { variant: 'destructive', label: 'Gagal' },
      'CANCELLED': { variant: 'secondary', label: 'Dibatalkan' }
    };
    return config[status] || { variant: 'outline', label: status };
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Daftar Transaksi</h1>
          <p className="text-gray-600 mt-1">Kelola transaksi dan pembayaran</p>
        </div>

        {/* Filter Status */}
        <div className="flex gap-2">
          <Button
            variant={statusFilter === '' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('')}
          >
            Semua
          </Button>
          <Button
            variant={statusFilter === 'PENDING' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('PENDING')}
          >
            Menunggu
          </Button>
          <Button
            variant={statusFilter === 'SUCCESS' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter('SUCCESS')}
          >
            Berhasil
          </Button>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <CardTitle>Transaksi</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">Tidak ada transaksi</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created At</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const statusInfo = getStatusBadge(transaction.status);
                    
                    return (
                      <TableRow key={transaction.id}>
                        <TableCell className="font-mono text-sm">
                          {transaction.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {transaction.orderId.slice(0, 8)}...
                        </TableCell>
                        <TableCell className="font-semibold">
                          Rp {transaction.amount.toLocaleString('id-ID')}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusInfo.variant}>
                            {statusInfo.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(transaction.createdAt).toLocaleDateString('id-ID')}
                        </TableCell>
                        <TableCell className="text-right">
                          {transaction.status === 'PENDING' ? (
                            <div className="flex justify-end gap-2">
                              <ApprovePaymentButton 
                                transactionId={transaction.id}
                                size="sm"
                              />
                              <RejectPaymentButton 
                                transactionId={transaction.id}
                                size="sm"
                              />
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Halaman {pagination.page} dari {pagination.totalPages}
                    {' '}({pagination.total} total transaksi)
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(p => Math.min(pagination.totalPages, p + 1))}
                      disabled={page === pagination.totalPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
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
