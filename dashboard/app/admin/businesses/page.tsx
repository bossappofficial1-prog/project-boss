'use client';

import { useState, useEffect, useCallback } from 'react';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Search,
    Eye,
    MapPin,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    Users,
    Store
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/apis/base';

interface Business {
    id: string;
    name: string;
    description?: string;
    type?: string;
    address?: string;
    phone?: string;
    email?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    wallet?: {
        balance: number;
    };
    _count: {
        outlets: number;
        orders: number;
    };
}

export default function AdminBusinesses() {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    const router = useRouter();
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);

        return () => clearTimeout(timer);
    }, [search]);

    // Fetch businesses with infinite scroll
    const {
        data: businessesData,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
        refetch
    } = useInfiniteQuery({
        queryKey: ['admin-businesses', debouncedSearch, statusFilter],
        queryFn: async ({ pageParam = 1 }) => {
            const params = new URLSearchParams({
                page: pageParam.toString(),
                limit: '12', // Load 12 businesses per page
                ...(debouncedSearch && { search: debouncedSearch }),
                ...(statusFilter && { status: statusFilter }),
            });

            const response = await apiClient.get(`/admin/businesses?${params}`);
            return response.data;
        },
        getNextPageParam: (lastPage, pages) => {
            // Check if there are more pages based on the response
            const totalPages = lastPage.data?.pagination?.totalPages || 1;
            const currentPage = lastPage.data?.pagination?.currentPage || 1;
            return currentPage < totalPages ? currentPage + 1 : undefined;
        },
        initialPageParam: 1,
    });

    // Flatten businesses from all pages
    const businesses = businessesData?.pages.flatMap(page => page.data.businesses) || [];

    // Intersection Observer for infinite scroll
    const loadMoreRef = useCallback((node: HTMLDivElement | null) => {
        if (!node) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
                    fetchNextPage();
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

    // Refetch when filters change
    useEffect(() => {
        refetch();
    }, [debouncedSearch, statusFilter, refetch]);

    // Use businesses directly since filtering is done server-side
    const filteredBusinesses = businesses;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Active</Badge>;
            case 'INACTIVE':
                return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Inactive</Badge>;
            case 'SUSPENDED':
                return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Suspended</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400">Pending</Badge>;
            default:
                return <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">{status}</Badge>;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Business Management</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Manage all businesses on your platform
                        {!isLoading && businessesData && (
                            <span className="block text-sm mt-1 text-gray-500 dark:text-gray-500">
                                Showing {filteredBusinesses.length} businesses
                                {businessesData.pages[businessesData.pages.length - 1]?.data?.pagination?.total && (
                                    ` of ${businessesData.pages[businessesData.pages.length - 1].data.pagination.total}`
                                )}
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader className="pb-4">
                    <CardTitle className="text-gray-900 dark:text-gray-100">Filters & Search</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 min-w-0">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search businesses..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                                />
                                {search !== debouncedSearch && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-500 border-t-transparent"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="sm:w-48">
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200 hover:border-gray-400 dark:hover:border-gray-500"
                            >
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Businesses Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index} className="animate-pulse" style={{ animationDelay: `${index * 100}ms` }}>
                            <CardHeader className="pb-3">
                                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-4/6"></div>
                                    <div className="grid grid-cols-2 gap-4 pt-4">
                                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                        <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                                    </div>
                                    <div className="flex space-x-2 pt-4">
                                        <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded flex-1"></div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    filteredBusinesses.map((business: Business, index: number) => (
                        <Card
                            key={business.id}
                            className="group hover:shadow-xl dark:hover:shadow-2xl hover:shadow-red-100 dark:hover:shadow-red-900/20 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 animate-in fade-in-0 slide-in-from-bottom-4"
                            style={{ animationDelay: `${index * 100}ms` }}
                        >
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors truncate">
                                            {business.name}
                                        </CardTitle>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
                                            {business.type || 'Business'}
                                        </p>
                                    </div>
                                    <div className="ml-3 flex-shrink-0">
                                        {getStatusBadge(business.status)}
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Description */}
                                {business.description && (
                                    <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2 leading-relaxed">
                                        {business.description}
                                    </p>
                                )}

                                {/* Contact Info */}
                                <div className="space-y-2">
                                    {business.phone && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200 cursor-pointer group">
                                            <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors" />
                                            <span className="truncate group-hover:underline">{business.phone}</span>
                                        </div>
                                    )}
                                    {business.email && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200 cursor-pointer group">
                                            <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors" />
                                            <span className="truncate group-hover:underline">{business.email}</span>
                                        </div>
                                    )}
                                    {business.address && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors duration-200 cursor-pointer group">
                                            <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors flex-shrink-0" />
                                            <span className="line-clamp-1 group-hover:underline">{business.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <div className="flex items-center justify-center space-x-1 mb-1">
                                            <Building2 className="w-4 h-4 text-red-500" />
                                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{business._count.outlets}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Outlets</p>
                                    </div>
                                    <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                        <div className="flex items-center justify-center space-x-1 mb-1">
                                            <DollarSign className="w-4 h-4 text-green-500" />
                                            <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{business._count.orders}</span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Orders</p>
                                    </div>
                                </div>

                                {/* Wallet Balance */}
                                {business.wallet && (
                                    <div className="pt-3 border-t border-gray-100 dark:border-gray-700">
                                        <div className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">Wallet Balance</span>
                                                <span className="font-bold text-green-600 dark:text-green-400 text-lg">
                                                    {formatCurrency(business.wallet.balance)}
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-to-r from-green-400 to-emerald-500 h-2 rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${Math.min((business.wallet.balance / 10000000) * 100, 100)}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                {business.wallet.balance > 5000000 ? 'High balance' :
                                                    business.wallet.balance > 1000000 ? 'Good balance' : 'Low balance'}
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-2 pt-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition-colors"
                                        onClick={() => {
                                            router.push(`/admin/businesses/${business.id}`);
                                        }}
                                    >
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:border-blue-800 dark:hover:text-blue-400 transition-colors"
                                        onClick={() => {
                                            router.push(`/admin/businesses/${business.id}/outlets`);
                                        }}
                                    >
                                        <Store className="w-4 h-4 mr-2" />
                                        Outlets
                                    </Button>
                                </div>

                                {/* Created Date */}
                                <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700">
                                    <Calendar className="w-3 h-3" />
                                    <span>Joined {formatDateTime(business.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}

                {/* Infinite Scroll Loading Indicator */}
                {isFetchingNextPage && (
                    <div className="col-span-full flex justify-center py-8">
                        <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400">
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-red-500 border-t-transparent"></div>
                            <span className="text-sm font-medium">Loading more businesses...</span>
                        </div>
                    </div>
                )}

                {/* Load More Trigger */}
                {hasNextPage && !isFetchingNextPage && (
                    <div ref={loadMoreRef} className="col-span-full h-10" />
                )}
            </div>

            {/* Empty State */}
            {!isLoading && filteredBusinesses.length === 0 && (
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                            <Building2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            {search || statusFilter ? 'No businesses found' : 'No businesses yet'}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md leading-relaxed">
                            {search || statusFilter
                                ? 'Try adjusting your search criteria or filter settings to find what you\'re looking for.'
                                : 'Businesses will appear here once they register on your platform. Check back later or contact support if you\'re expecting businesses to appear.'}
                        </p>
                        {(search || statusFilter) && (
                            <Button
                                variant="outline"
                                className="mt-6 hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:border-red-800 dark:hover:text-red-400 transition-colors"
                                onClick={() => {
                                    setSearch('');
                                    setStatusFilter('');
                                }}
                            >
                                Clear Filters
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}