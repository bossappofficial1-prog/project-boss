'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    MessageSquare,
    Search,
    Filter,
    Eye,
    CheckCircle,
    Clock,
    AlertCircle,
    User,
    Phone,
    Mail,
    Calendar
} from 'lucide-react';

interface SupportTicket {
    id: string;
    orderId?: string;
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    issue: string;
    status: string;
    priority: string;
    createdAt: string;
    updatedAt: string;
    businessName?: string;
    orderTotal?: number;
}

export default function AdminSupport() {
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:1234/api/v1';
    const queryClient = useQueryClient();

    // Fetch support tickets
    const { data: ticketsData, isLoading } = useQuery({
        queryKey: ['admin-support-tickets', page, search, statusFilter, priorityFilter],
        queryFn: async () => {
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
            });

            if (search) params.append('search', search);
            if (statusFilter) params.append('status', statusFilter);
            if (priorityFilter) params.append('priority', priorityFilter);

            const response = await fetch(`${API_BASE_URL}/admin/support/tickets?${params}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
            if (!response.ok) throw new Error('Failed to fetch support tickets');
            return response.json();
        },
    });

    // Update ticket status mutation
    const updateTicketMutation = useMutation({
        mutationFn: async ({ ticketId, status, notes }: { ticketId: string; status: string; notes?: string }) => {
            const response = await fetch(`${API_BASE_URL}/admin/support/tickets/${ticketId}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({ status, notes }),
            });
            if (!response.ok) throw new Error('Failed to update ticket status');
            return response.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-support-tickets'] });
        },
    });

    const tickets = ticketsData?.data?.tickets || [];
    const pagination = ticketsData?.data?.pagination;

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING':
                return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
            case 'PROCESSING':
                return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
            case 'COMPLETED':
                return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
            case 'CANCELLED':
                return <Badge className="bg-red-100 text-red-800">Cancelled</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };

    const getPriorityBadge = (priority: string) => {
        switch (priority) {
            case 'LOW':
                return <Badge variant="outline" className="text-gray-600">Low</Badge>;
            case 'MEDIUM':
                return <Badge variant="outline" className="text-blue-600">Medium</Badge>;
            case 'HIGH':
                return <Badge variant="outline" className="text-orange-600">High</Badge>;
            case 'URGENT':
                return <Badge variant="outline" className="text-red-600">Urgent</Badge>;
            default:
                return <Badge variant="secondary">{priority}</Badge>;
        }
    };

    const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
        try {
            await updateTicketMutation.mutateAsync({
                ticketId,
                status: newStatus,
                notes: `Status updated to ${newStatus} by admin`
            });
        } catch (error) {
            console.error('Failed to update ticket status:', error);
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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Support Tickets</h1>
                    <p className="text-gray-600 mt-1">Manage customer support requests and issues</p>
                </div>
                <Button className="flex items-center space-x-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Create Ticket</span>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pagination?.total || 0}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-yellow-600">
                            {tickets.filter((t: SupportTicket) => t.status === 'PENDING').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Require attention</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Processing</CardTitle>
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {tickets.filter((t: SupportTicket) => t.status === 'PROCESSING').length}
                        </div>
                        <p className="text-xs text-muted-foreground">In progress</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Resolved</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {tickets.filter((t: SupportTicket) => t.status === 'COMPLETED').length}
                        </div>
                        <p className="text-xs text-muted-foreground">This month</p>
                    </CardContent>
                </Card>
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
                                    placeholder="Search tickets..."
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
                            <option value="PENDING">Pending</option>
                            <option value="PROCESSING">Processing</option>
                            <option value="COMPLETED">Completed</option>
                            <option value="CANCELLED">Cancelled</option>
                        </select>
                        <select
                            value={priorityFilter}
                            onChange={(e) => setPriorityFilter(e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                            <option value="">All Priority</option>
                            <option value="LOW">Low</option>
                            <option value="MEDIUM">Medium</option>
                            <option value="HIGH">High</option>
                            <option value="URGENT">Urgent</option>
                        </select>
                    </div>
                </CardContent>
            </Card>

            {/* Tickets List */}
            <Card>
                <CardHeader>
                    <CardTitle>Support Tickets</CardTitle>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex items-center justify-center h-64">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-500"></div>
                        </div>
                    ) : tickets.length > 0 ? (
                        <div className="space-y-4">
                            {tickets.map((ticket: SupportTicket) => (
                                <div key={ticket.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center space-x-3 mb-2">
                                                <h3 className="text-lg font-semibold text-gray-900">
                                                    Ticket #{ticket.id.slice(-8)}
                                                </h3>
                                                {getStatusBadge(ticket.status)}
                                                {getPriorityBadge(ticket.priority)}
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                                <div className="space-y-2">
                                                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                        <User className="w-4 h-4" />
                                                        <span>{ticket.customerName}</span>
                                                    </div>
                                                    {ticket.customerPhone && (
                                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                            <Phone className="w-4 h-4" />
                                                            <span>{ticket.customerPhone}</span>
                                                        </div>
                                                    )}
                                                    {ticket.customerEmail && (
                                                        <div className="flex items-center space-x-2 text-sm text-gray-600">
                                                            <Mail className="w-4 h-4" />
                                                            <span>{ticket.customerEmail}</span>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="space-y-2">
                                                    {ticket.businessName && (
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Business:</span> {ticket.businessName}
                                                        </div>
                                                    )}
                                                    {ticket.orderTotal && (
                                                        <div className="text-sm text-gray-600">
                                                            <span className="font-medium">Order Total:</span> {formatCurrency(ticket.orderTotal)}
                                                        </div>
                                                    )}
                                                    <div className="text-sm text-gray-600">
                                                        <span className="font-medium">Created:</span> {formatDate(ticket.createdAt)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-gray-50 rounded-lg p-3">
                                                <p className="text-sm text-gray-700">{ticket.issue}</p>
                                            </div>
                                        </div>

                                        <div className="ml-6 flex flex-col space-y-2">
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View
                                            </Button>

                                            {ticket.status === 'PENDING' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(ticket.id, 'PROCESSING')}
                                                    className="text-blue-600 hover:text-blue-700"
                                                >
                                                    Start Processing
                                                </Button>
                                            )}

                                            {ticket.status === 'PROCESSING' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleStatusUpdate(ticket.id, 'COMPLETED')}
                                                    className="text-green-600 hover:text-green-700"
                                                >
                                                    Mark Complete
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12">
                            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No support tickets found</h3>
                            <p className="text-gray-600">
                                {search || statusFilter || priorityFilter
                                    ? 'Try adjusting your search or filter criteria.'
                                    : 'No support tickets have been created yet.'}
                            </p>
                        </div>
                    )}

                    {/* Pagination */}
                    {pagination && pagination.totalPages > 1 && (
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200">
                            <div className="text-sm text-gray-600">
                                Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} tickets
                            </div>
                            <div className="flex space-x-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.max(1, page - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(Math.min(pagination.totalPages, page + 1))}
                                    disabled={page === pagination.totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}