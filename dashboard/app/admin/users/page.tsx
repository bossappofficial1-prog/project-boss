"use client"

<<<<<<< Updated upstream
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
    Users,
    Search,
    Filter,
    Plus,
    UserCheck,
    UserX,
    TrendingUp,
    Activity,
    Shield,
    Building2,
    Calendar,
    AlertTriangle,
    RefreshCw
} from 'lucide-react';
import { useUsers, useUserOperations, useUserStats } from '@/hooks/useUsers';
import { createUserColumns, getUserBulkActions, renderUserMobileCard } from '@/components/users/UserTableColumns';
import CreateUserDialog from '@/components/users/CreateUserDialog';
import { User, UserRole, PaginationParams } from '@/types/user';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function AdminUsersPage() {
    // State management
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'verified' | 'unverified'>('all');

    // Pagination parameters
    const paginationParams: PaginationParams = useMemo(() => ({
        page,
        limit,
        search: search || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
    }), [page, limit, search]);

    // Hooks
    const { data: usersData, isLoading, error, refetch } = useUsers(paginationParams);
    const { data: statsData, isLoading: isStatsLoading } = useUserStats();
    const userOperations = useUserOperations();

    // Table actions
    const tableActions = {
        onEdit: (user: User) => {
            toast.info(`Edit user: ${user.name}`, {
                description: 'Edit functionality will be implemented soon.'
            });
        },
        onDelete: (user: User) => {
            if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                userOperations.deleteUser.mutate(user.id);
            }
        },
        onToggleVerification: (user: User) => {
            const newStatus = !user.isVerified;
            userOperations.updateUserStatus.mutate({
                userId: user.id,
                isVerified: newStatus
            });
        },
        onSendVerification: (user: User) => {
            userOperations.sendVerification.mutate(user.id);
        },
        onResetPassword: (user: User) => {
            const newPassword = prompt('Enter new password:');
            if (newPassword && newPassword.length >= 6) {
                userOperations.resetPassword.mutate({
                    userId: user.id,
                    newPassword
                });
            } else if (newPassword) {
                toast.error('Password must be at least 6 characters long');
            }
        },
        onViewDetails: (user: User) => {
            toast.info(`View details for: ${user.name}`, {
                description: 'User details modal will be implemented soon.'
            });
        }
    };

    // Bulk actions
    const bulkActions = {
        onBulkDelete: (users: User[]) => {
            if (confirm(`Are you sure you want to delete ${users.length} users?`)) {
                const userIds = users.map(u => u.id);
                userOperations.bulkDeleteUsers.mutate(userIds);
            }
        },
        onBulkVerify: (users: User[]) => {
            users.forEach(user => {
                if (!user.isVerified) {
                    userOperations.updateUserStatus.mutate({
                        userId: user.id,
                        isVerified: true
                    });
                }
            });
        },
        onBulkUnverify: (users: User[]) => {
            users.forEach(user => {
                if (user.isVerified) {
                    userOperations.updateUserStatus.mutate({
                        userId: user.id,
                        isVerified: false
                    });
                }
            });
        }
    };

    // Filter data based on local filters
    const filteredData = useMemo(() => {
        if (!usersData?.data) return [];

        return usersData.data.filter(user => {
            // Role filter
            if (roleFilter !== 'all' && user.role !== roleFilter) {
                return false;
            }

            // Status filter
            if (statusFilter === 'verified' && !user.isVerified) {
                return false;
            }
            if (statusFilter === 'unverified' && user.isVerified) {
                return false;
            }

            return true;
        });
    }, [usersData?.data, roleFilter, statusFilter]);

    // Create columns with actions
    const columns = useMemo(() => createUserColumns(tableActions), []);

    // Stats cards data
    const statsCards = [
        {
            title: 'Total Users',
            value: statsData?.total || 0,
            icon: Users,
            description: 'All registered users',
            color: 'text-blue-600 dark:text-blue-400',
            bgColor: 'bg-blue-50 dark:bg-blue-950/50'
        },
        {
            title: 'Verified Users',
            value: statsData?.verified || 0,
            icon: UserCheck,
            description: 'Email verified users',
            color: 'text-green-600 dark:text-green-400',
            bgColor: 'bg-green-50 dark:bg-green-950/50'
        },
        {
            title: 'Unverified Users',
            value: statsData?.unverified || 0,
            icon: UserX,
            description: 'Pending verification',
            color: 'text-yellow-600 dark:text-yellow-400',
            bgColor: 'bg-yellow-50 dark:bg-yellow-950/50'
        },
        {
            title: 'Business Owners',
            value: statsData?.byRole?.OWNER || 0,
            icon: Building2,
            description: 'Business account holders',
            color: 'text-purple-600 dark:text-purple-400',
            bgColor: 'bg-purple-50 dark:bg-purple-950/50'
        }
    ];

    // Loading skeleton component
    const StatsSkeleton = () => (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {[...Array(4)].map((_, i) => (
                <Card key={i} className="border-0 shadow-sm">
                    <CardContent className="p-4 lg:p-6">
                        <div className="flex items-center space-x-4">
                            <Skeleton className="h-12 w-12 rounded-full" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-6 w-16" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-6 lg:py-8 space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="space-y-1">
                            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">User Management</h1>
                            <p className="text-muted-foreground text-sm lg:text-base">
                                Manage platform users and their access
                            </p>
                        </div>
                    </div>

                    {/* Error Card */}
                    <Card className="border-destructive/20">
                        <CardContent className="flex flex-col items-center justify-center py-12 lg:py-16">
                            <div className="text-center space-y-4">
                                <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
                                    <AlertTriangle className="h-6 w-6 text-destructive" />
                                </div>
                                <div className="space-y-2">
                                    <h3 className="text-lg font-semibold">Failed to load users</h3>
                                    <p className="text-muted-foreground text-sm">
                                        There was an error loading the user data. Please try again.
                                    </p>
                                </div>
                                <Button onClick={() => refetch()} className="mt-4">
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    Try Again
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            <div className="container px-4 py-6 lg:py-8 space-y-6 lg:space-y-8">
                {/* Header Section */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center justify-between w-full">
                        <div className="space-y-1">
                            <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">User Management</h1>
                            <p className="text-muted-foreground text-sm lg:text-base">
                                Manage platform users and their access
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <CreateUserDialog onSuccess={() => refetch()}>
                                <Button variant="outline" size="sm" className="flex items-center gap-2">
                                    <Plus className="w-4 h-4" />
                                    <span className="hidden sm:inline">Add User</span>
                                </Button>
                            </CreateUserDialog>
                        </div>
                    </div>
                </div>

                {/* Stats Cards */}
                {isStatsLoading ? (
                    <StatsSkeleton />
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                        {statsCards.map((stat, index) => {
                            const Icon = stat.icon;
                            return (
                                <Card key={index} className="border-0 shadow-sm hover:shadow-md transition-all duration-200">
                                    <CardContent className="p-3 sm:p-4 lg:p-6">
                                        <div className="flex items-center space-x-3">
                                            <div className={cn(
                                                "p-2 rounded-full",
                                                stat.bgColor
                                            )}>
                                                <Icon className={cn("h-5 w-5", stat.color)} />
                                            </div>
                                            <div className="space-y-1 flex-1 min-w-0">
                                                <p className="text-sm font-medium text-muted-foreground truncate">
                                                    {stat.title}
                                                </p>
                                                <p className="text-xl sm:text-2xl font-bold">
                                                    {stat.value.toLocaleString()}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">
                                                    {stat.description}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {/* Filters Section */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="text-lg font-semibold flex items-center gap-2">
                            <Filter className="w-5 h-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-col sm:flex-row gap-4">
                            {/* Search Input */}
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search users by name or email..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="pl-9"
                                />
                            </div>

                            {/* Role Filter */}
                            <Select
                                value={roleFilter}
                                onValueChange={(value) => setRoleFilter(value as UserRole | 'all')}
                            >
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="All Roles" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Roles</SelectItem>
                                    <SelectItem value={UserRole.ADMIN}>
                                        <div className="flex items-center gap-2">
                                            <Shield className="w-4 h-4" />
                                            Admin
                                        </div>
                                    </SelectItem>
                                    <SelectItem value={UserRole.OWNER}>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="w-4 h-4" />
                                            Business Owner
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>

                            {/* Status Filter */}
                            <Select
                                value={statusFilter}
                                onValueChange={(value) => setStatusFilter(value as any)}
                            >
                                <SelectTrigger className="w-full sm:w-[180px]">
                                    <SelectValue placeholder="All Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="verified">
                                        <div className="flex items-center gap-2">
                                            <UserCheck className="w-4 h-4 text-green-600" />
                                            Verified
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="unverified">
                                        <div className="flex items-center gap-2">
                                            <UserX className="w-4 h-4 text-yellow-600" />
                                            Unverified
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Active Filters Display */}
                        {(roleFilter !== 'all' || statusFilter !== 'all' || search) && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 border-t">
                                <span className="text-sm text-muted-foreground">Active filters:</span>
                                {roleFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1">
                                        Role: {roleFilter}
                                        <button
                                            onClick={() => setRoleFilter('all')}
                                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {statusFilter !== 'all' && (
                                    <Badge variant="secondary" className="gap-1">
                                        Status: {statusFilter}
                                        <button
                                            onClick={() => setStatusFilter('all')}
                                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                {search && (
                                    <Badge variant="secondary" className="gap-1">
                                        Search: "{search}"
                                        <button
                                            onClick={() => setSearch('')}
                                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                        >
                                            ×
                                        </button>
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setRoleFilter('all');
                                        setStatusFilter('all');
                                        setSearch('');
                                    }}
                                    className="text-xs"
                                >
                                    Clear all
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Users DataTable */}
                <Card className="border-0 shadow-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <Users className="w-5 h-5" />
                                <span>Users ({usersData?.pagination.total || 0})</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Activity className="w-4 h-4" />
                                <span>{filteredData.length} filtered</span>
                            </div>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 sm:p-6 sm:pt-0">
                        <div className="px-4 sm:px-0">
                            <DataTable
                                columns={columns}
                                data={filteredData}
                                searchKey="name"
                                searchPlaceholder="Search users..."
                                globalFilter={false}
                                enableRowSelection={true}
                                bulkActions={getUserBulkActions(bulkActions)}
                                pagination={true}
                                pageSize={limit}
                                pageSizeOptions={[5, 10, 20, 50]}
                                isLoading={isLoading}
                                isRefreshing={userOperations.isLoading}
                                onRefresh={() => refetch()}
                                enableExport={true}
                                exportFilename="users-data"
                                exportTitle="User Management Report"
                                emptyMessage="No users found. Try adjusting your filters."
                                showColumnVisibility={true}
                                showTableInfo={true}
                                density="normal"
                                enableSorting={true}
                                enableFiltering={true}
                                stickyHeader={false}
                                striped={true}
                                bordered={false}
                                mobileBreakpoint={768}
                                mobileCardRender={renderUserMobileCard}
                                ariaLabel="Users management table"
                                ariaDescription="Table containing all platform users with management actions"
                                onRowClick={(user) => toast.info(`Clicked on ${user.name}`)}
                                onExportStart={(format) => toast.info(`Exporting ${format.toUpperCase()}...`)}
                                onExportComplete={(format, count) =>
                                    toast.success(`${format.toUpperCase()} exported successfully! ${count} records`)
                                }
                                onExportError={(format, error) =>
                                    toast.error(`Export failed: ${error}`)
                                }
                            />
                        </div>
                    )}
                    </CardContent>
                </Card>
=======
import React from "react"
import {
                    MoreHorizontal,
                    Plus,
                    Search,
                    Shield,
                    ShieldAlert,
                    CheckCircle2,
                    XCircle,
                    Mail,
                    Key,
                    UserCog,
                    LogIn,
                    Filter,
                    Download
                } from "lucide-react"

                import {Button} from "@/components/ui/button"
                import {Input} from "@/components/ui/input"
                import {
                    Table,
                    TableBody,
                    TableCell,
                    TableHead,
                    TableHeader,
                    TableRow,
} from "@/components/ui/table"
                import {
                    DropdownMenu,
                    DropdownMenuContent,
                    DropdownMenuItem,
                    DropdownMenuLabel,
                    DropdownMenuSeparator,
                    DropdownMenuTrigger,
                    DropdownMenuSub,
                    DropdownMenuSubTrigger,
                    DropdownMenuSubContent,
                    DropdownMenuRadioGroup,
                    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu"
                import {
                    Card,
                    CardContent,
                    CardDescription,
                    CardHeader,
                    CardTitle,
                    CardFooter
                } from "@/components/ui/card"
                import {Badge} from "@/components/ui/badge"
                import {Avatar, AvatarFallback, AvatarImage} from "@/components/ui/avatar"
                import {
                    Select,
                    SelectContent,
                    SelectItem,
                    SelectTrigger,
                    SelectValue,
} from "@/components/ui/select"

                // --- TYPES ---
                type UserRole = "OWNER" | "ADMIN" | "EDITOR" | "VIEWER"
                type UserStatus = "verified" | "unverified" | "suspended"

                interface User {
                    id: string
                name: string
                email: string
                role: UserRole
                status: UserStatus
                createdAt: string
                lastLogin: string
                avatar?: string
}

                // --- MOCK DATA ---
                const USERS: User[] = [
                {
                    id: "USR-001",
                name: "Admin Boss",
                email: "admin@boss-platform.com",
                role: "OWNER",
                status: "verified",
                createdAt: "2023-01-15",
                lastLogin: "2 menit yang lalu",
                avatar: "/avatars/admin.jpg"
    },
                {
                    id: "USR-002",
                name: "Sarah Connor",
                email: "sarah@skynet.net",
                role: "ADMIN",
                status: "verified",
                createdAt: "2023-03-10",
                lastLogin: "1 jam yang lalu",
                avatar: "/avatars/01.png"
    },
                {
                    id: "USR-003",
                name: "John Doe",
                email: "john.doe@example.com",
                role: "EDITOR",
                status: "unverified",
                createdAt: "2023-11-05",
                lastLogin: "3 hari yang lalu",
                avatar: "/avatars/02.png"
    },
                {
                    id: "USR-004",
                name: "Jane Smith",
                email: "jane.smith@company.co",
                role: "VIEWER",
                status: "suspended",
                createdAt: "2023-08-22",
                lastLogin: "1 bulan yang lalu",
                avatar: "/avatars/03.png"
    },
                {
                    id: "USR-005",
                name: "Michael Chen",
                email: "m.chen@tech.asia",
                role: "ADMIN",
                status: "verified",
                createdAt: "2023-05-14",
                lastLogin: "Kemarin",
    },
                ]

                export default function UserManagement() {
    const [searchQuery, setSearchQuery] = React.useState("")
                const [roleFilter, setRoleFilter] = React.useState<string>("ALL")
                    const [statusFilter, setStatusFilter] = React.useState<string>("ALL")

    // --- FILTER LOGIC ---
    const filteredUsers = USERS.filter((user) => {
        const matchesSearch =
                        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        user.email.toLowerCase().includes(searchQuery.toLowerCase())

                        const matchesRole = roleFilter === "ALL" || user.role === roleFilter
                        const matchesStatus = statusFilter === "ALL" || user.status === statusFilter

                        return matchesSearch && matchesRole && matchesStatus
    })

                        return (
                        <div className="flex flex-col space-y-3 h-full">

                            {/* --- HEADER & ACTIONS --- */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 space-y-2 sm:space-y-0">
                                <div>
                                    <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
                                    <p className="text-muted-foreground text-sm">
                                        Kelola akses, peran, dan status pengguna sistem.
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" className="shadow-sm">
                                        <Download className="mr-2 h-4 w-4" /> Export
                                    </Button>
                                    <Button size="sm" className="shadow-sm">
                                        <Plus className="mr-2 h-4 w-4" /> Tambah User
                                    </Button>
                                </div>
                            </div>

                            {/* --- FILTERS & SEARCH --- */}
                            <Card className="rounded-md shadow-md border-border/50 bg-card">
                                <CardContent>
                                    <div className="flex flex-col md:flex-row gap-3">
                                        {/* Search Input */}
                                        <div className="relative flex-1">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input
                                                placeholder="Cari berdasarkan nama atau email..."
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                className="pl-9 bg-muted/30 border-border/50 focus-visible:bg-background transition-colors"
                                            />
                                        </div>

                                        {/* Filters Group */}
                                        <div className="flex gap-3">
                                            <Select value={roleFilter} onValueChange={setRoleFilter}>
                                                <SelectTrigger className="w-[140px] bg-muted/30 border-border/50">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Shield className="h-3.5 w-3.5" />
                                                        <span className="truncate text-xs font-medium">{roleFilter === 'ALL' ? 'Semua Role' : roleFilter}</span>
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Semua Role</SelectItem>
                                                    <SelectItem value="OWNER">Owner</SelectItem>
                                                    <SelectItem value="ADMIN">Admin</SelectItem>
                                                    <SelectItem value="EDITOR">Editor</SelectItem>
                                                    <SelectItem value="VIEWER">Viewer</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                                <SelectTrigger className="w-[140px] bg-muted/30 border-border/50">
                                                    <div className="flex items-center gap-2 text-muted-foreground">
                                                        <Filter className="h-3.5 w-3.5" />
                                                        <span className="truncate text-xs font-medium">
                                                            {statusFilter === 'ALL' ? 'Semua Status' :
                                                                statusFilter === 'verified' ? 'Terverifikasi' :
                                                                    statusFilter === 'unverified' ? 'Belum Verif' : 'Ditangguhkan'}
                                                        </span>
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="ALL">Semua Status</SelectItem>
                                                    <SelectItem value="verified">Terverifikasi</SelectItem>
                                                    <SelectItem value="unverified">Belum Verif</SelectItem>
                                                    <SelectItem value="suspended">Ditangguhkan</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* --- USERS TABLE --- */}
                            <Card className="rounded-md shadow-md border-border/50 flex-1 overflow-hidden flex flex-col">
                                <div className="overflow-auto">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow>
                                                <TableHead className="w-[300px]">User</TableHead>
                                                <TableHead>Role</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="hidden md:table-cell">Terdaftar</TableHead>
                                                <TableHead className="hidden md:table-cell">Login Terakhir</TableHead>
                                                <TableHead className="w-[50px]"></TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                                        Tidak ada user yang ditemukan.
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                filteredUsers.map((user) => (
                                                    <TableRow key={user.id} className="group hover:bg-muted/30 transition-colors">
                                                        <TableCell>
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-9 w-9 border border-border/50">
                                                                    <AvatarImage src={user.avatar} alt={user.name} />
                                                                    <AvatarFallback className="text-xs font-medium">
                                                                        {user.name.substring(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium text-sm">{user.name}</span>
                                                                    <span className="text-xs text-muted-foreground">{user.email}</span>
                                                                </div>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={`
                          text-[10px] px-2 py-0.5 h-5 font-medium border-0
                          ${user.role === 'OWNER' ? 'bg-purple-500/15 text-purple-700 dark:text-purple-400' : ''}
                          ${user.role === 'ADMIN' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400' : ''}
                          ${user.role === 'EDITOR' ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400' : ''}
                          ${user.role === 'VIEWER' ? 'bg-slate-500/15 text-slate-700 dark:text-slate-400' : ''}
                        `}
                                                            >
                                                                {user.role}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-2">
                                                                {user.status === 'verified' && <CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                                                                {user.status === 'unverified' && <ShieldAlert className="h-4 w-4 text-amber-500" />}
                                                                {user.status === 'suspended' && <XCircle className="h-4 w-4 text-destructive" />}
                                                                <span className="text-xs capitalize text-muted-foreground">
                                                                    {user.status === 'verified' ? 'Verified' : user.status}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                                            {user.createdAt}
                                                        </TableCell>
                                                        <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                                                            {user.lastLogin}
                                                        </TableCell>
                                                        <TableCell>
                                                            <DropdownMenu>
                                                                <DropdownMenuTrigger asChild>
                                                                    <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground">
                                                                        <span className="sr-only">Open menu</span>
                                                                        <MoreHorizontal className="h-4 w-4" />
                                                                    </Button>
                                                                </DropdownMenuTrigger>
                                                                <DropdownMenuContent align="end" className="w-[180px]">
                                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                    <DropdownMenuItem className="cursor-pointer">
                                                                        <UserCog className="mr-2 h-4 w-4 text-muted-foreground" /> Edit Detail
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="cursor-pointer">
                                                                        <Key className="mr-2 h-4 w-4 text-muted-foreground" /> Reset Password
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuItem className="cursor-pointer text-blue-600 dark:text-blue-400 focus:text-blue-600 focus:bg-blue-50 dark:focus:bg-blue-900/20">
                                                                        <LogIn className="mr-2 h-4 w-4" /> Impersonate
                                                                    </DropdownMenuItem>
                                                                    <DropdownMenuSeparator />

                                                                    <DropdownMenuSub>
                                                                        <DropdownMenuSubTrigger>
                                                                            <Shield className="mr-2 h-4 w-4 text-muted-foreground" /> Ubah Role
                                                                        </DropdownMenuSubTrigger>
                                                                        <DropdownMenuSubContent>
                                                                            <DropdownMenuRadioGroup value={user.role}>
                                                                                <DropdownMenuRadioItem value="ADMIN">Admin</DropdownMenuRadioItem>
                                                                                <DropdownMenuRadioItem value="EDITOR">Editor</DropdownMenuRadioItem>
                                                                                <DropdownMenuRadioItem value="VIEWER">Viewer</DropdownMenuRadioItem>
                                                                            </DropdownMenuRadioGroup>
                                                                        </DropdownMenuSubContent>
                                                                    </DropdownMenuSub>

                                                                    <DropdownMenuSeparator />
                                                                    <DropdownMenuItem className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
                                                                        Hapus User
                                                                    </DropdownMenuItem>
                                                                </DropdownMenuContent>
                                                            </DropdownMenu>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination Footer (Opsional untuk estetika) */}
                                <CardFooter className="flex items-center justify-between border-t border-border/50 px-6 py-3 bg-muted/20">
                                    <div className="text-xs text-muted-foreground">
                                        Menampilkan <strong>{filteredUsers.length}</strong> dari <strong>{USERS.length}</strong> user
                                    </div>
                                    <div className="flex gap-2">
                                        <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Sebelumnya</Button>
                                        <Button variant="outline" size="sm" className="h-7 text-xs" disabled>Selanjutnya</Button>
                                    </div>
                                </CardFooter>
                            </Card>
>>>>>>> Stashed changes
                        </div>
                        )
}