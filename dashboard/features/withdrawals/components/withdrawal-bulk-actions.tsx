// Bulk actions component for withdrawals
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    CheckCircleIcon,
    XCircleIcon,
    MoreHorizontalIcon,
    TrashIcon,
} from 'lucide-react';

interface WithdrawalBulkActionsProps {
    selectedCount: number;
    onBulkApprove: () => void;
    onBulkReject: () => void;
    onClearSelection: () => void;
    isProcessing?: boolean;
}

export function WithdrawalBulkActions({
    selectedCount,
    onBulkApprove,
    onBulkReject,
    onClearSelection,
    isProcessing = false,
}: WithdrawalBulkActionsProps) {
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

    const handleBulkAction = (action: 'approve' | 'reject') => {
        setPendingAction(action);
        setShowConfirmDialog(true);
    };

    const confirmBulkAction = () => {
        if (pendingAction === 'approve') {
            onBulkApprove();
        } else if (pendingAction === 'reject') {
            onBulkReject();
        }
        setShowConfirmDialog(false);
        setPendingAction(null);
    };

    const cancelBulkAction = () => {
        setShowConfirmDialog(false);
        setPendingAction(null);
    };

    if (selectedCount === 0) {
        return null;
    }

    return (
        <>
            <div className="flex items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {selectedCount} selected
                </Badge>

                <div className="flex gap-2 ml-auto">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onClearSelection}
                        disabled={isProcessing}
                    >
                        Clear Selection
                    </Button>

                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="default" size="sm" disabled={isProcessing}>
                                <MoreHorizontalIcon className="w-4 h-4 mr-2" />
                                Bulk Actions
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => handleBulkAction('approve')}
                                className="text-green-600"
                                disabled={isProcessing}
                            >
                                <CheckCircleIcon className="w-4 h-4 mr-2" />
                                Approve Selected ({selectedCount})
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleBulkAction('reject')}
                                className="text-red-600"
                                disabled={isProcessing}
                            >
                                <XCircleIcon className="w-4 h-4 mr-2" />
                                Reject Selected ({selectedCount})
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>
                            Confirm Bulk {pendingAction === 'approve' ? 'Approval' : 'Rejection'}
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to {pendingAction} {selectedCount} withdrawal{selectedCount > 1 ? 's' : ''}?
                            This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={cancelBulkAction} disabled={isProcessing}>
                            Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmBulkAction}
                            disabled={isProcessing}
                            className={pendingAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {pendingAction === 'approve' ? (
                                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                                    ) : (
                                        <XCircleIcon className="w-4 h-4 mr-2" />
                                    )}
                                    {pendingAction === 'approve' ? 'Approve' : 'Reject'} {selectedCount} Withdrawal{selectedCount > 1 ? 's' : ''}
                                </>
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}