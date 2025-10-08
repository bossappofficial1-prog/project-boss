import { UserService } from "@/lib/servicev2/user.service";
import useReactQuery from "./useReactQuery";
import { createUserPayload, updateUserPayload, User } from "@/types/userv2";

/**
 * Custom hook for managing user data with React Query
 * Provides CRUD operations for users with proper caching and state management
 * 
 * @returns Object containing user queries and mutations
 * 
 * @example
 * ```tsx
 * const { useUserList, useUser, createUser, updateUser } = useUserV2();
 * 
 * // Enhanced user list with utilities
 * const { users, isEmpty, hasUsers, isLoading, pagination } = useUserList();
 * 
 * // Get specific user with utilities
 * const { user, exists, isLoading: userLoading } = useUser("123");
 * 
 * // Create user (now with built-in toast and error handling)
 * const createMutation = createUser();
 * createMutation.mutate({ name: "John", email: "john@example.com" });
 * 
 * // Update user (now with built-in toast and error handling)
 * const updateMutation = updateUser();
 * updateMutation.mutate({ id: "123", name: "Jane" });
 * 
 * // Basic usage (legacy)
 * const { data: userList } = users();
 * ```
 * 
  * @example\n * ```tsx\n * const { useUserList, useUser, createUserOptimistic, updateUserOptimistic } = useUserV2();\n * \n * // Enhanced user list with utilities\n * const { users, isEmpty, hasUsers, isLoading, pagination } = useUserList();\n * \n * // Get specific user with utilities\n * const { user, exists, isLoading: userLoading } = useUser(\"123\");\n * \n * // Create user with error handling\n * const createMutation = createUserOptimistic();\n * await createMutation.mutateAsync({ name: \"John\", email: \"john@example.com\" });\n * \n * // Update user with error handling\n * const updateMutation = updateUserOptimistic();\n * await updateMutation.mutateAsync({ id: \"123\", name: \"Jane\" });\n * \n * // Basic usage (legacy)\n * const { data: userList } = users();\n * const createBasic = createUser();\n * createBasic.mutate({ name: \"Basic\", email: \"basic@example.com\" });\n * ```
 */
export default function useUserV2() {
    const queryKey = "users"
    const { createMutation, createQuery, createParameterizedQuery } = useReactQuery()

    // Create queries using new API
    const getData = createQuery([queryKey], UserService.getAll)
    const getById = createParameterizedQuery(
        (id: string) => [queryKey, id],
        (id: string) => UserService.getById(id)
    )

    // Create mutations with built-in error handling and toast
    const createUser = createMutation<User, createUserPayload>(
        (payload) => UserService.create(payload),
        {
            invalidateKeys: [queryKey],
            toast: {
                success: "User berhasil dibuat!",
                error: "Gagal membuat user"
            }
        }
    )

    const updateUser = createMutation<User, updateUserPayload & { id: string }>(
        ({ id, ...payload }) => UserService.update(id, payload),
        {
            invalidateKeys: [queryKey],
            toast: {
                success: "User berhasil diupdate!",
                error: "Gagal mengupdate user"
            }
        }
    )

    const deleteUser = createMutation<void, string>(
        (id) => UserService.delete(id),
        {
            invalidateKeys: [queryKey],
            toast: {
                success: "User berhasil dihapus!",
                error: "Gagal menghapus user"
            }
        }
    )

    // Utility functions for enhanced UX
    const useUserList = () => {
        const query = getData();
        return {
            ...query,
            users: query.data?.data || [],
            isEmpty: !query.data?.data?.length,
            hasUsers: Boolean(query.data?.data?.length),
            pagination: query.data?.pagination
        };
    };

    const useUser = (id: string) => {
        const query = getById(id);
        return {
            ...query,
            user: query.data,
            exists: Boolean(query.data)
        };
    };

    return {
        // Enhanced query hooks
        useUserList,
        useUser,

        // Basic queries (for direct access)
        users: getData,
        userById: getById,

        // Mutations with built-in error handling
        createUser,
        updateUser,
        deleteUser,

        // Legacy aliases for backward compatibility
        getData,
        getById
    }
}