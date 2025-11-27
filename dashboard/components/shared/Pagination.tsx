import React from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  pageSizeOptions?: number[];
  showPageSize?: boolean;
  showInfo?: boolean;
  className?: string;
}

/**
 * Reusable Pagination Component
 * 
 * @example
 * ```typescript
 * const pagination = usePagination({ initialPage: 1, initialPageSize: 10 });
 * 
 * <Pagination
 *   page={pagination.page}
 *   pageSize={pagination.pageSize}
 *   total={data?.pagination?.total || 0}
 *   onPageChange={pagination.setPage}
 *   onPageSizeChange={pagination.setPageSize}
 * />
 * ```
 */
export function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  showPageSize = true,
  showInfo = true,
  className = '',
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  const canGoPrevious = page > 1;
  const canGoNext = page < totalPages;

  const handleFirst = () => {
    if (canGoPrevious) onPageChange(1);
  };

  const handlePrevious = () => {
    if (canGoPrevious) onPageChange(page - 1);
  };

  const handleNext = () => {
    if (canGoNext) onPageChange(page + 1);
  };

  const handleLast = () => {
    if (canGoNext) onPageChange(totalPages);
  };

  // Render page numbers
  const renderPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Show subset with ellipsis
      if (page <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(page - 1);
        pages.push(page);
        pages.push(page + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }

    return pages.map((pageNum, index) => {
      if (pageNum === '...') {
        return (
          <span key={`ellipsis-${index}`} className="px-3 py-2 text-sm text-muted-foreground">
            ...
          </span>
        );
      }

      return (
        <Button
          key={pageNum}
          variant={page === pageNum ? 'default' : 'outline'}
          size="sm"
          onClick={() => onPageChange(pageNum as number)}
          className="min-w-[40px]"
        >
          {pageNum}
        </Button>
      );
    });
  };

  if (total === 0) {
    return null;
  }

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Info & Page Size */}
      <div className="flex items-center gap-4">
        {showInfo && (
          <div className="text-sm text-muted-foreground">
            Menampilkan <span className="font-medium">{from}</span> -{' '}
            <span className="font-medium">{to}</span> dari{' '}
            <span className="font-medium">{total}</span> data
          </div>
        )}

        {showPageSize && onPageSizeChange && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Per halaman:</span>
            <Select value={String(pageSize)} onValueChange={(val) => onPageSizeChange(Number(val))}>
              <SelectTrigger className="w-[70px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((option) => (
                  <SelectItem key={option} value={String(option)}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-2">
        {/* First Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleFirst}
          disabled={!canGoPrevious}
          className="hidden sm:inline-flex"
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>

        {/* Previous */}
        <Button
          variant="outline"
          size="sm"
          onClick={handlePrevious}
          disabled={!canGoPrevious}
        >
          <ChevronLeft className="h-4 w-4" />
          <span className="hidden sm:inline ml-1">Sebelumnya</span>
        </Button>

        {/* Page Numbers */}
        <div className="hidden md:flex items-center gap-1">
          {renderPageNumbers()}
        </div>

        {/* Mobile: Current Page */}
        <div className="md:hidden text-sm text-muted-foreground">
          Halaman {page} dari {totalPages}
        </div>

        {/* Next */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleNext}
          disabled={!canGoNext}
        >
          <span className="hidden sm:inline mr-1">Selanjutnya</span>
          <ChevronRight className="h-4 w-4" />
        </Button>

        {/* Last Page */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleLast}
          disabled={!canGoNext}
          className="hidden sm:inline-flex"
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
