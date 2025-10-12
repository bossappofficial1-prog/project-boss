/**
 * Authorization Utility
 * Centralized role-based access control untuk dashboard
 */

export type UserRole = 'OWNER' | 'ADMIN' | 'USER';

export const Authorization = {
  /**
   * Cek apakah user dapat menyetujui pembayaran
   */
  canApprovePayment: (userRole?: UserRole | string): boolean => {
    return ['OWNER', 'ADMIN'].includes(userRole || '');
  },

  /**
   * Cek apakah user dapat menolak pembayaran
   */
  canRejectPayment: (userRole?: UserRole | string): boolean => {
    return ['OWNER', 'ADMIN'].includes(userRole || '');
  },

  /**
   * Cek apakah user dapat melihat semua transaksi
   */
  canViewAllTransactions: (userRole?: UserRole | string): boolean => {
    return ['OWNER', 'ADMIN'].includes(userRole || '');
  },

  /**
   * Cek apakah user dapat mengubah status transaksi
   */
  canUpdateTransactionStatus: (userRole?: UserRole | string): boolean => {
    return ['OWNER', 'ADMIN'].includes(userRole || '');
  },

  /**
   * Cek apakah user dapat export data transaksi
   */
  canExportTransactions: (userRole?: UserRole | string): boolean => {
    return ['OWNER', 'ADMIN'].includes(userRole || '');
  },

  /**
   * Cek apakah user dapat mengelola user lain
   */
  canManageUsers: (userRole?: UserRole | string): boolean => {
    return ['OWNER', 'ADMIN'].includes(userRole || '');
  },

  /**
   * Cek apakah user adalah OWNER
   */
  isOwner: (userRole?: UserRole | string): boolean => {
    return userRole === 'OWNER';
  },

  /**
   * Cek apakah user adalah ADMIN atau OWNER
   */
  isAdminOrOwner: (userRole?: UserRole | string): boolean => {
    return ['OWNER', 'ADMIN'].includes(userRole || '');
  }
};
