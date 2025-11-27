import { useQuery, useMutation, useQueryClient, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { BaseService, BaseQueryParams } from '@/lib/services/BaseService';

/**
 * Options untuk customisasi factory behavior
 */
interface EntityFactoryOptions {
  /** Query key prefix (e.g., 'users', 'products') */
  queryKey: string;
  
  /** Success messages */
  messages?: {
    create?: string;
    update?: string;
    delete?: string;
  };

  /** Disable toast notifications */
  disableToast?: boolean;

  /** Custom error handler */
  onError?: (error: any) => void;
}

/**
 * Factory Pattern untuk CRUD Hooks
 * 
 * Menghilangkan duplikasi kode hook untuk setiap entity.
 * Menggunakan React Query untuk caching dan state management.
 * 
 * @example
 * ```typescript
 * // Create factory untuk User entity
 * export const useUsers = () => createEntityFactory({
 *   service: userService,
 *   queryKey: 'users',
 *   messages: {
 *     create: 'User berhasil ditambahkan',
 *     update: 'User berhasil diupdate',
 *     delete: 'User berhasil dihapus'
 *   }
 * });
 * 
 * // Gunakan di component
 * const { useList, useCreate, useUpdate, useDelete } = useUsers();
 * const { data: users, isLoading } = useList({ page: 1, limit: 10 });
 * const createMutation = useCreate();
 * ```
 */
export function createEntityFactory<TEntity = any>(
  options: EntityFactoryOptions & { service: BaseService<TEntity> }
) {
  const { 
    service, 
    queryKey, 
    messages = {}, 
    disableToast = false,
    onError: globalOnError 
  } = options;

  const defaultMessages = {
    create: messages.create || 'Data berhasil ditambahkan',
    update: messages.update || 'Data berhasil diupdate',
    delete: messages.delete || 'Data berhasil dihapus',
  };

  /**
   * Hook untuk mengambil list entities dengan pagination & filter
   */
  const useList = (
    params?: BaseQueryParams,
    queryOptions?: Omit<UseQueryOptions<TEntity[], any>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<TEntity[], any>({
      queryKey: [queryKey, 'list', params],
      queryFn: () => service.list(params),
      staleTime: 30000, // 30 seconds
      ...queryOptions,
    });
  };

  /**
   * Hook untuk mengambil single entity by ID
   */
  const useById = (
    id: string,
    queryOptions?: Omit<UseQueryOptions<TEntity, any>, 'queryKey' | 'queryFn'>
  ) => {
    return useQuery<TEntity, any>({
      queryKey: [queryKey, 'detail', id],
      queryFn: () => service.getById(id),
      enabled: !!id,
      staleTime: 60000, // 1 minute
      ...queryOptions,
    });
  };

  /**
   * Hook untuk create entity
   */
  const useCreate = (customOptions?: {
    onSuccess?: (data: TEntity) => void;
    onError?: (error: any) => void;
  }) => {
    const queryClient = useQueryClient();

    return useMutation<TEntity, any, Partial<TEntity>>({
      mutationFn: (data: Partial<TEntity>) => service.create(data),
      onSuccess: (data) => {
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: [queryKey, 'list'] });
        
        // Show success toast
        if (!disableToast) {
          toast.success(defaultMessages.create);
        }

        // Call custom onSuccess if provided
        customOptions?.onSuccess?.(data);
      },
      onError: (error: any) => {
        // Show error toast
        if (!disableToast) {
          toast.error(error?.message || 'Gagal menambahkan data');
        }

        // Call custom error handler
        if (globalOnError) {
          globalOnError(error);
        }

        // Call custom onError if provided
        customOptions?.onError?.(error);
      },
    });
  };

  /**
   * Hook untuk update entity
   */
  const useUpdate = (customOptions?: {
    onSuccess?: (data: TEntity) => void;
    onError?: (error: any) => void;
  }) => {
    const queryClient = useQueryClient();

    return useMutation<TEntity, any, { id: string; data: Partial<TEntity> }>({
      mutationFn: ({ id, data }) => service.update(id, data),
      onSuccess: (data, variables) => {
        // Invalidate list and detail queries
        queryClient.invalidateQueries({ queryKey: [queryKey, 'list'] });
        queryClient.invalidateQueries({ queryKey: [queryKey, 'detail', variables.id] });
        
        // Show success toast
        if (!disableToast) {
          toast.success(defaultMessages.update);
        }

        // Call custom onSuccess if provided
        customOptions?.onSuccess?.(data);
      },
      onError: (error: any) => {
        // Show error toast
        if (!disableToast) {
          toast.error(error?.message || 'Gagal mengupdate data');
        }

        // Call custom error handler
        if (globalOnError) {
          globalOnError(error);
        }

        // Call custom onError if provided
        customOptions?.onError?.(error);
      },
    });
  };

  /**
   * Hook untuk delete entity
   */
  const useDelete = (customOptions?: {
    onSuccess?: () => void;
    onError?: (error: any) => void;
  }) => {
    const queryClient = useQueryClient();

    return useMutation<void, any, string>({
      mutationFn: (id: string) => service.delete(id),
      onSuccess: (data, id) => {
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: [queryKey, 'list'] });
        queryClient.removeQueries({ queryKey: [queryKey, 'detail', id] });
        
        // Show success toast
        if (!disableToast) {
          toast.success(defaultMessages.delete);
        }

        // Call custom onSuccess if provided
        customOptions?.onSuccess?.();
      },
      onError: (error: any) => {
        // Show error toast
        if (!disableToast) {
          toast.error(error?.message || 'Gagal menghapus data');
        }

        // Call custom error handler
        if (globalOnError) {
          globalOnError(error);
        }

        // Call custom onError if provided
        customOptions?.onError?.(error);
      },
    });
  };

  /**
   * Hook untuk bulk delete entities
   */
  const useBulkDelete = (customOptions?: {
    onSuccess?: (count: number) => void;
    onError?: (error: any) => void;
  }) => {
    const queryClient = useQueryClient();

    return useMutation<void, any, string[]>({
      mutationFn: (ids: string[]) => service.bulkDelete(ids),
      onSuccess: (data, ids) => {
        // Invalidate list queries
        queryClient.invalidateQueries({ queryKey: [queryKey, 'list'] });
        
        // Remove detail queries
        ids.forEach(id => {
          queryClient.removeQueries({ queryKey: [queryKey, 'detail', id] });
        });
        
        // Show success toast
        if (!disableToast) {
          toast.success(`${ids.length} data berhasil dihapus`);
        }

        // Call custom onSuccess if provided
        customOptions?.onSuccess?.(ids.length);
      },
      onError: (error: any) => {
        // Show error toast
        if (!disableToast) {
          toast.error(error?.message || 'Gagal menghapus data');
        }

        // Call custom error handler
        if (globalOnError) {
          globalOnError(error);
        }

        // Call custom onError if provided
        customOptions?.onError?.(error);
      },
    });
  };

  return {
    useList,
    useById,
    useCreate,
    useUpdate,
    useDelete,
    useBulkDelete,
  };
}
