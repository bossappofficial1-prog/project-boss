import { useState, useCallback } from 'react';

/**
 * Pagination state & controls
 */
export interface UsePaginationReturn {
  page: number;
  pageSize: number;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  nextPage: () => void;
  previousPage: () => void;
  goToFirstPage: () => void;
  goToLastPage: (totalPages: number) => void;
  reset: () => void;
}

/**
 * Custom hook untuk pagination logic
 * 
 * @example
 * ```typescript
 * const pagination = usePagination({ initialPage: 1, initialPageSize: 10 });
 * 
 * // Di component
 * <Pagination
 *   page={pagination.page}
 *   pageSize={pagination.pageSize}
 *   onPageChange={pagination.setPage}
 *   onNext={pagination.nextPage}
 *   onPrevious={pagination.previousPage}
 * />
 * ```
 */
export function usePagination(options?: {
  initialPage?: number;
  initialPageSize?: number;
}): UsePaginationReturn {
  const { initialPage = 1, initialPageSize = 10 } = options || {};

  const [page, setPageState] = useState(initialPage);
  const [pageSize, setPageSizeState] = useState(initialPageSize);

  const setPage = useCallback((newPage: number) => {
    setPageState(Math.max(1, newPage));
  }, []);

  const setPageSize = useCallback((newSize: number) => {
    setPageSizeState(newSize);
    setPageState(1); // Reset to first page when changing page size
  }, []);

  const nextPage = useCallback(() => {
    setPageState(prev => prev + 1);
  }, []);

  const previousPage = useCallback(() => {
    setPageState(prev => Math.max(1, prev - 1));
  }, []);

  const goToFirstPage = useCallback(() => {
    setPageState(1);
  }, []);

  const goToLastPage = useCallback((totalPages: number) => {
    setPageState(totalPages);
  }, []);

  const reset = useCallback(() => {
    setPageState(initialPage);
    setPageSizeState(initialPageSize);
  }, [initialPage, initialPageSize]);

  return {
    page,
    pageSize,
    setPage,
    setPageSize,
    nextPage,
    previousPage,
    goToFirstPage,
    goToLastPage,
    reset,
  };
}

/**
 * Pagination info untuk UI
 */
export function usePaginationInfo(params: {
  page: number;
  pageSize: number;
  total: number;
}) {
  const { page, pageSize, total } = params;

  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  return {
    totalPages,
    from,
    to,
    hasNextPage,
    hasPrevPage,
    isFirstPage: page === 1,
    isLastPage: page === totalPages,
  };
}
