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
    Store,
    Eye,
    Edit,
    Trash2,
    CreditCard,
    TrendingUp,
    Package
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
    owner: {
        id: string;
        name: string;
        email: string;
        phone?: string;
    };
    wallet?: {
        balance: number;
        currency: string;
    };
    _count: {
        outlets: number;
        orders: number;
        products: number;
    };
}

export default function BusinessDetailPage() {
    const params = useParams();
    const router = useRouter();
    const businessId = params.id as string;

    // Fetch business details
    const { data: businessData, isLoading, refetch } = useQuery({
        queryKey: ['admin-business-detail', businessId],
        queryFn: async () => {
            const response = await apiClient.get(`/admin/businesses/${businessId}`);
            return response.data;
        },
        enabled: !!businessId,
    });

    const business = businessData?.data?.business;

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

    const getWalletStatus = (balance: number) => {
        if (balance > 5000000) return { text: 'High Balance', color: 'text-green-600 dark:text-green-400' };
        if (balance > 1000000) return { text: 'Good Balance', color: 'text-blue-600 dark:text-blue-400' };
        return { text: 'Low Balance', color: 'text-orange-600 dark:text-orange-400' };
    };

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div key={index} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
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
                        className="hover:bg-gray-50 hover:border-gray-300 dark:hover:bg-gray-800 dark:hover:border-gray-600"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {business.name}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400 mt-1">
                            Business Details & Management
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    {getStatusBadge(business.status)}
                    <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:border-blue-800 dark:hover:text-blue-400"
                    >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                    </Button>
                </div>
            </div>

            {/* Business Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center">
                                <Building2 className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                                Business Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Business Name</label>
                                        <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                            {business.name}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                                        <p className="text-gray-900 dark:text-gray-100 mt-1">
                                            {business.type || 'Not specified'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
                                        <div className="mt-1">
                                            {getStatusBadge(business.status)}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                                        <p className="text-gray-900 dark:text-gray-100 mt-1 leading-relaxed">
                                            {business.description || 'No description provided'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Created</label>
                                        <p className="text-gray-900 dark:text-gray-100 mt-1">
                                            {formatDateTime(business.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Updated</label>
                                        <p className="text-gray-900 dark:text-gray-100 mt-1">
                                            {formatDateTime(business.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Contact Information */}
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center">
                                <Mail className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                                Contact Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {business.phone && (
                                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                            <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{business.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                    {business.email && (
                                        <div className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                            <Mail className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Email</p>
                                                <p className="font-medium text-gray-900 dark:text-gray-100">{business.email}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    {business.address && (
                                        <div className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                                            <MapPin className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                                            <div className="flex-1">
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Address</p>
                                                <p className="font-medium text-gray-900 dark:text-gray-100 leading-relaxed">
                                                    {business.address}
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar */}
                <div className="space-y-6">
                    {/* Owner Information */}
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center">
                                <Users className="w-5 h-5 mr-2 text-indigo-600 dark:text-indigo-400" />
                                Owner Information
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Owner Name</label>
                                <p className="text-lg font-semibold text-gray-900 dark:text-gray-100 mt-1">
                                    {business.owner.name}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Owner Email</label>
                                <p className="text-gray-900 dark:text-gray-100 mt-1">
                                    {business.owner.email}
                                </p>
                            </div>
                            {business.owner.phone && (
                                <div>
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Owner Phone</label>
                                    <p className="text-gray-900 dark:text-gray-100 mt-1">
                                        {business.owner.phone}
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Wallet Information */}
                    {business.wallet && (
                        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                            <CardHeader>
                                <CardTitle className="text-gray-900 dark:text-gray-100 flex items-center">
                                    <CreditCard className="w-5 h-5 mr-2 text-green-600 dark:text-green-400" />
                                    Wallet Balance
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">
                                        {formatCurrency(business.wallet.balance)}
                                    </div>
                                    <p className={`text-sm font-medium ${getWalletStatus(business.wallet.balance).color}`}>
                                        {getWalletStatus(business.wallet.balance).text}
                                    </p>
                                </div>
                                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                                    <div
                                        className="bg-gradient-to-r from-green-400 to-emerald-500 h-3 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${Math.min((business.wallet.balance / 10000000) * 100, 100)}%`
                                        }}
                                    ></div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Quick Actions */}
                    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-gray-900 dark:text-gray-100">Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <Button
                                variant="outline"
                                className="w-full justify-start hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:border-blue-800 dark:hover:text-blue-400"
                                onClick={() => router.push(`/admin/businesses/${business.id}/outlets`)}
                            >
                                <Store className="w-4 h-4 mr-2" />
                                View Outlets ({business._count.outlets})
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start hover:bg-purple-50 hover:border-purple-200 hover:text-purple-600 dark:hover:bg-purple-900/20 dark:hover:border-purple-800 dark:hover:text-purple-400"
                            >
                                <Package className="w-4 h-4 mr-2" />
                                View Products ({business._count.products})
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full justify-start hover:bg-green-50 hover:border-green-200 hover:text-green-600 dark:hover:bg-green-900/20 dark:hover:border-green-800 dark:hover:text-green-400"
                            >
                                <TrendingUp className="w-4 h-4 mr-2" />
                                View Orders ({business._count.orders})
                            </Button>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Outlets</p>
                                <p className="text-3xl font-bold text-blue-700 dark:text-blue-300 mt-2">
                                    {business._count.outlets}
                                </p>
                            </div>
                            <Store className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Orders</p>
                                <p className="text-3xl font-bold text-green-700 dark:text-green-300 mt-2">
                                    {business._count.orders}
                                </p>
                            </div>
                            <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-purple-200 dark:border-purple-800">
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Products</p>
                                <p className="text-3xl font-bold text-purple-700 dark:text-purple-300 mt-2">
                                    {business._count.products}
                                </p>
                            </div>
                            <Package className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}