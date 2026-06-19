import {
    useMutation,
    useQuery,
    useQueryClient,
    UseQueryOptions,
    useInfiniteQuery,
    UseInfiniteQueryOptions,
    InfiniteData
} from "@tanstack/react-query"
import { gooeyToast } from "goey-toast"

// Types for better API design
type ToastConfig = {
    success?: string | false;
    error?: string | false;
};

type MutationConfig<TData, TVariables, TError = unknown> = {
    invalidateKeys?: (string | number)[];
    toast?: ToastConfig;
    onSuccess?: (data: TData, variables: TVariables) => void;
    onError?: (error: TError, variables: TVariables) => void;
};

/**
 * Enhanced React Query hook factory with built-in error handling, caching, and utilities
 * 
 * @returns Object containing factory functions for creating queries and mutations
 * 
 * @example
 * ```tsx
 * const { createMutation, createQuery, createParameterizedQuery } = useReactQuery();
 * 
 * // Simple query
 * const useUsers = createQuery(['users'], UserService.getAll);
 * 
 * // Parameterized query
 * const useUser = createParameterizedQuery(
 *   (id: string) => ['users', id],
 *   (id: string) => UserService.getById(id)
 * );
 * 
 * // Mutation with custom config\n * const useCreateUser = createMutation(UserService.create, {\n *   invalidateKeys: ['users'],\n *   toast: { success: 'User created!', error: 'Failed to create user' }\n * });\n * \n * // Infini/**
 * Enhanced React Query hook factory with built-in error handling, caching, and utilities
 * 
 * @returns Object containing factory functions for creating queries and mutations
 * 
 * @example
 * ```tsx
 * const { createMutation, createQuery, createParameterizedQuery } = useReactQuery();
 * 
 * // Simple query
 * const useUsers = createQuery(['users'], UserService.getAll);
 * 
 * // Parameterized query
 * const useUser = createParameterizedQuery(
 *   (id: string) => ['users', id],
 *   (id: string) => UserService.getById(id)
 * );
 * 
 * // Mutation with custom config\n * const useCreateUser = createMutation(UserService.create, {\n *   invalidateKeys: ['users'],\n *   toast: { success: 'User created!', error: 'Failed to create user' }\n * });\n * \n * // Infinite query for pagination\n * const useInfiniteUsers = createInfiniteQuery(\n *   ['users', 'infinite'],\n *   ({ pageParam }) => UserService.getUsers({ page: pageParam || 1 }),\n *   {\n *     initialPageParam: 1,\n *     getNextPageParam: (lastPage, allPages) => {\n *       return lastPage.hasMore ? allPages.length + 1 : undefined;\n *     }\n *   }\n * );\n * ```\n 
 * */
