/**
 * Modern User Hooks menggunakan Factory Pattern
 * 
 * Menggantikan useUsers.ts dengan pattern yang lebih scalable
 * menggunakan createEntityFactory
 * 
 * @example
 * ```typescript
 * // Di component
 * const { useList, useById, useCreate, useUpdate, useDelete } = useUsersV3();
 * 
 * const { data: users, isLoading } = useList({ page: 1, limit: 10 });
 * const createMutation = useCreate();
 * 
 * createMutation.mutate({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'password123',
 *   phone: '08123456789',
 *   role: UserRole.OWNER
 * });
 * ```
 */

import { createEntityFactory } from './use-entity-factory';
import { userService } from '@/lib/services/UserService';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { User, UserRole } from '@/types';

/**
 * Modern hooks dengan factory pattern
 */
export const useUsersV3 = () => {
  const factory = createEntityFactory({
    service: userService,
    queryKey: 'users',
    messages: {
      create: 'User berhasil ditambahkan',
      update: 'User berhasil diupdate',
      delete: 'User berhasil dihapus',
    },
  });

  const queryClient = useQueryClient();

  // Custom hooks untuk operasi spesifik user
  const useChangeRole = () => {
    return useMutation({
      mutationFn: ({ userId, role }: { userId: string; role: UserRole }) =>
        userService.changeRole(userId, role),
      onSuccess: (_data: User, { userId }: { userId: string; role: UserRole }) => {
        queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
        toast.success('Role berhasil diubah');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Gagal mengubah role');
      },
    });
  };

  const useVerifyEmail = () => {
    return useMutation({
      mutationFn: (userId: string) => userService.verifyEmail(userId),
      onSuccess: (_data: User, userId: string) => {
        queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
        toast.success('Email berhasil diverifikasi');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Gagal memverifikasi email');
      },
    });
  };

  const useSuspendUser = () => {
    return useMutation({
      mutationFn: (userId: string) => userService.suspendUser(userId),
      onSuccess: (_data: User, userId: string) => {
        queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
        toast.success('User berhasil disuspend');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Gagal suspend user');
      },
    });
  };

  const useActivateUser = () => {
    return useMutation({
      mutationFn: (userId: string) => userService.activateUser(userId),
      onSuccess: (_data: User, userId: string) => {
        queryClient.invalidateQueries({ queryKey: ['users', 'list'] });
        queryClient.invalidateQueries({ queryKey: ['users', 'detail', userId] });
        toast.success('User berhasil diaktifkan');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Gagal mengaktifkan user');
      },
    });
  };

  const useResetPassword = () => {
    return useMutation({
      mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
        userService.resetPassword(userId, newPassword),
      onSuccess: () => {
        toast.success('Password berhasil direset');
      },
      onError: (error: any) => {
        toast.error(error?.message || 'Gagal reset password');
      },
    });
  };

  const useUserStats = () => {
    return factory.useList({}, {
      queryKey: ['users', 'stats'],
      queryFn: () => userService.getStats(),
      staleTime: 60000, // 1 minute
    } as any);
  };

  return {
    // Factory hooks
    ...factory,

    // Custom user-specific hooks
    useChangeRole,
    useVerifyEmail,
    useSuspendUser,
    useActivateUser,
    useResetPassword,
    useUserStats,
  };
};

// Export sebagai default untuk kemudahan import
export default useUsersV3;
