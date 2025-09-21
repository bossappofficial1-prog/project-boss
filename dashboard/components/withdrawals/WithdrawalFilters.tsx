// Withdrawal filters component
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, FilterIcon, XIcon } from 'lucide-react';
import { WithdrawalFilters, WithdrawalStatus } from '@/lib/withdrawals/types';
import { formatDateForInput } from '@/lib/withdrawals';

interface WithdrawalFiltersProps {
    filters: WithdrawalFilters;
    onFiltersChange: (filters: WithdrawalFilters) => void;
    isLoading?: boolean;
}

export function WithdrawalFiltersComponent({
    filters,
    onFiltersChange,
    isLoading = false
}: WithdrawalFiltersProps) {
    const [localFilters, setLocalFilters] = useState<WithdrawalFilters>(filters);

    const handleFilterChange = (key: keyof WithdrawalFilters, value: any) => {
        const newFilters = { ...localFilters, [key]: value };
        setLocalFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const clearFilters = () => {
        const emptyFilters: WithdrawalFilters = {
            status: undefined,
            businessName: '',
            minAmount: undefined,
            maxAmount: undefined,
            startDate: undefined,
            endDate: undefined,
            sortBy: 'createdAt',
            sortOrder: 'desc',
            page: 1,
            limit: 10,
        };
        setLocalFilters(emptyFilters);
        onFiltersChange(emptyFilters);
    };

    const hasActiveFilters = () => {
        return (
            localFilters.status ||
            localFilters.businessName ||
            localFilters.minAmount ||
            localFilters.maxAmount ||
            localFilters.startDate ||
            localFilters.endDate
        );
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (localFilters.status) count++;
        if (localFilters.businessName) count++;
        if (localFilters.minAmount) count++;
        if (localFilters.maxAmount) count++;
        if (localFilters.startDate) count++;
        if (localFilters.endDate) count++;
        return count;
    };

    return (
        <Card>
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FilterIcon className="w-5 h-5" />
                        Filters
                        {hasActiveFilters() && (
                            <Badge variant="secondary" className="ml-2">
                                {getActiveFilterCount()} active
                            </Badge>
                        )}
                    </CardTitle>
                    {hasActiveFilters() && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearFilters}
                            disabled={isLoading}
                        >
                            <XIcon className="w-4 h-4 mr-1" />
                            Clear All
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Status Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="status-filter">Status</Label>
                        <Select
                            value={localFilters.status || ''}
                            onValueChange={(value) =>
                                handleFilterChange('status', value || undefined)
                            }
                            disabled={isLoading}
                        >
                            <SelectTrigger id="status-filter">
                                <SelectValue placeholder="All statuses" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="PENDING">Pending</SelectItem>
                                <SelectItem value="PROCESSING">Processing</SelectItem>
                                <SelectItem value="COMPLETED">Completed</SelectItem>
                                <SelectItem value="REJECTED">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Business Name Filter */}
                    <div className="space-y-2">
                        <Label htmlFor="business-filter">Business Name</Label>
                        <Input
                            id="business-filter"
                            placeholder="Search by business name..."
                            value={localFilters.businessName || ''}
                            onChange={(e) => handleFilterChange('businessName', e.target.value)}
                            disabled={isLoading}
                        />
                    </div>

                    {/* Amount Range Filters */}
                    <div className="space-y-2">
                        <Label>Amount Range</Label>
                        <div className="flex gap-2">
                            <Input
                                type="number"
                                placeholder="Min"
                                value={localFilters.minAmount || ''}
                                onChange={(e) =>
                                    handleFilterChange('minAmount', e.target.value ? Number(e.target.value) : undefined)
                                }
                                disabled={isLoading}
                                min="0"
                                step="0.01"
                            />
                            <Input
                                type="number"
                                placeholder="Max"
                                value={localFilters.maxAmount || ''}
                                onChange={(e) =>
                                    handleFilterChange('maxAmount', e.target.value ? Number(e.target.value) : undefined)
                                }
                                disabled={isLoading}
                                min="0"
                                step="0.01"
                            />
                        </div>
                    </div>

                    {/* Date Range Filters */}
                    <div className="space-y-2">
                        <Label htmlFor="start-date">Start Date</Label>
                        <div className="relative">
                            <Input
                                id="start-date"
                                type="date"
                                value={localFilters.startDate ? formatDateForInput(localFilters.startDate) : ''}
                                onChange={(e) => handleFilterChange('startDate', e.target.value || undefined)}
                                disabled={isLoading}
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="end-date">End Date</Label>
                        <div className="relative">
                            <Input
                                id="end-date"
                                type="date"
                                value={localFilters.endDate ? formatDateForInput(localFilters.endDate) : ''}
                                onChange={(e) => handleFilterChange('endDate', e.target.value || undefined)}
                                disabled={isLoading}
                            />
                            <CalendarIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        </div>
                    </div>

                    {/* Sort Options */}
                    <div className="space-y-2">
                        <Label htmlFor="sort-by">Sort By</Label>
                        <Select
                            value={localFilters.sortBy}
                            onValueChange={(value: any) => handleFilterChange('sortBy', value)}
                            disabled={isLoading}
                        >
                            <SelectTrigger id="sort-by">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="createdAt">Created Date</SelectItem>
                                <SelectItem value="updatedAt">Updated Date</SelectItem>
                                <SelectItem value="requestedAmount">Amount</SelectItem>
                                <SelectItem value="business.name">Business Name</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Sort Order */}
                <div className="flex items-center gap-4">
                    <Label className="text-sm font-medium">Sort Order:</Label>
                    <div className="flex gap-2">
                        <Button
                            variant={localFilters.sortOrder === 'asc' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFilterChange('sortOrder', 'asc')}
                            disabled={isLoading}
                        >
                            Ascending
                        </Button>
                        <Button
                            variant={localFilters.sortOrder === 'desc' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleFilterChange('sortOrder', 'desc')}
                            disabled={isLoading}
                        >
                            Descending
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}