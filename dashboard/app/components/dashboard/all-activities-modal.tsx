import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Activity, CheckCircle, Clock, AlertCircle, Search, Filter } from "lucide-react";
import { RecentActivity } from "@/lib/types/api.types";
import { useInfiniteQuery } from '@tanstack/react-query';
import { DashboardService } from '@/lib/services/dashboard.service';

interface AllActivitiesModalProps {
    children: React.ReactNode;
}

export function AllActivitiesModal({ children }: AllActivitiesModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [typeFilter, setTypeFilter] = useState<string>('all');

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        error
    } = useInfiniteQuery({
        queryKey: ['all-activities', searchTerm, statusFilter, typeFilter],
        queryFn: ({ pageParam = 1 }: { pageParam?: number }) =>
            DashboardService.getAllActivities({
                page: pageParam as number,
                limit: 20,
                search: searchTerm,
                status: statusFilter !== 'all' ? statusFilter : undefined,
                type: typeFilter !== 'all' ? typeFilter : undefined
            }),
        initialPageParam: 1,
        getNextPageParam: (lastPage: any, pages: any[]) => {
            if (lastPage.activities.length < 20) return undefined;
            return pages.length + 1;
        },
        enabled: isOpen
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'warning':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            case 'error':
                return <AlertCircle className="w-4 h-4 text-red-500" />;
            default:
                return <Activity className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'success':
                return 'text-green-600 bg-green-50 dark:bg-green-900/20';
            case 'warning':
                return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-900/20';
            case 'error':
                return 'text-red-600 bg-red-50 dark:bg-red-900/20';
            default:
                return 'text-gray-600 bg-gray-50 dark:bg-gray-900/20';
        }
    };

    const allActivities = data?.pages.flatMap((page: any) => page.activities) || [];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center space-x-2">
                        <Activity className="w-5 h-5" />
                        <span>All Activities</span>
                    </DialogTitle>
                </DialogHeader>

                {/* Filters */}
                <div className="flex flex-col sm:flex-row gap-4 mb-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                            placeholder="Search activities..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="success">Success</SelectItem>
                            <SelectItem value="warning">Warning</SelectItem>
                            <SelectItem value="error">Error</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                        <SelectTrigger className="w-full sm:w-40">
                            <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Types</SelectItem>
                            <SelectItem value="user_registration">User Registration</SelectItem>
                            <SelectItem value="order_completed">Order Completed</SelectItem>
                            <SelectItem value="withdrawal_request">Withdrawal Request</SelectItem>
                            <SelectItem value="system_alert">System Alert</SelectItem>
                            <SelectItem value="business_created">Business Created</SelectItem>
                            <SelectItem value="payment_received">Payment Received</SelectItem>
                        </SelectContent>
                    </Select> */}
                </div>

                {/* Activities List */}
                <div className="h-96 overflow-y-auto">
                    <div className="space-y-3">
                        {isLoading ? (
                            // Loading skeleton
                            Array.from({ length: 10 }).map((_, index) => (
                                <div key={index} className="flex items-start space-x-3 p-3 rounded-lg border">
                                    <div className="animate-pulse bg-gray-200 h-4 w-4 rounded-full"></div>
                                    <div className="flex-1 space-y-2">
                                        <div className="animate-pulse bg-gray-200 h-4 w-3/4 rounded"></div>
                                        <div className="animate-pulse bg-gray-200 h-3 w-1/2 rounded"></div>
                                    </div>
                                </div>
                            ))
                        ) : error ? (
                            <div className="text-center py-8">
                                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    Failed to load activities. Please try again.
                                </p>
                            </div>
                        ) : allActivities.length === 0 ? (
                            <div className="text-center py-8">
                                <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                                <p className="text-sm text-muted-foreground">
                                    No activities found matching your criteria.
                                </p>
                            </div>
                        ) : (
                            <>
                                {allActivities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                                    >
                                        <div className="flex-shrink-0">
                                            {getStatusIcon(activity.status)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {activity.description}
                                                </p>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(activity.status)}`}>
                                                    {activity.status}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between mt-1">
                                                <p className="text-xs text-gray-500">
                                                    {activity.timestamp}
                                                </p>
                                                <span className="text-xs text-gray-400 capitalize">
                                                    {activity.type.replace('_', ' ')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Load More Button */}
                                {hasNextPage && (
                                    <div className="text-center pt-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => fetchNextPage()}
                                            disabled={isFetchingNextPage}
                                            className="w-full"
                                        >
                                            {isFetchingNextPage ? 'Loading...' : 'Load More Activities'}
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}