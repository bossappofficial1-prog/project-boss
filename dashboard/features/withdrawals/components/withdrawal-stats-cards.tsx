// Withdrawal statistics cards component
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    DollarSign,
    Clock,
    CheckCircle,
    XCircle,
    TrendingUp
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { WithdrawalStats } from '@/lib/withdrawals/types';

interface WithdrawalStatsCardsProps {
    stats: WithdrawalStats | null;
    isLoading?: boolean;
}

export function WithdrawalStatsCards({ stats, isLoading }: WithdrawalStatsCardsProps) {
    if (isLoading) return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 4 }).map((_, index) => (
                <Card key={index} className="animate-pulse">
                    <CardContent className="p-6">
                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
                    </CardContent>
                </Card>
            ))}
        </div>
    )

    if (!stats) return null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <WithdrawalStatCard
                title="Total Withdrawals"
                value={stats.summary?.totalWithdrawals}
                icon={DollarSign}
                color="blue"
                gradient="from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20"
                delay={0}
            />
            <WithdrawalStatCard
                title="Pending"
                value={stats.summary?.pendingWithdrawals || 0}
                subtitle={formatCurrency(stats.summary?.pendingAmount || 0)}
                icon={Clock}
                color="yellow"
                gradient="from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20"
                delay={100}
            />
            <WithdrawalStatCard
                title="Completed"
                value={stats.summary?.completedWithdrawals || 0}
                subtitle={formatCurrency(stats.summary?.completedAmount || 0)}
                icon={CheckCircle}
                color="green"
                gradient="from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20"
                delay={200}
            />
            <WithdrawalStatCard
                title="Rejected"
                value={stats.summary?.rejectedWithdrawals || 0}
                icon={XCircle}
                color="red"
                gradient="from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20"
                delay={300}
            />
        </div>
    );
}

// Individual stat card component for reusability
interface WithdrawalStatCardProps {
    title: string;
    value: number | string;
    subtitle?: string;
    icon: React.ComponentType<{ className?: string }>;
    color: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'indigo';
    gradient: string;
    delay?: number;
}

export function WithdrawalStatCard({
    title,
    value,
    subtitle,
    icon: Icon,
    color,
    gradient,
    delay = 0
}: WithdrawalStatCardProps) {
    return (
        <Card
            className={`bg-gradient-to-br ${gradient} border-${color}-200 dark:border-${color}-800 animate-in fade-in-0 slide-in-from-bottom-4`}
            style={{ animationDelay: `${delay}ms` }}
        >
            <CardContent>
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <p className={`text-sm font-medium text-${color}-600 dark:text-${color}-400`}>
                            {title}
                        </p>
                        <p className={`text-3xl font-bold text-${color}-700 dark:text-${color}-300 mt-2`}>
                            {typeof value === 'number' ? value.toLocaleString() : value}
                        </p>
                        {subtitle && (
                            <p className={`text-xs text-${color}-600 dark:text-${color}-400 mt-1`}>
                                {subtitle}
                            </p>
                        )}
                    </div>
                    <Icon className={`w-8 h-8 text-${color}-600 dark:text-${color}-400`} />
                </div>
            </CardContent>
        </Card>
    );
}