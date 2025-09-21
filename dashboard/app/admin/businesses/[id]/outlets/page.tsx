'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ArrowLeft,
    Building2,
    MapPin,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    Users,
    Eye,
    Package
} from 'lucide-react';
import { formatDate, formatDateTime } from '@/lib/utils/date';
import { formatCurrency } from '@/lib/utils';
import { apiClient } from '@/lib/apis/base';

interface Outlet {
    id: string;
    name: string;
    address: string;
    phone?: string;
    email?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    _count: {
        orders: number;
        products: number;
    };
}

export default function BusinessOutletsPage() {
    const params = useParams();
    const router = useRouter();
    const businessId = params.id as string;

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';

    // Fetch business details with outlets
    const { data: businessData, isLoading } = useQuery({
        queryKey: ['admin-business-details', businessId],
        queryFn: async () => {
            const response = await apiClient.get(`/admin/businesses/${businessId}`);
            return response.data;
        },
        enabled: !!businessId,
    });

    const business = businessData?.data?.business;
    const outlets = business?.outlets || [];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">Active</Badge>;
            case 'INACTIVE':
                return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">Inactive</Badge>;
            case 'SUSPENDED':
                return <Badge className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">Suspended</Badge>;
            default:
                return <Badge variant="secondary" className="dark:bg-gray-700 dark:text-gray-300">{status}</Badge>;
        }
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!business) {
        return (
            <div className="flex items-center justify-center min-h-96">
                <div className="text-center">
                    <Building2 className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                        Business not found
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        The business you're looking for doesn't exist or has been removed.
                    </p>
                    <Button onClick={() => router.push('/admin/businesses')}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Businesses
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push('/admin/businesses')}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {business.name} - Outlets
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Manage outlets for {business.name}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    {getStatusBadge(business.status)}
                </div>
            </div>

            {/* Business Info Summary */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="text-gray-900 dark:text-gray-100">Business Overview</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Total Outlets</p>
                                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{business._count.outlets}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Owner</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">{business.owner.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{business.owner.email}</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Joined</p>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                    {formatDate(business.createdAt)}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Outlets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {outlets.map((outlet: Outlet) => (
                    <Card
                        key={outlet.id}
                        className="group hover:shadow-xl dark:hover:shadow-2xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                    >
                        <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                                <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors truncate">
                                        {outlet.name}
                                    </CardTitle>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        Outlet #{outlet.id.slice(-8)}
                                    </p>
                                </div>
                                <div className="ml-3 flex-shrink-0">
                                    {getStatusBadge(outlet.status)}
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Address */}
                            {outlet.address && (
                                <div className="flex items-start space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                    <MapPin className="w-4 h-4 text-gray-400 dark:text-gray-500 mt-0.5 flex-shrink-0" />
                                    <span className="line-clamp-2">{outlet.address}</span>
                                </div>
                            )}

                            {/* Contact Info */}
                            <div className="space-y-2">
                                {outlet.phone && (
                                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Phone className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        <span>{outlet.phone}</span>
                                    </div>
                                )}
                                {outlet.email && (
                                    <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                                        <Mail className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                                        <span className="truncate">{outlet.email}</span>
                                    </div>
                                )}
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center justify-center space-x-1 mb-1">
                                        <Package className="w-4 h-4 text-orange-500" />
                                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{outlet._count.products}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Products</p>
                                </div>
                                <div className="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                    <div className="flex items-center justify-center space-x-1 mb-1">
                                        <DollarSign className="w-4 h-4 text-green-500" />
                                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{outlet._count.orders}</span>
                                    </div>
                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Orders</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="pt-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="w-full hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:border-blue-800 dark:hover:text-blue-400 transition-colors"
                                    onClick={() => {
                                        // TODO: Navigate to outlet details page
                                        console.log('View outlet:', outlet.id);
                                    }}
                                >
                                    <Eye className="w-4 h-4 mr-2" />
                                    View Details
                                </Button>
                            </div>

                            {/* Created Date */}
                            <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-500 pt-3 border-t border-gray-100 dark:border-gray-700">
                                <Calendar className="w-3 h-3" />
                                <span>Created {formatDateTime(outlet.createdAt)}</span>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Empty State */}
            {outlets.length === 0 && (
                <Card className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 border-gray-200 dark:border-gray-700">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mb-6">
                            <Building2 className="w-10 h-10 text-gray-400 dark:text-gray-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-3">
                            No outlets yet
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md leading-relaxed">
                            This business doesn't have any outlets registered yet. Outlets will appear here once they are created.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}