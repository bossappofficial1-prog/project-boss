import { transactionApi } from '@/lib/api';
import type { Transaction, TransactionListParams, PaginatedResponse } from '@/lib/apis/transaction';
import useReactQuery from './useReactQuery';

/**
 * Hook untuk operasi transaksi
 * Mengikuti pattern BOSS Dashboard yang sudah ada
 */
export const useTransactions = () => {
  const {
    createQuery,
    createParameterizedQuery,
    createMutation
  } = useReactQuery();

  // Query: Get all transactions with pagination
  const useTransactionList = (params?: TransactionListParams) => {
    const queryKey = ['transactions', JSON.stringify(params || {})] as (string | number)[];
    return createQuery(
      queryKey,
      () => transactionApi.getAll(params)
    )();
  };

  // Query: Get transaction by ID
  const useTransaction = (id: string) => {
    return createParameterizedQuery(
      (id: string) => ['transaction', id],
      (id: string) => transactionApi.getById(id)
    )(id);
  };

  // Mutation: Approve payment
  const useApprovePayment = createMutation(
    (id: string) => transactionApi.approve(id),
    {
      invalidateKeys: ['transactions'],
      toast: {
        success: 'Pembayaran berhasil disetujui',
        error: 'Gagal menyetujui pembayaran'
      }
    }
  );

  // Mutation: Reject payment
  const useRejectPayment = createMutation(
    ({ id, reason }: { id: string; reason?: string }) =>
      transactionApi.reject(id, reason),
    {
      invalidateKeys: ['transactions'],
      toast: {
        success: 'Pembayaran berhasil ditolak',
        error: 'Gagal menolak pembayaran'
      }
    }
  );

  // Mutation: Update status
  const useUpdateStatus = createMutation(
    ({ id, status }: { id: string; status: string }) =>
      transactionApi.updateStatus(id, status),
    {
      invalidateKeys: ['transactions'],
      toast: {
        success: 'Status transaksi berhasil diperbarui',
        error: 'Gagal memperbarui status'
      }
    }
  );

  return {
    useTransactionList,
    useTransaction,
    useApprovePayment,
    useRejectPayment,
    useUpdateStatus
  };
};
