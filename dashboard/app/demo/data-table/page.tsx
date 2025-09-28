'use client';

import { useState, useMemo } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    User,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Star,
    Eye,
    Edit,
    Trash2,
    UserCheck,
    UserX,
    Crown,
    Shield
} from 'lucide-react';
import { toast } from 'sonner';

// Sample data interface
interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    role: 'admin' | 'manager' | 'user' | 'premium';
    status: 'active' | 'inactive' | 'pending' | 'suspended';
    joinDate: string;
    location: string;
    revenue: number;
    rating: number;
    lastActive: string;
}

// Generate realistic sample data
const generateSampleData = (): User[] => {
    const names = [
        'John Doe', 'Jane Smith', 'Ahmed Hassan', 'Maria Garcia', 'Chen Wei',
        'Sarah Johnson', 'Michael Brown', 'Lisa Anderson', 'David Wilson', 'Emma Davis',
        'James Miller', 'Anna Martinez', 'Robert Taylor', 'Elena Rodriguez', 'Kevin Lee',
        'Sophie Turner', 'Daniel Kim', 'Isabella Thompson', 'Alexander Wang', 'Olivia White',
        'Ryan Cooper', 'Zara Khan', 'Lucas Silva', 'Maya Patel', 'Noah Anderson'
    ];

    const locations = [
        'Jakarta', 'Surabaya', 'Bandung', 'Medan', 'Semarang',
        'Makassar', 'Palembang', 'Tangerang', 'Depok', 'Bogor'
    ];

    const roles: User['role'][] = ['admin', 'manager', 'user', 'premium'];
    const statuses: User['status'][] = ['active', 'inactive', 'pending', 'suspended'];

    return names.map((name, index) => ({
        id: `user-${index + 1}`,
        name,
        email: name.toLowerCase().replace(' ', '.') + '@example.com',
        phone: `+62 ${Math.floor(Math.random() * 900000000) + 100000000}`,
        role: roles[Math.floor(Math.random() * roles.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        joinDate: new Date(2020 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 12), Math.floor(Math.random() * 28) + 1).toISOString(),
        location: locations[Math.floor(Math.random() * locations.length)],
        revenue: Math.floor(Math.random() * 10000000) + 100000,
        rating: Math.round((Math.random() * 4 + 1) * 10) / 10,
        lastActive: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
    }));
};

export default function DataTableDemo() {
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [selectedUsers, setSelectedUsers] = useState<User[]>([]);

    const sampleData = useMemo(() => generateSampleData(), []);

    // Status badge component
    const StatusBadge = ({ status }: { status: User['status'] }) => {
        const variants = {
            active: 'bg-green-100 text-green-800 border-green-200',
            inactive: 'bg-gray-100 text-gray-800 border-gray-200',
            pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            suspended: 'bg-red-100 text-red-800 border-red-200',
        };

        return (
            <Badge variant="outline" className={variants[status]}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </Badge>
        );
    };

    // Role badge component
    const RoleBadge = ({ role }: { role: User['role'] }) => {
        const config = {
            admin: { icon: Crown, color: 'bg-purple-100 text-purple-800 border-purple-200' },
            manager: { icon: Shield, color: 'bg-blue-100 text-blue-800 border-blue-200' },
            premium: { icon: Star, color: 'bg-amber-100 text-amber-800 border-amber-200' },
            user: { icon: User, color: 'bg-gray-100 text-gray-800 border-gray-200' },
        };

        const { icon: Icon, color } = config[role];

        return (
            <Badge variant="outline" className={`${color} flex items-center gap-1`}>
                <Icon className="h-3 w-3" />
                {role.charAt(0).toUpperCase() + role.slice(1)}
            </Badge>
        );
    };

    // Define columns with advanced features
    const columns: ColumnDef<User>[] = [
        {
            accessorKey: 'name',
            header: 'User',
            cell: ({ row }) => (
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                        {row.original.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <div className="font-medium">{row.original.name}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {row.original.email}
                        </div>
                    </div>
                </div>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'phone',
            header: 'Contact',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-sm">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {row.original.phone}
                </div>
            ),
        },
        {
            accessorKey: 'role',
            header: 'Role',
            cell: ({ row }) => <RoleBadge role={row.original.role} />,
            enableSorting: true,
        },
        {
            accessorKey: 'status',
            header: 'Status',
            cell: ({ row }) => <StatusBadge status={row.original.status} />,
            enableSorting: true,
        },
        {
            accessorKey: 'location',
            header: 'Location',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-sm">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {row.original.location}
                </div>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'revenue',
            header: 'Revenue',
            cell: ({ row }) => (
                <div className="font-mono text-sm">
                    Rp {row.original.revenue.toLocaleString('id-ID')}
                </div>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'rating',
            header: 'Rating',
            cell: ({ row }) => (
                <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium">{row.original.rating}</span>
                </div>
            ),
            enableSorting: true,
        },
        {
            accessorKey: 'joinDate',
            header: 'Join Date',
            cell: ({ row }) => (
                <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {new Date(row.original.joinDate).toLocaleDateString('id-ID')}
                </div>
            ),
            enableSorting: true,
        },
    ];

    // Row actions
    const rowActions = (user: User) => [
        {
            label: 'View Details',
            onClick: (user: User) => toast.success(`Viewing details for ${user.name}`),
            icon: Eye,
        },
        {
            label: 'Edit User',
            onClick: (user: User) => toast.info(`Editing user ${user.name}`),
            icon: Edit,
        },
        {
            label: user.status === 'active' ? 'Deactivate' : 'Activate',
            onClick: (user: User) => toast.success(`${user.status === 'active' ? 'Deactivated' : 'Activated'} ${user.name}`),
            icon: user.status === 'active' ? UserX : UserCheck,
        },
        {
            label: 'Delete',
            onClick: (user: User) => toast.error(`Deleted user ${user.name}`),
            icon: Trash2,
            variant: 'destructive' as const,
        },
    ];

    // Bulk actions
    const bulkActions = [
        {
            label: 'Activate Selected',
            onClick: (users: User[]) => toast.success(`Activated ${users.length} users`),
            icon: UserCheck,
        },
        {
            label: 'Deactivate Selected',
            onClick: (users: User[]) => toast.warning(`Deactivated ${users.length} users`),
            icon: UserX,
        },
        {
            label: 'Delete Selected',
            onClick: (users: User[]) => toast.error(`Deleted ${users.length} users`),
            icon: Trash2,
            variant: 'destructive' as const,
        },
    ];

    // Handlers
    const handleRefresh = async () => {
        setIsRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 2000));
        setIsRefreshing(false);
        toast.success('Data refreshed successfully!');
    };

    // Export event handlers - now handled by DataTable internally
    const handleExportStart = (format: 'csv' | 'pdf') => {
        toast.info(`Preparing ${format.toUpperCase()} export...`);
    };

    const handleExportComplete = (format: 'csv' | 'pdf', recordCount: number) => {
        toast.success(`Successfully exported ${recordCount} records as ${format.toUpperCase()}!`);
    };

    const handleExportError = (format: 'csv' | 'pdf', error: string) => {
        toast.error(`Failed to export as ${format.toUpperCase()}: ${error}`);
    };

    // Mobile card render
    const mobileCardRender = (user: User) => (
        <div className="space-y-3">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-medium">
                        {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                    </div>
                </div>
                <StatusBadge status={user.status} />
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3 text-muted-foreground" />
                    {user.phone}
                </div>
                <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    {user.location}
                </div>
                <div className="flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {user.rating}
                </div>
                <div className="font-mono">
                    Rp {user.revenue.toLocaleString('id-ID')}
                </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t">
                <RoleBadge role={user.role} />
                <div className="text-xs text-muted-foreground">
                    Joined {new Date(user.joinDate).toLocaleDateString('id-ID')}
                </div>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto py-8 space-y-8">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-4xl font-bold tracking-tight">🚀 Enhanced DataTable Demo</h1>
                <p className="text-xl text-muted-foreground">
                    Experience the power of enterprise-grade data table with 30+ advanced features
                </p>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Row Selection</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-blue-600">✓</p>
                        <p className="text-xs text-muted-foreground">Bulk operations enabled</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Export Data</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-green-600">CSV/PDF</p>
                        <p className="text-xs text-muted-foreground">One-click export</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Mobile Ready</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-purple-600">📱</p>
                        <p className="text-xs text-muted-foreground">Responsive design</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Accessibility</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-2xl font-bold text-orange-600">A11Y</p>
                        <p className="text-xs text-muted-foreground">WCAG compliant</p>
                    </CardContent>
                </Card>
            </div>

            {/* Selection Info */}
            {selectedUsers.length > 0 && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="pt-6">
                        <div className="flex items-center gap-2">
                            <UserCheck className="h-5 w-5 text-blue-600" />
                            <span className="font-medium">
                                {selectedUsers.length} user(s) selected
                            </span>
                            <Badge variant="secondary">
                                Total Revenue: Rp {selectedUsers.reduce((sum, user) => sum + user.revenue, 0).toLocaleString('id-ID')}
                            </Badge>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Enhanced DataTable */}
            <Card>
                <CardContent className="p-6">
                    <DataTable
                        title="User Management System"
                        description="Complete user management with advanced filtering, sorting, and bulk operations"
                        columns={columns}
                        data={sampleData}
                        searchKey="name"
                        searchPlaceholder="Search by name..."
                        globalFilter={true}
                        enableRowSelection={true}
                        onRowSelectionChange={setSelectedUsers}
                        pagination={true}
                        pageSize={10}
                        pageSizeOptions={[5, 10, 20, 50]}
                        isLoading={isLoading}
                        isRefreshing={isRefreshing}
                        onRefresh={handleRefresh}
                        enableExport={true}
                        exportFilename="users-data"
                        exportTitle="User Management System"
                        exportConfig={{
                            csv: {
                                enabled: true,
                                filename: `users-export-${new Date().toISOString().split('T')[0]}.csv`,
                                includeHeaders: true,
                            },
                            pdf: {
                                enabled: true,
                                title: "User Management Report",
                                includeStats: true,
                            }
                        }}
                        onExportStart={handleExportStart}
                        onExportComplete={handleExportComplete}
                        onExportError={handleExportError}
                        emptyMessage="No users found. Try adjusting your search criteria."
                        showColumnVisibility={true}
                        showTableInfo={true}
                        density="normal"
                        rowActions={rowActions}
                        bulkActions={bulkActions}
                        enableColumnResizing={false}
                        enableSorting={true}
                        stickyHeader={false}
                        striped={true}
                        bordered={true}
                        mobileBreakpoint={768}
                        // mobileCardRender={mobileCardRender}
                        ariaLabel="Users data table"
                        ariaDescription="Table containing user information with sorting, filtering, and selection capabilities"
                    // onRowClick={}
                    />
                </CardContent>
            </Card>

            {/* Feature List */}
            <Card>
                <CardHeader>
                    <CardTitle>🎯 Implemented Features</CardTitle>
                    <CardDescription>All the advanced features now available in your DataTable</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[
                            '✅ Row Selection & Bulk Actions',
                            '✅ Advanced Search & Filtering',
                            '✅ Column Visibility Toggle',
                            '✅ CSV/PDF Export',
                            '✅ Mobile Responsive Design',
                            '✅ Loading & Empty States',
                            '✅ Pagination Controls',
                            '✅ Sorting Indicators',
                            '✅ Row Actions Menu',
                            '✅ Customizable Density',
                            '✅ ARIA Accessibility',
                            '✅ TypeScript Support',
                            '✅ Keyboard Navigation',
                            '✅ Performance Optimized',
                            '✅ Enterprise UI/UX',
                        ].map((feature, index) => (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                {feature}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Instructions */}
            <Card className="border-amber-200 bg-amber-50/50">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-amber-600" />
                        Try These Features
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>🔍 <strong>Search:</strong> Use global search or filter by name</p>
                    <p>☑️ <strong>Selection:</strong> Select rows and try bulk actions</p>
                    <p>📊 <strong>Export:</strong> Click Export button for CSV/PDF download</p>
                    <p>👁️ <strong>Columns:</strong> Toggle column visibility</p>
                    <p>📱 <strong>Mobile:</strong> Resize window to see mobile view</p>
                    <p>🔄 <strong>Refresh:</strong> Click refresh to see loading state</p>
                    <p>⚙️ <strong>Settings:</strong> Customize table appearance</p>
                </CardContent>
            </Card>
        </div>
    );
}