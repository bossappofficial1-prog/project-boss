// Withdrawal table component
import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    MoreHorizontalIcon,
    EyeIcon,
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
} from 'lucide-react';
import { Withdrawal, WithdrawalStatus } from '@/lib/withdrawals/types';
import { formatWithdrawalAmount, getStatusDisplayText } from '@/lib/withdrawals/utils';
import { WithdrawalStatusBadge } from './WithdrawalStatusBadge';
import { formatDate } from '@/lib/utils/date';

interface WithdrawalTableProps {
    withdrawals: Withdrawal[];
    selectedWithdrawals: string[];
    onSelectionChange: (selectedIds: string[]) => void;
    onViewDetails: (withdrawal: Withdrawal) => void;
    onProcessWithdrawal: (withdrawal: Withdrawal, action: 'approve' | 'reject') => void;
    isLoading?: boolean;
}

export function WithdrawalTable({
    withdrawals,
    selectedWithdrawals,
    onSelectionChange,
    onViewDetails,
    onProcessWithdrawal,
    isLoading = false,
}: WithdrawalTableProps) {
    const [sortField, setSortField] = useState<string>('createdAt');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(withdrawals.map(w => w.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectWithdrawal = (withdrawalId: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedWithdrawals, withdrawalId]);
        } else {
            onSelectionChange(selectedWithdrawals.filter(id => id !== withdrawalId));
        }
    };

    const handleSort = (field: string) => {
        if (sortField === field) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    const sortedWithdrawals = [...withdrawals].sort((a, b) => {
        let aValue: any = a[sortField as keyof Withdrawal];
        let bValue: any = b[sortField as keyof Withdrawal];

        // Handle nested properties
        if (sortField === 'business.name') {
            aValue = a.business?.name || '';
            bValue = b.business?.name || '';
        }

        if (typeof aValue === 'string') {
            aValue = aValue.toLowerCase();
            bValue = bValue.toLowerCase();
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
    });

    const getActionIcon = (status: WithdrawalStatus) => {
        switch (status) {
            case 'PENDING':
                return <ClockIcon className="w-4 h-4" />;
            case 'PROCESSING':
                return <CheckCircleIcon className="w-4 h-4" />;
            case 'COMPLETED':
                return <CheckCircleIcon className="w-4 h-4 text-green-600" />;
            case 'REJECTED':
                return <XCircleIcon className="w-4 h-4 text-red-600" />;
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-12">
                            <Checkbox
                                checked={selectedWithdrawals.length === withdrawals.length && withdrawals.length > 0}
                                onCheckedChange={handleSelectAll}
                            />
                        </TableHead>
                        <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort('business.name')}
                        >
                            Business
                            {sortField === 'business.name' && (
                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </TableHead>
                        <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort('requestedAmount')}
                        >
                            Requested Amount
                            {sortField === 'requestedAmount' && (
                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </TableHead>
                        <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort('finalAmount')}
                        >
                            Final Amount
                            {sortField === 'finalAmount' && (
                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </TableHead>
                        <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort('status')}
                        >
                            Status
                            {sortField === 'status' && (
                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </TableHead>
                        <TableHead
                            className="cursor-pointer hover:bg-gray-50"
                            onClick={() => handleSort('createdAt')}
                        >
                            Created
                            {sortField === 'createdAt' && (
                                <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
                            )}
                        </TableHead>
                        <TableHead className="w-12">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {sortedWithdrawals.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                                No withdrawals found
                            </TableCell>
                        </TableRow>
                    ) : (
                        sortedWithdrawals.map((withdrawal) => (
                            <TableRow key={withdrawal.id}>
                                <TableCell>
                                    <Checkbox
                                        checked={selectedWithdrawals.includes(withdrawal.id)}
                                        onCheckedChange={(checked) =>
                                            handleSelectWithdrawal(withdrawal.id, checked as boolean)
                                        }
                                    />
                                </TableCell>
                                <TableCell className="font-medium">
                                    {withdrawal.business?.name || 'N/A'}
                                </TableCell>
                                <TableCell>
                                    {formatWithdrawalAmount(withdrawal.requestedAmount)}
                                </TableCell>
                                <TableCell>
                                    {withdrawal.finalAmount
                                        ? formatWithdrawalAmount(withdrawal.finalAmount)
                                        : '-'
                                    }
                                </TableCell>
                                <TableCell>
                                    <WithdrawalStatusBadge status={withdrawal.status} />
                                </TableCell>
                                <TableCell className="text-sm text-gray-600">
                                    {formatDate(withdrawal.createdAt)}
                                </TableCell>
                                <TableCell>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <MoreHorizontalIcon className="w-4 h-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onViewDetails(withdrawal)}>
                                                <EyeIcon className="w-4 h-4 mr-2" />
                                                View Details
                                            </DropdownMenuItem>
                                            {withdrawal.status === 'PENDING' && (
                                                <>
                                                    <DropdownMenuItem
                                                        onClick={() => onProcessWithdrawal(withdrawal, 'approve')}
                                                        className="text-green-600"
                                                    >
                                                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                                                        Approve
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onProcessWithdrawal(withdrawal, 'reject')}
                                                        className="text-red-600"
                                                    >
                                                        <XCircleIcon className="w-4 h-4 mr-2" />
                                                        Reject
                                                    </DropdownMenuItem>
                                                </>
                                            )}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    )}
                </TableBody>
            </Table>
        </div>
    );
}