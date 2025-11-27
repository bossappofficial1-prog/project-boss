import { useState, useCallback, useMemo } from 'react';
import { usePagination } from './usePagination';

/**
 * Table filters state & controls
 */
export interface UseTableFiltersReturn<T extends Record<string, any>> {
  filters: Partial<T>;
  search: string;
  setSearch: (value: string) => void;
  updateFilter: <K extends keyof T>(key: K, value: T[K]) => void;
  removeFilter: (key: keyof T) => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number;
  getFilterParams: () => Partial<T> & { search?: string };
}

/**
 * Custom hook untuk table filter logic
 * 
 * @example
 * ```typescript
 * interface UserFilters {
 *   role: UserRole;
 *   status: string;
 *   isVerified: boolean;
 * }
 * 
 * const filters = useTableFilters<UserFilters>();
 * 
 * // Update filter
 * filters.updateFilter('role', UserRole.ADMIN);
 * 
 * // Search
 * filters.setSearch('john');
 * 
 * // Get params untuk API call
 * const params = filters.getFilterParams();
 * const { data } = useUsers(params);
 * ```
 */
export function useTableFilters<T extends Record<string, any>>(): UseTableFiltersReturn<T> {
  const [filters, setFilters] = useState<Partial<T>>({});
  const [search, setSearchState] = useState('');

  const updateFilter = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  const removeFilter = useCallback((key: keyof T) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchState(value);
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({});
    setSearchState('');
  }, []);

  const hasActiveFilters = useMemo(() => {
    return Object.keys(filters).length > 0 || search.length > 0;
  }, [filters, search]);

  const activeFilterCount = useMemo(() => {
    return Object.keys(filters).length + (search ? 1 : 0);
  }, [filters, search]);

  const getFilterParams = useCallback(() => {
    const params: Partial<T> & { search?: string } = { ...filters };
    if (search) {
      params.search = search;
    }
    return params;
  }, [filters, search]);

  return {
    filters,
    search,
    setSearch,
    updateFilter,
    removeFilter,
    resetFilters,
    hasActiveFilters,
    activeFilterCount,
    getFilterParams,
  };
}

/**
 * Hook untuk sorting table
 */
export interface UseSortingReturn {
  sortBy: string | null;
  sortOrder: 'asc' | 'desc';
  handleSort: (field: string) => void;
  reset: () => void;
  getSortParams: () => { sortBy?: string; sortOrder?: 'asc' | 'desc' };
}

/**
 * Custom hook untuk table sorting logic
 * 
 * @example
 * ```typescript
 * const sorting = useSorting({ defaultSort: 'createdAt', defaultOrder: 'desc' });
 * 
 * // Handle column click
 * <th onClick={() => sorting.handleSort('name')}>
 *   Name {sorting.sortBy === 'name' && (sorting.sortOrder === 'asc' ? '↑' : '↓')}
 * </th>
 * ```
 */
export function useSorting(options?: {
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
}): UseSortingReturn {
  const { defaultSort = null, defaultOrder = 'asc' } = options || {};

  const [sortBy, setSortBy] = useState<string | null>(defaultSort);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>(defaultOrder);

  const handleSort = useCallback((field: string) => {
    setSortBy(prevSort => {
      if (prevSort === field) {
        // Toggle order if same field
        setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        return field;
      } else {
        // Default to asc for new field
        setSortOrder('asc');
        return field;
      }
    });
  }, []);

  const reset = useCallback(() => {
    setSortBy(defaultSort);
    setSortOrder(defaultOrder);
  }, [defaultSort, defaultOrder]);

  const getSortParams = useCallback(() => {
    if (!sortBy) return {};
    return { sortBy, sortOrder };
  }, [sortBy, sortOrder]);

  return {
    sortBy,
    sortOrder,
    handleSort,
    reset,
    getSortParams,
  };
}

/**
 * Combined hook untuk complete table state management
 * 
 * @example
 * ```typescript
 * const table = useTableState<UserFilters>({
 *   initialPage: 1,
 *   initialPageSize: 10,
 *   defaultSort: 'createdAt',
 *   defaultOrder: 'desc'
 * });
 * 
 * // Get all params untuk API call
 * const params = table.getAllParams();
 * const { data } = useUsers(params);
 * 
 * // Reset everything
 * table.resetAll();
 * ```
 */
export function useTableState<T extends Record<string, any>>(options?: {
  initialPage?: number;
  initialPageSize?: number;
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
}) {
  const pagination = usePagination({
    initialPage: options?.initialPage,
    initialPageSize: options?.initialPageSize,
  });

  const filters = useTableFilters<T>();

  const sorting = useSorting({
    defaultSort: options?.defaultSort,
    defaultOrder: options?.defaultOrder,
  });

  const getAllParams = useCallback(() => {
    return {
      page: pagination.page,
      limit: pagination.pageSize,
      ...filters.getFilterParams(),
      ...sorting.getSortParams(),
    };
  }, [pagination.page, pagination.pageSize, filters, sorting]);

  const resetAll = useCallback(() => {
    pagination.reset();
    filters.resetFilters();
    sorting.reset();
  }, [pagination, filters, sorting]);

  return {
    pagination,
    filters,
    sorting,
    getAllParams,
    resetAll,
  };
}
