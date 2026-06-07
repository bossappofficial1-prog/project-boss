// Withdrawal details dialog component
import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
    CheckCircleIcon,
    XCircleIcon,
    ClockIcon,
    UserIcon,
    BuildingIcon,
    CalendarIcon,
    DollarSignIcon,
    FileTextIcon,
} from 'lucide-react';
import { Withdrawal } from '@/lib/withdrawals/types';
import {
    formatWithdrawalAmount,
    formatDate,
    getStatusDisplayText,
    getStatusBadgeVariant
} from '@/lib/withdrawals/utils';

interface WithdrawalDetailsDialogProps {
    withdrawal: Withdrawal | null;
    isOpen: boolean;
    onClose: () => void;
    onProcess: (action: 'approve' | 'reject', notes?: string) => void;
    isProcessing?: boolean;
}

export function WithdrawalDetailsDialog({
    withdrawal,
    isOpen,
    onClose,
    onProcess,
    isProcessing = false,
}: WithdrawalDetailsDialogProps) {
    const [notes, setNotes] = React.useState('');
    const [action, setAction] = React.useState<'approve' | 'reject' | null>(null);

    React.useEffect(() => {
        if (withdrawal) {
            setNotes('');
            setAction(null);
        }
    }, [withdrawal]);

    if (!withdrawal) return null;

    const handleProcess = () => {
        if (action) {
            onProcess(action, notes.trim() || undefined);
        }
    };

    const canProcess = withdrawal.status === 'PENDING' && !isProcessing;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <DollarSignIcon className="w-5 h-5" />
                        Withdrawal Details
                        <Badge
                            variant="secondary"
                            className={`${getStatusBadgeVariant(withdrawal.status).className} ml-auto`}
                        >
                            {getStatusDisplayText(withdrawal.status)}
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Business Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <BuildingIcon className="w-5 h-5" />
                            Business Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Business Name</Label>
                                <p className="text-sm font-medium">{withdrawal.business?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <Label className="text-sm font-medium text-gray-600">Business ID</Label>
                                <p className="text-sm font-mono">{withdrawal.business?.id || 'N/A'}</p>
                            </div>
                            {withdrawal.business?.email && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                                    <p className="text-sm">{withdrawal.business.email}</p>
                                </div>
                            )}
                            {withdrawal.business?.phone && (
                                <div>
                                    <Label className="text-sm font-medium text-gray-600">Phone</Label>
                                    <p className="text-sm">{withdrawal.business.phone}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Withdrawal Details */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold flex items-center gap-2">
                            <FileTextIcon className="w-5 h-5" />
                            Withdrawal Details
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Withdrawal ID</Label>
                                <p className="text-sm font-mono">{withdrawal.id}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Requested Amount</Label>
                                <p className="text-lg font-semibold text-green-600">
                                    {formatWithdrawalAmount(withdrawal.requestedAmount)}
                                </p>
                            </div>
                            {withdrawal.finalAmount && (
                                <div className="space-y-2">
                                    <Label className="text-sm font-medium text-gray-600">Final Amount</Label>
                                    <p className="text-lg font-semibold text-blue-600">
                                        {formatWithdrawalAmount(withdrawal.finalAmount)}
                                    </p>
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Status</Label>
                                <Badge
                                    variant="secondary"
                                    className={getStatusBadgeVariant(withdrawal.status).className}
                                >
                                    {getStatusDisplayText(withdrawal.status)}
                                </Badge>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    Created At
                                </Label>
                                <p className="text-sm">{formatDate(withdrawal.createdAt)}</p>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                    <CalendarIcon className="w-4 h-4" />
                                    Updated At
                                </Label>
                                <p className="text-sm">{formatDate(withdrawal.updatedAt)}</p>
                            </div>
                        </div>
                    </div>

                    {/* Processed By Information */}
                    {withdrawal.processedBy && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold flex items-center gap-2">
                                    <UserIcon className="w-5 h-5" />
                                    Processed By
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Name</Label>
                                        <p className="text-sm font-medium">{withdrawal.processedBy.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <Label className="text-sm font-medium text-gray-600">Email</Label>
                                        <p className="text-sm">{withdrawal.processedBy.email || 'N/A'}</p>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Notes */}
                    {withdrawal.notes && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label className="text-sm font-medium text-gray-600">Notes</Label>
                                <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm whitespace-pre-wrap">{withdrawal.notes}</p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Processing Section */}
                    {canProcess && (
                        <>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold">Process Withdrawal</h3>
                                <div className="space-y-4">
                                    <div className="flex gap-2">
                                        <Button
                                            variant={action === 'approve' ? 'default' : 'outline'}
                                            onClick={() => setAction('approve')}
                                            className="flex-1"
                                            disabled={isProcessing}
                                        >
                                            <CheckCircleIcon className="w-4 h-4 mr-2" />
                                            Approve
                                        </Button>
                                        <Button
                                            variant={action === 'reject' ? 'destructive' : 'outline'}
                                            onClick={() => setAction('reject')}
                                            className="flex-1"
                                            disabled={isProcessing}
                                        >
                                            <XCircleIcon className="w-4 h-4 mr-2" />
                                            Reject
                                        </Button>
                                    </div>

                                    {action && (
                                        <div className="space-y-2">
                                            <Label htmlFor="processing-notes">
                                                {action === 'approve' ? 'Approval' : 'Rejection'} Notes (Optional)
                                            </Label>
                                            <Textarea
                                                id="processing-notes"
                                                placeholder={`Add notes for ${action === 'approve' ? 'approval' : 'rejection'}...`}
                                                value={notes}
                                                onChange={(e) => setNotes(e.target.value)}
                                                disabled={isProcessing}
                                                rows={3}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <DialogFooter className="flex gap-2">
                    <Button variant="outline" onClick={onClose} disabled={isProcessing}>
                        Close
                    </Button>
                    {canProcess && action && (
                        <Button
                            onClick={handleProcess}
                            disabled={isProcessing}
                            variant={action === 'approve' ? 'default' : 'destructive'}
                        >
                            {isProcessing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Processing...
                                </>
                            ) : (
                                <>
                                    {action === 'approve' ? (
                                        <CheckCircleIcon className="w-4 h-4 mr-2" />
                                    ) : (
                                        <XCircleIcon className="w-4 h-4 mr-2" />
                                    )}
                                    {action === 'approve' ? 'Approve' : 'Reject'} Withdrawal
                                </>
                            )}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}