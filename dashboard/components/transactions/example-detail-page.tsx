/**
 * Example: Transaction Detail Page
 * Menampilkan detail transaksi dengan action buttons
 */

'use client';

import { ApprovePaymentButton, RejectPaymentButton } from '@/components/transactions';
import { useTransactions } from '@/hooks/useTransactions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

export default function TransactionDetailPage({ params }: { params: { id: string } }) {
  const { useTransaction } = useTransactions();
  const { data, isLoading, error } = useTransaction(params.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error || !data?.data) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold text-gray-900">Transaksi tidak ditemukan</h2>
        <p className="text-gray-600 mt-2">ID: {params.id}</p>
      </div>
    );
  }

  const transaction = data.data;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'PENDING': 'outline',
      'SUCCESS': 'default',
      'FAILED': 'destructive',
      'CANCELLED': 'secondary'
    };
    return variants[status] || 'outline';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Detail Transaksi</h1>
          <p className="text-gray-600 mt-1">ID: {transaction.id}</p>
        </div>

        {/* Action Buttons - hanya muncul jika PENDING */}
        {transaction.status === 'PENDING' && (
          <div className="flex gap-2">
            <ApprovePaymentButton 
              transactionId={transaction.id}
              onSuccess={() => {
                console.log('Transaction approved successfully');
              }}
            />
            <RejectPaymentButton 
              transactionId={transaction.id}
              onSuccess={() => {
                console.log('Transaction rejected successfully');
              }}
            />
          </div>
        )}
      </div>

      {/* Transaction Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Transaksi</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="text-lg font-semibold">{transaction.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <Badge variant={getStatusBadge(transaction.status)}>
                {transaction.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Amount</p>
              <p className="text-lg font-semibold">
                Rp {transaction.amount.toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="text-lg">{transaction.paymentMethod || '-'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Created At</p>
              <p className="text-lg">
                {new Date(transaction.createdAt).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Updated At</p>
              <p className="text-lg">
                {new Date(transaction.updatedAt).toLocaleString('id-ID')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Order Details (if available) */}
      {transaction.order && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Order</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-100 p-4 rounded-lg overflow-auto">
              {JSON.stringify(transaction.order, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
