// Withdrawal pagination component
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    ChevronLeftIcon,
    ChevronRightIcon,
    ChevronsLeftIcon,
    ChevronsRightIcon,
} from 'lucide-react';

interface WithdrawalPaginationProps {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    pageSize: number;
    onPageChange: (page: number) => void;
    onPageSizeChange: (pageSize: number) => void;
    isLoading?: boolean;
}

export function WithdrawalPagination({
    currentPage,
    totalPages,
    totalItems,
    pageSize,
    onPageChange,
    onPageSizeChange,
    isLoading = false,
}: WithdrawalPaginationProps) {
    const startItem = (currentPage - 1) * pageSize + 1;
    const endItem = Math.min(currentPage * pageSize, totalItems);

    const getVisiblePages = () => {
        const delta = 2;
        const range = [];
        const rangeWithDots = [];

        for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
            range.push(i);
        }

        if (currentPage - delta > 2) {
            rangeWithDots.push(1, '...');
        } else {
            rangeWithDots.push(1);
        }

        rangeWithDots.push(...range);

        if (currentPage + delta < totalPages - 1) {
            rangeWithDots.push('...', totalPages);
        } else if (totalPages > 1) {
            rangeWithDots.push(totalPages);
        }

        return rangeWithDots;
    };

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="flex items-center justify-between px-2 py-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                    Showing {startItem} to {endItem} of {totalItems} withdrawals
                </span>
            </div>

            <div className="flex items-center gap-4">
                {/* Page Size Selector */}
                <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">Show:</span>
                    <Select
                        value={pageSize.toString()}
                        onValueChange={(value) => onPageSizeChange(Number(value))}
                        disabled={isLoading}
                    >
                        <SelectTrigger className="w-20">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                            <SelectItem value="100">100</SelectItem>
                        </SelectContent>
                    </Select>
                    <span className="text-sm text-gray-600">per page</span>
                </div>

                {/* Pagination Controls */}
                <div className="flex items-center gap-1">
                    {/* First Page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={currentPage === 1 || isLoading}
                        className="px-2"
                    >
                        <ChevronsLeftIcon className="w-4 h-4" />
                    </Button>

                    {/* Previous Page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage - 1)}
                        disabled={currentPage === 1 || isLoading}
                        className="px-2"
                    >
                        <ChevronLeftIcon className="w-4 h-4" />
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                        {getVisiblePages().map((page, index) => (
                            <Button
                                key={index}
                                variant={page === currentPage ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => typeof page === 'number' && onPageChange(page)}
                                disabled={page === '...' || isLoading}
                                className="min-w-[40px] px-3"
                            >
                                {page}
                            </Button>
                        ))}
                    </div>

                    {/* Next Page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(currentPage + 1)}
                        disabled={currentPage === totalPages || isLoading}
                        className="px-2"
                    >
                        <ChevronRightIcon className="w-4 h-4" />
                    </Button>

                    {/* Last Page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={currentPage === totalPages || isLoading}
                        className="px-2"
                    >
                        <ChevronsRightIcon className="w-4 h-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

// Compact pagination for smaller spaces
interface WithdrawalPaginationCompactProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export function WithdrawalPaginationCompact({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false,
}: WithdrawalPaginationCompactProps) {
    return (
        <div className="flex items-center justify-center gap-2">
            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
            >
                <ChevronLeftIcon className="w-4 h-4" />
                Previous
            </Button>

            <span className="text-sm text-gray-600 px-2">
                Page {currentPage} of {totalPages}
            </span>

            <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
            >
                Next
                <ChevronRightIcon className="w-4 h-4" />
            </Button>
        </div>
    );
}