// Types for User Management System

// User roles enum matching backend
export enum UserRole {
    ADMIN = 'ADMIN',
    OWNER = 'OWNER'
}

export interface User {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    role: UserRole;
    provider?: 'local' | 'google';
    isVerified: boolean;
    avatar: string | null;
    createdAt: string;
    updatedAt: string;
    business?: {
        id: string;
        name: string;
        description?: string;
        outlets?: Array<{
            id: string;
            name: string;
            address?: string;
        }>;
    };
}

export interface CreateUserInput {
    name: string;
    email: string;
    password: string;
    phone: string;
    role: UserRole;
}

export interface UpdateUserInput {
    name?: string;
    email?: string;
    password?: string;
    phone?: string;
    role?: UserRole;
}

export interface UserFilters {
    search?: string;
    role?: UserRole | 'all';
    status?: 'all' | 'verified' | 'unverified';
}

export interface PaginationParams {
    page?: number;
    limit?: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface PaginatedUsersResponse {
    data: User[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    };
}

export interface UserStats {
    total: number;
    verified: number;
    unverified: number;
    byRole: {
        ADMIN: number;
        OWNER: number;
    };
}

// Form validation types
export interface UserFormData {
    name: string;
    email: string;
    password: string;
    confirmPassword: string;
    phone: string;
    role: UserRole;
}

export interface UserFormErrors {
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    phone?: string;
    role?: string;
}

// Table row actions
export interface UserRowAction {
    label: string;
    onClick: (user: User) => void;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
}

// Bulk actions
export interface UserBulkAction {
    label: string;
    onClick: (users: User[]) => void;
    icon?: React.ComponentType<{ className?: string }>;
    variant?: 'default' | 'destructive';
    confirmMessage?: string;
}

export type UserSortField = 'name' | 'email' | 'role' | 'createdAt' | 'updatedAt' | 'isVerified';
export type SortOrder = 'asc' | 'desc';