// User DataTable Configuration
"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    MoreHorizontal,
    Edit,
    Trash2,
    Shield,
    ShieldOff,
    Mail,
    Key,
    User as UserIcon,
    Building2,
    Phone,
    Calendar
} from "lucide-react";
import { User, UserRole } from "@/types/user";
import { formatDistanceToNow } from "date-fns";

// Helper functions with dark/light theme support
export const getUserRoleBadge = (role: UserRole) => {
    switch (role) {
        case UserRole.ADMIN:
            return (
                <Badge variant="destructive" className="font-semibold">
                    <Shield className="w-3 h-3 mr-1" />
                    Admin
                </Badge>
            );
        case UserRole.OWNER:
            return (
                <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 font-semibold">
                    <Building2 className="w-3 h-3 mr-1" />
                    Business Owner
                </Badge>
            );
        default:
            return <Badge variant="outline">{role}</Badge>;
    }
};

export const getVerificationBadge = (isVerified: boolean) => {
    if (isVerified) {
        return (
            <Badge className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 font-medium">
                <Shield className="w-3 h-3 mr-1" />
                Verified
            </Badge>
        );
    }
    return (
        <Badge className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 font-medium">
            <ShieldOff className="w-3 h-3 mr-1" />
            Unverified
        </Badge>
    );
};