export default function useReactQuery() {
    const createMutation = <TData, TVariables, TError = unknown>(
        mutationFn: (variables: TVariables) => Promise<TData>,
        config?: MutationConfig<TData, TVariables, TError>
    ) => {
        return function useGeneratedMutation() {
            const queryClient = useQueryClient()
            const { invalidateKeys, toast: toastConfig, onSuccess: customOnSuccess, onError: customOnError } = config || {}

            return useMutation<TData, TError, TVariables>({
                mutationFn,
                onSuccess: (data, variables) => {
                    // Cache invalidation
                    if (invalidateKeys?.length) {
                        queryClient.invalidateQueries({ queryKey: invalidateKeys })
                    }

                    // Toast notification
                    const successMessage = toastConfig?.success
                    if (successMessage !== false) {
                        gooeyToast.success(successMessage || "Operation completed successfully")
                    }

                    // Call user-defined success handler
                    customOnSuccess?.(data, variables)
                },
                onError: (error, variables) => {
                    // Toast notification
                    const errorMessage = toastConfig?.error
                    if (errorMessage !== false) {
                        const message = errorMessage ||
                            (error as Error)?.message ||
                            "Operation failed"
                        gooeyToast.error(message)
                    }

                    // Call user-defined error handler
                    customOnError?.(error, variables)
                },
            })
        }
    }

    // Simple query (no parameters)
    const createQuery = <TData, TError = unknown>(
        queryKey: (string | number)[],
        queryFn: () => Promise<TData>,
        options?: UseQueryOptions<TData, TError>
    ) => {
        return function useGeneratedQuery() {
            return useQuery<TData, TError>({
                queryKey,
                queryFn,
                ...options,
            })
        }
    }

    // Parameterized query (with arguments)
    const createParameterizedQuery = <TData, TArgs = string, TError = unknown>(
        keyFactory: (args: TArgs) => (string | number)[],
        queryFn: (args: TArgs) => Promise<TData>,
        options?: UseQueryOptions<TData, TError>
    ) => {
        return function useGeneratedQuery(args: TArgs) {
            // Better validation for args
            const isEnabled = args !== undefined &&
                args !== null &&
                (typeof args !== 'string' || args.trim() !== '') &&
                (options?.enabled !== false)

            return useQuery<TData, TError>({
                queryKey: keyFactory(args),
                queryFn: () => queryFn(args),
                enabled: isEnabled,
                ...options,
            })
        }
    }

    // Utility functions
    const createInfiniteQuery = <TData, TPageParam = unknown, TError = unknown>(
        queryKey: (string | number)[],
        queryFn: (context: { pageParam: TPageParam }) => Promise<TData>,
        config?: {
            initialPageParam?: TPageParam;
            getNextPageParam?: (lastPage: TData, allPages: TData[], lastPageParam: TPageParam, allPageParams: TPageParam[]) => TPageParam | undefined | null;
            getPreviousPageParam?: (firstPage: TData, allPages: TData[], firstPageParam: TPageParam, allPageParams: TPageParam[]) => TPageParam | undefined | null;
            options?: Omit<UseInfiniteQueryOptions<TData, TError, InfiniteData<TData, TPageParam>, (string | number)[], TPageParam>, 'queryKey' | 'queryFn' | 'initialPageParam' | 'getNextPageParam' | 'getPreviousPageParam'>;
        }
    ) => {
        return function useGeneratedInfiniteQuery() {
            const { initialPageParam, getNextPageParam, getPreviousPageParam, options } = config || {};

            return useInfiniteQuery({
                queryKey,
                queryFn: ({ pageParam }) => queryFn({ pageParam: pageParam as TPageParam }),
                initialPageParam: initialPageParam as TPageParam,
                getNextPageParam: getNextPageParam || (() => undefined),
                getPreviousPageParam,
                ...options,
            })
        }
    }

    // Get query client once at the top level
    const queryClient = useQueryClient()

    const invalidateQueries = (keys: (string | number)[]) => {
        return () => queryClient.invalidateQueries({ queryKey: keys })
    }

    const prefetchQuery = <TData>(
        queryKey: (string | number)[],
        queryFn: () => Promise<TData>
    ) => {
        return () => queryClient.prefetchQuery({ queryKey, queryFn })
    }

    // Additional utility functions
    const setQueryData = <TData>(queryKey: (string | number)[], data: TData) => {
        queryClient.setQueryData(queryKey, data)
    }

    const getQueryData = <TData>(queryKey: (string | number)[]): TData | undefined => {
        return queryClient.getQueryData<TData>(queryKey)
    }

    const removeQueries = (keys: (string | number)[]) => {
        queryClient.removeQueries({ queryKey: keys })
    }

    return {
        // Core functions
        createMutation,
        createQuery,
        createParameterizedQuery,

        // Advanced functions
        createInfiniteQuery,

        // Cache utilities
        invalidateQueries,
        prefetchQuery,
        setQueryData,
        getQueryData,
        removeQueries,

        // Direct access to query client
        queryClient
    }
}