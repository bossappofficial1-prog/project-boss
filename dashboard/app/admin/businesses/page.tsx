'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Building2,
    Search,
    Eye,
    Edit,
    MapPin,
    Phone,
    Mail,
    Calendar,
    DollarSign,
    Users
} from 'lucide-react';

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

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';

    // Fetch businesses
    const { data: businessesData, isLoading } = useQuery({
        queryKey: ['admin-businesses', search, statusFilter],
        queryFn: async () => {
            const response = await fetch(`${API_BASE_URL}/admin/businesses`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch businesses');
            return response.json();
        },
    });

    const businesses = businessesData?.data.businesses || [];
    console.log(businesses);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'ACTIVE':
                return <Badge className="bg-green-100 text-green-800">Active</Badge>;
            case 'INACTIVE':
                return <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>;
            case 'SUSPENDED':
                return <Badge className="bg-red-100 text-red-800">Suspended</Badge>;
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const filteredBusinesses = businesses?.filter((business: Business) => {
        const matchesSearch = !search ||
            business.name.toLowerCase().includes(search.toLowerCase()) ||
            business.description?.toLowerCase().includes(search.toLowerCase());

        const matchesStatus = !statusFilter || business.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Business Management</h1>
                    <p className="text-gray-600 mt-1">Manage all businesses on your platform</p>
                </div>
                <Button className="flex items-center space-x-2">
                    <Building2 className="w-4 h-4" />
                    <span>Add Business</span>
                </Button>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-64">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search businesses..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                                />
                            </div>
                        </div>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">All Status</option>
                            <option value="ACTIVE">Active</option>
                            <option value="INACTIVE">Inactive</option>
                            <option value="SUSPENDED">Suspended</option>
                            <option value="PENDING">Pending</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Businesses Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    Array.from({ length: 6 }).map((_, index) => (
                        <Card key={index} className="animate-pulse">
                            <CardHeader>
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2">
                                    <div className="h-3 bg-gray-200 rounded"></div>
                                    <div className="h-3 bg-gray-200 rounded w-5/6"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    filteredBusinesses.map((business: Business) => (
                        <Card key={business.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="text-lg">{business.name}</CardTitle>
                                        <p className="text-sm text-gray-600 mt-1">{business.type || 'Business'}</p>
                                    </div>
                                    {getStatusBadge(business.status)}
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {/* Description */}
                                {business.description && (
                                    <p className="text-sm text-gray-700 line-clamp-2">{business.description}</p>
                                )}

                                {/* Contact Info */}
                                <div className="space-y-2">
                                    {business.phone && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Phone className="w-4 h-4" />
                                            <span>{business.phone}</span>
                                        </div>
                                    )}
                                    {business.email && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <Mail className="w-4 h-4" />
                                            <span>{business.email}</span>
                                        </div>
                                    )}
                                    {business.address && (
                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                            <MapPin className="w-4 h-4" />
                                            <span className="line-clamp-1">{business.address}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Stats */}
                                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <Building2 className="w-4 h-4 text-gray-400" />
                                            <span className="text-lg font-semibold">{business._count.outlets}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">Outlets</p>
                                    </div>
                                    <div className="text-center">
                                        <div className="flex items-center justify-center space-x-1">
                                            <DollarSign className="w-4 h-4 text-gray-400" />
                                            <span className="text-lg font-semibold">{business._count.orders}</span>
                                        </div>
                                        <p className="text-xs text-gray-600">Orders</p>
                                    </div>
                                </div>

                                {/* Wallet Balance */}
                                {business.wallet && (
                                    <div className="pt-2 border-t border-gray-100">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm text-gray-600">Wallet Balance</span>
                                            <span className="font-semibold text-green-600">
                                                {formatCurrency(business.wallet.balance)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="flex space-x-2 pt-4">
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Eye className="w-4 h-4 mr-2" />
                                        View
                                    </Button>
                                    <Button variant="outline" size="sm" className="flex-1">
                                        <Edit className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                </div>

                                {/* Created Date */}
                                <div className="flex items-center space-x-2 text-xs text-gray-500 pt-2 border-t border-gray-100">
                                    <Calendar className="w-3 h-3" />
                                    <span>Joined {formatDate(business.createdAt)}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* Empty State */}
            {!isLoading && filteredBusinesses.length === 0 && (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Building2 className="w-12 h-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No businesses found</h3>
                        <p className="text-gray-600 text-center">
                            {search || statusFilter
                                ? 'Try adjusting your search or filter criteria.'
                                : 'Get started by adding your first business.'}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}