export const getUserInitials = (name: string) => {
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Actions interface
interface UserTableActions {
    onEdit?: (user: User) => void;
    onDelete?: (user: User) => void;
    onToggleVerification?: (user: User) => void;
    onSendVerification?: (user: User) => void;
    onResetPassword?: (user: User) => void;
    onViewDetails?: (user: User) => void;
}

// Create columns function
export const createUserColumns = (actions?: UserTableActions): ColumnDef<User>[] => [
    {
        accessorKey: "name",
        header: "User",
        cell: ({ row }) => {
            const user = row.original;
            return (
                <div className="flex items-center gap-3">
                    <Avatar className="w-9 h-9 ring-2 ring-border">
                        <AvatarImage src={user.avatar || undefined} alt={user.name} />
                        <AvatarFallback className="text-xs font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                            {getUserInitials(user.name)}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-foreground truncate">{user.name}</span>
                        <span className="text-sm text-muted-foreground truncate">{user.email}</span>
                    </div>
                </div>
            );
        },
        enableSorting: true,
        size: 250,
    },
    {
        accessorKey: "phone",
        header: "Phone",
        cell: ({ row }) => {
            const phone = row.getValue("phone") as string | null;
            if (!phone) {
                return <span className="text-muted-foreground text-sm">No phone</span>;
            }
            return (
                <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-mono">{phone}</span>
                </div>
            );
        },
        enableSorting: false,
        size: 150,
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
            const role = row.getValue("role") as UserRole;
            return getUserRoleBadge(role);
        },
        enableSorting: true,
        filterFn: (row, id, value) => {
            if (value === 'all') return true;
            return row.getValue(id) === value;
        },
        size: 120,
    },
    {
        accessorKey: "isVerified",
        header: "Status",
        cell: ({ row }) => {
            const isVerified = row.getValue("isVerified") as boolean;
            return getVerificationBadge(isVerified);
        },
        enableSorting: true,
        filterFn: (row, id, value) => {
            if (value === 'all') return true;
            const isVerified = row.getValue(id) as boolean;
            return value === 'verified' ? isVerified : !isVerified;
        },
        size: 100,
    },
    {
        accessorKey: "business",
        header: "Business",
        cell: ({ row }) => {
            const business = row.original.business;
            if (!business) {
                return <span className="text-muted-foreground text-sm">No business</span>;
            }
            return (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/50">
                        <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground truncate">{business.name}</span>
                        {business.outlets && business.outlets.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                                {business.outlets.length} outlet{business.outlets.length > 1 ? 's' : ''}
                            </span>
                        )}
                    </div>
                </div>
            );
        },
        enableSorting: false,
        size: 180,
    },
    {
        accessorKey: "createdAt",
        header: "Joined",
        cell: ({ row }) => {
            const createdAt = row.getValue("createdAt") as string;
            const date = new Date(createdAt);
            return (
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-gray-50 dark:bg-gray-950/50">
                        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div className="flex flex-col min-w-0 flex-1">
                        <span className="text-sm font-medium text-foreground">
                            {formatDistanceToNow(date, { addSuffix: true })}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {date.toLocaleDateString()}
                        </span>
                    </div>
                </div>
            );
        },
        enableSorting: true,
        size: 150,
    },
    {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => {
            const user = row.original;

            return (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel className="flex items-center gap-2">
                            <UserIcon className="w-4 h-4" />
                            Actions for {user.name}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />

                        {actions?.onViewDetails && (
                            <DropdownMenuItem onClick={() => actions.onViewDetails!(user)}>
                                <UserIcon className="mr-2 h-4 w-4" />
                                View Details
                            </DropdownMenuItem>
                        )}

                        {actions?.onEdit && (
                            <DropdownMenuItem onClick={() => actions.onEdit!(user)}>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {actions?.onToggleVerification && (
                            <DropdownMenuItem
                                onClick={() => actions.onToggleVerification!(user)}
                                className={user.isVerified ? "text-yellow-600" : "text-green-600"}
                            >
                                {user.isVerified ? (
                                    <>
                                        <ShieldOff className="mr-2 h-4 w-4" />
                                        Unverify User
                                    </>
                                ) : (
                                    <>
                                        <Shield className="mr-2 h-4 w-4" />
                                        Verify User
                                    </>
                                )}
                            </DropdownMenuItem>
                        )}

                        {actions?.onSendVerification && !user.isVerified && (
                            <DropdownMenuItem onClick={() => actions.onSendVerification!(user)}>
                                <Mail className="mr-2 h-4 w-4" />
                                Send Verification Email
                            </DropdownMenuItem>
                        )}

                        {actions?.onResetPassword && (
                            <DropdownMenuItem onClick={() => actions.onResetPassword!(user)}>
                                <Key className="mr-2 h-4 w-4" />
                                Reset Password
                            </DropdownMenuItem>
                        )}

                        <DropdownMenuSeparator />

                        {actions?.onDelete && (
                            <DropdownMenuItem
                                onClick={() => actions.onDelete!(user)}
                                className="text-red-600 focus:text-red-600"
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete User
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            );
        },
        enableSorting: false,
        enableHiding: false,
        size: 60,
    },
];

// Mobile card renderer for responsive design
export const renderUserMobileCard = (user: User) => {
    return (
        <div className="space-y-2 py-2">
            {/* User Header */}
            <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 ring-1 ring-border">
                    <AvatarImage src={user.avatar || undefined} alt={user.name} />
                    <AvatarFallback className="text-sm font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                        {getUserInitials(user.name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate text-sm">{user.name}</h3>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                    {getUserRoleBadge(user.role)}
                    {getVerificationBadge(user.isVerified)}
                </div>
            </div>

            {/* User Details */}
            <div className="grid grid-cols-2 gap-2 text-sm">
                {/* Phone */}
                <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground truncate text-xs">
                        {user.phone || 'No phone'}
                    </span>
                </div>

                {/* Joined Date */}
                <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="text-muted-foreground text-xs">
                        {formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })}
                    </span>
                </div>

                {/* Business Info */}
                {user.business && (
                    <div className="col-span-2 flex items-center gap-2">
                        <Building2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                        <div className="min-w-0 flex-1">
                            <span className="text-foreground font-medium truncate block">
                                {user.business.name}
                            </span>
                            {user.business.outlets && user.business.outlets.length > 0 && (
                                <span className="text-xs text-muted-foreground">
                                    {user.business.outlets.length} outlet{user.business.outlets.length > 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Bulk actions configuration
export const getUserBulkActions = (actions?: {
    onBulkDelete?: (users: User[]) => void;
    onBulkVerify?: (users: User[]) => void;
    onBulkUnverify?: (users: User[]) => void;
}) => [
        {
            label: "Verify Selected",
            onClick: (users: User[]) => actions?.onBulkVerify?.(users),
            icon: Shield,
            variant: 'default' as const,
        },
        {
            label: "Unverify Selected",
            onClick: (users: User[]) => actions?.onBulkUnverify?.(users),
            icon: ShieldOff,
            variant: 'default' as const,
        },
        {
            label: "Delete Selected",
            onClick: (users: User[]) => actions?.onBulkDelete?.(users),
            icon: Trash2,
            variant: 'destructive' as const,
        },
    ];