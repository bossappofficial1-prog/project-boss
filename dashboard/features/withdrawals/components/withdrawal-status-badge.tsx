// Withdrawal status badge component
import { Badge } from '@/components/ui/badge';
import { WithdrawalStatus } from '@/lib/withdrawals/types';
import { getStatusBadgeVariant, getStatusDisplayText } from '@/lib/withdrawals/utils';

interface WithdrawalStatusBadgeProps {
    status: WithdrawalStatus;
    className?: string;
}

export function WithdrawalStatusBadge({ status, className }: WithdrawalStatusBadgeProps) {
    const { className: badgeClassName } = getStatusBadgeVariant(status);
    const displayText = getStatusDisplayText(status);

    return (
        <Badge
            variant="secondary"
            className={`${badgeClassName} ${className || ''}`}
        >
            {displayText}
        </Badge>
    );
}

// Status badge with icon
interface WithdrawalStatusBadgeWithIconProps extends WithdrawalStatusBadgeProps {
    showIcon?: boolean;
}

export function WithdrawalStatusBadgeWithIcon({
    status,
    className,
    showIcon = true
}: WithdrawalStatusBadgeWithIconProps) {
    const { className: badgeClassName } = getStatusBadgeVariant(status);
    const displayText = getStatusDisplayText(status);

    const getStatusIcon = (status: WithdrawalStatus) => {
        switch (status) {
            case 'PENDING':
                return '⏳';
            case 'PROCESSING':
                return '⚙️';
            case 'COMPLETED':
                return '✅';
            case 'REJECTED':
                return '❌';
            default:
                return '❓';
        }
    };

    return (
        <Badge
            variant="secondary"
            className={`${badgeClassName} ${className || ''}`}
        >
            {showIcon && <span className="mr-1">{getStatusIcon(status)}</span>}
            {displayText}
        </Badge>
    );
}

// Status indicator dot
interface WithdrawalStatusDotProps {
    status: WithdrawalStatus;
    size?: 'sm' | 'md' | 'lg';
}

export function WithdrawalStatusDot({ status, size = 'md' }: WithdrawalStatusDotProps) {
    const getStatusColor = (status: WithdrawalStatus) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-500';
            case 'PROCESSING':
                return 'bg-blue-500';
            case 'COMPLETED':
                return 'bg-green-500';
            case 'REJECTED':
                return 'bg-red-500';
            default:
                return 'bg-gray-500';
        }
    };

    const sizeClasses = {
        sm: 'w-2 h-2',
        md: 'w-3 h-3',
        lg: 'w-4 h-4',
    };

    return (
        <div
            className={`rounded-full ${getStatusColor(status)} ${sizeClasses[size]}`}
            title={getStatusDisplayText(status)}
        />
    );
}