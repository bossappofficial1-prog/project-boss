// Custom hooks for User Management using React Query
import { useMutation, useQuery, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { userApi } from '@/lib/api';
import type {
    User,
    CreateUserInput,
    UpdateUserInput,
    PaginationParams,
    PaginatedUsersResponse,
    UserStats
} from '@/types/user';
import { UserService } from '@/lib/servicev2/user.service';
import { AxiosError } from 'axios';

export interface UserDetail {
    id: string
    name: string
    avatar?: string
    email: string;
    role: string
    isVerified: boolean
    phone?: string
    business: Business
}

export interface Business {
    name: string
    description: string
    bankName: string
    bankAccount: string
    accountHolder: string
    subscriptionStatus: string
    subscriptionPlan: string
    subscriptionEndDate: any
}

// Query Keys
export const userQueryKeys = {
    all: ['users'] as const,
    lists: () => [...userQueryKeys.all, 'list'] as const,
    list: (params?: PaginationParams) => [...userQueryKeys.lists(), params] as const,
    details: () => [...userQueryKeys.all, 'detail'] as const,
    detail: (id: string) => [...userQueryKeys.details(), id] as const,
    stats: () => [...userQueryKeys.all, 'stats'] as const,
} as const;

// Hook to get paginated users
export function useUsers(
    params?: PaginationParams,
    options?: Omit<UseQueryOptions<PaginatedUsersResponse>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: userQueryKeys.list(params),
        queryFn: () => userApi.getUsers(params),
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
        refetchOnWindowFocus: false,
        ...options,
    });
}

// Hook to get single user
export function useUser(
    userId: string,
    options?: Omit<UseQueryOptions<User>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: userQueryKeys.detail(userId),
        queryFn: () => userApi.getUserById(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
}

export function useUserDetail(
    userId: string,
    options?: Omit<UseQueryOptions<UserDetail>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: userQueryKeys.detail(userId),
        queryFn: () => UserService.getUserDetail(userId),
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
        ...options,
    });
}

// Hook to get user statistics
export function useUserStats(
    options?: Omit<UseQueryOptions<UserStats>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: userQueryKeys.stats(),
        queryFn: () => userApi.getUserStats(),
        staleTime: 2 * 60 * 1000, // 2 minutes
        ...options,
    });
}

// Hook to create user
export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userData: CreateUserInput) => UserService.create(userData),
        onSuccess: (newUser) => {
            // Invalidate and refetch users list
            queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });

            // Add to cache
            queryClient.setQueryData(userQueryKeys.detail(newUser.id), newUser);

            toast.success('User created successfully!', {
                description: `${newUser.email} has been added to the system.`
            });
        },
        onError: (error: AxiosError) => {
            toast.error('Failed to create user', {
                description: (error.response?.data as any).message
            });
        },
    });
}

// Hook to update user
export function useUpdateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, userData }: { userId: string; userData: UpdateUserInput }) =>
            UserService.update(userId, userData),
        onSuccess: (updatedUser, { userId }) => {
            // Update specific user in cache
            queryClient.setQueryData(userQueryKeys.detail(userId), updatedUser);

            // Invalidate lists to reflect changes
            queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });

            toast.success('User updated successfully!', {
                description: `${updatedUser.name} has been updated.`
            });
        },
        onError: (error: AxiosError) => {
            toast.error('Failed to update user', {
                description: (error.response?.data as any).message
            });
        },
    });
}

// Hook to delete user
export function useDeleteUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userId: string) => UserService.delete(userId),
        onSuccess: (_, userId) => {
            // Remove from cache
            queryClient.removeQueries({ queryKey: userQueryKeys.detail(userId) });

            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });

            toast.success('User deleted successfully!');
        },
        onError: (error: AxiosError) => {
            toast.error('Failed to delete user', {
                description: (error.response?.data as any).message
            });
        },
    });
}

// Hook to bulk delete users
export function useBulkDeleteUsers() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (userIds: string[]) => userApi.bulkDeleteUsers(userIds),
        onSuccess: (result, userIds) => {
            // Remove deleted users from cache
            userIds.forEach(userId => {
                queryClient.removeQueries({ queryKey: userQueryKeys.detail(userId) });
            });

            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });

            toast.success(`Successfully deleted ${result.deletedCount} users`);
        },
        onError: (error: AxiosError) => {
            toast.error('Failed to delete users', {
                description: (error.response?.data as any).message
            });
        },
    });
}

// Hook to update user status (verify/unverify)
export function useUpdateUserStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, isVerified }: { userId: string; isVerified: boolean }) =>
            userApi.updateUserStatus(userId, isVerified),
        onSuccess: (updatedUser, { userId, isVerified }) => {
            // Update user in cache
            queryClient.setQueryData(userQueryKeys.detail(userId), updatedUser);

            // Invalidate lists
            queryClient.invalidateQueries({ queryKey: userQueryKeys.lists() });
            queryClient.invalidateQueries({ queryKey: userQueryKeys.stats() });

            const statusText = isVerified ? 'verified' : 'unverified';
            toast.success(`User ${statusText} successfully!`, {
                description: `${updatedUser.name} is now ${statusText}.`
            });
        },
        onError: (error: AxiosError) => {
            toast.error('Failed to update user status', {
                description: (error.response?.data as any).message
            });
        },
    });
}

// Hook to search users
export function useSearchUsers(
    query: string,
    options?: { role?: string; limit?: number },
    queryOptions?: Omit<UseQueryOptions<User[]>, 'queryKey' | 'queryFn'>
) {
    return useQuery({
        queryKey: [...userQueryKeys.all, 'search', query, options],
        queryFn: () => userApi.searchUsers(query, options),
        enabled: !!query && query.length >= 2, // Only search if query has 2+ characters
        staleTime: 30 * 1000, // 30 seconds
        ...queryOptions,
    });
}

// Hook to reset user password
export function useResetUserPassword() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, newPassword }: { userId: string; newPassword: string }) =>
            userApi.resetUserPassword(userId, newPassword),
        onSuccess: (_, { userId }) => {
            toast.success('Password reset successfully!');
        },
        onError: (error: AxiosError) => {
            toast.error('Failed to reset password', {
                description: (error.response?.data as any).message
            });
        },
    });
}

// Hook to send verification email
export function useSendVerificationEmail() {
    return useMutation({
        mutationFn: (userId: string) => userApi.sendVerificationEmail(userId),
        onSuccess: () => {
            toast.success('Verification email sent successfully!');
        },
        onError: (error: Error) => {
            toast.error('Failed to send verification email', {
                description: error.message
            });
        },
    });
}


export function useUserOperations() {
    const createUser = useCreateUser();
    const updateUser = useUpdateUser();
    const deleteUser = useDeleteUser();
    const bulkDeleteUsers = useBulkDeleteUsers();
    const updateUserStatus = useUpdateUserStatus();
    const resetPassword = useResetUserPassword();
    const sendVerification = useSendVerificationEmail();

    return {
        createUser,
        updateUser,
        deleteUser,
        bulkDeleteUsers,
        updateUserStatus,
        resetPassword,
        sendVerification,

        // Loading states
        isLoading: createUser.isPending || updateUser.isPending || deleteUser.isPending ||
            bulkDeleteUsers.isPending || updateUserStatus.isPending ||
            resetPassword.isPending || sendVerification.isPending,
    };
}